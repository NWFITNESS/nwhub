-- Enquiry reply thread
create table if not exists enquiry_replies (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references contact_enquiries(id) on delete cascade,
  message text not null,
  sent_to text not null,
  created_at timestamptz not null default now()
);

create index enquiry_replies_enquiry_id on enquiry_replies(enquiry_id);
