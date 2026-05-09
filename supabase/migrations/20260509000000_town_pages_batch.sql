-- ─────────────────────────────────────────────────────────────────────────────
-- 12 town pages for Kids × Town programmatic SEO
-- Each page has genuinely unique local content to avoid duplicate flags
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure template exists
insert into seo_templates (slug, name, url_pattern, status, variables)
values ('kids-by-town', 'Kids Classes by Town', '/kids-classes/[town]', 'live', '["town"]'::jsonb)
on conflict (slug) do nothing;

-- ── Helper: insert page + brief in one go ────────────────────────────────────

-- 1. WORKINGTON
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/workington',
  'Kids Fitness Classes Workington',
  '{"town":"workington","town_display":"Workington","postcode":"CA14","drive_min":15}'::jsonb,
  '{"town":"workington","town_display":"Workington","postcode":"CA14","drive_min":15,"landmark":"town centre","monthly_search":720}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/workington'), 1,
  'Hand-authored town page',
  '{"town":"workington","town_display":"Workington","drive_min":15}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Workington · Kids 3-18",
      "badge": "15 minutes from Workington town centre · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Coached strength and conditioning for kids and teens aged 3–18. Fifteen minutes from Workington — real coaching, real fun, every Sunday.",
      "cta_primary": "Book Workington Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Why Workington families train at Northern Warrior",
      "paragraphs": [
        "Workington to Northern Warrior takes about 15 minutes — down the A66 and through Distington. Most Workington parents come from Stainburn, Seaton or Northside and have it timed around Sunday morning routines.",
        "If your child plays rugby league or does athletics at the Zebras, this slots in nicely alongside. We build strength, coordination and movement quality that carries over into any sport — not a replacement, a supplement.",
        "Two coaches on the floor every session. Mat runs the programme, Lauren assists. Both DBS checked, first aid trained. Your child gets coached, not babysat."
      ],
      "drive_callout": "15 minutes from Workington town centre. Free parking on site, easy in and out."
    },
    "age_groups": {"intro": "Three groups based on age and ability. We''ll suggest the right one — you can always move up when ready."},
    "schedule": {"heading": "Upcoming blocks for Workington families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, Workington?", "sub": "Block 4 starts Saturday 10 May. Grab your child''s spot."},
    "meta": {
      "title": "Kids Fitness Classes Workington | Northern Warrior",
      "description": "Coached strength & conditioning for kids 3-18, 15 minutes from Workington. Sundays at Northern Warrior in Egremont. Book now."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- 2. CLEATOR MOOR
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/cleator-moor',
  'Kids Fitness Classes Cleator Moor',
  '{"town":"cleator-moor","town_display":"Cleator Moor","postcode":"CA25","drive_min":5}'::jsonb,
  '{"town":"cleator-moor","town_display":"Cleator Moor","postcode":"CA25","drive_min":5,"landmark":"Market Square","monthly_search":320}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/cleator-moor'), 1,
  'Hand-authored town page',
  '{"town":"cleator-moor","town_display":"Cleator Moor","drive_min":5}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Cleator Moor · Kids 3-18",
      "badge": "5 minutes from Cleator Moor · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Strength, movement and confidence for kids 3–18 — just five minutes down the road from Cleator Moor. Coached properly, every Sunday.",
      "cta_primary": "Book Cleator Moor Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Cleator Moor kids are already here",
      "paragraphs": [
        "Five minutes. That''s Cleator Moor to Northern Warrior — straight down past Wath Brow and you''re here. Half the kids in our Sunday sessions come from Cleator Moor or Cleator village already.",
        "If your child goes to Monkray or St Mary''s, you probably know parents who bring theirs. Word of mouth is how most Cleator Moor families find us — and the kids keep coming back because they genuinely enjoy it.",
        "No gimmicks. We teach proper movement: running, jumping, lifting, throwing, gymnastics. Scaled to their age, coached by adults who actually care. Mat and Lauren run every session."
      ],
      "drive_callout": "5 minutes from Cleator Moor. Literally down the road — the closest town to the gym."
    },
    "age_groups": {"intro": "Three age groups, coached differently. Minis play, Littles learn, Teens train."},
    "schedule": {"heading": "Upcoming blocks for Cleator Moor families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, Cleator Moor?", "sub": "Block 4 starts Saturday 10 May. Your neighbours are already booked in."},
    "meta": {
      "title": "Kids Fitness Classes Cleator Moor | Northern Warrior",
      "description": "Kids strength & conditioning 5 minutes from Cleator Moor. Ages 3-18, every Sunday. Coached sessions at Northern Warrior, Egremont."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- 3. FRIZINGTON
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/frizington',
  'Kids Fitness Classes Frizington',
  '{"town":"frizington","town_display":"Frizington","postcode":"CA26","drive_min":4}'::jsonb,
  '{"town":"frizington","town_display":"Frizington","postcode":"CA26","drive_min":4,"landmark":"main road","monthly_search":140}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/frizington'), 1,
  'Hand-authored town page',
  '{"town":"frizington","town_display":"Frizington","drive_min":4}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Frizington · Kids 3-18",
      "badge": "4 minutes from Frizington · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Coached kids fitness four minutes from Frizington. Ages 3–18, every Sunday morning at Northern Warrior.",
      "cta_primary": "Book Frizington Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Frizington to Northern Warrior — four minutes flat",
      "paragraphs": [
        "Frizington is one of our closest villages — four minutes straight through to Bridge End. If you can see Dent Fell from your kitchen window, you''re practically our neighbour.",
        "We get a lot of kids from Arlecdon and Rowrah too. Sunday mornings work well — drop off at 10:15 for Minis, pick up at 10:35. That''s 20 minutes of proper coaching while you grab a coffee.",
        "Every session is coached by two adults. Mat handles programming and coaching. Lauren is there every week too. Both DBS checked, both first aid trained. It''s a small gym, so your child gets actual attention."
      ],
      "drive_callout": "4 minutes from Frizington. Our nearest village — some families walk here in summer."
    },
    "age_groups": {"intro": "Minis (3–5) learn through play. Littles (5–10) build real movement skills. Teens (10–18) train like athletes."},
    "schedule": {"heading": "Upcoming blocks for Frizington families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, Frizington?", "sub": "Block 4 starts Saturday 10 May. Book your spot — you''re practically next door."},
    "meta": {
      "title": "Kids Fitness Classes Frizington | Northern Warrior",
      "description": "Kids fitness classes 4 minutes from Frizington. Ages 3-18, coached every Sunday at Northern Warrior in Egremont."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- 4. GOSFORTH
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/gosforth',
  'Kids Fitness Classes Gosforth',
  '{"town":"gosforth","town_display":"Gosforth","postcode":"CA20","drive_min":18}'::jsonb,
  '{"town":"gosforth","town_display":"Gosforth","postcode":"CA20","drive_min":18,"landmark":"village green","monthly_search":210}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/gosforth'), 1,
  'Hand-authored town page',
  '{"town":"gosforth","town_display":"Gosforth","drive_min":18}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Gosforth · Kids 3-18",
      "badge": "18 minutes from Gosforth village · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Coached strength sessions for kids and teens aged 3–18. Eighteen minutes from Gosforth — worth the drive for proper coaching.",
      "cta_primary": "Book Gosforth Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Why Gosforth parents make the drive",
      "paragraphs": [
        "Gosforth to Northern Warrior is 18 minutes via Calder Bridge and the coast road. A few of our regular families come from Gosforth and Seascale — they combine it with a Sunday morning routine and make a thing of it.",
        "There''s nothing like this closer to Gosforth. The nearest alternatives are in Whitehaven or Workington, and they''re the same distance. What you get here is small group coaching — not 30 kids in a sports hall with one adult.",
        "If your child is active, sporty, or just needs something constructive on a Sunday morning, this is it. Properly coached, age-appropriate, and they''ll actually want to come back."
      ],
      "drive_callout": "18 minutes from Gosforth. A Sunday drive with purpose — and free parking when you arrive."
    },
    "age_groups": {"intro": "Three groups tailored by age. Your child trains with kids at their level."},
    "schedule": {"heading": "Upcoming blocks for Gosforth families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, Gosforth?", "sub": "Block 4 starts Saturday 10 May. Worth the drive."},
    "meta": {
      "title": "Kids Fitness Classes Gosforth Cumbria | Northern Warrior",
      "description": "Coached kids fitness classes 18 minutes from Gosforth. Ages 3-18, every Sunday at Northern Warrior, Egremont."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- 5. THORNHILL
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/thornhill',
  'Kids Fitness Classes Thornhill',
  '{"town":"thornhill","town_display":"Thornhill","postcode":"CA22","drive_min":2}'::jsonb,
  '{"town":"thornhill","town_display":"Thornhill","postcode":"CA22","drive_min":2,"landmark":"Egremont","monthly_search":90}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/thornhill'), 1,
  'Hand-authored town page',
  '{"town":"thornhill","town_display":"Thornhill","drive_min":2}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Thornhill · Kids 3-18",
      "badge": "2 minutes from Thornhill · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Kids fitness classes two minutes from Thornhill. Walk, cycle, or drive — you''re practically on our doorstep.",
      "cta_primary": "Book Thornhill Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Thornhill — you can nearly walk here",
      "paragraphs": [
        "Thornhill is two minutes from the gym. Some families literally walk. If you live on the Egremont side of Thornhill, you can see Bridge End Industrial Estate from the end of your road.",
        "Being this close means no excuses on a Sunday morning. Drop your child at 10:15 for Minis, nip home for a brew, and pick them up at 10:35. Twenty minutes of coached movement — and they''ll sleep well after.",
        "We''re not a soft play centre. We teach kids to move properly — running, jumping, lifting, gymnastics — in a real gym with real coaches. But we do it with warmth, fun, and zero pressure."
      ],
      "drive_callout": "2 minutes from Thornhill. Walk here if the weather''s decent — it''s that close."
    },
    "age_groups": {"intro": "Three groups, one gym, every Sunday. Pick the group that fits your child''s age."},
    "schedule": {"heading": "Upcoming blocks for Thornhill families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, Thornhill?", "sub": "You''re two minutes away. Block 4 starts Saturday 10 May."},
    "meta": {
      "title": "Kids Fitness Classes Thornhill Egremont | Northern Warrior",
      "description": "Kids fitness 2 minutes from Thornhill. Ages 3-18, coached Sundays at Northern Warrior. Book your child''s spot."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- 6. SEASCALE
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/seascale',
  'Kids Fitness Classes Seascale',
  '{"town":"seascale","town_display":"Seascale","postcode":"CA20","drive_min":16}'::jsonb,
  '{"town":"seascale","town_display":"Seascale","postcode":"CA20","drive_min":16,"landmark":"beach","monthly_search":170}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/seascale'), 1,
  'Hand-authored town page',
  '{"town":"seascale","town_display":"Seascale","drive_min":16}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Seascale · Kids 3-18",
      "badge": "16 minutes from Seascale · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Coached sessions for kids 3–18, sixteen minutes from Seascale. Strength, movement and fun — proper coaching every Sunday.",
      "cta_primary": "Book Seascale Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Seascale families — it''s closer than you think",
      "paragraphs": [
        "Seascale to Northern Warrior is 16 minutes via Gosforth and Calder Bridge. A straight run with no traffic on a Sunday morning. Some families from the Sellafield corridor already combine it with their weekend routine.",
        "There isn''t a kids strength programme near Seascale — the closest options are in Whitehaven or Kendal, both further. Here you get a proper gym, proper coaches, and a group small enough that your child actually gets coached.",
        "We''re not a holiday club or a bouncy castle session. We teach functional movement — pulling, pushing, squatting, jumping — scaled to your child''s age and ability. They leave stronger and more confident."
      ],
      "drive_callout": "16 minutes from Seascale. Sunday morning drive with no traffic — beach after if you fancy it."
    },
    "age_groups": {"intro": "Pick by age — Minis play, Littles build foundations, Teens train seriously."},
    "schedule": {"heading": "Upcoming blocks for Seascale families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, Seascale?", "sub": "Block 4 starts Saturday 10 May. Sunday mornings sorted."},
    "meta": {
      "title": "Kids Fitness Classes Seascale | Northern Warrior",
      "description": "Kids fitness 16 minutes from Seascale. Coached strength & conditioning ages 3-18, Sundays at Northern Warrior."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- 7. ST BEES
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/st-bees',
  'Kids Fitness Classes St Bees',
  '{"town":"st-bees","town_display":"St Bees","postcode":"CA27","drive_min":10}'::jsonb,
  '{"town":"st-bees","town_display":"St Bees","postcode":"CA27","drive_min":10,"landmark":"priory","monthly_search":190}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/st-bees'), 1,
  'Hand-authored town page',
  '{"town":"st-bees","town_display":"St Bees","drive_min":10}'::jsonb,
  '{
    "hero": {
      "eyebrow": "St Bees · Kids 3-18",
      "badge": "10 minutes from St Bees · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Kids and teens strength coaching, ten minutes from St Bees. Functional fitness in a real gym, every Sunday morning.",
      "cta_primary": "Book St Bees Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "St Bees parents — ten minutes to proper coaching",
      "paragraphs": [
        "St Bees to Northern Warrior is a ten-minute drive inland. Up past Sandwith, through to Egremont and you''re at Bridge End. Quick, easy, and you''ll be back on the beach by lunchtime.",
        "Whether your kids go to St Bees Village School or St Bees School, this complements whatever sport they''re already doing. We build general physical preparation — the strength, coordination and confidence that makes everything else easier.",
        "Sessions run every Sunday morning. Minis finish at 10:35, so you''re home before 11. Teens finish at 12:30 — still time for a walk along the headland after if the weather''s in."
      ],
      "drive_callout": "10 minutes from St Bees. Quick drive inland, home in time for Sunday lunch."
    },
    "age_groups": {"intro": "Three groups, three coaching styles. All built around proper movement and genuine fun."},
    "schedule": {"heading": "Upcoming blocks for St Bees families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, St Bees?", "sub": "Block 4 starts Saturday 10 May. Ten minutes — go on."},
    "meta": {
      "title": "Kids Fitness Classes St Bees | Northern Warrior",
      "description": "Kids fitness 10 minutes from St Bees. Coached strength & conditioning ages 3-18. Sundays at Northern Warrior, Egremont."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- 8. BECKERMET
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/beckermet',
  'Kids Fitness Classes Beckermet',
  '{"town":"beckermet","town_display":"Beckermet","postcode":"CA21","drive_min":6}'::jsonb,
  '{"town":"beckermet","town_display":"Beckermet","postcode":"CA21","drive_min":6,"landmark":"village","monthly_search":110}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/beckermet'), 1,
  'Hand-authored town page',
  '{"town":"beckermet","town_display":"Beckermet","drive_min":6}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Beckermet · Kids 3-18",
      "badge": "6 minutes from Beckermet · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Six minutes from Beckermet — coached kids fitness every Sunday at Northern Warrior. Ages 3 to 18.",
      "cta_primary": "Book Beckermet Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Beckermet — six minutes and you''re here",
      "paragraphs": [
        "Beckermet to the gym takes six minutes through Thornhill. One road, no fuss. We already have families from Beckermet and Calder Bridge who make this part of their Sunday.",
        "If your child goes to Beckermet Primary, they probably know someone who comes here. It''s a small community — word gets around when kids come home buzzing about what they did at the gym.",
        "This isn''t a ball pit. It''s a real strength and conditioning gym where kids learn to move well, build confidence, and have fun doing it. Two coached adults every session — Mat and Lauren."
      ],
      "drive_callout": "6 minutes from Beckermet. Through Thornhill and you''re here."
    },
    "age_groups": {"intro": "Pick the group that matches your child''s age. We''ll guide them from there."},
    "schedule": {"heading": "Upcoming blocks for Beckermet families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, Beckermet?", "sub": "Block 4 starts Saturday 10 May. Six minutes and you''re in."},
    "meta": {
      "title": "Kids Fitness Classes Beckermet | Northern Warrior",
      "description": "Kids fitness 6 minutes from Beckermet. Coached sessions ages 3-18, Sundays at Northern Warrior, Egremont."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- 9. PARTON
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/parton',
  'Kids Fitness Classes Parton',
  '{"town":"parton","town_display":"Parton","postcode":"CA28","drive_min":8}'::jsonb,
  '{"town":"parton","town_display":"Parton","postcode":"CA28","drive_min":8,"landmark":"coast road","monthly_search":90}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/parton'), 1,
  'Hand-authored town page',
  '{"town":"parton","town_display":"Parton","drive_min":8}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Parton · Kids 3-18",
      "badge": "8 minutes from Parton · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Coached kids fitness eight minutes from Parton. Real strength training, real fun, every Sunday morning.",
      "cta_primary": "Book Parton Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Parton parents — eight minutes to a proper gym",
      "paragraphs": [
        "Parton to Northern Warrior is eight minutes — cut through Moresby Parks to Egremont and you''re at Bridge End. Easier than driving into Whitehaven for most things.",
        "If your child needs something active on a Sunday that isn''t a football pitch, this is it. We teach movement skills — pulling, pushing, squatting, lifting — that make them better at everything else they do.",
        "Small groups, two coaches, real equipment. Not a church hall with some cones. A proper gym where kids learn what their body can do."
      ],
      "drive_callout": "8 minutes from Parton via Moresby Parks. Quicker than town and better parking."
    },
    "age_groups": {"intro": "Three age-appropriate groups. Every child coached to their level."},
    "schedule": {"heading": "Upcoming blocks for Parton families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, Parton?", "sub": "Block 4 starts Saturday 10 May. Eight minutes — that''s all."},
    "meta": {
      "title": "Kids Fitness Classes Parton | Northern Warrior",
      "description": "Kids fitness 8 minutes from Parton. Coached strength & conditioning for ages 3-18, Sundays at Northern Warrior."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- 10. LOWCA
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/lowca',
  'Kids Fitness Classes Lowca',
  '{"town":"lowca","town_display":"Lowca","postcode":"CA28","drive_min":10}'::jsonb,
  '{"town":"lowca","town_display":"Lowca","postcode":"CA28","drive_min":10,"landmark":"coast","monthly_search":70}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/lowca'), 1,
  'Hand-authored town page',
  '{"town":"lowca","town_display":"Lowca","drive_min":10}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Lowca · Kids 3-18",
      "badge": "10 minutes from Lowca · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Kids strength and conditioning ten minutes from Lowca. Coached sessions for ages 3–18, every Sunday at Northern Warrior.",
      "cta_primary": "Book Lowca Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Lowca kids — ten minutes to something different",
      "paragraphs": [
        "Lowca to Northern Warrior is ten minutes through Parton and Moresby Parks. An easy Sunday morning drive — and a much better use of the morning than screens.",
        "We don''t do party games or trampolines. We do real coaching — movement, strength, coordination, teamwork. Designed so your child actually improves week on week, not just turns up and runs around.",
        "Mat and Lauren coach every single session. Both DBS checked, both first aid qualified. Your child is in safe hands — and they''ll come out stronger for it."
      ],
      "drive_callout": "10 minutes from Lowca. Through Parton, past Moresby — easy drive on a Sunday."
    },
    "age_groups": {"intro": "Three groups by age. We match the coaching to what your child needs."},
    "schedule": {"heading": "Upcoming blocks for Lowca families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, Lowca?", "sub": "Block 4 starts Saturday 10 May. Give them a Sunday they''ll actually enjoy."},
    "meta": {
      "title": "Kids Fitness Classes Lowca | Northern Warrior",
      "description": "Kids fitness classes 10 minutes from Lowca. Ages 3-18, coached Sundays at Northern Warrior, Egremont."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- 11. MORESBY PARKS
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/moresby-parks',
  'Kids Fitness Classes Moresby Parks',
  '{"town":"moresby-parks","town_display":"Moresby Parks","postcode":"CA28","drive_min":7}'::jsonb,
  '{"town":"moresby-parks","town_display":"Moresby Parks","postcode":"CA28","drive_min":7,"landmark":"village","monthly_search":80}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/moresby-parks'), 1,
  'Hand-authored town page',
  '{"town":"moresby-parks","town_display":"Moresby Parks","drive_min":7}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Moresby Parks · Kids 3-18",
      "badge": "7 minutes from Moresby Parks · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Seven minutes from Moresby Parks — coached kids sessions every Sunday. Strength, movement and confidence for ages 3 to 18.",
      "cta_primary": "Book Moresby Parks Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Moresby Parks — seven minutes to Northern Warrior",
      "paragraphs": [
        "Moresby Parks to the gym is seven minutes — through Distington and down to Bridge End. An easy route even on a Sunday morning with half-asleep kids in the back.",
        "We''re the closest kids strength programme to Moresby Parks. Whitehaven has swimming and football, but if you want your child to learn proper movement — lifting, gymnastics, conditioning — we''re the only option within 20 miles.",
        "Sessions are short and focused. Minis are 20 minutes, Littles 30 minutes, Teens an hour. Every minute coached. Your child won''t be standing around waiting for a turn."
      ],
      "drive_callout": "7 minutes from Moresby Parks. Through Distington and you''re here."
    },
    "age_groups": {"intro": "Three groups. Real coaching. Scaled to your child''s age and ability."},
    "schedule": {"heading": "Upcoming blocks for Moresby Parks families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, Moresby Parks?", "sub": "Block 4 starts Saturday 10 May. Seven minutes — make Sunday count."},
    "meta": {
      "title": "Kids Fitness Classes Moresby Parks | Northern Warrior",
      "description": "Kids fitness 7 minutes from Moresby Parks. Coached ages 3-18, every Sunday at Northern Warrior, Egremont."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- 12. COCKERMOUTH
insert into seo_pages (template_id, url_path, title, variables, data_row, status, version, published_at)
values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/cockermouth',
  'Kids Fitness Classes Cockermouth',
  '{"town":"cockermouth","town_display":"Cockermouth","postcode":"CA13","drive_min":22}'::jsonb,
  '{"town":"cockermouth","town_display":"Cockermouth","postcode":"CA13","drive_min":22,"landmark":"Main Street","monthly_search":480}'::jsonb,
  'live', 1, now()
) on conflict (url_path) do update set variables = excluded.variables, data_row = excluded.data_row, status = excluded.status;

