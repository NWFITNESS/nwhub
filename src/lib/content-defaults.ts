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
          detail: 'Our coaches are qualified, experienced and genuinely invested in your progress.',
          image_url: '/ig/2.png',
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
      items: [
        { image_url: '', alt: 'Kids session photo 1', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 2', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 3', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 4', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 5', image_position: '50% 50%' },
        { image_url: '', alt: 'Kids session photo 6', image_position: '50% 50%' },
      ],
    },
    coaches: {
      items: [
        {
          name: 'Mathew Tomkinson',
          role: 'Head Coach & Owner',
          avatarEmoji: '🏋️',
          qualifications: ['Level 3 PT', 'CrossFit L2', 'Youth Fitness Specialist'],
          bio: 'Mat founded Northern Warrior to build something the community was missing.',
        },
        {
          name: 'Lauren',
          role: 'Kids Lead Coach',
          avatarEmoji: '⭐',
          qualifications: ['Level 2 Fitness', 'Gymnastics Coach', 'First Aid'],
          bio: 'Lauren runs the kids programme with patience, energy, and an infectious love of movement.',
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
}
