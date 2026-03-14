-- ── Seed: page_content ───────────────────────────────────────────────────────
-- All values are taken directly from the hardcoded arrays in northernwarrior-v2.
-- ON CONFLICT DO NOTHING means re-running this is safe and won't overwrite live edits.

-- ─────────────────────────────────────────────────────────────────────────────
-- HOME
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO page_content (page_slug, section_key, content) VALUES

('home', 'hero', '{
  "kicker": "Egremont — Cumbria",
  "heading": "Community Driven.\nFun. Fitness.",
  "subtext": "Discover Cumbria''s premier destination for strength and conditioning excellence — built for progress and powered by community.",
  "image_url": ""
}'::jsonb),

('home', 'memberships', '{
  "heading": "Pricing that''s clear. Options that fit real life.",
  "cards": [
    {"title": "2x Weekly",          "price": "£51",  "period": "per month", "desc": "Perfect for consistency without living in the gym. Includes Open Gym.",                              "highlight": false},
    {"title": "Unlimited",          "price": "£66",  "period": "per month", "desc": "Train as often as you like across our coached sessions + Open Gym included.",                        "highlight": true},
    {"title": "Unlimited + 24/7",   "price": "£71",  "period": "per month", "desc": "Unlimited coached sessions plus 24/7 access so you can train around your schedule.",                "highlight": false},
    {"title": "10 Pack",            "price": "£84",  "period": "pack",      "desc": "Flexible class pack to use across sessions — ideal for shifts and busy schedules.",                  "highlight": false},
    {"title": "20 Pack",            "price": "£156", "period": "pack",      "desc": "More flexible training at a better rate — ideal if you''re consistent but not monthly.",             "highlight": false}
  ]
}'::jsonb),

('home', 'faq', '{
  "items": [
    {"q": "Do I need to be ''fit'' before I start training at Northern Warrior?",
     "a": "No. You start where you are. Everything is coached and scaled so you can build confidence, consistency and progress safely."},
    {"q": "Which class should I go to, and what''s the difference between the types of classes?",
     "a": "If you''re new, start with Start Here and we''ll point you to the best sessions. Functional Fitness is our main coached program, HYROX is hybrid race-focused, and Kids & Teens is separate for younger athletes."},
    {"q": "What will my first time in the gym be like?",
     "a": "You''ll be welcomed, briefed, and coached through the session. Expect a structured warm-up, coached technique, and a workout scaled to your level."},
    {"q": "How often should I attend class?",
     "a": "2–3 sessions per week is the sweet spot for most people. Consistency beats intensity. We''ll help you build a realistic rhythm."},
    {"q": "Do you have lockers, showers & changing facilities onsite?",
     "a": "Yes — we have changing facilities and storage options. If you''re unsure what''s available day-to-day, message us and we''ll confirm."},
    {"q": "What''s your drop-in policy?",
     "a": "Drop-ins are welcome for experienced gym-goers. Check Start Here and we''ll direct you to the correct route (trial, induction or drop-in)."},
    {"q": "Do you have Open Gym access?",
     "a": "Yes — Open Gym is included in all memberships. You can train around coached sessions and build extra work in when needed."}
  ]
}'::jsonb),

('home', 'social_carousel', '{
  "heading": "Real training. Real people. Real community.",
  "subtext": "A glimpse of life inside Northern Warrior — sessions, events, wins and the graft in between.",
  "ig_url": "https://www.instagram.com/nwfitnessuk/",
  "speed": 55,
  "items": []
}'::jsonb),

('home', 'contact_block', '{
  "address": ["Unit 6, Bridge End Industrial Estate,", "Egremont, Cumbria, CA22 2RD"],
  "whatsapp": "+447950340217",
  "email": "info@northernwarrior.co.uk"
}'::jsonb)

ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- TRAINING
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO page_content (page_slug, section_key, content) VALUES

('training', 'hero', '{
  "kicker": "Training Programs",
  "heading": "Every session. Purposefully programmed.",
  "subtext": "Eight training tracks — from daily conditioning to Olympic lifting — all under one roof. HWPO-programmed sessions for every level.",
  "image_url": "/feature-1.jpg"
}'::jsonb),

