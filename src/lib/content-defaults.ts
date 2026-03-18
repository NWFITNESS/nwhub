/**
 * Default section content for the visual editor.
 * When a section has never been saved to the DB, these values are used
 * so the editor shows meaningful pre-populated content instead of empty fields.
 */

export const PAGE_SECTION_DEFAULTS: Record<string, Record<string, Record<string, unknown>>> = {
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
          link: '/start-here',
        },
        {
          title: 'HYROX®',
          type: 'Race Prep',
          desc: 'Scalable, aerobic-based training building stamina, grit and real-world work capacity. Machine work, sled pushes, running intervals and functional movements.',
          detail: 'Mon · Wed · Sun',
          image_url: '/feature-2.jpg',
          link: '/hyrox',
        },
        {
          title: 'Bodybuilding',
          type: 'Hypertrophy',
          desc: '5 weekly sessions of 60–90 minutes combining traditional bodybuilding with functional strength. Focused on aesthetics, quality movement and physique goals.',
          detail: '5 sessions/week · 60–90 min',
          image_url: '/ig/7.png',
          link: '/start-here',
        },
        {
          title: 'Weightlifting',
          type: 'Olympic',
          desc: 'Snatch and clean & jerk broken down properly. Positional drills, technique cycles and heavy singles using dedicated 8-week progressive cycles.',
          detail: '8-week cycles · All levels',
          image_url: '/ig/10.png',
          link: '/start-here',
        },
        {
          title: 'Gymnastics',
          type: 'Skill',
          desc: '8-week cycles dedicated to specific modalities — from foundational pulling and pressing strength through to muscle-ups and handstand walks.',
          detail: '8-week cycles · Skill progressions',
          image_url: '/ig/2.png',
          link: '/start-here',
        },
        {
          title: 'EMOM40',
          type: 'Engine Builder',
          desc: 'A staple in Mat Fraser\'s training. Aerobic conditioning with functional movements in a focused 40-minute format — programmed twice weekly.',
          detail: 'Twice weekly · 40 min',
          image_url: '/ig/4.png',
          link: '/start-here',
        },
        {
          title: 'Kids & Teens',
          type: 'Ages 3–18',
          desc: 'Mini Warriors (3–5), Little Warriors (5–10) and Teen Warriors (10–18). Coached, safe and seriously fun — building confidence, coordination and long-term athletic development.',
          detail: 'Ages 3–18 · Sunday sessions only',
          image_url: '/feature-3.jpg',
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
        },
        {
          kicker: 'HYROX',
          heading: 'Built for the race. Trained for the grind.',
          body: 'Hybrid race prep: running, stations, pacing and conditioning — coached from first-timer to podium finisher.',
          image_url: '/feature-2.jpg',
        },
        {
          kicker: 'Kids & Teens',
          heading: 'Building the next generation of athletes.',
          body: 'Mini, Little & Teen Warriors. Confidence, coordination and long-term athletic development — coached, safe, and seriously fun.',
          image_url: '/feature-3.jpg',
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
  },

  'kids-teens': {
    hero: {
      kicker: 'Kids & Teens',
      heading: 'Warriors start young.',
      subtext: 'Safe, coached, and seriously fun — building the next generation of athletes.',
      image_url: '/feature-3.jpg',
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
