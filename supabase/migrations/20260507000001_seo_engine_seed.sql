-- ─────────────────────────────────────────────────────────────────────────────
-- SEO Engine — seed data for UI development
-- ─────────────────────────────────────────────────────────────────────────────

-- Templates
insert into seo_templates (id, slug, name, url_pattern, status, variables) values
  ('a1000000-0000-0000-0000-000000000001', 'kids-by-town', 'Kids Classes by Town', '/kids-classes/[town]', 'live', '["town"]'::jsonb),
  ('a1000000-0000-0000-0000-000000000002', 'discipline-by-town', 'Discipline by Town', '/[discipline]/[town]', 'live', '["discipline","town"]'::jsonb),
  ('a1000000-0000-0000-0000-000000000003', 'goals-by-town', 'Goals by Town', '/[goal]/[town]', 'draft', '["goal","town"]'::jsonb)
on conflict (slug) do nothing;

-- Pages — Kids by Town
insert into seo_pages (id, template_id, url_path, title, variables, data_row, status, published_at) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '/kids-classes/whitehaven', 'Kids Fitness Classes Whitehaven', '{"town":"whitehaven","drive_min":12}'::jsonb, '{"town":"Whitehaven","postcode_prefix":"CA28","population":24978,"drive_min":12}'::jsonb, 'live', now() - interval '30 days'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', '/kids-classes/workington', 'Kids Fitness Classes Workington', '{"town":"workington","drive_min":15}'::jsonb, '{"town":"Workington","postcode_prefix":"CA14","population":25207,"drive_min":15}'::jsonb, 'live', now() - interval '28 days'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', '/kids-classes/cockermouth', 'Kids Fitness Classes Cockermouth', '{"town":"cockermouth","drive_min":20}'::jsonb, '{"town":"Cockermouth","postcode_prefix":"CA13","population":8761,"drive_min":20}'::jsonb, 'live', now() - interval '25 days'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', '/kids-classes/cleator-moor', 'Kids Fitness Classes Cleator Moor', '{"town":"cleator-moor","drive_min":8}'::jsonb, '{"town":"Cleator Moor","postcode_prefix":"CA25","population":7257,"drive_min":8}'::jsonb, 'live', now() - interval '20 days')
on conflict (url_path) do nothing;

-- Pages — Discipline by Town
insert into seo_pages (id, template_id, url_path, title, variables, data_row, status, published_at) values
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', '/hyrox-training/whitehaven', 'HYROX Training Whitehaven', '{"discipline":"hyrox-training","town":"whitehaven"}'::jsonb, '{"discipline":"HYROX Training","town":"Whitehaven","postcode_prefix":"CA28"}'::jsonb, 'live', now() - interval '30 days'),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', '/olympic-weightlifting/workington', 'Olympic Weightlifting Workington', '{"discipline":"olympic-weightlifting","town":"workington"}'::jsonb, '{"discipline":"Olympic Weightlifting","town":"Workington","postcode_prefix":"CA14"}'::jsonb, 'live', now() - interval '28 days'),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', '/functional-fitness/keswick', 'Functional Fitness Keswick', '{"discipline":"functional-fitness","town":"keswick"}'::jsonb, '{"discipline":"Functional Fitness","town":"Keswick","postcode_prefix":"CA12"}'::jsonb, 'live', now() - interval '22 days'),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002', '/personal-training/whitehaven', 'Personal Training Whitehaven', '{"discipline":"personal-training","town":"whitehaven"}'::jsonb, '{"discipline":"Personal Training","town":"Whitehaven","postcode_prefix":"CA28"}'::jsonb, 'draft', null)
on conflict (url_path) do nothing;

-- Pages — Goals by Town (draft template)
insert into seo_pages (id, template_id, url_path, title, variables, data_row, status) values
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000003', '/weight-loss/whitehaven', 'Weight Loss Whitehaven', '{"goal":"weight-loss","town":"whitehaven"}'::jsonb, '{"goal":"Weight Loss","town":"Whitehaven"}'::jsonb, 'draft'),
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000003', '/muscle-building/workington', 'Muscle Building Workington', '{"goal":"muscle-building","town":"workington"}'::jsonb, '{"goal":"Muscle Building","town":"Workington"}'::jsonb, 'draft')
on conflict (url_path) do nothing;

-- ── GSC daily data (28 days for live pages) ─────────────────────────────────
-- Generate realistic daily impressions/clicks for the first 7 live pages
do $$
declare
  p record;
  d int;
  imp int;
  clk int;
begin
  for p in
    select id from seo_pages where status = 'live' order by url_path
  loop
    for d in 0..27 loop
      -- Randomish impressions 20-200, clicks 1-15
      imp := 20 + floor(random() * 180)::int;
      clk := greatest(1, floor(imp * (0.02 + random() * 0.06))::int);
      insert into seo_gsc_daily (page_id, date, impressions, clicks, ctr, position)
      values (
        p.id,
        current_date - d,
        imp,
        clk,
        round((clk::numeric / nullif(imp, 0)), 4),
        round((5 + random() * 25)::numeric, 2)
      )
      on conflict (page_id, date) do nothing;
    end loop;
  end loop;
