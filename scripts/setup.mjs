import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres:NWfitness@2026@db.llmyrauorwaxleqxcgpc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
})

await client.connect()
console.log('✓ Connected to Supabase')

// ─── SCHEMA ──────────────────────────────────────────────────────────────────

const schema = `
create extension if not exists "pgcrypto";

create table if not exists page_content (
  id             uuid primary key default gen_random_uuid(),
  page_slug      text not null,
  section_key    text not null,
  content        jsonb not null default '{}',
  draft_content  jsonb,
  updated_at     timestamptz not null default now(),
  unique(page_slug, section_key)
);
create index if not exists page_content_page_slug_idx on page_content (page_slug);

create table if not exists global_settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists blog_categories (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table if not exists blog_posts (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique,
  title              text not null,
  excerpt            text,
  content            text,
  featured_image_url text,
  author             text default 'Northern Warrior',
  category_id        uuid references blog_categories(id) on delete set null,
  tags               text[] default '{}',
  status             text not null default 'draft' check (status in ('draft','published')),
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists blog_posts_status_idx on blog_posts (status);
create index if not exists blog_posts_published_at_idx on blog_posts (published_at desc);

create table if not exists media (
  id           uuid primary key default gen_random_uuid(),
  filename     text not null,
  storage_path text not null,
  public_url   text not null,
  alt_text     text default '',
  file_size    int,
  mime_type    text,
  width int, height int,
  uploaded_at  timestamptz not null default now()
);

create table if not exists contact_enquiries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  phone        text default '',
  enquiry_type text default 'General Enquiry',
  message      text not null,
  status       text not null default 'new' check (status in ('new','read','replied')),
  created_at   timestamptz not null default now()
);
create index if not exists contact_enquiries_status_idx on contact_enquiries (status);
create index if not exists contact_enquiries_created_at_idx on contact_enquiries (created_at desc);

create table if not exists kids_registrations (
  id                uuid primary key default gen_random_uuid(),
  parent            jsonb not null,
  emergency         jsonb not null,
  children          jsonb not null,
  first_aid_consent bool not null default false,
  waiver_accepted   bool not null default false,
  source            text default 'web',
  status            text not null default 'active',
  created_at        timestamptz not null default now()
);
create index if not exists kids_registrations_created_at_idx on kids_registrations (created_at desc);

create table if not exists email_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  first_name      text default '',
  last_name       text default '',
  tags            text[] default '{}',
  status          text not null default 'subscribed' check (status in ('subscribed','unsubscribed','bounced')),
  source          text default 'web',
  subscribed_at   timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table if not exists email_campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  subject      text not null,
  preview_text text default '',
  html_content text not null,
  from_name    text not null default 'Northern Warrior',
  from_email   text not null default 'noreply@northernwarrior.co.uk',
  reply_to     text default 'info@northernwarrior.co.uk',
  segment_tags text[] default '{}',
  status       text not null default 'draft' check (status in ('draft','scheduled','sent')),
  scheduled_at timestamptz,
  sent_at      timestamptz,
  stats        jsonb default '{"sent":0,"opened":0,"clicked":0,"bounced":0}',
  created_at   timestamptz not null default now()
);

create table if not exists sms_subscribers (
  id            uuid primary key default gen_random_uuid(),
  phone         text not null unique,
  first_name    text default '',
  tags          text[] default '{}',
  status        text not null default 'subscribed' check (status in ('subscribed','unsubscribed')),
  subscribed_at timestamptz not null default now()
);

create table if not exists sms_campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  message      text not null,
  segment_tags text[] default '{}',
  status       text not null default 'draft' check (status in ('draft','sent')),
  sent_at      timestamptz,
  stats        jsonb default '{"sent":0,"delivered":0,"failed":0}',
  created_at   timestamptz not null default now()
);
`

for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
  await client.query(stmt)
}
console.log('✓ Schema created')

// ─── RLS ─────────────────────────────────────────────────────────────────────

