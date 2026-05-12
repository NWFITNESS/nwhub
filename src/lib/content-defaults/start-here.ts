export const startHereDefaults = {
  hero: {
    kicker: 'Start Here',
    heading: 'Your first step starts here.',
    subtext: 'Two weeks free, no contract, no commitment \u2014 just show up.',
    image_url: '/feature-1.jpg',
  },
  options: {
    items: [
      {
        kicker: 'Main offer',
        title: '2 Week Free Trial',
        desc: 'Already comfortable with HYROX or Functional Fitness movements? Jump straight in with a free 2 week trial \u2014 no induction needed. Must not have trained with us before.',
        image_url: '/feature-2.jpg',
        image_position: 'center 30%',
        buttons: [
          { label: 'View Timetable', href: '/timetable', variant: 'outline' },
          { label: 'Activate Trial', href: 'https://www.wodboard.com/locations/895/signup/7a25875258?purchasable=Plan-11921&code=3c77d994e8d1e166', variant: 'primary' },
        ],
      },
      {
        kicker: 'New to training',
        title: 'Induction',
        desc: 'Brand new to this style of training? We\'ll take you through the basics so you feel confident and safe before joining a class.',
        image_url: '/feature-1.jpg',
        image_position: 'center 25%',
        buttons: [
          { label: 'Book an Induction', href: '/contact', variant: 'primary' },
        ],
      },
      {
        kicker: 'Visiting',
        title: 'Drop-In',
        desc: 'In town and want to train? Book a drop-in session and we\'ll see you on the floor.',
        image_url: '/hero.jpg',
        image_position: 'center 40%',
        buttons: [
          { label: 'Book a Drop-In', href: 'https://www.wodboard.com/locations/895/drop_ins/7a25875258', variant: 'primary' },
        ],
      },
    ],
  },
}
