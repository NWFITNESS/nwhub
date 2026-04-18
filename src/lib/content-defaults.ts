/**
 * Default section content for the visual editor.
 * When a section has never been saved to the DB, these values are used
 * so the editor shows meaningful pre-populated content instead of empty fields.
 */

export const PAGE_SECTION_DEFAULTS: Record<string, Record<string, Record<string, unknown>>> = {
  blog: {
    hero: {
      heading: 'Northern Warrior Blog',
      subtext: 'Training tips, nutrition advice, and community stories to help you reach your fitness goals',
    },
  },
  home: {
    hero: {
      kicker: 'Northern Warrior',
      heading: 'Train Hard. Build Community.',
      subtext: 'Cumbria\'s premier functional fitness facility.',
      video_url: '/hero-video.mp4',
      image_url: '/feature-1.jpg',
    },
    trust_bar: {
      items: [
        'HYROX Affiliate',
        'HWPO Partner',
        '150+ Members',
        'Est. 2015',
        'Huge Facility',
        'Cumbria\'s Best Gym',
        'Community Driven',
        'Functional Fitness',
      ],
    },
    programs: {
      items: [
        {
          title: 'Class',
          type: 'Daily WOD',
          desc: '7 expertly programmed workouts per week, each 60 minutes. Warm-up, two-part workout and optional homework. Progressive cycles build strength, power, endurance and overall physical preparedness.',
          detail: '7 sessions/week · 60 min',
          image_url: '/feature-1.jpg',
          image_position: '',
          link: '/start-here',
        },
        {
          title: 'HYROX®',
          type: 'Race Prep',
          desc: 'Scalable, aerobic-based training building stamina, grit and real-world work capacity. Machine work, sled pushes, running intervals and functional movements.',
          detail: 'Mon · Wed · Sun',
          image_url: '/feature-2.jpg',
          image_position: '',
          link: '/hyrox',
        },
        {
          title: 'Bodybuilding',
          type: 'Hypertrophy',
          desc: '5 weekly sessions of 60–90 minutes combining traditional bodybuilding with functional strength. Focused on aesthetics, quality movement and physique goals.',
          detail: '5 sessions/week · 60–90 min',
          image_url: '/ig/7.png',
          image_position: '',
          link: '/start-here',
        },
        {
          title: 'Weightlifting',
          type: 'Olympic',
          desc: 'Snatch and clean & jerk broken down properly. Positional drills, technique cycles and heavy singles using dedicated 8-week progressive cycles.',
          detail: '8-week cycles · All levels',
          image_url: '/ig/10.png',
          image_position: '',
          link: '/start-here',
        },
        {
          title: 'Gymnastics',
          type: 'Skill',
          desc: '8-week cycles dedicated to specific modalities — from foundational pulling and pressing strength through to muscle-ups and handstand walks.',
          detail: '8-week cycles · Skill progressions',
          image_url: '/ig/2.png',
          image_position: '',
          link: '/start-here',
        },
        {
          title: 'EMOM40',
          type: 'Engine Builder',
          desc: 'A staple in Mat Fraser\'s training. Aerobic conditioning with functional movements in a focused 40-minute format — programmed twice weekly.',
          detail: 'Twice weekly · 40 min',
          image_url: '/ig/4.png',
          image_position: '',
          link: '/start-here',
        },
        {
          title: 'Kids & Teens',
          type: 'Ages 3–18',
          desc: 'Mini Warriors (3–5), Little Warriors (5–10) and Teen Warriors (10–18). Coached, safe and seriously fun — building confidence, coordination and long-term athletic development.',
          detail: 'Ages 3–18 · Sunday sessions only',
          image_url: '/feature-3.jpg',
          image_position: '',
          link: '/kids-teens',
        },
      ],
    },
    stats: {
      items: [
        { value: '150', suffix: '+', label: 'Members', sub: 'and growing' },
        { value: '2', suffix: ' Week', label: 'Free Trial', sub: 'no commitment needed' },
        { value: '0', suffix: '', label: 'Contracts', sub: 'ever. train on your terms' },
        { value: '100', suffix: '%', label: 'Community', sub: 'every single session' },
      ],
    },
    testimonials: {
      items: [
        {
          quote: 'Northern Warrior completely changed my approach to fitness. The community here is like nothing else — everyone pushes you to be better, every single session.',
          name: 'Sarah M.',
          role: 'Member since 2021',
        },
        {
          quote: "I came in knowing nothing about functional fitness. Within 3 months I'd completed my first HYROX race. The coaching is phenomenal.",
          name: 'James T.',
          role: 'HYROX Competitor',
        },
        {
          quote: 'The facility is incredible and the programming is elite. HWPO + great coaches = results. My strength has gone through the roof.',
          name: 'Lauren K.',
          role: 'Unlimited Member',
        },
      ],
    },
    icon_row: {
      heading: 'More than a gym.',
      subtext: 'Every session coached. Every member supported. World-class programming, an in-house physio, and a community that actually shows up for each other.',
      items: [
        { label: 'In-house Physio', desc: 'Support, rehab and return-to-training.' },
        { label: 'Personal Training', desc: '1:1 coaching and bespoke programming.' },
        { label: 'Elite Coaching', desc: 'Structured sessions. Real intent. Real standards.' },
        { label: 'Premium Facility', desc: '500m² space built for strength + conditioning.' },
      ],
    },
    scroll_story: {
      items: [
        {
          kicker: 'Functional Fitness',
          heading: 'Grassroots strength. Coached by people who live it.',
          body: 'The foundation of Northern Warrior. Functional Fitness sessions built on movement quality, effort, and community — coached for all levels.',
          image_url: '/feature-1.jpg',
          image_position: '',
        },
        {
          kicker: 'HYROX',
          heading: 'Built for the race. Trained for the grind.',
          body: 'Hybrid race prep: running, stations, pacing and conditioning — coached from first-timer to podium finisher.',
          image_url: '/feature-2.jpg',
          image_position: '',
        },
        {
          kicker: 'Kids & Teens',
          heading: 'Building the next generation of athletes.',
          body: 'Mini, Little & Teen Warriors. Confidence, coordination and long-term athletic development — coached, safe, and seriously fun.',
          image_url: '/feature-3.jpg',
          image_position: '',
        },
      ],
    },
    induction: {
      heading: 'Master the basics — then build fast.',
      subtext: 'Our induction is designed to teach essential movements and techniques in a supportive, structured environment — giving you the foundation used across classes at Northern Warrior.',
      items: [
        { title: 'Coached foundations', desc: 'Movement quality, breathing, pacing and confidence.' },
        { title: 'Scalable approach', desc: 'Start safely. Progress consistently.' },
        { title: 'Clear next step', desc: "You'll know exactly which sessions to attend next." },
      ],
    },
    social_carousel: {
      heading: 'Follow the journey.',
      subtext: 'Tag us @northernwarrior and you might end up on our feed.',
    },
  },

  'why-us': {
    hero: {
      kicker: 'Why Northern Warrior',
      heading: "There's a reason people stay.",
      subtext: "Cumbria's premier functional fitness facility — and the community that makes it worth it.",
      image_url: '/feature-1.jpg',
    },
    differentiators: {
      items: [
        {
          num: '01',
          title: 'The Facility',
          desc: '500m² of purpose-built functional fitness space. SkiErgs, sleds, rowers, rigs, turf track — everything you need, none of what you don\'t.',
          detail: 'Most gyms cram functional fitness into a corner. We built it from the ground up.',
          image_url: '/ig/8.png',
        },
        {
          num: '02',
          title: 'The Community',
          desc: "This isn't a transactional gym. We're a community of people who train hard, support each other, and actually want to be here.",
          detail: "You'll know everyone's name within a month. Members celebrate each other's wins.",
          image_url: '/ig/5.png',
        },
        {
          num: '03',
          title: 'The Coaching',
          desc: 'Every session is coached. Not supervised — coached. There\'s a difference, and you\'ll feel it from your first class.',
          detail: 'Our coaches are qualified, experienced and genuinely invested in your progress. Warm-up to cool-down, every session has structure and intent.',
          image_url: '/ig/2.png',
        },
        {
          num: '04',
          title: 'HYROX Affiliation',
          desc: 'We\'re an official HYROX affiliate — one of very few in Cumbria. Our HYROX programme is structured and race-specific.',
          detail: 'From first-timer to podium contender, our HYROX track builds you systematically. Running fitness, station efficiency, pacing under fatigue — all coached.',
          image_url: '/feature-2.jpg',
        },
        {
          num: '05',
          title: 'HWPO Programming',
          desc: 'Our main programme runs on HWPO — the world-class training platform built for serious athletes at every level.',
          detail: 'Hard Work Pays Off. Elite programming, delivered by our coaches, scaled for your level. The same system used by champions, adapted for real life.',
          image_url: '/feature-1.jpg',
        },
        {
          num: '06',
          title: 'Location & Access',
          desc: 'Based in Egremont, West Cumbria. Easy parking, 24/7 access available, and central to the communities we serve.',
          detail: 'Unit 6, Bridge End Industrial Estate, Egremont. Plenty of parking. 24/7 keyfob access on the right membership. No excuses not to train.',
          image_url: '/ig/11.png',
        },
      ],
    },
    discounts: {
      items: [
        { label: 'Armed Forces', detail: 'Active service, veterans and reservists.' },
        { label: 'NHS & Emergency Services', detail: 'Our way of saying thank you.' },
        { label: 'Student Discount', detail: 'For full-time students with valid ID.' },
        { label: 'Sibling Discount', detail: 'Train together, save together.' },
      ],
    },
  },

  hyrox: {
    hero: {
      kicker: 'HYROX',
      heading: 'We Are An Official HYROX Affiliate.',
      subtext: 'Train for the race. Compete with confidence.',
      video_url: '',
      image_url: '/feature-2.jpg',
    },
    what_is_hyrox: {
      heading: 'What is HYROX?',
      subtext: '1km run + 1 functional workout station, repeated 8 times. Simple format. Elite challenge.',
    },
    example_day: {
      heading: 'What does a session look like?',
      subtext: 'Every HYROX session at Northern Warrior has structure and intent — warm-up, skill work, conditioning.',
    },
  },

  training: {
    hero: {
      kicker: 'Training',
      heading: 'Find your programme.',
      subtext: 'Seven structured training tracks, all coached.',
      image_url: '/feature-1.jpg',
    },
    intro: {
      heading: 'Something for every goal.',
      subtext: 'From functional fitness to Olympic weightlifting — every programme is designed with intent and coached from warm-up to cool-down.',
    },
    sessions: {
      items: [
        {
          title: 'Workout of the Day',
          type: 'WOD',
          desc: 'Our daily session. Functional fitness combining strength, conditioning and skill work — programmed by HWPO and coached from warmup to cooldown. Scales to any level.',
          image_url: '/feature-1.jpg',
          image_position: '',
          link: '',
        },
        {
          title: 'HYROX',
          type: 'Race prep',
          desc: 'Hybrid race prep: running, stations, pacing and conditioning. As an official HYROX affiliate, we build you for race day from first-timer to podium finisher.',
          image_url: '/feature-2.jpg',
          image_position: '',
          link: '/hyrox',
        },
        {
          title: 'EMOM40',
          type: 'Engine',
          desc: '40 minutes, every minute on the minute. An engine-building session mixing monostructural cardio, gymnastics and weightlifting. Relentless but sustainable.',
          image_url: '/ig/4.png',
          image_position: '',
          link: '',
        },
        {
          title: 'BodyBuilding',
          type: 'Hypertrophy',
          desc: 'Hypertrophy-focused work alongside your conditioning. Compound and isolation movements programmed to build strength and physique with intent.',
          image_url: '/ig/7.png',
          image_position: '',
          link: '',
        },
        {
          title: 'Weightlifting',
          type: 'Olympic',
          desc: 'Snatch and clean & jerk, broken down properly. Positional drills, technique cycles and heavy singles — suitable for beginners through to competitors.',
          image_url: '/ig/10.png',
          image_position: '',
          link: '',
        },
        {
          title: 'Gymnastics',
          type: 'Skill',
          desc: 'Skill-based sessions run in focused blocks. Progressions from foundational pulling and pressing strength through to muscle-ups, handstand walks and beyond.',
          image_url: '/ig/2.png',
          image_position: '',
          link: '',
        },
      ],
    },
    specialist: {
      items: [
        {
          title: 'Open Gym',
          type: 'Open — 10 members max',
          desc: 'Self-directed training time with a qualified coach on the floor. Up to 10 members at a time. Included in all memberships.',
          image_url: '/ig/5.png',
          image_position: '',
          link: '',
        },
        {
          title: 'Kids & Teens',
          type: 'Specialist',
          desc: 'Mini Warriors (3–5), Little Warriors (5–10) and Teen Warriors (10–18). Coached, safe and seriously fun.',
          image_url: '/feature-3.jpg',
          image_position: '',
          link: '/kids-teens',
        },
      ],
    },
  },

  results: {
    hero: {
      kicker: 'Member Results',
      heading: 'Real training. Real results.',
      subtext: 'From first sessions to podium finishes — every result in here started with someone showing up.',
      image_url: '/feature-1.jpg',
    },
    stories: {
      items: [
        { name: 'Sarah M.', role: 'Member since 2021', quote: 'Northern Warrior completely changed my approach to fitness. I went from never setting foot in a gym to completing my first HYROX race in under 1:10. The community here is like nothing else.', stat_before: 'Zero gym experience', stat_after: 'HYROX finisher — 1:08', image_url: '/ig/1.png' },
        { name: 'James T.', role: 'HYROX Competitor', quote: "I came in knowing nothing about functional fitness. Within 3 months I'd completed my first HYROX race. Within a year I podiumed in my age category. The coaching is phenomenal.", stat_before: 'No race experience', stat_after: 'Age category podium', image_url: '/ig/3.png' },
        { name: 'Lauren K.', role: 'Unlimited Member', quote: "I've tried every gym in Cumbria. Nothing comes close to NW. The programming is elite, the coaches actually care, and the community keeps you accountable.", stat_before: '3 failed gym memberships', stat_after: 'Training 4x/week consistently', image_url: '/ig/6.png' },
        { name: 'Mark D.', role: 'Dad of two warriors', quote: 'Started to lose weight, stayed for the community. Lost 18kg in 6 months. My kids now train in the Teens class. Best decision our family ever made.', stat_before: '18kg overweight', stat_after: '18kg down, still going', image_url: '/ig/9.png' },
        { name: 'Claire F.', role: 'NHS Worker', quote: 'Night shifts make gym life hard. The 24/7 access membership changed everything. I train when it suits me and the programming keeps me on track without a coach.', stat_before: 'Irregular training, low energy', stat_after: 'Training 5x/week around shifts', image_url: '/ig/11.png' },
        { name: 'Tom W.', role: 'Forces Veteran', quote: "The coaches here understand what hard work actually means. The forces discount is appreciated. The programming is the best I've followed outside the military.", stat_before: 'Post-service detraining', stat_after: 'Back to peak fitness', image_url: '/ig/2.png' },
      ],
    },
    competition_results: {
      items: [
        { event: 'HYROX Manchester', athlete: 'James T.', result: 'Age Category Podium — Top 3', year: '2024' },
        { event: 'HYROX Liverpool', athlete: 'Sarah M.', result: 'Sub 1:10 finish', year: '2024' },
        { event: 'HYROX Birmingham', athlete: 'Chris B.', result: 'First race — completed', year: '2023' },
        { event: 'HYROX Manchester', athlete: 'Laura P.', result: "Women's Doubles — Podium", year: '2024' },
        { event: 'HYROX Edinburgh', athlete: 'Dave H.', result: 'Sub 1:30 — first race', year: '2023' },
        { event: 'HYROX Sheffield', athlete: 'Multiple Athletes', result: '5 NW athletes on podium', year: '2024' },
      ],
    },
  },

  'kids-teens': {
    hero: {
      kicker: 'Egremont, Cumbria · Est. 2021 · Classes Running Now',
      titleStart: 'YOUNG',
      titleEnd: 'WARRIORS',
      subtext: 'Strength, fitness and confidence for kids and teens. Properly coached, age-appropriate, every Sunday at Northern Warrior.',
    },
    sessions_intro: {
      background_image: '',
      kicker: 'What are our sessions?',
      heading: 'Functional fitness',
      heading_sub: 'built for young athletes',
      body1: 'Our kids and teens programme brings the best of functional fitness training to young people aged 3–18. Think running, jumping, climbing, lifting, throwing, and teamwork — all scaled to their age, ability, and confidence level. No experience needed. Just energy and a willingness to try.',
      body2: 'Every session follows a structured warm-up, skill or strength focus, a workout, and a cool-down game. It\'s the same methodology used by elite athletes, adapted so kids develop coordination, strength, and discipline — all while having a blast.',
    },
    gallery: {
      kicker: 'In the gym',
      heading: 'Warriors in action',
      caption: 'Real photos of your young warriors — sessions run every Sunday at Northern Warrior, Egremont.',
      layout: 'masonry',
      items: [
        { image_url: '', alt: 'Kids session photo 1', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 2', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 3', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 4', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 5', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 6', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 7', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 8', image_position: '50% 50%' },
      ],
    },
    coaches: {
      items: [
        {
          name: 'Mathew Tomkinson',
          role: 'Head Coach & Owner',
          avatarEmoji: '🏋️',
          bio: 'Mat founded Northern Warrior to build something the community was missing.',
          image_url: '',
          image_position: '50% 30%',
        },
        {
          name: 'Lauren',
          role: 'Kids Lead Coach',
          avatarEmoji: '⭐',
          bio: 'Lauren runs the kids programme with patience, energy, and an infectious love of movement.',
          image_url: '',
          image_position: '50% 30%',
        },
      ],
    },
    why_nw: {
      items: [
        { icon: '🛡️', title: 'Safe Environment', text: 'Purpose-built facility with qualified coaches at every session.' },
        { icon: '📈', title: 'Real Progression', text: 'Structured blocks so kids see real improvement week to week.' },
        { icon: '🤝', title: 'Community', text: 'A welcoming, inclusive space where every kid is part of the tribe.' },
        { icon: '🎓', title: 'Life Skills', text: 'Discipline, resilience, teamwork, and confidence that goes beyond the gym.' },
      ],
      statValue: '100+',
      statLabel: 'Young Warriors trained since 2021',
      quote: 'My son has never looked forward to a class as much as this. He talks about it all week.',
      attribution: '— Parent, Egremont',
    },
    testimonials: {
      items: [
        { name: 'Sarah M.', meta: 'Mum of 2', initials: 'SM', quote: 'Both my kids absolutely love it. They come out buzzing every Sunday.' },
        { name: 'James T.', meta: 'Dad', initials: 'JT', quote: 'The coaches are brilliant — my daughter has grown in confidence massively.' },
        { name: 'Lucy P.', meta: 'Mum', initials: 'LP', quote: 'Best thing we ever signed up for. Can\'t recommend it enough.' },
      ],
    },
  },

  membership: {
    hero: {
      kicker: 'Membership',
      heading: 'Train on your terms.',
      subtext: 'No contracts. No pressure. Just great training.',
      image_url: '/feature-1.jpg',
    },
    plans: {
      cards: [
        { title: '2 Sessions / week', price: '£51', period: '/month', desc: '2 sessions per week across any of our coached classes or Open Gym. Perfect for building consistency.', highlight: false },
        { title: 'Unlimited', price: '£66', period: '/month', desc: 'Unlimited access to all coached sessions and Open Gym. Train as often as you like.', highlight: true },
        { title: 'Unlimited + 24/7', price: '£71', period: '/month', desc: 'Unlimited sessions plus 24/7 fob access to the facility. Train whenever it suits you.', highlight: false },
        { title: '10 Session Pack', price: '£84', period: 'one-off', desc: 'Ten sessions to use at your own pace across any coached class or Open Gym. No monthly commitment.', highlight: false },
        { title: '20 Session Pack', price: '£156', period: 'one-off', desc: 'Twenty sessions at a better per-session rate. Use across any coached class or Open Gym.', highlight: false },
      ],
    },
    included: {
      items: [
        { title: 'Open Gym Access', desc: 'Included with every membership — train on your own schedule outside coached sessions.', image_url: '' },
        { title: 'Coached Group Sessions', desc: 'Expert-led sessions with structured programming, scaled to your ability.', image_url: '' },
        { title: 'Scalable Programming', desc: 'Every workout is adapted for all levels — from beginners to experienced athletes.', image_url: '' },
        { title: 'Supportive Community', desc: 'Train alongside a motivated community that pushes each other to improve.', image_url: '' },
        { title: 'Flexible Scheduling', desc: 'Multiple session times throughout the day to fit around your life.', image_url: '' },
        { title: 'Fully Equipped Facility', desc: 'Rigs, rowers, bikes, dumbbells, barbells and more — everything you need under one roof.', image_url: '' },
      ],
    },
    partner_discounts: {
      items: [
        { name: 'LSKD', discount: '20% off', method: 'Online code', url: 'https://us.lskd.co/', logo_url: '/partners/lskd.svg' },
        { name: 'The Protein Bakehouse', discount: '10% off', method: 'Online code', url: 'https://www.proteinbakehouse.co.uk/', logo_url: '/partners/protein-bakehouse.png' },
        { name: 'Velites', discount: '10% off', method: 'Purchase at the gym only', url: 'https://eu.velitessport.com/', logo_url: '/partners/velites.svg' },
        { name: 'Advanced Physio', discount: '10% off', method: 'Online code', url: '', logo_url: '/partners/advanced-physio.png' },
      ],
    },
    service_discounts: {
      items: [
        { text: '10% Forces Discount' },
        { text: '10% NHS Discount' },
        { text: '10% Emergency Services Discount' },
        { text: '10% Sibling Discount (Kids & Teens)' },
      ],
    },
    photo_strip: {
      items: [
        { image_url: '/ig/3.png', image_position: '' },
        { image_url: '/ig/5.png', image_position: '' },
        { image_url: '/ig/7.png', image_position: '' },
        { image_url: '/ig/9.png', image_position: '' },
        { image_url: '/ig/11.png', image_position: '' },
        { image_url: '/ig/13.png', image_position: '' },
      ],
    },
    wodboard: {
      heading: 'Manage Your Membership',
      subtext: 'Book classes, track your progress, purchase session packs, and manage your membership — all in one app. WodBoard is your all-in-one gym companion.',
      logo_url: '/partners/wodboard-dark.png',
      app_screenshot_url: '',
      ios_url: 'https://apps.apple.com/us/app/wodboard/id1477992244',
      android_url: 'https://play.google.com/store/apps/details?id=com.wodboard.app',
      features: [
        'Book & manage class bookings',
        'Purchase session packs',
        'Track your workouts & progress',
        'Manage your membership anytime',
      ],
    },
    terms_list: {
      items: [
        '2-month initial commitment on monthly memberships',
        'Rolling 30-day notice period after commitment',
        'No joining fees',
        'Session packs — no commitment, use at your own pace',
      ],
    },
    cancellation: {
      heading: 'Need to Cancel?',
      subtext: 'We make cancellation straightforward. Simply contact us to begin the process.',
      items: [
        '30-day notice period required',
        'This may result in a pro-rata payment',
        'Contact us directly or via the WodBoard app',
      ],
    },
  },

  'start-here': {
    hero: {
      kicker: 'Start Here',
      heading: 'Your first step starts here.',
      subtext: 'Two weeks free, no contract, no commitment — just show up.',
      image_url: '/feature-1.jpg',
    },
  },

  team: {
    hero: {
      kicker: 'The Team',
      heading: 'Meet the coaches.',
      subtext: 'Qualified, experienced and genuinely invested in your progress.',
      image_url: '/feature-1.jpg',
    },
    coaches: {
      items: [],
    },
  },

  'our-facilities': {
    hero: {
      kicker: 'Our Facilities',
      heading: '500m² built for results.',
      subtext: 'Purpose-built functional fitness space in Egremont, West Cumbria.',
      image_url: '/ig/8.png',
    },
  },

  contact: {
    hero: {
      kicker: 'Contact',
      heading: 'Get in touch.',
      subtext: "We're based in Egremont, West Cumbria. Come and say hello.",
      image_url: '/feature-1.jpg',
    },
  },

  physio: {
    hero: {
      kicker: 'In-house Physiotherapy',
      heading: 'Advanced Physio',
      subtext: 'Expert physiotherapy by Marek Emilianowicz — 19+ years of clinical experience, MSc Physiotherapy. Exclusively at Northern Warrior.',
      image_url: '/feature-1.jpg',
    },
    about: {
      kicker: 'Meet Your Physio',
      heading: 'Marek Emilianowicz',
      subheading: 'MSc Physiotherapy — 19+ years experience',
      body: 'With over 19 years of clinical experience and a Master\'s degree in Physiotherapy, Marek brings an evidence-based, hands-on approach to injury treatment and rehabilitation. Incorporating advanced techniques such as manual therapy, dry needling, and Kinesio taping, he provides tailored care to keep you pain-free and performing at your best. Based in-house at Northern Warrior, he works closely with coaches and athletes to ensure you stay strong, recover faster, and train without limits.',
      image_url: '',
      image_position: '50% 30%',
    },
    techniques: {
      heading: 'Treatment Techniques',
      subtext: 'A comprehensive toolkit for diagnosis, treatment and recovery.',
      items: [
        { title: 'Manual Therapy', desc: 'Hands-on joint mobilisation and soft tissue techniques to restore range of motion and reduce pain.', image_url: '', image_position: '' },
        { title: 'Dry Needling', desc: 'Targeted trigger point therapy using fine needles to release deep muscle tension and accelerate recovery.', image_url: '', image_position: '' },
        { title: 'Kinesio Taping', desc: 'Therapeutic taping to support joints, reduce swelling and enhance proprioceptive feedback during training.', image_url: '', image_position: '' },
        { title: 'Sports Massage', desc: 'Deep tissue and sports-specific massage to improve circulation, break down adhesions and speed up recovery.', image_url: '', image_position: '' },
        { title: 'TENS Therapy', desc: 'Transcutaneous electrical nerve stimulation for effective pain management and muscle activation.', image_url: '', image_position: '' },
      ],
    },
    specialisations: {
      heading: 'Areas of Expertise',
      subtext: 'Specialist treatment across a wide range of musculoskeletal conditions.',
      items: [
        { title: 'Sports Injuries', desc: 'From acute sprains and strains to chronic overuse injuries — diagnosis, treatment and return-to-sport planning.', image_url: '', image_position: '' },
        { title: 'Joint Pain', desc: 'Assessment and treatment of shoulder, knee, hip, ankle and spinal joint pain using manual therapy and exercise prescription.', image_url: '', image_position: '' },
        { title: 'Post-Surgery Rehabilitation', desc: 'Structured rehabilitation programmes following ACL reconstruction, Achilles tendon repair, hip and knee replacements.', image_url: '', image_position: '' },
        { title: 'Performance Optimisation', desc: 'Prehabilitation, movement screening and targeted treatment to push you beyond your limits.', image_url: '', image_position: '' },
      ],
    },
    case_studies: {
      heading: 'Recovery Stories',
      subtext: 'Real results from real athletes.',
      items: [
        {
          kicker: 'Case Study',
          heading: 'Back to Running in 6 Weeks',
          body: 'A Northern Warrior athlete came in with chronic knee pain that had kept them sidelined for months. Through manual therapy, dry needling and a supervised return-to-running programme, they were back in class within 6 weeks — stronger and pain-free.',
          video_url_1: '',
          video_url_2: '',
          video_url_3: '',
          image_url: '',
        },
        {
          kicker: 'Case Study',
          heading: 'Post-Surgery Shoulder Rehab',
          body: 'Following shoulder surgery, this athlete worked with Marek over 12 weeks to rebuild strength and mobility. A combination of manual therapy, progressive loading and movement coaching got them back to overhead lifts with full confidence.',
          video_url_1: '',
          video_url_2: '',
          image_url: '',
        },
      ],
    },
    member_discount: {
      kicker: 'NW Members',
      heading: 'Exclusive member discount.',
      subtext: 'Northern Warrior members receive a discount on all physiotherapy treatments. Book through the link below or ask at the front desk.',
    },
    testimonials: {
      items: [
        { quote: 'I went to see Marek with an injury I\'d gotten while running. Marek was brilliant in checking all possible causes of the injury, until it was identified. I was then given exercises and advice on what to do to help in my recovery. The movements helped a tremendous amount. After a couple of weeks I was feeling much better — the care Marek gave and attention to my recovery was brilliant. I really recommend Marek.', name: 'George Cowen', role: 'NW Coach | Athlete' },
        { quote: 'Marek was very professional and made a thorough initial examination to discover the root cause of my back & hip pain. He devised a plan of treatment that has led to the pain being resolved and has given me a better range of movement than I had before! I have recommended him to friends and family for when they need a physio.', name: 'Jackie Fox' },
        { quote: 'Big thanks to Marek for all his work on my long standing shoulder issues which, following a range of manipulation, dry needling and rehabilitation programme has resulted in a pain free, much improved range of motion.', name: 'Mark Neal' },
        { quote: 'Visited Marek couple of weeks ago. I was impressed with the thorough examination and his expertise on the physiotherapy. Recommend 100%.', name: 'Antonis Katsikadamos' },
        { quote: 'Marek has recently helped me with some long term issues. He was very helpful and knowledgeable with diagnosing what was wrong. I also received a detailed follow up plan to help keep the injuries away. I would recommend Marek to anyone!', name: 'Zoe Bradley' },
        { quote: 'I needed help for a back injury. I scheduled an appointment using Marek\'s easy online booking system. Marek was thorough in his assessment, also looking into my other back issues, to benefit me beyond the specific injury I had. After the appointment, I received a personalised exercise routine to help me remember what to work on. I would recommend Marek to anyone seeking physiotherapy support.', name: 'Alex McCarthy' },
        { quote: 'I would like to thank Marek for his professionalism treating a problem of my back recently. I am really grateful for all the advice and treatment he gave me. He has worked wonders!', name: 'Maureen Cromwell' },
        { quote: 'Marek recently supported me in overcoming a knee issue, which I later understood to be bursitis. I found Marek very engaging and knowledgeable. He provided information continually during my treatment plan and explained how the in-person physio sessions and the home exercises would recover my range of motion. I would recommend Marek to anyone requiring the support of a professional physiotherapist.', name: 'John Murphy' },
        { quote: 'I have recently seen Marek with long term lower back, hip and groin issues. He gave a thorough examination before providing physical treatment as well as an easy to follow tailored exercise programme which was concise and easy to fit into a busy life. I also seen Marek for a sports massage which was one of the best I\'ve had out of many. Marek also follows up after appointments to check on progress which is a nice touch.', name: 'Lloyd O\'Neil' },
        { quote: 'Marek was very professional and thorough in his approach. Not only did he treat an ongoing problem but he gave further advice for ongoing prevention.', name: 'Stephen McCourt' },
        { quote: 'I recently saw Marek for a sports massage, targeting my back. Not only did he provide a thorough and invigorating massage, but his personalized attention stood out. He took the time to ask about any specific concerns, and provided valuable advice for addressing them in training. Marek\'s expertise and genuine care for my well-being made for a fantastic experience. I highly recommend him!', name: 'Cindy Schmidt' },
        { quote: 'I am a 74 year old lady who tore her meniscus cartilage. Marek was recommended to me when I was concerned about how to progress forward. I have always found him to be professional, knowledgeable, reassuring and patient and he always involved me in the planning of my exercise routine. I noticed improvement after each home visit and now I see a marked improvement and I feel confident going forward with my future exercise plan. I would highly recommend him to anyone in need of his expertise.', name: 'Monica Reid' },
      ],
    },
    physio_contact: {
      heading: 'Book an Appointment',
      subtext: 'Get in touch with Advanced Physio directly — or book online.',
      booking_url: 'https://advancedphysiobyemilianowicz.as.me/schedule/b844fe3a',
      whatsapp: '+447503497554',
      email: 'advanced.physiome@gmail.com',
      instagram: 'advanced_physiome',
    },
  },
}