const rls = `
alter table page_content enable row level security;
alter table global_settings enable row level security;
alter table blog_posts enable row level security;
alter table blog_categories enable row level security;
alter table media enable row level security;
alter table contact_enquiries enable row level security;
alter table kids_registrations enable row level security;
alter table email_subscribers enable row level security;
alter table email_campaigns enable row level security;
alter table sms_subscribers enable row level security;
alter table sms_campaigns enable row level security;
`

for (const stmt of rls.split(';').map(s => s.trim()).filter(Boolean)) {
  await client.query(stmt).catch(() => {}) // idempotent
}

// Drop & recreate policies so re-runs are safe
const policies = [
  `drop policy if exists "public_read" on page_content`,
  `drop policy if exists "public_read" on global_settings`,
  `drop policy if exists "public_read" on blog_categories`,
  `drop policy if exists "public_read_published" on blog_posts`,
  `drop policy if exists "public_read" on media`,
  `create policy "public_read" on page_content for select using (true)`,
  `create policy "public_read" on global_settings for select using (true)`,
  `create policy "public_read" on blog_categories for select using (true)`,
  `create policy "public_read_published" on blog_posts for select using (status = 'published')`,
  `create policy "public_read" on media for select using (true)`,
]
for (const stmt of policies) {
  await client.query(stmt).catch(() => {})
}
console.log('✓ RLS policies applied')

// ─── SEED HELPER ─────────────────────────────────────────────────────────────

async function upsertSection(pageSlug, sectionKey, content) {
  await client.query(
    `insert into page_content (page_slug, section_key, content, updated_at)
     values ($1, $2, $3, now())
     on conflict (page_slug, section_key) do update
     set content = $3, updated_at = now()`,
    [pageSlug, sectionKey, JSON.stringify(content)]
  )
}

async function upsertSetting(key, value) {
  await client.query(
    `insert into global_settings (key, value, updated_at)
     values ($1, $2, now())
     on conflict (key) do update
     set value = $2, updated_at = now()`,
    [key, JSON.stringify(value)]
  )
}

// ─── GLOBAL SETTINGS ─────────────────────────────────────────────────────────

await upsertSetting('nav', {
  links: [
    { label: 'Training', href: '/training', sub: 'HWPO-programmed' },
    { label: 'HYROX', href: '/hyrox', sub: 'Race prep' },
    { label: 'Kids & Teens', href: '/kids-teens', sub: 'Ages 3–18' },
    { label: 'Timetable', href: '/timetable' },
    { label: 'The Team', href: '/team' },
    { label: 'Membership', href: '/membership' },
    { label: 'Contact', href: '/contact' },
  ],
  cta: { label: '2 Week Trial', href: '/start-here' },
  mobile_ctas: [
    { label: 'Start Here', href: '/start-here' },
    { label: 'View Timetable', href: '/timetable' },
  ],
})

await upsertSetting('footer', {
  brand: 'Northern Warrior',
  tagline: 'Community-driven training in a premium functional fitness facility. Functional Fitness, HYROX, and kids & teens programmes — all coached, all scalable.',
  links: [
    { label: 'Training', href: '/training' },
    { label: 'HYROX', href: '/hyrox' },
    { label: 'Kids & Teens', href: '/kids-teens' },
    { label: 'Membership', href: '/membership' },
    { label: 'The Team', href: '/team' },
    { label: 'Our Facilities', href: '/our-facilities' },
  ],
  values: 'Show up. Work hard. Make yourself proud.',
  copyright: 'Northern Warrior Ltd. All rights reserved.',
  terms_link: '/membership-terms',
})

await upsertSetting('contact_info', {
  email: 'info@northernwarrior.co.uk',
  phone: '+447950340217',
  address: 'Unit 6, Bridge End Industrial Estate, Egremont, Cumbria, CA22 2RD',
  address_short: 'Egremont, Cumbria',
  values: 'Show up. Work hard. Make yourself proud.',
})

await upsertSetting('social_links', {
  instagram: 'https://instagram.com/northernwarriorfit',
  facebook: 'https://facebook.com/northernwarriorfit',
  whatsapp: 'https://wa.me/447950340217',
})

console.log('✓ Global settings seeded')

// ─── HOME ─────────────────────────────────────────────────────────────────────