('training', 'sessions', '{
  "items": [
    {"title": "Workout of the Day", "type": "WOD",         "desc": "Our daily session. Functional fitness combining strength, conditioning and skill work — programmed by HWPO and coached from warmup to cooldown. Scales to any level.",                                                          "image_url": "/feature-1.jpg", "link": null},
    {"title": "HYROX",             "type": "Race prep",    "desc": "Hybrid race prep: running, stations, pacing and conditioning. As an official HYROX affiliate, we build you for race day from first-timer to podium finisher.",                                                                  "image_url": "/feature-2.jpg", "link": "/hyrox"},
    {"title": "EMOM40",            "type": "Engine",       "desc": "40 minutes, every minute on the minute. An engine-building session mixing monostructural cardio, gymnastics and weightlifting. Relentless but sustainable.",                                                                    "image_url": "/ig/4.png",      "link": null},
    {"title": "BodyBuilding",      "type": "Hypertrophy",  "desc": "Hypertrophy-focused work alongside your conditioning. Compound and isolation movements programmed to build strength and physique with intent.",                                                                                  "image_url": "/ig/7.png",      "link": null},
    {"title": "Weightlifting",     "type": "Olympic",      "desc": "Snatch and clean & jerk, broken down properly. Positional drills, technique cycles and heavy singles — suitable for beginners through to competitors.",                                                                         "image_url": "/ig/10.png",     "link": null},
    {"title": "Gymnastics",        "type": "Skill",        "desc": "Skill-based sessions run in focused blocks. Progressions from foundational pulling and pressing strength through to muscle-ups, handstand walks and beyond.",                                                                   "image_url": "/ig/2.png",      "link": null}
  ]
}'::jsonb),

('training', 'specialist', '{
  "items": [
    {"title": "Open Gym",    "type": "Open — 10 members max", "desc": "Self-directed training time with a qualified coach on the floor. Up to 10 members at a time. Included in all memberships.", "image_url": "/ig/5.png",      "link": null},
    {"title": "Kids & Teens","type": "Specialist",            "desc": "Mini Warriors (3–5), Little Warriors (5–10) and Teen Warriors (10–18). Coached, safe and seriously fun.",                    "image_url": "/feature-3.jpg", "link": "/kids-teens"}
  ]
}'::jsonb),

('training', 'hwpo', '{
  "text": "Northern Warrior is an official HWPO affiliate. HWPO — Hard Work Pays Off — is the world-class training platform built by 5x CrossFit Games champion Mat Fraser. Most of our programs (WOD, EMOM40, BodyBuilding, Weightlifting, Gymnastics) are delivered directly from HWPO''s elite programming team and scaled for all levels — from your first session to competition podium."
}'::jsonb)

ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- HYROX
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO page_content (page_slug, section_key, content) VALUES

('hyrox', 'hero', '{
  "kicker": "HYROX Affiliate",
  "heading": "HYROX training that actually prepares you for race day.",
  "subtext": "Build your engine. Get efficient on the stations. Learn to pace when it matters.",
  "image_url": "/feature-2.jpg"
}'::jsonb),

('hyrox', 'stations', '{
  "items": [
    {"name": "SkiErg"},
    {"name": "Sled Push"},
    {"name": "Sled Pull"},
    {"name": "Burpee Broad Jumps"},
    {"name": "Row"},
    {"name": "Farmers Carry"},
    {"name": "Sandbag Lunges"},
    {"name": "Wall Balls"}
  ]
}'::jsonb),