end $$;

-- ── GA4 daily data ──────────────────────────────────────────────────────────
do $$
declare
  p record;
  d int;
  sess int;
begin
  for p in
    select id from seo_pages where status = 'live' order by url_path
  loop
    for d in 0..27 loop
      sess := 3 + floor(random() * 20)::int;
      insert into seo_ga4_daily (page_id, date, sessions, engaged_sessions, conversions)
      values (
        p.id,
        current_date - d,
        sess,
        greatest(1, floor(sess * 0.6)::int),
        case when random() < 0.15 then 1 else 0 end
      )
      on conflict (page_id, date) do nothing;
    end loop;
  end loop;
end $$;

-- ── GSC queries (last week) ─────────────────────────────────────────────────
insert into seo_gsc_queries (page_id, query, impressions, clicks, position, week_start) values
  ('b1000000-0000-0000-0000-000000000001', 'kids fitness classes whitehaven', 85, 6, 4.2, date_trunc('week', current_date)::date),
  ('b1000000-0000-0000-0000-000000000001', 'kids gym whitehaven', 52, 3, 8.1, date_trunc('week', current_date)::date),
  ('b1000000-0000-0000-0000-000000000001', 'children exercise classes near me', 120, 4, 14.5, date_trunc('week', current_date)::date),
  ('b1000000-0000-0000-0000-000000000002', 'kids fitness workington', 45, 2, 6.3, date_trunc('week', current_date)::date),
  ('b1000000-0000-0000-0000-000000000005', 'hyrox training whitehaven', 38, 5, 3.1, date_trunc('week', current_date)::date),
  ('b1000000-0000-0000-0000-000000000005', 'hyrox gym near me cumbria', 95, 7, 11.2, date_trunc('week', current_date)::date),
  ('b1000000-0000-0000-0000-000000000006', 'olympic weightlifting workington', 22, 3, 5.7, date_trunc('week', current_date)::date)
on conflict (page_id, query, week_start) do nothing;

-- ── Health data ─────────────────────────────────────────────────────────────
insert into seo_health (page_id, is_indexed, last_crawled_at, http_status, schema_valid, schema_types, inbound_links, outbound_links, lcp_ms, cls, inp_ms, uniqueness_score, checked_at) values
  ('b1000000-0000-0000-0000-000000000001', true,  now() - interval '2 days', 200, true,  '{HealthClub,SportsActivityLocation}', 3, 5, 1800, 0.04, 120, 0.82, now()),
  ('b1000000-0000-0000-0000-000000000002', true,  now() - interval '3 days', 200, true,  '{HealthClub,SportsActivityLocation}', 2, 5, 2100, 0.06, 150, 0.79, now()),
  ('b1000000-0000-0000-0000-000000000003', false, null,                       200, true,  '{HealthClub,SportsActivityLocation}', 1, 4, 1900, 0.03, 110, 0.85, now()),
  ('b1000000-0000-0000-0000-000000000004', true,  now() - interval '1 day',  200, true,  '{HealthClub,SportsActivityLocation}', 2, 5, 2400, 0.08, 180, 0.76, now()),
  ('b1000000-0000-0000-0000-000000000005', true,  now() - interval '2 days', 200, true,  '{HealthClub}', 4, 6, 1700, 0.02, 100, 0.88, now()),
  ('b1000000-0000-0000-0000-000000000006', true,  now() - interval '4 days', 200, false, '{HealthClub}', 1, 3, 3200, 0.12, 250, 0.71, now()),
  ('b1000000-0000-0000-0000-000000000007', false, null,                       200, true,  '{HealthClub}', 0, 4, 2000, 0.05, 130, 0.83, now())
on conflict (page_id) do nothing;

-- ── Pipeline run (completed) ────────────────────────────────────────────────
insert into seo_pipeline_runs (template_id, status, current_step, steps, cells_planned, cells_passed, cells_generated, started_at, finished_at) values
  ('a1000000-0000-0000-0000-000000000001', 'succeeded', 'publish',
   '[{"name":"strategy","status":"done","started_at":"2026-05-04T10:00:00Z","finished_at":"2026-05-04T10:01:00Z"},{"name":"volume_check","status":"done","started_at":"2026-05-04T10:01:00Z","finished_at":"2026-05-04T10:03:00Z"},{"name":"generate","status":"done","started_at":"2026-05-04T10:03:00Z","finished_at":"2026-05-04T10:12:00Z"},{"name":"publish","status":"done","started_at":"2026-05-04T10:12:00Z","finished_at":"2026-05-04T10:13:00Z"}]'::jsonb,
   4, 4, 4, now() - interval '3 days', now() - interval '3 days' + interval '13 minutes')
on conflict do nothing;
