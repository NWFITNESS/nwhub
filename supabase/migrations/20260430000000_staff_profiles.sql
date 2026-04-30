-- Staff profiles with roles and granular permissions
create table if not exists staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  permissions jsonb not null default '{
    "overview": true,
    "inbox": true,
    "contacts": true,
    "financials": false,
    "kids": true,
    "email_campaigns": true,
    "branding": true,
    "ai_chat": true,
    "blog": true,
    "content_editor": true,
    "media": true,
    "integrations": false,
    "settings": false,
    "staff_management": false
  }'::jsonb,
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  avatar_url text,
  invited_by uuid references auth.users(id),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id),
  unique(email)
);

-- RLS
alter table staff_profiles enable row level security;

-- All authenticated users can read staff profiles (needed for permission checks)
create policy "staff_profiles_select"
  on staff_profiles for select
  to authenticated
  using (true);

-- Only owners and admins can insert/update/delete
create policy "staff_profiles_insert"
  on staff_profiles for insert
  to authenticated
  with check (
    exists (
      select 1 from staff_profiles sp
      where sp.user_id = auth.uid()
      and sp.role in ('owner', 'admin')
    )
  );

create policy "staff_profiles_update"
  on staff_profiles for update
  to authenticated
  using (
    -- Owners can update anyone
    exists (
      select 1 from staff_profiles sp
      where sp.user_id = auth.uid()
      and sp.role = 'owner'
    )
    -- Admins can update staff (not other admins/owners)
    or (
      exists (
        select 1 from staff_profiles sp
        where sp.user_id = auth.uid()
        and sp.role = 'admin'
      )
      and role = 'staff'
    )
    -- Users can update their own display_name and avatar_url
    or user_id = auth.uid()
  );

create policy "staff_profiles_delete"
  on staff_profiles for delete
  to authenticated
  using (
    exists (
      select 1 from staff_profiles sp
      where sp.user_id = auth.uid()
      and sp.role = 'owner'
    )
  );

-- Index for quick lookups
create index idx_staff_profiles_user_id on staff_profiles(user_id);
create index idx_staff_profiles_email on staff_profiles(email);

-- Insert current user as owner (bootstrap)
-- This runs once — the first user to exist becomes owner
insert into staff_profiles (user_id, display_name, email, role, permissions, status)
select
  id,
  coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  email,
  'owner',
  '{
    "overview": true,
    "inbox": true,
    "contacts": true,
    "financials": true,
    "kids": true,
    "email_campaigns": true,
    "branding": true,
    "ai_chat": true,
    "blog": true,
    "content_editor": true,
    "media": true,
    "integrations": true,
    "settings": true,
    "staff_management": true
  }'::jsonb,
  'active'
from auth.users
order by created_at asc
limit 1
on conflict (user_id) do nothing;
