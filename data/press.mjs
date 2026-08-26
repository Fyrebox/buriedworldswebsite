// Press kit copy and asset manifest.
//
// Everything here is checked. The historical detail in particular: a press kit
// is the document an outlet quotes without re-checking, and getting Hoxne wrong
// in front of the British Museum, or the target ID scale wrong in front of a
// detectorist, ends that conversation on contact. Sources are the game's own
// design docs and the live store listing, not recollection.
//
// The long description is the store listing's text, word for word and on
// purpose — when every outlet quotes the same paragraphs as the store page, the
// game reads as one thing rather than five slightly different ones.

export const pressContact = 'press@buriedworlds.com';

export const descriptions = {
  // For a listing line, a tweet, a roundup entry.
  oneLine:
    'A VR treasure-hunting game built around the oldest thrill there is: the '
    + 'moment the ground gives something up.',

  // For a news item or a preview paragraph.
  short:
    'Buried Worlds VR is a VR treasure-hunting game for Meta Quest. No combat and '
    + 'no timers — just a metal detector, a signal climbing, and a patch of dirt '
    + 'that might be hiding a coin, a nugget, or nothing at all. Every tool is '
    + 'worked by hand: sweep the coil, drive the pickaxe, swirl a pan of river '
    + 'gravel until something bright settles at the bottom. Five expeditions, '
    + 'each drawn from a real place where real treasure was found. Built alone, '
    + 'over two years, by a developer in regional Victoria who took a gold '
    + 'prospecting course and never quite got over it.',

  // The store listing's own text.
  full: [
    'Somewhere under your feet, something has been waiting a long time.',
    'Buried Worlds VR is a VR treasure-hunting game built around the oldest thrill '
      + 'there is: the moment the ground gives something up. No combat, no timers. '
      + 'Just a detector in your hand, a signal climbing, and a patch of dirt that '
      + 'might be hiding a coin, a nugget, or nothing at all.',
    'Every tool is worked with your own hands. Sweep the coil low and listen for '
      + 'the tone to rise. Drive the pickaxe into the spot you marked. Load a pan '
      + 'with river gravel and swirl it, again and again, until the silt washes '
      + 'away and something bright settles at the bottom. Sift sand, fish flooded '
      + 'wells with a magnet, and brush the dirt from finds too fragile to strike.',
    'Sell what you recover, upgrade your kit, and earn your way to the next '
      + 'destination. Play seated or standing, teleport or move freely, with '
      + 'comfort options that stay out of your way.',
    'Bring patience. The ground rewards it.'
  ]
};

export const expeditions = [
  {
    place: 'Ballarat',
    region: 'Victoria, Australia',
    questName: 'Birth of Fortune',
    blurb: 'The Victorian diggings that drew the world to Australia, and where the expedition begins.',
    history:
      'The 1850s Victorian gold rush. The game opens here with the basic '
      + 'detector — a bare strength bar that tells you something is there and '
      + 'nothing more about what.'
  },
  {
    place: 'Coloma',
    region: 'California, USA',
    questName: 'A River of Gold',
    blurb: 'The American River strike that started it all.',
    history:
      'James Marshall found gold at Sutter’s Mill in January 1848, the find '
      + 'that started the California Gold Rush. Coloma is where the better '
      + 'detector appears, with a real target ID scale.'
  },
  {
    place: 'Carcassonne',
    region: 'Occitania, France',
    questName: 'Forgotten Relics',
    blurb: 'Coin hoards beneath a walled hilltop city, a locked chest and a missing key.',
    history:
      'The fortified city has been UNESCO-listed since 1997. Its wells are '
      + 'fished with a magnet rather than dug.'
  },
  {
    place: 'Hoxne',
    region: 'Suffolk, England',
    questName: 'Echoes of Rome',
    blurb: 'A Suffolk field holding the largest Roman hoard ever found in Britain.',
    history:
      'In 1992 Eric Lawes went looking for a hammer his tenant farmer, Peter '
      + 'Whatling, had lost in the field, and found the Hoxne Hoard. The hammer '
      + 'was recovered too, and sits with the hoard in the British Museum, '
      + 'Room 49. The game recreates the hammer.'
  },
  {
    place: 'Bolonia',
    region: 'Andalusia, Spain',
    questName: 'Secret of the Tides',
    blurb: 'An Atlantic shore that surrenders its ruins only at low tide.',
    history:
      'The Roman town of Baelo Claudia. The tide governs what can be reached, '
      + 'so the site has to be read rather than simply swept.'
  }
];

export const loop = [
  ['Detect', 'Sweep the coil low and slow. The signal tells you what is down there before you break ground.'],
  ['Dig', 'Pick your spot and put the pickaxe to work. Every hole is a small bet.'],
  ['Pan', 'Take the paydirt to water. Swirl, tilt, and watch the colour settle in the riffle.'],
  ['Stow & sell', 'Fill the pouch, weigh in at the trader, and turn dust into a bankroll.'],
  ['Travel', 'Buy a ticket to the next rush. Five destinations, each seeded by its real history.']
];

// Captions are what an outlet will print under the image, so each one names the
// destination and what is actually happening rather than describing the mood.
export const screenshots = [
  ['01-ballarat-detector.jpg', 'Ballarat — sweeping the coil across the diggings. The basic detector reports signal strength and nothing about what is under it.'],
  ['02-ballarat-panning.jpg', 'Ballarat — panning river gravel. The pan is swirled by hand until the silt washes over the lip.'],
  ['03-coloma-mine.jpg', 'Coloma — a staked claim on the American River diggings.'],
  ['04-coloma-camp.jpg', 'Coloma — the camp above the workings.'],
  ['05-coloma-diggings.jpg', 'Coloma — working ground that other prospectors have already been over.'],
  ['06-carcassonne-citadel.jpg', 'Carcassonne — a well below the walls of the fortified city.'],
  ['07-carcassonne-well.jpg', 'Carcassonne — magnet fishing a flooded well. Some things are not dug for.'],
  ['08-bolonia-ruins.jpg', 'Bolonia — the Roman ruins of Baelo Claudia, exposed at low tide.']
];

export const art = [
  ['art/key-art-2560x1440.jpg', 'Key art', '2560×1440 JPEG'],
  ['art/cover-art-2560x1440.png', 'Cover art with logo', '2560×1440 PNG'],
  ['art/wordmark.png', 'Logo / wordmark', '1774×887 PNG, transparent'],
  ['art/app-icon-1254.png', 'App icon', '1254×1254 PNG']
];