('hyrox', 'blocks', '{
  "items": [
    {"title": "Run Fitness + Pacing",       "desc": "Intervals, threshold and race-pace efforts so you can hold speed without blowing up.",                     "image_url": "/ig/3.png"},
    {"title": "Stations Under Fatigue",     "desc": "Execute stations efficiently when heart rate is high and legs are cooked.",                                 "image_url": "/ig/6.png"},
    {"title": "Strength for HYROX",         "desc": "Leg strength, trunk stability and pulling strength to stay robust and fast.",                               "image_url": "/ig/9.png"},
    {"title": "Hybrid Conditioning",        "desc": "Mixed machine + movement sessions that build the work capacity HYROX demands.",                             "image_url": "/ig/12.png"}
  ]
}'::jsonb)

ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- KIDS & TEENS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO page_content (page_slug, section_key, content) VALUES

('kids-teens', 'hero', '{
  "kicker": "Kids & Teens",
  "heading": "Confidence. Fitness. Community.",
  "subtext": "A coached programme built for long-term development — fun, safe, scalable and structured.",
  "image_url": "/feature-3.jpg"
}'::jsonb),

('kids-teens', 'groups', '{
  "items": [
    {"title": "Mini Warriors",   "age": "Ages 3–5",  "desc": "Fun-based movement, coordination, confidence, and listening skills.",                                                                          "image_url": "/feature-3.jpg"},
    {"title": "Little Warriors", "age": "Ages 5–10", "desc": "Movement foundations: running, jumping, pulling, squatting, throwing and teamwork — scaled and coached.",                                      "image_url": "/feature-3.jpg"},
    {"title": "Teen Warriors",   "age": "Ages 10–18","desc": "Strength, conditioning and confidence. Learn safe lifting, good movement, and how to train with intent.",                                      "image_url": "/feature-3.jpg"}
  ]
}'::jsonb),

('kids-teens', 'steps', '{
  "items": [
    {"text": "Complete registration (parent/guardian + emergency info + photo consent)."},
    {"text": "Receive an email summary for your records and ours."},
    {"text": "Continue to payment via Square."},
    {"text": "Next time, bypass registration if you''ve already completed it on this device."}
  ]
}'::jsonb),

('kids-teens', 'payment_url', '{
  "url": "https://nw-fitness---kidsteens.square.site/"
}'::jsonb)

ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- MEMBERSHIP
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO page_content (page_slug, section_key, content) VALUES

('membership', 'hero', '{
  "kicker": "Membership",
  "heading": "Clear pricing. Premium coaching. No nonsense.",
  "subtext": "Pick the membership that fits your schedule. Open Gym is included across all options.",
  "image_url": "/feature-1.jpg"
}'::jsonb),

('membership', 'pricing', '{
  "heading": "Membership Options",
  "cards": [
    {"name": "2 Sessions / week",  "price": "£51",  "note": "per month"},
    {"name": "Unlimited",          "price": "£66",  "note": "per month"},
    {"name": "Unlimited + 24/7",   "price": "£71",  "note": "per month"},
    {"name": "10 Session Pack",    "price": "£84",  "note": "one-off"},
    {"name": "20 Session Pack",    "price": "£156", "note": "one-off"}
  ]
}'::jsonb),

('membership', 'perks', '{
  "heading": "What''s included",
  "items": [
    {"text": "Open Gym included in all memberships"},
    {"text": "Coached group sessions"},
    {"text": "Scalable programming for all levels"},
    {"text": "Supportive community & accountability"}
  ]
}'::jsonb),

('membership', 'discounts', '{
  "heading": "Discounts",
  "items": [
    {"text": "10% Forces Discount"},
    {"text": "10% NHS Discount"},
    {"text": "10% Emergency Services Discount"},
    {"text": "10% Sibling Discount (Kids & Teens)"}
  ]
}'::jsonb),

('membership', 'terms', '{
  "text": "2-month commitment → then 30-day notice. No joining fees."
}'::jsonb)

ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- OUR FACILITIES
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO page_content (page_slug, section_key, content) VALUES

('our-facilities', 'hero', '{
  "kicker": "Our Facilities",
  "heading": "Built for performance — not crowded treadmill rows.",
  "subtext": "Northern Warrior is designed for functional training: space to move, kit that supports progress, and a layout that makes coaching easy.",
  "image_url": "/feature-1.jpg"
}'::jsonb),

