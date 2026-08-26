// Central content model for the Buried Worlds VR landing page.
// Copy and per-world theming live here so templates stay presentational.

export const links = {
  redditGame: 'https://www.reddit.com/r/buriedworlds/comments/1ux2j2s/buried_worlds_daily_prospect/',
  // Locale-free on purpose: Meta redirects each visitor to their own region and
  // currency. Pinning /en-gb/ or /en-us/ would show everyone else the wrong price.
  metaQuestStore: 'https://www.meta.com/experiences/buried-worlds/1129006663640647/',
  subreddit: 'https://www.reddit.com/r/buriedworlds/',
  discord: 'https://discord.gg/2d6XkPrSNU'
};

// The canonical origin, used for absolute URLs in share cards and structured
// data. Both require absolute URLs — a relative path silently yields no preview.
export const siteUrl = 'https://www.buriedworlds.com';

// Store facts, read off the live product detail page and the developer dashboard
// on 27 August 2026. They live here rather than in the templates because the
// same numbers appear in the hero, the buy bar, the structured data and the
// share card, and a launch is exactly when they drift apart.
//
// `price` is deliberately labelled with its currency. Meta localises the real
// figure per region, so an unlabelled number would be wrong for most visitors.
export const product = {
  // The site leads with "Buried Worlds VR" everywhere because the bare name
  // collides with an existing television series in search results. The store
  // listing itself is titled "Buried Worlds", which is carried in the
  // structured data as alternateName so the two stay linked.
  name: 'Buried Worlds VR',
  storeListingName: 'Buried Worlds',
  status: 'Early Access',
  price: 'US$14.99',
  priceAmount: '14.99',
  priceCurrency: 'USD',
  store: 'Meta Horizon Store',
  devices: 'Quest 2, Quest 3, Quest 3S and Quest Pro',
  devicesList: ['Meta Quest 2', 'Meta Quest 3', 'Meta Quest 3S', 'Meta Quest Pro'],
  releaseDate: '2026-08-26',
  releaseDateLabel: '26 August 2026',
  version: '1.0',
  size: '462 MB',
  languages: ['English', 'French'],
  comfort: 'Moderate',
  playModes: 'Seated or standing',
  developer: 'Melvia Pty Ltd',
  publisher: 'Bellare Studios',
  genres: ['Adventure', 'Simulation'],
  ageRating: '13+',
  offline: true
};

// The trailer, self-hosted. It is not on YouTube, and a normal YouTube embed
// would set cookies the privacy policy would then have to cover — so the files
// are served from here instead.
//
// `loop` is the muted clip that plays in the hero. Two alternates are encoded
// and sitting beside it in public/video, so swapping the hero's mood is a
// one-line change:
//   /video/hero-loop-detector.mp4  the detector sweep, the game's core verb
//   /video/hero-loop-well.mp4      magnet fishing a well under Carcassonne
//   /video/hero-loop-ruins.mp4     the camera crossing the ruins at Bolonia
//
// The full trailer is 14 MB and only downloads when somebody asks for it
// (preload="none"), so the page still costs well under a megabyte to open.
export const trailer = {
  loop: '/video/hero-loop-detector.mp4',
  poster: '/images/hero-poster.jpg',
  full: '/video/buried-worlds-trailer-720p.mp4',
  fullPoster: '/images/og-cover.jpg',
  duration: '2:00'
};

// Hero variant: "poster" | "split" | "banner". Poster is the shipped default;
// the others are alternate layouts kept for reference (README §1).
export const heroVariant = 'poster';

// Toggle for the trailing "More worlds coming" destination card. On since
// launch: Kimberley is finished and held back as the first post-launch
// destination, so the locked card now states a fact rather than a hope.
export const showLockedCard = true;

// Section 3 — the VR core loop, "The Prospector's Day".
export const loopSteps = [
  { num: '01', name: 'Detect', desc: "Sweep the coil low and slow. The signal tells you what's down there before you break ground." },
  { num: '02', name: 'Dig', desc: 'Pick your spot and put the pickaxe to work. Every hole is a small bet.' },
  { num: '03', name: 'Pan', desc: 'Take the paydirt to water. Swirl, tilt, and watch the colour settle in the riffle.' },
  { num: '04', name: 'Stow & sell', desc: 'Fill the pouch, weigh in at the trader, and turn dust into a bankroll.' },
  { num: '05', name: 'Travel', desc: 'Buy a ticket to the next rush. Five worlds, each seeded by its real history.' }
];

// Section 4 — the five destinations. Gradients are terrain height gradients
// (DESIGN_SYSTEM.md §5); Hoxne intentionally reuses the Ballarat green.
// Kimberley is withheld from the current release — its card, images and
// gradient are kept out of this list rather than deleted, ready to return.
export const worlds = [
  {
    name: 'Ballarat',
    subtitle: 'The Victorian gold rush, Australia. Where the expedition begins.',
    gradient: 'linear-gradient(160deg,#85A857,#668C45 45%,#8C734C 78%,#C2B280)',
    image: '/images/CastlemaineShot.webp'
  },
  {
    name: 'Coloma',
    subtitle: 'California, 1849. The American River strike that started it all.',
    gradient: 'linear-gradient(160deg,#DEC480,#CCAD66 40%,#B28F5C 65%,#9B7653 85%,#6B4C33)',
    image: '/images/ColomaShot.webp'
  },
  {
    name: 'Carcassonne',
    subtitle: 'Medieval France. Coin hoards beneath a walled hilltop city.',
    gradient: 'linear-gradient(160deg,#94B261,#789E4C 45%,#6B8C47 75%,#857854)',
    image: '/images/CarcassonneShot.webp'
  },
  {
    name: 'Hoxne',
    subtitle: 'A Suffolk field, 1992. The largest Roman hoard ever found in Britain.',
    gradient: 'linear-gradient(160deg,#85A857,#668C45 50%,#8C734C 82%,#C2B280)',
    image: '/images/HoxneShot.webp'
  },
  {
    name: 'Bolonia',
    subtitle: "Spain's Atlantic coast. Roman ruins in the dunes.",
    gradient: 'linear-gradient(160deg,#8C8575,#9E9E61 35%,#CCBD85 60%,#DECC99 80%,#9E8C6B)',
    image: '/images/BoloniaShot.webp'
  }
];

// Section 2 — the mock "Detector reading" card signal rows.
export const signalRows = [
  { label: 'COLD', color: '#0A84FF', pct: 22 },
  { label: 'WARM', color: '#FF9F0A', pct: 48 },
  { label: 'HOT', color: '#FF3B30', pct: 74 },
  { label: 'GOLD!', color: '#FFC400', pct: 96 }
];
