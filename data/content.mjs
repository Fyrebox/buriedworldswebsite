// Central content model for the Buried Worlds landing page.
// Copy and per-world theming live here so templates stay presentational.

export const links = {
  // TBD in the design handoff — wire these to real URLs when available.
  redditGame: 'https://www.reddit.com/r/buriedworlds/comments/1ux2j2s/buried_worlds_daily_prospect/',
  metaQuestStore: '#',
  subreddit: 'https://www.reddit.com/r/buriedworlds/',
  discord: 'https://discord.gg/2d6XkPrSNU',
  // Shown on /privacy as the contact for data requests. Must be a mailbox
  // someone actually reads — privacy requests have to reach a human.
  contactEmail: 'privacy@buriedworlds.com'
};

// Hero variant: "poster" | "split" | "banner". Poster is the shipped default;
// the others are alternate layouts kept for reference (README §1).
export const heroVariant = 'poster';

// Toggle for the trailing "More worlds coming" destination card.
export const showLockedCard = false;

// Section 3 — the VR core loop, "The Prospector's Day".
export const loopSteps = [
  { num: '01', name: 'Detect', desc: "Sweep the coil low and slow. The signal tells you what's down there before you break ground." },
  { num: '02', name: 'Dig', desc: 'Pick your spot and put the pickaxe to work. Every hole is a small bet.' },
  { num: '03', name: 'Pan', desc: 'Take the paydirt to water. Swirl, tilt, and watch the colour settle in the riffle.' },
  { num: '04', name: 'Stow & sell', desc: 'Fill the pouch, weigh in at the trader, and turn dust into a bankroll.' },
  { num: '05', name: 'Travel', desc: 'Buy a ticket to the next rush. Five worlds, each seeded by its real history.' }
];

// Section 4 — the five destinations. Gradients are terrain height gradients
// (DESIGN_SYSTEM.md §5); Hoxne intentionally reuses the Castlemaine green.
// Kimberley is withheld from the current release — its card, images and
// gradient are kept out of this list rather than deleted, ready to return.
export const worlds = [
  {
    name: 'Castlemaine',
    subtitle: 'The Victorian gold rush, Australia. Where the expedition begins.',
    gradient: 'linear-gradient(160deg,#85A857,#668C45 45%,#8C734C 78%,#C2B280)',
    image: '/images/CastlemaineShot.webp', imageFallback: '/images/CastlemaineShot.png'
  },
  {
    name: 'Coloma',
    subtitle: 'California, 1849. The American River strike that started it all.',
    gradient: 'linear-gradient(160deg,#DEC480,#CCAD66 40%,#B28F5C 65%,#9B7653 85%,#6B4C33)',
    image: '/images/ColomaShot.webp', imageFallback: '/images/ColomaShot.png'
  },
  {
    name: 'Carcassonne',
    subtitle: 'Medieval France. Coin hoards beneath a walled hilltop city.',
    gradient: 'linear-gradient(160deg,#94B261,#789E4C 45%,#6B8C47 75%,#857854)',
    image: '/images/CarcassonneShot.webp', imageFallback: '/images/CarcassonneShot.png'
  },
  {
    name: 'Hoxne',
    subtitle: 'A Suffolk field, 1992. The largest Roman hoard ever found in Britain.',
    gradient: 'linear-gradient(160deg,#85A857,#668C45 50%,#8C734C 82%,#C2B280)',
    image: '/images/HoxneShot.webp', imageFallback: '/images/HoxneShot.png'
  },
  {
    name: 'Bolonia',
    subtitle: "Spain's Atlantic coast. Roman ruins in the dunes.",
    gradient: 'linear-gradient(160deg,#8C8575,#9E9E61 35%,#CCBD85 60%,#DECC99 80%,#9E8C6B)',
    image: '/images/BoloniaShot.webp', imageFallback: '/images/BoloniaShot.png'
  }
];

// Section 2 — the mock "Detector reading" card signal rows.
export const signalRows = [
  { label: 'COLD', color: '#0A84FF', pct: 22 },
  { label: 'WARM', color: '#FF9F0A', pct: 48 },
  { label: 'HOT', color: '#FF3B30', pct: 74 },
  { label: 'GOLD!', color: '#FFC400', pct: 96 }
];