('our-facilities', 'highlights', '{
  "items": [
    {"title": "Large functional training space", "desc": "A dedicated strength & conditioning area built to support group training and performance work.",                           "image_url": "/ig/1.png",  "large": true},
    {"title": "25m functional rig",              "desc": "Competition-standard rig with pull-up bars, rings and rope options for proper gymnastics and capacity work.",             "image_url": "/ig/2.png",  "large": true},
    {"title": "Rowers",                          "desc": "Rowing uses a large amount of total-body musculature and is a staple for engine building.",                               "image_url": "/ig/4.png",  "large": false},
    {"title": "Dumbbells & kettlebells",         "desc": "Resistance tools for scaling workouts and building real-world strength and conditioning.",                                "image_url": "/ig/7.png",  "large": false},
    {"title": "Bike & SkiErgs",                  "desc": "Low-impact conditioning options with adjustable resistance — perfect for intervals and HYROX-style work.",               "image_url": "/ig/10.png", "large": false},
    {"title": "Jerk blocks + strength area",     "desc": "Space and kit for Olympic lifting progressions and strength bias training.",                                               "image_url": "/ig/13.png", "large": false}
  ]
}'::jsonb)

ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- START HERE
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO page_content (page_slug, section_key, content) VALUES

('start-here', 'hero', '{
  "kicker": "Getting Started",
  "heading": "Start Here",
  "subtext": "Choose the route that fits you. If you''re experienced, jump straight in. If you''re new, we''ll guide you.",
  "image_url": "/feature-1.jpg"
}'::jsonb),

('start-here', 'options', '{
  "items": [
    {
      "kicker": "Main offer",
      "title": "2 Week Free Trial",
      "desc": "The fastest way to get moving. We''ll guide you into the right sessions.",
      "image_url": "/ig/2.png",
      "buttons": [
        {"label": "View Timetable",  "href": "/timetable",  "variant": "outline"},
        {"label": "Activate Trial",  "href": "/start-here", "variant": "primary"}
      ]
    },
    {
      "kicker": "New to training",
      "title": "Induction",
      "desc": "If you''re brand new, we''ll take you through the basics so you feel confident and safe.",
      "image_url": "/ig/5.png",
      "buttons": [
        {"label": "Book an Induction", "href": "/contact", "variant": "primary"}
      ]
    },
    {
      "kicker": "Visiting",
      "title": "Drop-In",
      "desc": "In town and want to train? Book a drop-in and we''ll see you on the floor.",
      "image_url": "/ig/8.png",
      "buttons": [
        {"label": "Book a Drop-In", "href": "/timetable", "variant": "primary"}
      ]
    }
  ]
}'::jsonb)

ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- TEAM
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO page_content (page_slug, section_key, content) VALUES