await upsertSection('home', 'hero', {
  kicker: 'Egremont — Cumbria',
  heading: 'Community Driven. Fun. Fitness.',
  subtext: "Discover Cumbria's premier destination for strength and conditioning excellence — built for progress and powered by community.",
  image_url: '',
  buttons: [
    { label: '2 Week Free Trial', href: '/start-here', variant: 'primary' },
    { label: 'View Timetable', href: '/timetable', variant: 'outline' },
  ],
})

await upsertSection('home', 'scroll_story', {
  panels: [
    {
      kicker: 'Functional Fitness',
      heading: 'Grassroots strength. Coached by people who live it.',
      desc: 'HWPO-programmed workouts coached by qualified trainers who train alongside you. Every session scales to your level.',
      image_url: '',
      buttons: [{ label: 'See Training', href: '/training' }],
    },
    {
      kicker: 'HYROX',
      heading: 'Built for the race. Trained for the grind.',
      desc: 'As an official HYROX affiliate we build you for race day — from first-timer to podium finisher.',
      image_url: '',
      buttons: [{ label: 'HYROX Training', href: '/hyrox' }],
    },
    {
      kicker: 'Kids & Teens',
      heading: 'Building the next generation of athletes.',
      desc: 'Mini Warriors (3–5), Little Warriors (5–10) and Teen Warriors (10–18). Coached, safe and seriously fun.',
      image_url: '',
      buttons: [{ label: 'Kids & Teens', href: '/kids-teens' }],
    },
  ],
})

await upsertSection('home', 'icon_row', {
  items: [
    { num: '01', title: 'In-house Physio', desc: 'Support, rehab and return-to-training.' },
    { num: '02', title: 'Personal Training', desc: '1:1 coaching and bespoke programming.' },
    { num: '03', title: 'Elite Coaching', desc: 'Structured sessions. Real intent. Real standards.' },
    { num: '04', title: 'Premium Facility', desc: '500m² space built for strength + conditioning.' },
  ],
})

await upsertSection('home', 'induction', {
  heading: 'New to Northern Warrior?',
  desc: 'Start with our free 2 Week Trial. We guide you into the right sessions from day one.',
  features: [
    'Guided onboarding — no experience needed',
    'Access to all coached group sessions',
    'Qualified coaches with you every step',
    'No joining fees, no commitment',
  ],
  buttons: [
    { label: 'Activate 2 Week Trial', href: '/start-here', variant: 'primary' },
    { label: 'Book an Induction', href: '/contact', variant: 'outline' },
  ],
})

await upsertSection('home', 'memberships', {
  heading: 'Clear pricing. Premium coaching.',
  subtext: 'Open Gym is included across all options. 2-month commitment, then 30-day notice.',
  cards: [
    { title: '2 Sessions / week', price: '£51', period: '/month', desc: 'Two coached group sessions per week plus Open Gym.', highlight: false },
    { title: 'Unlimited', price: '£66', period: '/month', desc: 'Unlimited coached sessions plus Open Gym. The most popular option.', highlight: true },
    { title: 'Unlimited + 24/7', price: '£71', period: '/month', desc: 'Unlimited sessions plus round-the-clock access to the facility.', highlight: false },
    { title: '10 Session Pack', price: '£84', period: '/pack', desc: 'Ten sessions to use at your own pace. No monthly commitment.', highlight: false },
    { title: '20 Session Pack', price: '£156', period: '/pack', desc: 'Twenty sessions at a better per-session rate.', highlight: false },
  ],
})

