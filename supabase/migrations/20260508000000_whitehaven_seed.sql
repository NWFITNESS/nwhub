-- ─────────────────────────────────────────────────────────────────────────────
-- Whitehaven — first reference page for Kids × Town template
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure template exists (may already be seeded)
insert into seo_templates (slug, name, url_pattern, status, variables)
values ('kids-by-town', 'Kids Classes by Town', '/kids-classes/[town]', 'live', '["town"]'::jsonb)
on conflict (slug) do nothing;

-- Upsert the Whitehaven page
insert into seo_pages (
  template_id, url_path, title, variables, data_row, status, version, published_at
) values (
  (select id from seo_templates where slug = 'kids-by-town'),
  '/kids-classes/whitehaven',
  'Kids Fitness Classes Whitehaven',
  '{"town":"whitehaven","town_display":"Whitehaven","postcode":"CA28","drive_min":12,"landmark":"harbour"}'::jsonb,
  '{"town":"whitehaven","town_display":"Whitehaven","postcode":"CA28","drive_min":12,"landmark":"harbour","monthly_search":880}'::jsonb,
  'live',
  1,
  now()
)
on conflict (url_path) do update set
  variables = excluded.variables,
  data_row = excluded.data_row,
  status = excluded.status;

-- Hand-authored brief with real Whitehaven content
insert into seo_briefs (
  page_id, version, prompt_used, data_snapshot, generated_content, model
) values (
  (select id from seo_pages where url_path = '/kids-classes/whitehaven'),
  1,
  'Hand-authored — first reference page for Kids × Town template',
  '{"town":"whitehaven","town_display":"Whitehaven","postcode":"CA28","drive_min":12,"landmark":"harbour","monthly_search":880}'::jsonb,
  '{
    "hero": {
      "eyebrow": "Whitehaven · Kids 3-18",
      "badge": "Just 12 minutes from Whitehaven harbour · Kids & Teens S&C · Est. 2021",
      "title_top": "YOUNG",
      "title_bottom": "WARRIORS",
      "sub": "Strength, conditioning and serious fun — coached sessions for kids and teens aged 3-18, just 12 minutes from Whitehaven.",
      "cta_primary": "Book Whitehaven Block",
      "cta_secondary": "Find Your Group"
    },
    "local": {
      "heading": "Why Whitehaven parents pick Northern Warrior",
      "paragraphs": [
        "Whitehaven to Northern Warrior is a 12-minute drive — straight out past the Beacon and down through Bigrigg. Most Whitehaven parents have it timed to fit around the school run from Bransty, Hensingham or Mirehouse.",
        "We coach properly. Mat is the head kids coach with paediatric first aid and full DBS clearance. Lauren assists every session — Level 3 Sport Science, first aid, DBS clearance too. Two adults on the floor at all times means kids actually get coached, not just kept busy.",
        "We don''t do crash diets, we don''t do shouty sergeant-major. We do strength, gymnastics, movement and games — designed so kids leave fitter, stronger, and looking forward to coming back."
      ],
      "drive_callout": "12 minutes from the harbour. Easy parking on site. Plenty of room for siblings to wait."
    },
    "age_groups": {
      "intro": "Three groups, three sets of priorities. Pick by age — we''ll move them up when they''re ready, not before."
    },
    "schedule": {
      "heading": "Upcoming blocks for Whitehaven families",
      "next_block_label": "Block 4 · Spring/Summer 2026"
    },
    "cta_band": {
      "headline": "Ready, Whitehaven?",
      "sub": "Block 4 starts Saturday 10 May. Book your child''s spot now."
    },
    "meta": {
      "title": "Kids Fitness Classes Whitehaven | Northern Warrior",
      "description": "Coached strength & conditioning for kids 3-18, just 12 minutes from Whitehaven. Block 4 starts 10 May 2026. Book your child''s spot."
    }
  }'::jsonb,
  'manual-edit'
)
on conflict (page_id, version) do update set
  generated_content = excluded.generated_content;

-- Link page to brief
update seo_pages
set brief_id = (
  select id from seo_briefs
  where page_id = (select id from seo_pages where url_path = '/kids-classes/whitehaven')
  order by version desc limit 1
)
where url_path = '/kids-classes/whitehaven';