insert into seo_briefs (page_id, version, prompt_used, data_snapshot, generated_content, model)
values (
  (select id from seo_pages where url_path = '/kids-classes/cockermouth'), 1,
  'Hand-authored town page',
  '{"town":"cockermouth","town_display":"Cockermouth","drive_min":22}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Cockermouth · Kids 3-18",
      "badge": "22 minutes from Cockermouth · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG", "title_bottom": "WARRIORS",
      "sub": "Proper kids fitness coaching, 22 minutes from Cockermouth. The nearest dedicated kids strength programme to the Cocker Valley.",
      "cta_primary": "Book Cockermouth Block", "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Cockermouth parents — why the drive is worth it",
      "paragraphs": [
        "Cockermouth to Northern Warrior is 22 minutes down the A5086. It''s a drive, yes — but there is genuinely nothing like this closer. The nearest equivalent is Carlisle or Kendal. We''re half the distance.",
        "Several Cockermouth families already make the journey. They combine it with an Egremont shop or a coffee in town while the kids train. Minis are done by 10:35, so you''re back before noon.",
        "What your child gets is proper coaching in a real gym — not a village hall, not a school PE lesson. Mat programmes every session, Lauren assists, and both are qualified, DBS checked, and actually care about your child''s progress."
      ],
      "drive_callout": "22 minutes from Cockermouth via the A5086. The closest kids S&C programme to the Cocker Valley."
    },
    "age_groups": {"intro": "Three groups, three age ranges. Everyone gets coached to their level — not one-size-fits-all."},
    "schedule": {"heading": "Upcoming blocks for Cockermouth families", "next_block_label": "Block 4 · Spring/Summer 2026"},
    "cta_band": {"headline": "Ready, Cockermouth?", "sub": "Block 4 starts Saturday 10 May. The drive is worth it — ask the families who already make it."},
    "meta": {
      "title": "Kids Fitness Classes Cockermouth | Northern Warrior",
      "description": "Kids fitness 22 minutes from Cockermouth. Coached strength & conditioning ages 3-18, Sundays at Northern Warrior."
    }
  }'::jsonb, 'manual-edit'
) on conflict (page_id, version) do update set generated_content = excluded.generated_content;

-- ── Link all pages to their briefs ───────────────────────────────────────────
update seo_pages p
set brief_id = (
  select id from seo_briefs b
  where b.page_id = p.id
  order by b.version desc limit 1
)
where p.url_path like '/kids-classes/%'
  and p.brief_id is null;