await upsertSection('home', 'faq', {
  heading: 'Frequently Asked Questions',
  items: [
    {
      q: "Do I need to be 'fit' before I start training at Northern Warrior?",
      a: "No. You start where you are. Every session is coached and every workout scales to your level — whether you've never lifted before or you've been training for years. Our coaches' job is to meet you where you are and move you forward from there.",
    },
    {
      q: "Which class should I go to, and what's the difference between the types of classes?",
      a: "If you're new, start with Start Here or the WOD (Workout of the Day). The WOD is our daily session and works for most people. EMOM40 is engine-focused, BodyBuilding adds hypertrophy work, Weightlifting focuses on the Olympic lifts, and Gymnastics is skills-based. Your coaches will point you in the right direction.",
    },
    {
      q: 'What will my first time in the gym be like?',
      a: "You'll be welcomed, briefed, and coached. A coach will run you through the session, explain the movements, and scale the workout to your level. The community at NW is welcoming — most members remember exactly what their first session felt like.",
    },
    {
      q: 'How often should I attend class?',
      a: '2–3 sessions per week is the sweet spot for most people when starting out. Your body needs recovery time to adapt and improve. As you build fitness and resilience you can increase frequency — your coaches will help you plan this.',
    },
    {
      q: 'Do you have lockers, showers & changing facilities onsite?',
      a: 'Yes — we have changing facilities and showers on site. Lockers are available during your session.',
    },
    {
      q: "What's your drop-in policy?",
      a: "Drop-ins are welcome for experienced gym-goers. Book in advance via the timetable. The drop-in rate applies — speak to us if you'd like to know more.",
    },
    {
      q: 'Do you have Open Gym access?',
      a: 'Yes — Open Gym is included in all memberships. It runs at set times with a coach on the floor, giving you self-directed training time in a supported environment.',
    },
  ],
})

await upsertSection('home', 'social', {
  heading: 'Follow the journey.',
  desc: 'Training highlights, member stories and what life looks like at Northern Warrior.',
  instagram_url: 'https://instagram.com/northernwarriorfit',
  images: [],
})

console.log('✓ Home page seeded')

// ─── TRAINING ────────────────────────────────────────────────────────────────

await upsertSection('training', 'hero', {
  kicker: 'Training',
  heading: 'Eight training tracks. One roof.',
  subtext: 'HWPO-programmed sessions for every level — from daily conditioning to Olympic lifting.',
  image_url: '',
})

await upsertSection('training', 'hwpo', {
  heading: 'Programmed by the best in the world.',
  subtext: 'Northern Warrior is an official HWPO affiliate.',
  desc: "Northern Warrior is an official HWPO affiliate. HWPO — Hard Work Pays Off — is the world-class training platform built by 5x CrossFit Games champion Mat Fraser. Most of our programs (WOD, EMOM40, BodyBuilding, Weightlifting, Gymnastics) are delivered directly from HWPO's elite programming team and scaled for all levels — from your first session to competition podium.",
  logo_url: '',
})

await upsertSection('training', 'sessions', {
  heading: 'Coached Sessions',
  items: [
    { title: 'Workout of the Day', badge: 'WOD', desc: 'Our daily session. Functional fitness combining strength, conditioning and skill work — programmed by HWPO and coached from warmup to cooldown. Scales to any level.' },
    { title: 'HYROX', badge: 'Race prep', desc: 'Hybrid race prep: running, stations, pacing and conditioning. As an official HYROX affiliate, we build you for race day from first-timer to podium finisher.' },
    { title: 'EMOM40', badge: 'Engine', desc: '40 minutes, every minute on the minute. An engine-building session mixing monostructural cardio, gymnastics and weightlifting. Relentless but sustainable.' },
    { title: 'BodyBuilding', badge: 'Hypertrophy', desc: 'Hypertrophy-focused work alongside your conditioning. Compound and isolation movements programmed to build strength and physique with intent.' },
    { title: 'Weightlifting', badge: 'Olympic', desc: 'Snatch and clean & jerk, broken down properly. Positional drills, technique cycles and heavy singles — suitable for beginners through to competitors.' },
    { title: 'Gymnastics', badge: 'Skill', desc: 'Skill-based sessions run in focused blocks. Progressions from foundational pulling and pressing strength through to muscle-ups, handstand walks and beyond.' },
  ],
})

await upsertSection('training', 'specialist', {
  items: [
    { title: 'Open Gym', badge: 'Open — 10 members max', desc: 'Self-directed training time with a qualified coach on the floor. Up to 10 members at a time. Included in all memberships.' },
    { title: 'Kids & Teens', badge: 'Specialist', desc: 'Mini Warriors (3–5), Little Warriors (5–10) and Teen Warriors (10–18). Coached, safe and seriously fun.' },
  ],
})

console.log('✓ Training page seeded')

// ─── HYROX ───────────────────────────────────────────────────────────────────

