export const membershipDefaults = {
  hero: {
    kicker: 'Membership',
    heading: 'Train on your terms.',
    subtext: 'No contracts. No pressure. Just great training.',
    image_url: '/feature-1.jpg',
  },
  plans: {
    cards: [
      { title: '2 Sessions / week', price: '\u00a351', period: '/month', desc: '2 sessions per week across any of our coached classes or Open Gym. Perfect for building consistency.', highlight: false },
      { title: 'Unlimited', price: '\u00a366', period: '/month', desc: 'Unlimited access to all coached sessions and Open Gym. Train as often as you like.', highlight: true },
      { title: 'Unlimited + 24/7', price: '\u00a371', period: '/month', desc: 'Unlimited sessions plus 24/7 fob access to the facility. Train whenever it suits you.', highlight: false },
      { title: '10 Session Pack', price: '\u00a384', period: 'one-off', desc: 'Ten sessions to use at your own pace across any coached class or Open Gym. No monthly commitment.', highlight: false },
      { title: '20 Session Pack', price: '\u00a3156', period: 'one-off', desc: 'Twenty sessions at a better per-session rate. Use across any coached class or Open Gym.', highlight: false },
    ],
  },
  included: {
    items: [
      { title: 'Open Gym Access', desc: 'Included with every membership \u2014 train on your own schedule outside coached sessions.', image_url: '' },
      { title: 'Coached Group Sessions', desc: 'Expert-led sessions with structured programming, scaled to your ability.', image_url: '' },
      { title: 'Scalable Programming', desc: 'Every workout is adapted for all levels \u2014 from beginners to experienced athletes.', image_url: '' },
      { title: 'Supportive Community', desc: 'Train alongside a motivated community that pushes each other to improve.', image_url: '' },
      { title: 'Flexible Scheduling', desc: 'Multiple session times throughout the day to fit around your life.', image_url: '' },
      { title: 'Fully Equipped Facility', desc: 'Rigs, rowers, bikes, dumbbells, barbells and more \u2014 everything you need under one roof.', image_url: '' },
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
      { image_url: '/ig/1.png', image_position: '' },
      { image_url: '/ig/2.png', image_position: '' },
      { image_url: '/ig/4.png', image_position: '' },
      { image_url: '/ig/6.png', image_position: '' },
    ],
  },
  wodboard: {
    heading: 'Manage Your Membership',
    subtext: 'Book classes, track your progress, purchase session packs, and manage your membership \u2014 all in one app. WodBoard is your all-in-one gym companion.',
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
      'Session packs \u2014 no commitment, use at your own pace',
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
}
