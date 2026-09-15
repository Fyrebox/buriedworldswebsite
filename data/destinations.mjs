// The five destination pages, /destinations/:slug.
//
// Written from ~/Documents/VRVault/BuriedWorlds/Destination Gameplay.md, which
// is the source of record for what a player actually does in each world. The
// numbers — unlock thresholds, buried-item counts, reward values — are that
// document's numbers, not recalled ones. Change them there first.
//
// Each page is written to stand on its own in a search result: one place, its
// real history, and the one verb that makes it feel different from the others.
// That verb is the page's spine (pan and puddle, sluice and blast, fish the
// wells, brush the block, scoop the sand) because it is how a player remembers
// a world, and how somebody searching "VR gold panning" or "metal detecting
// game" finds the page that answers them.
//
// Every page carries a short "the real place" section and the same caveat: the
// places and their history are real, the people you meet are invented. Hoxne
// sits on a documented 1992 find with named, living people involved, so there
// the distinction is stated by name.
//
// Kimberley was built, withheld from launch and removed from the project in
// August 2026. It has no page and must not appear here as current or upcoming.

export const destinations = [
  {
    slug: 'ballarat',
    order: 1,
    name: 'Ballarat',
    country: 'Australia',
    region: 'Victoria, Australia',
    verb: 'Pan and puddle',
    unlock: 'Open from the start',
    tagline: 'Victorian gold-rush bush, a river to pan, and an abandoned machine that wants to turn again.',
    title: 'Ballarat — gold panning in the Victorian rush | Buried Worlds VR',
    description:
      'Ballarat is where Buried Worlds VR begins: gold-rush bush, a river to pan for gold, and an abandoned puddling machine to bring back to life. Open from day one.',
    hero: {
      src: '/press/screenshots/01-ballarat-detector.jpg',
      alt: 'A metal detector coil swept low over dry Australian scrub at Ballarat, gum trees behind.',
      width: 1920,
      height: 1080
    },
    facts: {
      tool: 'Detector, pickaxe, gold pan and shovel',
      finds: 'Around 2,000 buried items, worth about 12,900 together',
      signature: "The Puddler's Prize"
    },
    atmosphere: [
      'Gum trees, dry scrub and a river running through the middle of it. Kookaburras '
      + 'call over a bed of birdsong and wind, and Australian animals move through the '
      + 'scene on business of their own. Ballarat is the widest and most open of the '
      + 'five destinations — built to be walked around in rather than solved — and the '
      + 'mood is warm, unhurried and slightly sunbaked.',
      'It is also where everything is learned. The detector, the pickaxe, bringing a '
      + 'find to your chest to bank it: all of it is taught here, in the open, without '
      + 'pressure. There is no combat anywhere in Buried Worlds VR and no timer. '
      + 'Ballarat is the destination that sets that tone.'
    ],
    story: {
      name: 'The puddling machine',
      intro:
        'An abandoned colonial puddling machine sits idle in the diggings — the horse-driven '
        + 'trench-and-harrow rig that Victorian miners used to wash gold out of clay. '
        + 'Restoring it is Ballarat’s expedition, and it runs in three beats.',
      beats: [
        {
          name: 'Repair',
          body: 'Three parts of the machine are missing and lying loose somewhere in the world. '
            + 'Each leaves a pulsing silhouette where it belongs. Find them, carry them back, '
            + 'and push each one home into its socket.'
        },
        {
          name: 'Commissioning',
          body: 'The moment the third part goes in, the machine comes back to life in a one-off '
            + 'ceremony: a groan of old timber, the boom breaking free and dragging its harrow '
            + 'around the trench for the first time in sixty years, the instruction sign repainted.'
        },
        {
          name: 'Working it',
          body: 'After that it is yours to run, as often as you like. Bed the trench with clay '
            + 'shovelled from the pile, water it, then push the swingletree around the centre '
            + 'post. The machine follows your hand, so it works whether you walk the full circle '
            + 'or sweep it from where you stand. Gold comes up out of the trench.'
        }
      ],
      reward: 'The signature find at the end of it is the Puddler’s Prize.'
    },
    side: [
      {
        name: 'Gold panning',
        body: 'Ballarat is the only destination that sells the gold pan and shovel, and the only '
          + 'one that teaches panning. Golden chevrons lead you to the river station. Dip the '
          + 'shovel for a clod of dirt, tip it into the pan, hold the pan level at the water '
          + 'and swirl. The mound washes down and a nugget settles out. Swirl too fast and the '
          + 'gold goes with it — a warning colour on the ring and a buzz in your hand, never a '
          + 'hard stop. Panning is repeatable forever, which makes this the place a stuck '
          + 'prospector comes back to.'
      },
      {
        name: 'Free prospecting',
        body: 'Around two thousand buried items are scattered across the diggings, worth '
          + 'roughly 12,900 in all. Ballarat is the one destination that can fund the whole '
          + 'map on its own, given enough time with the detector.'
      }
    ],
    history:
      'The Victorian gold rush of the 1850s drew people to Ballarat from every continent, '
      + 'and the puddling machine was one of its real tools: a horse walked a circle, dragging '
      + 'harrows through a clay-filled trench until the gold dropped out. The place and its '
      + 'history are real. The people you meet are not.',
    video: {
      youtubeId: '3dv1H7-Trgs',
      name: 'Buried Worlds | VR Gold Prospecting on Meta Quest | Official Teaser',
      description:
        'The official teaser for Buried Worlds VR — sweeping the detector, digging, and '
        + 'panning the river at Ballarat.',
      uploadDate: '2026-09-06T16:55:22-07:00',
      duration: 'PT1M41S',
      durationLabel: '1:41',
      poster: {
        src: '/press/screenshots/02-ballarat-panning.jpg',
        alt: 'A gold pan held level at the surface of the river at Ballarat.',
        width: 1920,
        height: 1080
      }
    }
  },

  {
    slug: 'coloma',
    order: 2,
    name: 'Coloma',
    country: 'United States',
    region: 'California, USA',
    verb: 'Sluice and blast',
    unlock: 1000,
    tagline: 'The 1849 rush beside the American River, where money starts buying ground.',
    title: 'Coloma — claims, dynamite and a sluice, 1849 | Buried Worlds VR',
    description:
      'Coloma in Buried Worlds VR is the 1849 California gold rush: buy a claim, blast it with dynamite, and run a sluice box in the American River. Unlocks at 1,000.',
    hero: {
      src: '/press/screenshots/04-coloma-camp.jpg',
      alt: 'The ’49er camp at Coloma, timber buildings on the flat with open country beyond.',
      width: 1920,
      height: 1080
    },
    facts: {
      tool: 'Detector, pickaxe, sluice box and dynamite',
      finds: 'Around 2,000 buried items, worth about 16,100 together',
      signature: 'Six mine trophies, one per claim'
    },
    atmosphere: [
      'A ’49er camp at the place where the whole thing started. A hand-placed town on '
      + 'the flat, open country beyond it, and the river doing the work. Where Ballarat is '
      + 'about learning, Coloma is about output: this is the destination where the river '
      + 'gets a machine, and where money starts buying access to ground.'
    ],
    story: {
      name: 'Claims and dynamite',
      intro:
        'A Miners’ Notice board stands in the camp, listing six mines by name with a '
        + 'price against each. Coloma’s expedition is about deciding which of them '
        + 'is worth the powder.',
      beats: [
        {
          name: 'Buy a claim',
          body: 'The names carry the place: Dead Mule Shaft, Widow’s Luck, Sutter’s '
            + 'Folly, Rattlesnake Drift, Bonanza Hole, Last Chance Diggings. Claims run from '
            + '$250 to $500.'
        },
        {
          name: 'Buy powder',
          body: 'Dynamite is sold at Coloma and nowhere else, $75 a stick, and only while you '
            + 'hold an unblasted claim. The stick appears floating in front of you wherever you '
            + 'happen to be standing. Dropped, it hovers rather than rolling away.'
        },
        {
          name: 'Blast it',
          body: 'Carry the stick out to the claimed mine, set it in the blast socket, light the '
            + 'fuse and retreat. The mine comes down, the debris bounces and clears, and a named '
            + 'trophy rises out of the dust with a card that says what it is, plus a scatter of '
            + 'gold around it.'
        }
      ],
      reward:
        'Six trophies, one per mine and once per profile, each a small story on its own: a '
        + 'dented brass pack-bell with a torn strap from Dead Mule Shaft; a silver mourning '
        + 'locket with woven hair behind glass from Widow’s Luck; a hand-stamped sawmill '
        + 'maker’s plate from Sutter’s Folly; a snake rattle capped in worked silver '
        + 'from Rattlesnake Drift; native gold threading white quartz from Bonanza Hole; and a '
        + 'folding brass assayer’s balance from Last Chance Diggings. Blasting is '
        + 'deliberately a cash loss and a progression gain — it speeds a world up rather '
        + 'than clearing it.'
    },
    side: [
      {
        name: 'Sluicing',
        body: 'The sluice box is sold here and only here, $200, bought once. It seats itself in '
          + 'the river, hopper upstream, and does the work you would otherwise do by hand in a '
          + 'pan. Shovel dirt into the hopper, let the river run through it, and pick up what '
          + 'drops at the discharge. Easier and more productive than panning, by design.'
      },
      {
        name: 'Panning',
        body: 'Works here too, if you bought the kit at Ballarat.'
      },
      {
        name: 'Free prospecting',
        body: 'Around two thousand buried items across the camp and the river flats, worth '
          + 'roughly 16,100 in all.'
      }
    ],
    history:
      'James Marshall found gold in the tailrace of Sutter’s sawmill at Coloma in '
      + 'January 1848, and the California Gold Rush followed. The place and its history are '
      + 'real. The mine names and the people you meet are not.'
  },

  {
    slug: 'carcassonne',
    order: 3,
    name: 'Carcassonne',
    country: 'France',
    region: 'Occitania, France',
    verb: 'Fish the wells',
    unlock: 5000,
    tagline: 'A walled medieval city, seven wells, and a magnet on a rope.',
    title: 'Carcassonne — magnet fishing medieval wells | Buried Worlds VR',
    description:
      'Carcassonne in Buried Worlds VR: lower a fishing magnet into the wells of a walled medieval city and restore seven plaques to the chapel. Unlocks at 5,000.',
    hero: {
      src: '/press/screenshots/06-carcassonne-citadel.jpg',
      alt: 'The citadel at the heart of Carcassonne, stone walls and towers under a pale sky.',
      width: 1920,
      height: 1080
    },
    facts: {
      tool: 'Detector, pickaxe and a fishing magnet',
      finds: 'Around 1,900 buried items, worth about 29,700 — the richest destination',
      signature: 'The Lady Carcas Crown'
    },
    atmosphere: [
      'The richest destination in the game by buried value. The city is laid out on the '
      + 'real wall circuit — two north lobes and the barbican spur — with a ruined chapel '
      + 'inside it and a citadel at its heart. Geese wander their pen keeping their own '
      + 'flock spacing, and cows graze the barn in irregular bouts. Stone, water, '
      + 'livestock, and a long history of people losing things down wells.'
    ],
    story: {
      name: 'The seven relics',
      intro:
        'Carcassonne’s expedition runs on water rather than soil. The detector and '
        + 'pickaxe still work here, but the story is fished out, not dug.',
      beats: [
        {
          name: 'Learn the magnet',
          body: 'Buy the fishing magnet for $80. The purchase itself starts a lesson that leads '
            + 'you to the barn trough, whose lid raises when the magnet is bought and closes '
            + 'again once its relic is out.'
        },
        {
          name: 'Fish the wells',
          body: 'Six more wells sit behind permits, bought from a well claims board. A purchased '
            + 'well’s cover lifts two metres out of the way. Lower the magnet, sweep, feel '
            + 'the haptics tighten as you cross a hotspot, hold it there, and something clamps '
            + 'on. Pools deplete as you work them.'
        },
        {
          name: 'Seven Limoges plaques',
          body: 'One in the trough, one in each paid well. Everything else the magnet pulls up '
            + '— and it pulls up plenty — is worth nothing. The junk is there for texture and '
            + 'for the ambiguity of the hunt, not for the wallet.'
        },
        {
          name: 'The chapel',
          body: 'Seven sockets on the ruined chapel wall, laid out three, three and one. Bring a '
            + 'plaque to its silhouette and it snaps flush. Completing all seven plays a '
            + 'one-time ceremony: golden links, a seven-piece cross, an inward collapse, and '
            + 'the Lady Carcas Crown travelling to the altar.'
        }
      ],
      reward: 'The crown is worth 700 and is the destination’s signature payoff.'
    },
    side: [
      {
        name: 'The citadel chest',
        body: 'A locked strongbox sits in the citadel. Poke it while it is locked and it only '
          + 'rattles. The Ornate Citadel Key is buried somewhere in the world and has to be '
          + 'found with the detector and dug with the pickaxe — the rusty keys the wells give '
          + 'up do not fit, which is the joke. Bring the real key to the lock and it snaps in '
          + 'and turns, the lid swings open, and the hoard launches piece by piece out of the '
          + 'chest floor to chest height.'
      },
      {
        name: 'Free prospecting',
        body: 'Around 1,900 buried items inside and around the walls, worth roughly 29,700 in '
          + 'all. Carcassonne’s money comes from its buried loot, the chest and the crown '
          + '— never from what the magnet brings up.'
      }
    ],
    history:
      'The fortified Cité de Carcassonne has stood on its hill above the Aude since '
      + 'the Romans, and has been UNESCO-listed since 1997. Lady Carcas is the legend the '
      + 'city’s name is said to come from. The place and its history are real. The '
      + 'relics and the people you meet are not.'
  },

  {
    slug: 'hoxne',
    order: 4,
    name: 'Hoxne',
    country: 'England',
    region: 'Suffolk, England',
    verb: 'Brush the block',
    unlock: 8000,
    tagline: 'A lost hammer, a quiet field, and the largest Roman hoard ever found in Britain.',
    title: 'Hoxne — the lost hammer and the Roman hoard | Buried Worlds VR',
    description:
      'Buried Worlds VR retells the 1992 Hoxne Hoard: follow four clue signs to a lost hammer, mend a fence, and brush nineteen Roman pieces out of one block of soil.',
    hero: {
      src: '/images/HoxneShot.webp',
      alt: 'Quiet Suffolk farmland at Hoxne, a dead oak on the rise and a farmhouse beyond.',
      width: 384,
      height: 256,
      // No 1920×1080 capture of Hoxne exists yet: the trailer cut contains no
      // Hoxne footage (README § Press kit). Until one is taken, the page shows
      // the card image over its terrain gradient rather than nothing.
      gradient: 'linear-gradient(160deg,#85A857,#668C45 50%,#8C734C 82%,#C2B280)'
    },
    facts: {
      tool: 'Detector, pickaxe, a hammer and a cleaning brush',
      finds: 'Around 2,000 buried items, worth about 22,900 together',
      signature: 'The hoard — nineteen pieces from one find'
    },
    atmosphere: [
      'Quiet English farmland: a goat enclosure, a fence, a dead oak on the rise, a village '
      + 'of houses and a farmhouse that sits dark. This is the most restrained destination '
      + 'in the game and the most deliberately paced.',
      'It is also the only one with no tutorial prompts at all. Hoxne teaches entirely '
      + 'through what is lying around — four clue signs, a hole in a fence, a broken rail '
      + 'in the grass — and at no point does anything tell you what to do next.'
    ],
    story: {
      name: 'The lost hammer',
      intro:
        'Hoxne is built on the real story of how the Hoxne Hoard was found: a detectorist '
        + 'went into a field looking for a hammer a farmer had lost, and found something '
        + 'else. The expedition follows that shape exactly.',
      beats: [
        {
          name: 'Follow the signs',
          body: 'Four clue signs, each placed within sight of the last, lead from the broken '
            + 'goat enclosure out to the dead oak.'
        },
        {
          name: 'Find the hammer',
          body: 'Detect it, dig it. It is a tool, not treasure, and it is worth nothing.'
        },
        {
          name: 'Mend the fence',
          body: 'Carry the fallen panel to its ghost outline. The repair goes in four gated '
            + 'beats, and then you drive the nail — real hammer blows, with the hammer in '
            + 'your hand.'
        },
        {
          name: 'The field opens',
          body: 'Thurlow’s top field, sealed until now behind a fence ring you can see and '
            + 'walls you cannot, comes open, and the hoard goes live. The farmhouse, dark and '
            + 'bare all game, comes alive: a lantern, a thank-you note signed J.T., and a '
            + 'supper on the table that grants one-strike digging charges. Once per profile.'
        },
        {
          name: 'The hoard',
          body: 'The climax is built to feel unlike anything else in the game. The detector '
            + 'hears one signal. The pickaxe digs one hole. What rises is not a coin but a '
            + 'single block of soil, lifted to chest height. Buy the large cleaning brush — '
            + '$60, sold only here — and brush the block down stroke by stroke as treasure '
            + 'begins to show through the dirt. A naming card appears and turns gently to '
            + 'face you until the last piece is stowed.'
        }
      ],
      reward:
        'Nineteen pieces come out of that one find spot: ten siliquae, six solidi and three '
        + 'silver spoons, worth 1,570 together.'
    },
    side: [
      {
        name: 'House finds',
        body: 'Some pieces sit inside the village houses and need no digging at all. They are '
          + 'simply there, revealed in place — the reward for putting your head through a '
          + 'doorway.'
      },
      {
        name: 'A goat',
        body: 'It walks, it eats, it comes back.'
      },
      {
        name: 'Free prospecting',
        body: 'Around two thousand buried items across the farm and the village, worth roughly '
          + '22,900 in all.'
      }
    ],
    history:
      'In November 1992, Eric Lawes went into a field at Hoxne with his metal detector to '
      + 'find a hammer his friend, the tenant farmer Peter Whatling, had lost. He found the '
      + 'Hoxne Hoard — the largest hoard of late Roman gold and silver ever discovered in '
      + 'Britain. The hammer was recovered too, and sits with the hoard in the British '
      + 'Museum, Room 49. Eric Lawes and Peter Whatling were real. The farmer you meet in the '
      + 'game is not.',
    historyLink: {
      href: '/hoxne-hoard',
      label: 'The Hoxne Hoard: the real story',
      note: 'What was in the chest, why it matters, and where to see it.'
    }
  },

  {
    slug: 'bolonia',
    order: 5,
    name: 'Bolonia',
    country: 'Spain',
    region: 'Andalusia, Spain',
    verb: 'Scoop the sand',
    unlock: 12500,
    tagline: 'A Roman beach on the Atlantic, a tide that turns exactly once, and no pickaxe at all.',
    title: 'Bolonia — a Roman beach and a turning tide | Buried Worlds VR',
    description:
      'Bolonia in Buried Worlds VR, the beach below Baelo Claudia: rebuild an amphora to turn the tide, follow a crab to a coffer, raise columns. Unlocks at 12,500.',
    hero: {
      src: '/press/screenshots/08-bolonia-ruins.jpg',
      alt: 'The Roman ruins of Baelo Claudia at Bolonia, pale columns standing in sand.',
      width: 1920,
      height: 1080
    },
    facts: {
      tool: 'Detector and a hand sand scoop — there is no pickaxe here',
      finds: 'Around 2,200 buried items, worth about 20,500 together',
      signature: 'The colonnade — eight aurei and twenty-two silver pieces'
    },
    atmosphere: [
      'A wide Spanish beach with a Roman town behind it and a wreck out on the sand. The '
      + 'beach is deliberately kept clear of anything modern — no umbrellas, no dressing, '
      + 'nothing to place it in this century. The sea is the whole mood, and the tide turns '
      + 'exactly once. The seabed keeps its own colour below the old waterline, so when the '
      + 'water pulls back you can read where it used to be.',
      'There is no pickaxe on this beach. Everything is dug with a hand sand scoop, pushed '
      + 'mouth-first into the sand with real speed, and that single change is what makes '
      + 'Bolonia feel like a different game rather than a new skin.'
    ],
    story: {
      name: 'Secret of the Tides',
      intro: 'The most structured expedition in the game, in six beats, in order.',
      beats: [
        {
          name: 'High tide',
          body: 'Free prospecting along the storm line. The beach is banded rather than '
            + 'uniform — a storm line, a dune edge and a wet wreck line — each carrying its '
            + 'own character of find.'
        },
        {
          name: 'The amphora',
          body: 'Four shell fragments come out of the sand at the wreck and snap into a '
            + 'half-buried base. They go in by shape, not by the order you found them, so '
            + 'each fragment fits only its own place.'
        },
        {
          name: 'The tide turns',
          body: 'The fourth fragment triggers it. Over about six seconds the sea draws '
            + 'offshore and slightly down, a ribbon of wet sand is uncovered, the surf changes '
            + 'its voice, and the boundary of the world moves out with the water.'
        },
        {
          name: 'The fisher crab',
          body: 'An oversized crab idles near the wreck at low tide, and fish lie stranded and '
            + 'flopping on the new wet sand. Feed it one, and it leads you across the beach — '
            + 'waiting whenever you fall behind — then digs at the sand where it stops.'
        },
        {
          name: 'The merchant coffer',
          body: 'Three scooped loads at that spot bring up a bronze-bound coffer at chest '
            + 'height. One large, forgiving latch opens it.'
        },
        {
          name: 'The colonnade',
          body: 'Five broken columns on the citadel plaza, and nine pieces lying visible around '
            + 'the site. No burial and no detector for this one. Bases, shafts and capitals '
            + 'are interchangeable within their kind, and each stack builds from the bottom up.'
        }
      ],
      reward:
        'The colonnade pays the most: eight aurei and twenty-two ancient silver pieces across '
        + 'the five restored columns, around 1,840. The coffer adds another 535. The amphora '
        + 'fragments and the column pieces are themselves worth nothing, which is the point '
        + 'of them.'
    },
    side: [
      {
        name: 'Free prospecting',
        body: 'Around 2,200 buried items along the storm line, the dune edge and the wreck, '
          + 'worth roughly 20,500 in all — the second richest destination in the game.'
      }
    ],
    history:
      'Baelo Claudia was a Roman town on the Strait of Gibraltar, built on salted fish and '
      + 'the garum trade, and its ruins still stand above the beach at Bolonia. The place '
      + 'and its history are real. The wreck, the crab and the people you meet are not.'
  }
];

export function findDestination(slug) {
  return destinations.find((destination) => destination.slug === String(slug).toLowerCase()) ?? null;
}