await upsertSection('hyrox', 'hero', {
  kicker: 'HYROX Affiliate',
  heading: 'HYROX training that actually prepares you for race day.',
  subtext: 'Build your engine. Get efficient on the stations. Learn to pace when it matters.',
  image_url: '',
})

await upsertSection('hyrox', 'about', {
  heading: 'What is HYROX?',
  desc: 'A hybrid fitness race combining running with functional stations. It rewards pacing, efficiency and the ability to perform under fatigue. Our training is structured: running development, transitions, station execution and resilience.',
})

await upsertSection('hyrox', 'stations', {
  heading: 'The Race Stations',
  items: ['SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jumps', 'Row', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls'],
})

await upsertSection('hyrox', 'training_blocks', {
  heading: 'How We Train You',
  items: [
    { title: 'Run Fitness + Pacing', desc: 'Intervals, threshold and race-pace efforts so you can hold speed without blowing up.' },
    { title: 'Stations Under Fatigue', desc: 'Execute stations efficiently when heart rate is high and legs are cooked.' },
    { title: 'Strength for HYROX', desc: 'Leg strength, trunk stability and pulling strength to stay robust and fast.' },
    { title: 'Hybrid Conditioning', desc: 'Mixed machine + movement sessions that build the work capacity HYROX demands.' },
  ],
})

console.log('✓ HYROX page seeded')

// ─── KIDS & TEENS ────────────────────────────────────────────────────────────

await upsertSection('kids-teens', 'hero', {
  kicker: 'Kids & Teens',
  heading: 'Confidence. Fitness. Community.',
  subtext: 'A coached programme built for long-term development — fun, safe, scalable and structured.',
  image_url: '',
})

await upsertSection('kids-teens', 'age_groups', {
  heading: 'Three Groups. One Standard.',
  items: [
    { name: 'Mini Warriors', ages: 'Ages 3–5', desc: 'Fun-based movement, coordination, confidence, and listening skills.' },
    { name: 'Little Warriors', ages: 'Ages 5–10', desc: 'Movement foundations: running, jumping, pulling, squatting, throwing and teamwork — scaled and coached.' },
    { name: 'Teen Warriors', ages: 'Ages 10–18', desc: 'Strength, conditioning and confidence. Learn safe lifting, good movement, and how to train with intent.' },
  ],
})

await upsertSection('kids-teens', 'how_it_works', {
  heading: 'How Registration Works',
  items: [
    'Complete registration (parent/guardian + emergency info + photo consent).',
    'Receive an email summary for your records and ours.',
    'Continue to payment via Square.',
    'Next time, bypass registration if you\'ve already completed it on this device.',
  ],
  cta: { label: 'Register Now', href: '/kids-teens/register' },
})

console.log('✓ Kids & Teens page seeded')

// ─── MEMBERSHIP ──────────────────────────────────────────────────────────────

await upsertSection('membership', 'hero', {
  kicker: 'Membership',
  heading: 'Clear pricing. Premium coaching. No nonsense.',
  subtext: 'Pick the membership that fits your schedule. Open Gym is included across all options.',
  image_url: '',
})

await upsertSection('membership', 'plans', {
  heading: 'Membership Options',
  subtext: '2-month commitment then 30-day notice. No joining fees.',
  cards: [
    { title: '2 Sessions / week', price: '£51', period: '/month', type: 'monthly', desc: 'Two coached group sessions per week plus Open Gym.', highlight: false },
    { title: 'Unlimited', price: '£66', period: '/month', type: 'monthly', desc: 'Unlimited coached sessions plus Open Gym. Our most popular option.', highlight: true },
    { title: 'Unlimited + 24/7', price: '£71', period: '/month', type: 'monthly', desc: 'Unlimited sessions plus round-the-clock access to the facility.', highlight: false },
    { title: '10 Session Pack', price: '£84', period: '/pack', type: 'pack', desc: 'Ten sessions to use at your own pace. No monthly commitment.', highlight: false },
    { title: '20 Session Pack', price: '£156', period: '/pack', type: 'pack', desc: 'Twenty sessions at a better per-session rate.', highlight: false },
  ],
})

await upsertSection('membership', 'perks', {
  heading: "What's Included",
  items: [
    'Open Gym included in all memberships',
    'Coached group sessions',
    'Scalable programming for all levels',
    'Supportive community & accountability',
  ],
})

await upsertSection('membership', 'discounts', {
  heading: 'Discounts Available',
  items: [
    { label: '10% Forces Discount', desc: 'Active and veteran armed forces.' },
    { label: '10% NHS Discount', desc: 'All NHS staff.' },
    { label: '10% Emergency Services', desc: 'Police, fire, ambulance.' },
    { label: '10% Sibling Discount', desc: 'Kids & Teens siblings.' },
  ],
})

await upsertSection('membership', 'terms', {
  text: '2-month minimum commitment, then 30-day rolling notice. No joining fees. Direct debit via GoCardless.',
  link: { label: 'Full Membership Terms', href: '/membership-terms' },
})

console.log('✓ Membership page seeded')

// ─── OUR FACILITIES ───────────────────────────────────────────────────────────

await upsertSection('our-facilities', 'hero', {
  kicker: 'Our Facilities',
  heading: 'Built for performance — not crowded treadmill rows.',
  subtext: 'Northern Warrior is designed for functional training: space to move, kit that supports progress, and a layout that makes coaching easy.',
  image_url: '',
})

await upsertSection('our-facilities', 'facilities', {
  items: [
    { title: 'Large functional training space', desc: 'A dedicated strength & conditioning area built to support group training and performance work.', large: true, image_url: '' },
    { title: '25m functional rig', desc: 'Competition-standard rig with pull-up bars, rings and rope options for proper gymnastics and capacity work.', large: true, image_url: '' },
    { title: 'Rowers', desc: 'Rowing uses a large amount of total-body musculature and is a staple for engine building.', large: false, image_url: '' },
    { title: 'Dumbbells & kettlebells', desc: 'Resistance tools for scaling workouts and building real-world strength and conditioning.', large: false, image_url: '' },
    { title: 'Bike & SkiErgs', desc: 'Low-impact conditioning options with adjustable resistance — perfect for intervals and HYROX-style work.', large: false, image_url: '' },
    { title: 'Jerk blocks + strength area', desc: 'Space and kit for Olympic lifting progressions and strength bias training.', large: false, image_url: '' },
  ],
})

console.log('✓ Our Facilities page seeded')

// ─── START HERE ───────────────────────────────────────────────────────────────

await upsertSection('start-here', 'hero', {
  kicker: 'Getting Started',
  heading: 'Start Here',
  subtext: "Choose the route that fits you. If you're experienced, jump straight into the 2 Week Trial. If you're new, we'll guide you.",
  image_url: '',
})

await upsertSection('start-here', 'options', {
  items: [
    {
      title: '2 Week Free Trial',
      tag: 'Main offer',
      desc: "The fastest way to get moving. We'll guide you into the right sessions.",
      highlight: true,
      buttons: [
        { label: 'View Timetable', href: '/timetable', variant: 'outline' },
        { label: 'Activate Trial', href: '/contact?enquiry=trial', variant: 'primary' },
      ],
    },
    {
      title: 'Induction',
      tag: 'New to training',
      desc: "If you're brand new, we'll take you through the basics so you feel confident and safe.",
      highlight: false,
      buttons: [{ label: 'Book an Induction', href: '/contact?enquiry=induction', variant: 'primary' }],
    },
    {
      title: 'Drop-In',
      tag: 'Visiting',
      desc: "In town and want to train? Book a drop-in and we'll see you on the floor.",
      highlight: false,
      buttons: [{ label: 'Book a Drop-In', href: '/contact?enquiry=dropin', variant: 'primary' }],
    },
  ],
})

console.log('✓ Start Here page seeded')

// ─── TEAM ─────────────────────────────────────────────────────────────────────

await upsertSection('team', 'hero', {
  kicker: 'The Team',
  heading: 'Coaches who actually care.',
  subtext: "Every class is led by someone who knows your name, your goals and how to get you there.",
  image_url: '',
})

await upsertSection('team', 'intro', {
  label: 'Who we are',
  heading: 'Ten coaches. One standard.',
  desc: "Every coach at Northern Warrior is qualified, experienced and on the floor with you — not watching from the sidelines. We hire coaches who train, and train coaches to lead. Click any card to learn more about a coach.",
})

await upsertSection('team', 'coaches', {
  items: [
    {
      name: 'Mathew Tomkinson',
      role: 'Co-Owner · Coach · Kids Coach',
      excerpt: 'Mathew co-founded Northern Warrior to bring genuinely world-class coaching to Cumbria.',
      bio: 'Mathew co-founded Northern Warrior with one goal: build a gym where every member is coached, not just counted. His background spans functional fitness, kids development and programme design — and he leads from the floor every single week. If you\'ve had a session at NW, you\'ve probably already met him.',
      credentials: ['CrossFit Level 2 Trainer', 'Kids & Teens Coach', 'HYROX Coach'],
      image_url: '',
    },
    {
      name: 'Joe Bold',
      role: 'Co-Owner · Coach',
      excerpt: 'Joe built Northern Warrior alongside Mathew and has coached hundreds of members from their first session to the competition floor.',
      bio: 'Joe is the other half of the Northern Warrior founding team. His coaching style is direct, encouraging and deeply effective — built on years of training and competing himself. He programmes, he coaches, and he\'s always looking for ways to push the standard of what members experience every day they walk through the door.',
      credentials: ['CrossFit Level 2 Trainer', 'Strength & Conditioning', 'HYROX Coach'],
      image_url: '',
    },
    {
      name: 'Terry Whitaker',
      role: 'Coach',
      excerpt: 'Terry brings a calm, technical edge to the coaching floor — particularly strong in barbell and weightlifting.',
      bio: 'Terry has been coaching at Northern Warrior since the early days. Known for his attention to movement quality and his ability to break down complex skills for beginners, Terry is a go-to coach for anyone working on their Olympic lifting or wanting to understand the mechanics behind the barbell.',
      credentials: ['CrossFit Level 1 Trainer', 'Weightlifting Coach', 'First Aid Certified'],
      image_url: '',
    },
    {
      name: 'Zoe Bradley',
      role: 'Coach',
      excerpt: 'Zoe coaches with energy and precision — a specialist in gymnastics progressions and body-weight strength.',
      bio: "Zoe joined the coaching team with a background in gymnastics and a passion for helping people unlock skills they never thought possible. From kipping pull-ups to ring muscle-ups, Zoe's progressions are methodical and confidence-building. She runs our Gymnastics sessions and brings the same detail to every WOD she leads.",
      credentials: ['CrossFit Level 1 Trainer', 'Gymnastics Coach', 'Movement Specialist'],
      image_url: '',
    },
    {
      name: 'Karen Smith',
      role: 'Coach',
      excerpt: "Karen is proof that the best coaches are often the ones who've been through the journey themselves.",
      bio: 'Karen started as a member at Northern Warrior and fell in love with coaching after seeing how much a good session could change someone\'s day. She works particularly well with newer members and anyone who walks in feeling uncertain — Karen has a knack for making hard things feel achievable.',
      credentials: ['CrossFit Level 1 Trainer', 'First Aid Certified', 'Precision Nutrition L1'],
      image_url: '',
    },
    {
      name: "Lloyd O'Neil",
      role: 'Coach',
      excerpt: "Lloyd's background in endurance and conditioning makes him one of our strongest EMOM and engine-building coaches.",
      bio: 'Lloyd came to functional fitness from a competitive endurance background and has never looked back. His coaching is strong on pacing, breathing and building sustainable work capacity — the things that separate people who improve from people who plateau. Lloyd coaches WOD, EMOM40 and runs HYROX-specific conditioning blocks.',
      credentials: ['CrossFit Level 1 Trainer', 'HYROX Coach', 'Endurance & Conditioning'],
      image_url: '',
    },
    {
      name: 'Dom Dublin',
      role: 'Coach',
      excerpt: 'Dom brings intensity and precision to every session — a competitive athlete who brings race-day thinking to everyday training.',
      bio: "Dom competes in functional fitness and HYROX events and channels that competitive mindset directly into his coaching. He's demanding but fair — he'll push you to a standard you didn't know you had, then help you understand how you got there. If you want to perform, Dom's sessions are where you go.",
      credentials: ['CrossFit Level 1 Trainer', 'HYROX Certified', 'Athlete — Regional Competitor'],
      image_url: '',
    },
    {
      name: 'Kieran Mcglennon',
      role: 'Coach · Personal Trainer',
      excerpt: "Kieran is Northern Warrior's resident PT, working 1-to-1 with members who want tailored programming alongside their class schedule.",
      bio: "Kieran coaches group classes and runs a busy personal training schedule alongside. His 1-to-1 work spans strength development, body composition goals and returning from injury — delivered with the same evidence-based, no-nonsense approach he brings to the coaching floor. If you're interested in PT with Kieran, speak to us at reception.",
      credentials: ['CrossFit Level 2 Trainer', 'Personal Trainer (Level 3)', 'Rehabilitation & Injury Management'],
      image_url: '',
    },
    {
      name: 'Tom Duncombe',
      role: 'Coach',
      excerpt: 'Tom coaches with clear cues, sharp corrections and a style that gets results fast.',
      bio: "Tom joined the coaching team having trained at Northern Warrior as a member for several years. He knows the programme inside-out because he's lived it — and that experience makes him one of the most relatable coaches on the floor. Tom's coaching is crisp, technical and always goal-focused.",
      credentials: ['CrossFit Level 1 Trainer', 'First Aid Certified'],
      image_url: '',
    },
    {
      name: 'Gemma Tomkinson',
      role: 'Nutrition Coach',
      excerpt: 'Gemma bridges the gap between training and nutrition — helping members get the most out of what they do in the gym.',
      bio: "Gemma leads Northern Warrior's nutrition coaching offering. She works with members on fuelling for performance, managing body composition and building sustainable food habits that support their training lifestyle. Gemma takes an evidence-based, non-restrictive approach — because sustainable results come from sustainable habits.",
      credentials: ['Precision Nutrition Level 1', 'Sports Nutrition Specialist', 'Lifestyle & Wellness Coach'],
      image_url: '',
    },
  ],
})

console.log('✓ Team page seeded')

// ─── CONTACT ─────────────────────────────────────────────────────────────────

await upsertSection('contact', 'hero', {
  kicker: 'Contact Us',
  heading: 'Get in touch.',
  subtext: "Whether you're ready to start or just have a question — we're here. We'll get back to you within 24 hours.",
})

await upsertSection('contact', 'form', {
  enquiry_types: ['General Enquiry', 'Membership', 'HYROX', 'Kids & Teens', 'Timetable', 'Facilities', 'Other'],
  success_message: "Message sent! We'll be in touch within 24 hours.",
})

await upsertSection('contact', 'details', {
  email: 'info@northernwarrior.co.uk',
  address: 'Unit 6, Bridge End Industrial Estate, Egremont, Cumbria, CA22 2RD',
  values: 'Show up. Work hard. Make yourself proud.',
})

console.log('✓ Contact page seeded')

// ─── SEED BLOG CATEGORIES ────────────────────────────────────────────────────

const cats = [
  { name: 'Training', slug: 'training' },
  { name: 'HYROX', slug: 'hyrox' },
  { name: 'Nutrition', slug: 'nutrition' },
  { name: 'News', slug: 'news' },
  { name: 'Member Stories', slug: 'member-stories' },
]
for (const cat of cats) {
  await client.query(
    `insert into blog_categories (name, slug) values ($1, $2) on conflict (slug) do nothing`,
    [cat.name, cat.slug]
  )
}
console.log('✓ Blog categories seeded')

// ─── VERIFY ───────────────────────────────────────────────────────────────────

const { rows: counts } = await client.query(`
  select
    (select count(*) from page_content) as page_content,
    (select count(*) from global_settings) as global_settings,
    (select count(*) from blog_categories) as blog_categories
`)
console.log('\n── Summary ─────────────────────────')
console.log(`page_content rows:    ${counts[0].page_content}`)
console.log(`global_settings rows: ${counts[0].global_settings}`)
console.log(`blog_categories rows: ${counts[0].blog_categories}`)
console.log('────────────────────────────────────')
console.log('\n✅ All done! Supabase is ready.')

await client.end()