('team', 'coaches', '{
  "items": [
    {
      "name": "Mathew Tomkinson",
      "role": "Co-Owner · Coach · Kids Coach",
      "excerpt": "Mathew co-founded Northern Warrior to bring genuinely world-class coaching to Cumbria.",
      "bio": "Mathew co-founded Northern Warrior with one goal: build a gym where every member is coached, not just counted. His background spans functional fitness, kids development and programme design — and he leads from the floor every single week. If you''ve had a session at NW, you''ve probably already met him.",
      "image_url": "/ig/1.png",
      "credentials": ["CrossFit Level 2 Trainer", "Kids & Teens Coach", "HYROX Coach"]
    },
    {
      "name": "Joe Bold",
      "role": "Co-Owner · Coach",
      "excerpt": "Joe built Northern Warrior alongside Mathew and has coached hundreds of members from their first session to the competition floor.",
      "bio": "Joe is the other half of the Northern Warrior founding team. His coaching style is direct, encouraging and deeply effective — built on years of training and competing himself. He programmes, he coaches, and he''s always looking for ways to push the standard of what members experience every day they walk through the door.",
      "image_url": "/ig/2.png",
      "credentials": ["CrossFit Level 2 Trainer", "Strength & Conditioning", "HYROX Coach"]
    },
    {
      "name": "Terry Whitaker",
      "role": "Coach",
      "excerpt": "Terry brings a calm, technical edge to the coaching floor — particularly strong in barbell and weightlifting.",
      "bio": "Terry has been coaching at Northern Warrior since the early days. Known for his attention to movement quality and his ability to break down complex skills for beginners, Terry is a go-to coach for anyone working on their Olympic lifting or wanting to understand the mechanics behind the barbell.",
      "image_url": "/ig/3.png",
      "credentials": ["CrossFit Level 1 Trainer", "Weightlifting Coach", "First Aid Certified"]
    },
    {
      "name": "Zoe Bradley",
      "role": "Coach",
      "excerpt": "Zoe coaches with energy and precision — a specialist in gymnastics progressions and body-weight strength.",
      "bio": "Zoe joined the coaching team with a background in gymnastics and a passion for helping people unlock skills they never thought possible. From kipping pull-ups to ring muscle-ups, Zoe''s progressions are methodical and confidence-building. She runs our Gymnastics sessions and brings the same detail to every WOD she leads.",
      "image_url": "/ig/4.png",
      "credentials": ["CrossFit Level 1 Trainer", "Gymnastics Coach", "Movement Specialist"]
    },
    {
      "name": "Karen Smith",
      "role": "Coach",
      "excerpt": "Karen is proof that the best coaches are often the ones who''ve been through the journey themselves.",
      "bio": "Karen started as a member at Northern Warrior and fell in love with coaching after seeing how much a good session could change someone''s day. She works particularly well with newer members and anyone who walks in feeling uncertain — Karen has a knack for making hard things feel achievable.",
      "image_url": "/ig/5.png",
      "credentials": ["CrossFit Level 1 Trainer", "First Aid Certified", "Precision Nutrition L1"]
    },
    {
      "name": "Lloyd O''Neil",
      "role": "Coach",
      "excerpt": "Lloyd brings a competitive edge and a deep understanding of what it takes to perform under pressure.",
      "bio": "Lloyd competes himself and brings that mindset to the coaching floor. He''s methodical, technically strong and particularly effective with members who want to push performance. Whether it''s pacing strategy or barbell mechanics, Lloyd gives you the detail that moves the needle.",
      "image_url": "/ig/6.png",
      "credentials": ["CrossFit Level 1 Trainer", "HYROX Coach", "Strength & Conditioning"]
    },
    {
      "name": "Rachel Moore",
      "role": "Coach · Kids Coach",
      "excerpt": "Rachel is the calm in the storm — a coach who makes complex movements feel completely achievable.",
      "bio": "Rachel''s background is in movement education and she brings that clarity to every session she leads. She has a gift for breaking down technique in a way that sticks, and she''s one of our lead Kids & Teens coaches — building confidence in the gym''s youngest athletes every week.",
      "image_url": "/ig/7.png",
      "credentials": ["CrossFit Level 1 Trainer", "Kids & Teens Coach", "Movement Specialist"]
    },
    {
      "name": "Dan Heaton",
      "role": "Coach",
      "excerpt": "Dan''s energy on the coaching floor is infectious — sessions he leads are always worth showing up for.",
      "bio": "Dan came into coaching after years of competitive training and a desire to give back. His sessions are challenging, well-structured and always coach-led from start to finish. He brings a level of enthusiasm to the floor that pulls even tired members through tough finishers.",
      "image_url": "/ig/8.png",
      "credentials": ["CrossFit Level 1 Trainer", "First Aid Certified"]
    },
    {
      "name": "Sarah Jennings",
      "role": "Coach",
      "excerpt": "Sarah is technically sharp, genuinely encouraging, and consistently one of our most popular coaches.",
      "bio": "Sarah has been part of the Northern Warrior team for several years and brings a level of consistency and care that members notice. She''s technically thorough — spending real time on movement before loading — and has helped dozens of members unlock skills they''d given up on.",
      "image_url": "/ig/9.png",
      "credentials": ["CrossFit Level 2 Trainer", "Precision Nutrition L1", "First Aid Certified"]
    },
    {
      "name": "Tom Pearce",
      "role": "Coach",
      "excerpt": "Tom''s coaching is grounded, no-nonsense and deeply effective — exactly what a serious training environment needs.",
      "bio": "Tom came to Northern Warrior through competitive functional fitness and stayed because he found a place he believed in. His coaching is direct and honest — no unnecessary filler, just deliberate instruction that helps members train better. He''s particularly strong with strength bias work and engine sessions.",
      "image_url": "/ig/10.png",
      "credentials": ["CrossFit Level 1 Trainer", "Strength & Conditioning", "HYROX Coach"]
    }
  ]
}'::jsonb)

ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTACT
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO page_content (page_slug, section_key, content) VALUES

('contact', 'hero', '{
  "kicker": "Get in Touch",
  "heading": "We''d love to hear from you.",
  "subtext": "Message on WhatsApp for the fastest response. Or fill in the form below and we''ll get back to you.",
  "image_url": ""
}'::jsonb),

('contact', 'enquiry_types', '{
  "items": [
    {"label": "General Enquiry"},
    {"label": "Membership"},
    {"label": "HYROX"},
    {"label": "Kids & Teens"},
    {"label": "Timetable"},
    {"label": "Facilities"},
    {"label": "Other"}
  ]
}'::jsonb)

ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- TIMETABLE
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO page_content (page_slug, section_key, content) VALUES

('timetable', 'hero', '{
  "kicker": "Timetable",
  "heading": "Book your sessions",
  "subtext": "View the live timetable below. If the embed doesn''t load, open it in a new tab."
}'::jsonb),

('timetable', 'embed_url', '{
  "url": "https://www.wodboard.com/locations/895/timetable/9c751c1e26?adi=1"
}'::jsonb)

ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- MEMBERSHIP TERMS (placeholder — page stays mostly hardcoded for now)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO page_content (page_slug, section_key, content) VALUES
('membership-terms', 'content', '{"html": ""}'::jsonb)
ON CONFLICT (page_slug, section_key) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- GLOBAL SETTINGS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO global_settings (key, value) VALUES

('nav', '{
  "items": [
    {"label": "Training",    "href": "/training",       "sub": "HWPO-programmed"},
    {"label": "HYROX",       "href": "/hyrox",          "sub": "Race prep"},
    {"label": "Kids & Teens","href": "/kids-teens",     "sub": "Ages 3–18"},
    {"label": "Timetable",   "href": "/timetable",      "sub": null},
    {"label": "The Team",    "href": "/team",           "sub": null},
    {"label": "Membership",  "href": "/membership",     "sub": null},
    {"label": "Contact",     "href": "/contact",        "sub": null}
  ]
}'::jsonb),

('footer', '{
  "tagline": "Community-driven training in a premium functional fitness facility. Functional Fitness, HYROX, and kids & teens programmes — all coached, all scalable.",
  "address": "Unit 6, Bridge End Industrial Estate, Egremont, Cumbria, CA22 2RD",
  "email": "info@northernwarrior.co.uk",
  "social": [
    {"label": "Instagram", "href": "https://www.instagram.com/nwfitnessuk/"},
    {"label": "Facebook",  "href": "https://www.facebook.com/"}
  ],
  "links": [
    {"label": "Training",       "href": "/training"},
    {"label": "HYROX",          "href": "/hyrox"},
    {"label": "Kids & Teens",   "href": "/kids-teens"},
    {"label": "Membership",     "href": "/membership"},
    {"label": "The Team",       "href": "/team"},
    {"label": "Our Facilities", "href": "/our-facilities"}
  ]
}'::jsonb),

('contact_info', '{
  "email": "info@northernwarrior.co.uk",
  "phone": null,
  "whatsapp": "+447950340217",
  "address": ["Unit 6, Bridge End Industrial Estate,", "Egremont, Cumbria, CA22 2RD"],
  "values": "Show up. Work hard. Make yourself proud."
}'::jsonb)

ON CONFLICT (key) DO NOTHING;
