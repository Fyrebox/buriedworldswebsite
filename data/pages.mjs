// The guide pages: /vr-metal-detecting-game, /gold-panning-vr, /seated-vr,
// /hoxne-hoard, /how-to-play, /faq, /about, /updates, /magnet-fishing-vr, /best-metal-detecting-games,
// /vr-games-for-seniors,
// /gift-for-metal-detectorists.
//
// The site's homepage is a brand page, and the brand loses every search to a
// television series of the same name. So each page here is built to own one
// generic query the homepage never can — the query is the H1, and the page
// answers it — and to link out to the destination pages so that ranking power
// flows through the whole site rather than pooling on one URL.
//
// Every fact is sourced: the gameplay document for what the game does, the
// store listing in data/press.mjs for how it is described, data/content.mjs
// for price, devices and languages, and for /hoxne-hoard the British Museum's
// published record via its Wikipedia summary — checked on 15 September 2026.
// Nothing here is recalled; if a number needs to change, change its source.
//
// Blocks a section may hold:
//   { p }                 a paragraph
//   { list }              bullet points
//   { steps }             an ordered list of { name, body }
//   { table }             { head, rows }
//   { note }              a bordered aside
//   { links }             a list of { href, label, note }

import { product } from './content.mjs';

const SITES = [
  { href: '/destinations/ballarat', label: 'Ballarat, Australia', note: 'Pan and puddle. Open from the start.' },
  { href: '/destinations/coloma', label: 'Coloma, California', note: 'Sluice and blast. Unlocks at 1,000.' },
  { href: '/destinations/carcassonne', label: 'Carcassonne, France', note: 'Fish the wells. Unlocks at 5,000.' },
  { href: '/destinations/hoxne', label: 'Hoxne, Suffolk', note: 'Brush the block. Unlocks at 8,000.' },
  { href: '/destinations/bolonia', label: 'Bolonia, Spain', note: 'Scoop the sand. Unlocks at 12,500.' }
];

export const pages = [
  // ---------------------------------------------------------------- Tier 1
  {
    slug: 'vr-metal-detecting-game',
    kind: 'WebPage',
    kicker: 'Meta Quest 2, 3, 3S and Pro',
    h1: 'A VR metal detecting game built around the signal',
    tagline: 'Sweep a coil, read a faceplate, dig where the tone climbs. No combat, no timer — just the ground and what it is hiding.',
    title: 'VR Metal Detecting Game for Meta Quest | Buried Worlds VR',
    description: 'A VR metal detecting game for Meta Quest: sweep a real-style detector, read the target scale, dig, and bank finds across five real sites. No combat, no timers.',
    hero: {
      src: '/press/screenshots/01-ballarat-detector-2.jpg',
      alt: 'A gloved hand holds a metal detector over red dirt, the faceplate reading the target as brass.',
      width: 1920,
      height: 1080
    },
    sections: [
      {
        heading: 'What detecting feels like in VR',
        blocks: [
          { p: 'The detector is the game’s first tool and its whole premise. Sweep the coil '
            + 'low over the ground and it reads the nearest buried thing, showing the signal on a '
            + 'faceplate modelled on a real detector’s: a strength bar, and a target scale '
            + 'where gold and lead deliberately overlap. A strong reading is never a promise. That '
            + 'ambiguity is the point — it is what turns a sweep into a decision.' },
          { p: 'Every tool is worked with your own hands. You hold the detector, you angle the '
            + 'coil, and when the tone rises you put the pickaxe to the exact spot you marked. '
            + 'Nothing is a button press standing in for the thing itself.' }
        ]
      },
      {
        heading: 'Detect, dig, stow, sell, travel',
        blocks: [
          { steps: [
            { name: 'Detect', body: 'Sweep the ground. The signal tells you something is there before you break it.' },
            { name: 'Recover', body: 'Strike with the pickaxe until the find surfaces and rises to eye level. Each place changes this step — a pan, a sluice, a magnet, a brush, a sand scoop.' },
            { name: 'Stow', body: 'Bring the find to your chest. That gesture is what banks it, and the lifetime tally only ever goes up.' },
            { name: 'Spend', body: 'Open the marketplace from your wrist anywhere in the world and buy the tools, permits and consumables that open the next kind of ground.' },
            { name: 'Travel', body: 'Lifetime recovered value unlocks the next destination. Locked cards on the travel screen show how close you are.' }
          ] }
        ]
      },
      {
        heading: 'A metal detecting simulator that is not about tedium',
        blocks: [
          { p: 'Real detecting is hours of nothing punctuated by a heartbeat, and a faithful '
            + 'simulator of that would be unplayable. Buried Worlds VR keeps the heartbeat and '
            + 'compresses the nothing: around two thousand buried items per destination, a signal '
            + 'that means something, and the pace set by you. There is no combat anywhere in the '
            + 'game, no survival pressure and no clock. The tone is calm and curious.' },
          { p: `Play seated or standing, teleport or move freely. ${product.store} rates the `
            + `game’s comfort as ${product.comfort}; the seated-play page below says what that `
            + 'means in practice.' }
        ]
      },
      {
        heading: 'Five real places where real treasure was found',
        blocks: [
          { p: 'Each destination is drawn from a documented find, and each changes the tool in '
            + 'your hand. The places and their history are real. The people you meet are not.' },
          { links: SITES }
        ]
      }
    ],
    related: [
      { href: '/gold-panning-vr', label: 'Gold panning in VR', note: 'The pan, the sluice and the puddling machine.' },
      { href: '/magnet-fishing-vr', label: 'Magnet fishing in VR', note: 'The medieval wells of Carcassonne.' },
      { href: '/best-metal-detecting-games', label: 'Other metal detecting games', note: 'PC, VR and mobile, compared honestly.' },
      { href: '/seated-vr', label: 'Playing seated', note: 'What the Moderate comfort rating means here.' },
      { href: '/how-to-play', label: 'How the game works', note: 'The loop, the travel hub and the unlock order.' }
    ]
  },

  {
    slug: 'gold-panning-vr',
    lastModified: '2026-10-23',
    kind: 'WebPage',
    kicker: 'Ballarat and Coloma',
    h1: 'Gold panning in VR: the pan, the sluice and the puddling machine',
    tagline: 'Three real ways of getting gold out of dirt, each one worked with your hands.',
    title: 'Gold Panning in VR — Buried Worlds VR on Meta Quest',
    description: 'Gold panning in VR, by hand: swirl a pan at the river in Ballarat, run a sluice at Coloma, and bring a colonial puddling machine back to life. On Meta Quest.',
    hero: {
      src: '/press/screenshots/02-ballarat-panning-2.jpg',
      alt: 'A gold pan held level at the surface of the river, gravel washing down as it swirls.',
      width: 1920,
      height: 1080
    },
    sections: [
      {
        heading: 'Panning',
        blocks: [
          { p: 'Ballarat is the only destination that sells the gold pan and shovel, and the only '
            + 'one that teaches panning. Golden chevrons lead you to the river station. Dip the '
            + 'shovel for a clod of dirt, tip it into the pan, hold the pan level at the surface of '
            + 'the water and swirl.' },
          { p: 'The mound washes down and, if there is anything in it, a nugget settles out. '
            + 'Swirl too fast and the gold goes with the gravel — a warning colour on the ring and '
            + 'a buzz in your hand, never a hard stop. Panning is repeatable forever, which is why '
            + 'Ballarat is the place a stuck prospector comes back to, and why it is the one '
            + 'destination that can fund the whole map on its own.' }
        ]
      },
      {
        heading: 'Sluicing',
        blocks: [
          { p: 'The sluice box is sold at Coloma, and only there, for $200, bought once. It seats '
            + 'itself in the American River with the hopper upstream and does the work you would '
            + 'otherwise do by hand in the pan. Shovel dirt into the hopper, let the river run '
            + 'through, and pick up what drops at the discharge.' },
          { p: 'It is easier and more productive than panning by design. Where Ballarat is about '
            + 'learning, Coloma is about output — the destination where the river gets a machine '
            + 'and money starts buying access to ground.' }
        ]
      },
      {
        heading: 'The puddling machine',
        blocks: [
          { p: 'An abandoned colonial puddling machine sits idle in the Ballarat diggings — the '
            + 'horse-driven trench-and-harrow rig that Victorian miners used to break clay and '
            + 'free the gold in it. Restoring it is Ballarat’s expedition.' },
          { steps: [
            { name: 'Repair', body: 'Three parts are missing and lying loose in the world. Each leaves a pulsing silhouette where it belongs. Find them, carry them back, push them home.' },
            { name: 'Commissioning', body: 'The third part goes in and the machine comes back to life: a groan of old timber, the boom dragging its harrow around the trench for the first time in sixty years.' },
            { name: 'Working it', body: 'Bed the trench with clay from the pile, water it, push the swingletree around the centre post. The machine follows your hand. Gold comes up out of the trench.' }
          ] }
        ]
      },
      {
        heading: 'The real techniques',
        blocks: [
          { p: 'All three are real. Panning is the oldest — a shallow dish, water, and the fact '
            + 'that gold is heavier than everything around it. The sluice box scales the same '
            + 'principle up: water carries the light material over riffles that trap the heavy. '
            + 'Puddling machines were a Victorian-goldfields answer to clay too stiff to wash: a '
            + 'horse walked a circle, dragging harrows through a flooded trench until the clay '
            + 'broke down and the gold dropped out.' },
          { note: 'The game’s developer took a gold prospecting course before building any of '
            + 'this, and the pan’s behaviour — the swirl speed, the way gold washes out if you '
            + 'hurry — comes from that rather than from other games.' }
        ]
      },
      {
        heading: 'Where to start',
        blocks: [
          { links: SITES.slice(0, 2) }
        ]
      }
    ],
    related: [
      { href: '/vr-metal-detecting-game', label: 'The detector', note: 'How the signal works, and the loop around it.' },
      { href: '/how-to-play', label: 'How the game works', note: 'Unlock order, the travel hub, the marketplace.' },
      { href: '/blog/gold-prospecting-near-ballarat', label: 'Gold prospecting near Ballarat', note: 'Planning a first outing in the real Victorian goldfields.' }
    ]
  },

  {
    slug: 'seated-vr',
    kind: 'WebPage',
    kicker: 'Comfort and accessibility',
    h1: 'Playing Buried Worlds VR seated, and what “Moderate” comfort means here',
    tagline: 'A calm game that can be played sitting down — with an honest account of the one thing that might not suit you.',
    title: 'Seated VR Game for Meta Quest — Comfort in Buried Worlds VR',
    description: 'Buried Worlds VR plays seated or standing, teleport or free movement. No combat, no timers. What the store’s Moderate comfort rating means here, stated plainly.',
    hero: {
      src: '/press/screenshots/05-coloma-diggings-2.jpg',
      alt: 'An eagle standing on the open ground at Coloma beside the player, the detector reading gold, a calm scene with nothing moving fast.',
      width: 1920,
      height: 1080
    },
    sections: [
      {
        heading: 'Seated or standing',
        blocks: [
          { p: `${product.name} supports both, chosen in the game’s settings. Seated play is a `
            + 'first-class mode rather than a fallback: the detector, the pickaxe, the pan and the '
            + 'marketplace on your wrist all work from a chair. Nothing in the game requires you '
            + 'to stand or crouch: finds rise to meet you rather than staying on the ground.' }
        ]
      },
      {
        heading: 'Teleport or free movement',
        blocks: [
          { p: 'You can cross each world by teleporting — point, release, arrive — or by moving '
            + 'freely with the stick. Teleport is the gentler option and loses you nothing: every '
            + 'destination was built to be reached either way. If you know that smooth locomotion '
            + 'disagrees with you, choose teleport and seated play together and the game becomes '
            + 'one of the calmer things you can do in a headset.' }
        ]
      },
      {
        heading: 'What “Moderate” means',
        blocks: [
          { p: `${product.store} rates the game’s comfort as ${product.comfort}. That is Meta’s `
            + 'assessment, not ours, and it is worth taking seriously rather than talking around. '
            + 'It reflects two things: free movement is offered as an option, and the game asks '
            + 'you to look down and reach toward the ground when you dig and pick up finds. '
            + 'Neither is forced on you — but a game rated Comfortable would have neither.' },
          { note: 'If you are sensitive to motion in VR: play seated, choose teleport, and keep '
            + 'the first session short. Three save slots mean you can stop any time and pick the '
            + 'same expedition up later.' }
        ]
      },
      {
        heading: 'What the game never asks of you',
        blocks: [
          { list: [
            'No combat, and nothing that attacks or chases you.',
            'No timers, no survival meters, and no failure state for taking your time.',
            'No jump scares. The loudest thing in the game is a stick of dynamite you lit yourself.',
            'No online play, no other players, and no internet connection needed once installed.',
            'No requirement to finish anything in one sitting.'
          ] }
        ]
      },
      {
        heading: 'Things worth knowing before you buy',
        blocks: [
          { p: 'The detector and the pickaxe are one-handed, but the game is built around using '
            + 'both hands — shovelling into a pan, holding a magnet’s rope, pushing a machine. '
            + 'Picking up a find means reaching toward where it surfaces, which rises to chest '
            + 'height rather than staying on the ground. If reaching is difficult for you, tell us '
            + 'on Discord; that kind of report changes what gets fixed next.' },
          { p: `Available in ${product.languages.join(' and ')}. ${product.price} on the ${product.store}, for ${product.devices}.` }
        ]
      }
    ],
    related: [
      { href: '/faq', label: 'Questions before buying', note: 'Devices, price, languages, saves, refunds.' },
      { href: '/vr-games-for-seniors', label: 'For older and first-time players', note: 'Setting it up for someone new to VR.' },
      { href: '/vr-metal-detecting-game', label: 'What the game is', note: 'The detector and the loop around it.' }
    ]
  },

  {
    slug: 'hoxne-hoard',
    kind: 'WebPage',
    kicker: 'The real history',
    h1: 'The Hoxne Hoard: the lost hammer that found Britain’s largest Roman treasure',
    tagline: 'In November 1992 a man went into a Suffolk field to find a friend’s hammer. He found fifteen thousand Roman coins instead.',
    title: 'The Hoxne Hoard and the Lost Hammer — the Real Story',
    description: 'How Eric Lawes went looking for a lost hammer in 1992 and found 14,865 Roman coins, the largest late Roman treasure in Britain. How Buried Worlds VR retells it.',
    hero: null,
    sections: [
      {
        heading: 'The hammer',
        blocks: [
          { p: 'On 16 November 1992, Eric Lawes — a retired gardener and amateur metal '
            + 'detectorist — went into a field in the village of Hoxne, Suffolk, to help his '
            + 'friend Peter Whatling, the tenant farmer, find a hammer he had lost there. Lawes '
            + 'found the hammer. He also found, in the same field, the largest hoard of late Roman '
            + 'gold and silver ever discovered in Britain.' },
          { p: 'He did the thing that made everything that followed possible: he stopped digging '
            + 'and reported it. The site was excavated by archaeologists rather than by the man '
            + 'with the detector, which is why the hoard’s arrangement in the ground was '
            + 'recorded, and why the wooden chest it lay in — oak, roughly 60 by 45 by 30 '
            + 'centimetres, with smaller boxes of yew and cherry inside — is known at all.' },
          { p: 'The hammer was recovered too. Whatling donated it to the British Museum, where it '
            + 'is displayed alongside the treasure it led to.' }
        ]
      },
      {
        heading: 'What was in the chest',
        blocks: [
          { table: {
            head: ['Item', 'Count'],
            rows: [
              ['Gold solidi', '569'],
              ['Silver siliquae', '14,212'],
              ['Silver miliarenses', '60'],
              ['Bronze nummi', '24'],
              ['Coins in total', '14,865'],
              ['Silver spoons and ladles', '98'],
              ['Gold jewellery', '29 pieces'],
              ['Pepper pots', '4'],
              ['Other silver tableware and objects', 'around 200 items in all']
            ]
          } },
          { p: 'The objects people go to see are the silver “Empress” pepper pot, cast '
            + 'as a figure of a woman; a silver tigress that was once a handle, 480 grams and '
            + 'nearly 16 centimetres long; a gold body chain; and a bracelet inscribed '
            + '“VTERE FELIX DOMINA IVLIANE” — use this happily, Lady Juliane — which is '
            + 'as close as the hoard comes to telling us who owned it.' }
        ]
      },
      {
        heading: 'Why it matters',
        blocks: [
          { p: 'The latest coins are of Honorius and Constantine III, which puts the burial no '
            + 'earlier than 408 — the last years of Roman Britain, when the legions had gone and '
            + 'whoever owned this wealth had reason to put it in the ground. Nobody came back for '
            + 'it. It is not only the largest late Roman hoard from Britain; it is the largest '
            + 'collection of fourth- and fifth-century gold and silver coins found anywhere in '
            + 'the former Roman Empire.' },
          { p: 'It was declared treasure trove and valued at £1.75 million, which the Crown paid '
            + 'and which was split between Lawes and Whatling — finder and landowner. The British '
            + 'Museum acquired the hoard in April 1994. It is in Room 49.' }
        ]
      },
      {
        heading: 'How Buried Worlds VR retells it',
        blocks: [
          { p: 'Hoxne is the fourth destination in the game, and the one that never tells you '
            + 'anything. There are no tutorial prompts. Four clue signs lead from a broken goat '
            + 'enclosure out to a dead oak; you detect and dig up a hammer that is worth nothing; '
            + 'you carry a fallen fence panel back and drive the nail with real blows. Then a '
            + 'field opens that was sealed before, and a single signal brings up not a coin but a '
            + 'block of soil, lifted to chest height, that you brush down stroke by stroke until '
            + 'nineteen pieces come out of it: ten siliquae, six solidi and three silver spoons.' },
          { p: 'The place is real and the history is real. Eric Lawes and Peter Whatling were '
            + 'real. The farmer you meet in the game, and the note he leaves you, are invented — '
            + 'and the game says so, because a documented find with living people in it deserves '
            + 'that line drawn clearly.' },
          { links: [
            { href: '/destinations/hoxne', label: 'Hoxne in the game', note: 'The lost hammer, the fence, the block of soil.' },
            { href: 'https://www.britishmuseum.org/collection/galleries/roman-britain', label: 'Roman Britain, Room 49', note: 'The British Museum gallery where the hoard and the hammer are displayed.', external: true }
          ] }
        ]
      }
    ],
    related: [
      { href: '/vr-metal-detecting-game', label: 'The game', note: 'A VR metal detecting game built around the signal.' },
      { href: '/destinations/carcassonne', label: 'Carcassonne', note: 'Another real place — fished with a magnet rather than dug.' }
    ]
  },

  // ---------------------------------------------------------------- Tier 2
  {
    slug: 'how-to-play',
    kind: 'WebPage',
    kicker: 'Guide',
    h1: 'How Buried Worlds VR works',
    tagline: 'The cycle every destination shares, the hub between them, and the order the world opens in.',
    title: 'How to Play Buried Worlds VR — Loop, Hub and Unlock Order',
    description: 'How Buried Worlds VR works: detect, recover, stow, spend, travel. The travel hub, three save slots, the unlock order for five destinations, and the beer can.',
    hero: {
      src: '/press/screenshots/03-coloma-mine-2.jpg',
      alt: 'A bundle of dynamite held in both hands at the mouth of a mine at Coloma, an ore cart beside it.',
      width: 1920,
      height: 1080
    },
    sections: [
      {
        heading: 'The cycle',
        blocks: [
          { p: 'Every world runs the same five beats underneath its own story.' },
          { steps: [
            { name: 'Detect', body: 'Sweep the metal detector. It reads the nearest buried thing and shows the signal on a real-detector-style faceplate, with a target scale where gold and lead overlap. A strong reading is never a promise.' },
            { name: 'Recover', body: 'Usually: strike with the pickaxe until the find surfaces and rises to eye level. Each world changes this — panning and a machine at Ballarat, a sluice at Coloma, a fishing magnet at Carcassonne, a cleaning brush at Hoxne, a hand scoop at Bolonia.' },
            { name: 'Stow', body: 'Bring the find to your chest. That is what banks it. Selling moves value into cash later, but your lifetime tally only ever goes up.' },
            { name: 'Spend', body: 'The marketplace opens from your wrist anywhere. Buy the tools, permits and consumables that open the next kind of ground.' },
            { name: 'Travel', body: 'Lifetime recovered value unlocks the next destination. Locked cards on the travel screen show a progress bar toward their threshold.' }
          ] },
          { p: 'On top of the cycle, each world carries one authored expedition: a clue, some '
            + 'promising ground, a few key finds, a physical task done with your hands, a world '
            + 'that visibly changes, and a signature treasure at the end.' }
        ]
      },
      {
        heading: 'The travel hub',
        blocks: [
          { p: 'The hub is the only route between worlds and where every session begins. Three '
            + 'save slots, each showing its own name and lifetime value — or New Prospector if '
            + 'empty. Then a grid of destination cards with artwork and, where relevant, a '
            + 'Traditional Country acknowledgement. Locked cards carry a progress bar. From 250 '
            + 'lifetime value onward an Achievements card sits beside them and opens a completion '
            + 'screen: one row per world, showing how much of that world’s buried value this '
            + 'profile has recovered.' }
        ]
      },
      {
        heading: 'Unlock order',
        blocks: [
          { table: {
            head: ['Order', 'Destination', 'Lifetime value needed'],
            rows: [
              ['1', 'Ballarat', 'Open from the start'],
              ['2', 'Coloma', '1,000'],
              ['3', 'Carcassonne', '5,000'],
              ['4', 'Hoxne', '8,000'],
              ['5', 'Bolonia', '12,500']
            ]
          } },
          { p: 'Ballarat alone holds around 12,900 in buried value, and its river panning is '
            + 'repeatable forever — so it can fund the entire map by itself, given time. Nothing '
            + 'forces you onward before you want to go.' }
        ]
      },
      {
        heading: 'What each place changes',
        blocks: [
          { links: SITES }
        ]
      },
      {
        heading: 'The beer can',
        blocks: [
          { p: 'A hidden reward for looking where nobody told you to look. Somewhere in each '
            + 'world there is a beer can. Grab it and stow it at your chest like ordinary loot, and '
            + 'your digging tool swells to three times its size: its next strike unearths every '
            + 'buried item within fifteen metres. One use, once per profile, and it arms whatever '
            + 'that world digs with — which is why it also works on a beach with no pickaxe. '
            + 'Whether to clear a patch by hand first is the gamble.' }
        ]
      },
      {
        heading: 'Small things that help',
        blocks: [
          { list: [
            'The stow gesture — find to chest — is what banks a find. Dropping it does not.',
            'The gold pan and shovel are sold only at Ballarat; the sluice only at Coloma; dynamite only at Coloma while you hold an unblasted claim; the cleaning brush only at Hoxne.',
            'Everything the magnet pulls out of a Carcassonne well is worthless except the seven plaques. That is on purpose.',
            'Getting stuck is not a failure state. Go back to Ballarat, pan for a while, come back.'
          ] }
        ]
      }
    ],
    related: [
      { href: '/seated-vr', label: 'Comfort and seated play', note: 'What the Moderate rating means here.' },
      { href: '/faq', label: 'Questions before buying', note: 'Devices, price, languages, saves.' }
    ]
  },

  {
    slug: 'faq',
    lastModified: '2026-11-25',
    kind: 'FAQPage',
    kicker: 'Before you buy',
    h1: 'Questions about Buried Worlds VR',
    tagline: 'Short answers, every one of them checked against the game as it ships today.',
    title: 'Buried Worlds VR FAQ — Quest 2, Seated Play, Languages, Saves',
    description: 'Does Buried Worlds VR run on Quest 2? Can you play seated? Does it need internet? Is it in French? How many saves? Is there a Steam version? Straight answers.',
    hero: null,
    sections: [],
    faq: [
      {
        q: 'Which headsets does it run on?',
        a: `${product.devices}, from the ${product.store}. It runs natively on the headset — no PC, no cable.`
      },
      {
        q: 'Does it work on Quest 2?',
        a: 'Yes. Quest 2 is supported. It is the least powerful of the four headsets, so it is also where any performance report matters most to us.'
      },
      {
        q: 'Is there a free trial?',
        a: `Yes. The ${product.store} lets you play Buried Worlds VR free for ${product.trialMinutes} minutes before you buy, which is enough to try the detector, dig a first find and pan the river at Ballarat.`
      },
      {
        q: 'How much is it?',
        a: `${product.price} on the ${product.store}, after a ${product.trial.toLowerCase()}. Meta shows the price in your own currency and region, so the exact figure you see may differ.`
      },
      {
        q: 'Can I give it as a gift?',
        a: `Yes. The ${product.store} sends games as gifts from a Quest headset, the Meta Horizon app or the store website, and the person receiving it gets an email with a code to redeem. They need a ${product.devices.replace(' and ', ' or ')}. The gift page on this site has the steps.`
      },
      {
        q: 'Can I play sitting down?',
        a: 'Yes. Seated and standing are both supported, and seated is a full mode, not a fallback. You can also choose teleport instead of free movement. See the seated-play page for what the Moderate comfort rating means.'
      },
      {
        q: 'Is it comfortable? I get motion sick in VR.',
        a: `${product.store} rates it ${product.comfort}, because free movement is offered and the game asks you to look down and reach when you dig. Seated play with teleport removes most of what that rating is about. Keep the first session short.`
      },
      {
        q: 'Does it need an internet connection?',
        a: 'No. Once installed the game runs fully offline. It makes no network requests of its own except when you choose to send feedback from the settings menu.'
      },
      {
        q: 'Is there combat, or a timer?',
        a: 'Neither. Nothing attacks you, nothing chases you, and nothing runs out. The tone is calm and curious; getting stuck is not a failure state.'
      },
      {
        q: 'What languages is it in?',
        a: `${product.languages.join(' and ')}. These are the languages available in the game today; the updates page records any additions when they ship.`
      },
      {
        q: 'How many save slots are there?',
        a: 'Three. Each is its own prospector with its own lifetime value and unlocks, and they are chosen from the travel hub at the start of a session.'
      },
      {
        q: 'How long is it?',
        a: 'Five destinations, each with around two thousand buried items and one authored expedition. Ballarat alone can be played indefinitely — its river panning never runs out. How long that takes depends entirely on how you play.'
      },
      {
        q: 'Is it multiplayer?',
        a: 'No. Single player only, with no online features and no other players in your world.'
      },
      {
        q: 'Is Buried Worlds VR available to everyone?',
        a: `Yes. Buried Worlds VR became publicly available on ${product.releaseDateLabel} on the ${product.store}. You can buy it directly, with no invitation or test key. It includes five destinations and the full prospecting tool set. See Updates for the release history.`
      },
      {
        q: 'Is there a Steam or PC VR version?',
        a: 'Not yet. A PC VR release on Steam is planned and the privacy policy already covers it, but there is no date, and nothing about it is for sale.'
      },
      {
        q: 'Can I get a refund?',
        a: `Refunds are handled by Meta under the ${product.store}'s own policy, not by us. If the game is not working for you, the settings menu has a feedback panel and the Discord has the developer in it — both are faster than a refund and more likely to get the thing fixed.`
      },
      {
        q: 'Are the places real?',
        a: 'Yes. Every destination is drawn from a real place where real treasure was found — the Victorian goldfields, Sutter’s Mill, the Cité de Carcassonne, the Hoxne Hoard, Baelo Claudia. The people you meet in them are invented, and the game says so.'
      },
      {
        q: 'Who made it?',
        a: 'One person, in regional Victoria, Australia, over two years. The studio is Bellare Studios. See the about page.'
      }
    ],
    related: [
      { href: '/seated-vr', label: 'Seated play and comfort', note: 'The Moderate rating, explained.' },
      { href: '/how-to-play', label: 'How the game works', note: 'The loop, the hub, the unlock order.' },
      { href: '/about', label: 'Who made it', note: 'The studio and the person.' }
    ]
  },

  {
    slug: 'about',
    lastModified: '2026-10-23',
    kind: 'AboutPage',
    kicker: 'Bellare Studios',
    h1: 'About Buried Worlds VR',
    tagline: 'One person, two years, a gold prospecting course, and five real places where real treasure was found.',
    title: 'About Buried Worlds VR and Bellare Studios',
    description: 'Buried Worlds VR is made by Cyril Gaillard, working alone in regional Victoria, Australia, as Bellare Studios. How it is built, and how to reach him.',
    hero: {
      src: '/images/hero.webp',
      alt: 'Key art for Buried Worlds VR: a prospector with a detector in Australian gold-rush bush.',
      width: 2560,
      height: 1440
    },
    sections: [
      {
        heading: 'Who made it',
        blocks: [
          { p: `${product.name} was built alone, over two years, by Cyril Gaillard — a developer in `
            + 'regional Victoria, Australia, who took a gold prospecting course and never quite got '
            + 'over it. The game came out of that course: the pan’s behaviour, the way a real '
            + 'detector’s target scale refuses to promise gold, the patience the ground '
            + 'rewards.' },
          { p: `It is published under the name ${product.publisher}, which is the trading name of `
            + `${product.developer}, a company registered in Melbourne, Victoria. There is no team `
            + 'behind the name. When you write to the studio, the developer reads it.' }
        ]
      },
      {
        heading: 'What it is trying to be',
        blocks: [
          { p: 'A VR treasure-hunting game built around the oldest thrill there is: the moment '
            + 'the ground gives something up. No combat, no timers — just a detector in your '
            + 'hand, a signal climbing, and a patch of dirt that might be hiding a coin, a nugget, '
            + 'or nothing at all.' },
          { p: 'Three rules held through the whole build. Every tool is worked with your own '
            + 'hands, never by a button standing in for the thing. Every destination is a real '
            + 'place where real treasure was found, with its real history told straight and its '
            + 'people invented — and the game says which is which. And nothing pressures you: '
            + 'the pace is yours, and getting stuck is a result worth having rather than a '
            + 'failure.' }
        ]
      },
      {
        heading: 'How it is built',
        blocks: [
          { p: 'Unity 6 with the Universal Render Pipeline, OpenXR, and the Meta XR SDK. It runs '
            + `natively on ${product.devices}, fully offline once installed, in `
            + `${product.languages.join(' and ')}. It has no accounts, no analytics and no ads — `
            + 'the privacy policy is short because there is little to say.' },
          { p: `Buried Worlds VR became publicly available on ${product.releaseDateLabel} on the `
            + `${product.store}, following its Early Access launch on ${product.earlyAccessDateLabel}. `
            + 'Anyone can buy and play it without an invitation. The updates page keeps the release history.' }
        ]
      },
      {
        heading: 'The other Buried Worlds',
        blocks: [
          { p: 'There is also Buried Worlds on Reddit: a free daily deduction game that plays in '
            + 'a browser. One relic is buried somewhere in a shared field each day; read the '
            + 'detector’s signal and find it in six digs or fewer, then compare routes with '
            + 'everyone else who dug the same field. It is not VR and does not pretend to be — it '
            + 'is the quickest way to try the idea without a headset.' }
        ]
      },
      {
        heading: 'Reaching us',
        blocks: [
          { links: [
            { href: '/discord', label: 'Discord', note: 'The developer is in there most days. Questions, bug reports, and the first place new destinations get argued about.' },
            { href: '/press', label: 'Press kit', note: 'Fact sheet, screenshots, key art and the trailer, free to use in coverage.' },
            { href: 'mailto:cyril@bellare.com.au', label: 'cyril@bellare.com.au', note: 'For coverage, keys and interviews.' },
            { href: '/privacy', label: 'Privacy', note: 'What we collect, which is very little, and what we do with it.' }
          ] }
        ]
      }
    ],
    related: [
      { href: '/updates', label: 'Updates', note: 'What has shipped, and what is being worked on.' },
      { href: '/vr-metal-detecting-game', label: 'The game', note: 'A VR metal detecting game built around the signal.' }
    ]
  },

  {
    slug: 'updates',
    lastModified: '2026-10-23',
    kind: 'WebPage',
    kicker: 'Changelog',
    h1: 'Updates',
    tagline: 'Available to everyone since 22 October 2026. Release news and the history of the expedition.',
    title: 'Buried Worlds VR Updates — Public Release and Game News',
    description: 'Buried Worlds VR is available to everyone on Meta Quest from 22 October 2026. Read the public release news, earlier updates and how to report a problem.',
    hero: null,
    sections: [
      {
        heading: 'How updates reach you',
        blocks: [
          { p: `Updates are delivered through the ${product.store}, the same way the game was `
            + 'installed. By default the headset installs them on its own, so most players never do '
            + 'anything; if a version here is newer than yours, open the store listing and it will '
            + 'offer the download. Your three save slots are files on your headset, and an update '
            + 'does not remove them.' },
          { p: 'Each entry below is written when the build is actually available, not when it is '
            + 'submitted. Anything listed as being worked on has no date, and gets none until it '
            + 'ships. The Discord hears about a release first, usually the same day.' }
        ]
      },
      {
        heading: 'Reporting a problem',
        blocks: [
          { p: 'The settings menu inside the game has a Send Feedback panel. It asks a few tapped '
            + 'questions — including whether you felt any discomfort and whether the controls gave '
            + 'you trouble — and attaches your build version, headset model and which world you '
            + 'were in, so a report is actionable without you having to describe your setup. It '
            + 'sends nothing until you press Send, and it never asks who you are.' },
          { p: 'For anything that needs a conversation, the Discord has the developer in it most '
            + 'days. A specific report — what you did, what you expected, what happened — is worth '
            + 'more than a kind review, and is the fastest route to seeing something fixed on '
            + 'this page.' }
        ]
      },
      {
        heading: 'What comes next',
        blocks: [
          { p: 'This page records changes when they are available to players. Future destinations, '
            + 'languages and features will be described here when there is confirmed news to share. '
            + 'The five destination pages and FAQ describe what you can play today.' },
          { links: [
            { href: '/faq', label: 'What is in the game today', note: 'Supported headsets, languages, play modes and saves.' },
            { href: '/blog', label: 'Notes from the dig', note: 'Real goldfields, prospecting and the inspiration behind the game.' }
          ] }
        ]
      }
    ],
    updates: [
      {
        date: product.releaseDate,
        label: product.releaseDateLabel,
        title: 'Public release — available to everyone on Meta Quest',
        body: [
          `${product.name} is now available to everyone on the ${product.store}. Buy and install it directly — no invitation, test channel or access key is needed. The listed price is ${product.price}; Meta shows the price in your local currency and region.`,
          'Explore Ballarat, Coloma, Carcassonne, Hoxne and Bolonia with a detector and a different way to recover finds in each place. Pan for gold, run a sluice, fish wells with a magnet and uncover a Roman hoard. There is no combat and no timer: the pace is yours.',
          `Play on ${product.devices}, in ${product.languages.join(' or ')}, seated or standing, with teleport or free movement. Three save slots keep separate expeditions, and the game works offline once installed.`,
          `The expedition began with an Early Access launch on ${product.earlyAccessDateLabel}. The public release opens it to everyone. Questions and bug reports can go through the feedback panel in the game’s settings or directly to the developer on Discord.`
        ]
      },
      {
        date: '2026-09-06',
        label: '6 September 2026',
        title: 'Official teaser published',
        body: [
          'A 1:41 teaser is now on YouTube: sweeping the detector, digging, and panning the river at Ballarat. It plays from the Ballarat destination page here without loading anything from YouTube until you press play.'
        ]
      },
      {
        date: product.earlyAccessDate,
        label: product.earlyAccessDateLabel,
        title: 'Version 1.0 — Early Access release',
        body: [
          `${product.name} first launched in Early Access on the ${product.store} on ${product.earlyAccessDateLabel}. This is the original launch entry; the public release followed on ${product.releaseDateLabel}.`,
          'Five destinations, each drawn from a real place where real treasure was found: Ballarat, Coloma, Carcassonne, Hoxne and Bolonia. The whole tool set — detector, pickaxe, gold pan and shovel, sluice box, dynamite, fishing magnet, cleaning brush and hand sand scoop. Three save slots. English and French. Seated or standing, teleport or free movement. No internet connection needed once installed.'
        ]
      }
    ],
    related: [
      { href: '/about', label: 'About', note: 'Who made it and how it is built.' },
      { href: '/faq', label: 'Questions before buying', note: 'Availability, headsets, languages and saves.' }
    ]
  },
  // ---------------------------------------------------------------- Magnet fishing
  // "Magnet fishing game" is searched and no VR game answers it. The game side
  // is Carcassonne's, from data/destinations.mjs; the real-hobby section is
  // sourced, each source linked on the page.
  {
    slug: 'magnet-fishing-vr',
    lastModified: '2026-11-25',
    kind: 'WebPage',
    kicker: 'Carcassonne, France',
    h1: 'Magnet fishing in VR: the medieval wells of Carcassonne',
    tagline: 'Lower a magnet on a rope into a medieval well, feel the pull tighten, and find out what has been down there all this time.',
    title: 'Magnet Fishing in VR — Buried Worlds VR on Meta Quest',
    description: 'Magnet fishing in VR: lower a magnet into the medieval wells of Carcassonne, feel for the hotspot, and haul up relics and rusty junk. On Meta Quest.',
    hero: {
      src: '/press/screenshots/07-carcassonne-well-2.jpg',
      alt: 'A fishing magnet on its rope lowered into a stone well inside the walls of Carcassonne, a horseshoe and a nail already pulled out and stuck to the frame.',
      width: 1920,
      height: 1080
    },
    sections: [
      {
        heading: 'How the magnet works',
        blocks: [
          { p: 'At Carcassonne the expedition runs on water rather than soil. Buy the fishing magnet '
            + 'for $80 at the marketplace and the purchase starts a short lesson at the barn trough. '
            + 'From then on it works the same in every well: lower the magnet on its rope, sweep it '
            + 'slowly through the water, and feel the controller’s vibration tighten as you cross a '
            + 'hotspot. Hold it there and something clamps on.' },
          { p: 'Like the real thing, most of what comes up is junk: rusty keys and scrap iron. '
            + 'It is worth nothing and it is there on purpose: the ambiguity is the hunt. A well '
            + 'also runs dry as you work it, so the question is always whether to keep fishing or '
            + 'move on.' }
        ]
      },
      {
        heading: 'Seven wells, seven plaques',
        blocks: [
          { steps: [
            { name: 'The trough', body: 'The barn trough’s lid lifts when you buy the magnet. Its relic is the first of seven.' },
            { name: 'The wells', body: 'Six more wells sit behind permits, bought from a well claims board. A purchased well’s cover lifts out of the way, and each one holds a single Limoges plaque among the junk.' },
            { name: 'The chapel', body: 'Seven sockets wait on the ruined chapel wall. Bring each plaque to its silhouette and it snaps flush. The seventh plays a one-time ceremony that ends with the Lady Carcas Crown on the altar.' }
          ] },
          { note: 'The magnet is not the only way to work Carcassonne. The detector and pickaxe still '
            + 'find things here, and one of them is the only key that opens the chest in the citadel '
            + '— the rusty keys the wells give up do not fit.' }
        ]
      },
      {
        heading: 'The real hobby, and why the wells are safer in VR',
        blocks: [
          { p: 'Magnet fishing is the retrieval of metal objects from water with a strong magnet on '
            + 'a rope, in Historic Environment Scotland’s definition. Most kit guides suggest a '
            + 'magnet rated somewhere around 300 to 500 lb of pull for a beginner, at least 15 '
            + 'metres of rope, gloves and a bucket for what comes up. It is a real and popular '
            + 'hobby, and in a lot of places it is restricted or banned outright:' },
          { list: [
            'In England and Wales the Canal & River Trust does not permit magnet fishing on its waterways.',
            'In Scotland, scheduled monuments — the canal network among them — need Scheduled Monument Consent as well as Scottish Canals’ permission.',
            'In France, searching for objects of historical or archaeological interest needs a prefect’s authorisation, and prefectures have said magnet fishing without it is illegal. In 2023 the prefecture of the Aude, the department Carcassonne is in, published an order banning magnet fishing across the whole department.',
            'In South Carolina, the state’s archaeology institute says magnet fishing is prohibited in its waterways. Indiana allows it on state properties with a free permit.'
          ] },
          { p: 'The other reason for caution is what can come up. Canada’s Department of National '
            + 'Defence, writing for magnet fishers, says to treat a suspected munition as explosive, '
            + 'not to bring it ashore, and to call the police. The UK’s rules add a duty to report '
            + 'finds that may be Treasure within 14 days.' },
          { note: 'None of this applies inside a headset. The wells of the game’s Carcassonne hold '
            + 'nothing more dangerous than rust, and nobody needs a permit to fish them except the '
            + 'one sold on the claims board.' },
          { links: [
            { href: 'https://www.historicenvironment.scot/advice-and-support/applying-for-consents/scheduled-monument-consent/magnet-fishing', label: 'Historic Environment Scotland on magnet fishing', note: 'Definition, consent and safety.', external: true },
            { href: 'https://canalrivertrust.org.uk/enjoy-the-waterways/fishing/fishing-faqs', label: 'Canal & River Trust fishing FAQs', note: 'Why magnet fishing is not permitted.', external: true },
            { href: 'https://www.canada.ca/en/department-national-defence/services/uxo/unexploded-explosive-ordnance/magnet-fishing-and-uxo.html', label: 'Magnet fishing and unexploded ordnance', note: 'Canada’s Department of National Defence.', external: true },
            { href: 'https://www.gov.uk/report-treasure-step-by-step', label: 'Reporting treasure in the UK', note: 'GOV.UK.', external: true }
          ] }
        ]
      },
      {
        heading: 'Getting to Carcassonne',
        blocks: [
          { p: 'Carcassonne is the third destination. It opens once your lifetime finds reach 5,000, '
            + 'earned at Ballarat and Coloma, and it is the richest place in the game: about 1,900 '
            + 'buried items worth around 29,700. The city is laid out on the real wall circuit of '
            + 'the medieval Cité, with a ruined chapel inside it and a citadel at its heart.' },
          { links: SITES }
        ]
      }
    ],
    related: [
      { href: '/destinations/carcassonne', label: 'Carcassonne in full', note: 'The expedition, the citadel chest and the real city.' },
      { href: '/vr-metal-detecting-game', label: 'The detector', note: 'How the signal works, and the loop around it.' },
      { href: '/how-to-play', label: 'How the game works', note: 'Unlock order, the travel hub, the marketplace.' }
    ]
  },

  // ---------------------------------------------------------------- Roundup
  // "Metal detecting game" is mostly searched with a platform after it — steam,
  // pc, xbox, app — and Buried Worlds VR is none of those. An honest roundup is
  // the one page that can stand in that search, and it only works if it is
  // honest: our game is flagged as ours, and every other entry comes from its
  // own store page, checked on 25 November 2026. Prices are US store base prices
  // on that date. Re-check before changing anything here; prices and review
  // labels move.
  {
    slug: 'best-metal-detecting-games',
    lastModified: '2026-11-25',
    kind: 'WebPage',
    kicker: 'PC, VR and mobile · checked 25 November 2026',
    h1: 'The best metal detecting games, on PC, VR and mobile',
    tagline: 'Every metal detecting game we could find that you can actually buy today, what the detecting is like in each, and what it costs.',
    title: 'Best Metal Detecting Games on PC, VR and Mobile (2026)',
    description: 'The metal detecting games you can buy today on PC, VR and mobile: prices, platforms and what the detecting is actually like in each. Checked 25 November 2026.',
    hero: {
      src: '/press/screenshots/01-ballarat-detector-2.jpg',
      alt: 'A gloved hand holds a metal detector over red dirt, the faceplate reading the target as brass.',
      width: 1920,
      height: 1080
    },
    sections: [
      {
        heading: 'A note before the list',
        blocks: [
          { p: 'We make one of these games, Buried Worlds VR, so it is on the list and it is flagged '
            + 'as ours. Everything else comes from its own store page, read on 25 November 2026: the '
            + 'developer, the price on the US store, the Steam review summary where there are enough '
            + 'reviews for one, and what the store says the detecting involves. Prices change, and '
            + 'sales come and go, so treat them as a guide.' }
        ]
      },
      {
        heading: 'At a glance',
        blocks: [
          { table: {
            head: ['Game', 'Platform', 'Price (US)', 'In short'],
            rows: [
              ['Buried Worlds VR (ours)', 'Meta Quest', product.price, 'Detect, dig and pan at five real historic sites'],
              ['Treasure Hunter: Metal Detector', 'Meta Quest', 'about $3.99', 'A tropical beach and 40 treasures'],
              ['Treasure Hunter VR', 'PC VR (Steam)', '$0.99', 'Small VR detecting game, new maps unlock'],
              ['Treasure Hunter Simulator', 'PC (Steam)', '$16.99', 'Countryside fields and old battle sites'],
              ['Morgan: Metal Detective', 'PC (Steam)', '$14.99', 'Cosy: return lost things to islanders'],
              ['Treasure Hunter: History of Monastery Gold', 'PC (Steam)', '$4.99', 'Open-world, quest-driven detecting'],
              ['Metal Detector Island', 'PC (Steam)', '$9.99', 'Cosy island, chests and upgrades'],
              ['Dirt Fishing: Metal Detecting Simulator', 'PC (Steam)', '$8.99', 'Forests, beaches, deserts and US coins'],
              ['The Nugget', 'PC and Mac (Steam, Early Access)', '$14.99', 'Gold prospecting and survival in the outback'],
              ['Treasure Hunter / Treasure Hunter World', 'Android / iOS', 'Free, in-app purchases', 'The best-known mobile detecting game']
            ]
          } }
        ]
      },
      {
        heading: 'In VR',
        blocks: [
          { p: 'Buried Worlds VR (ours). You hold the detector in your hand, sweep the coil and read '
            + 'a faceplate modelled on a real one, then dig with a pickaxe and pan river gravel for '
            + 'gold. Five destinations, each drawn from a real place where real treasure was found — '
            + 'the Victorian goldfields, the 1849 California strike, medieval Carcassonne, the Hoxne '
            + `Hoard and a Roman beach in Spain. No combat, no timers. ${product.price} on the `
            + `${product.store}, with a ${product.trial.toLowerCase()}.` },
          { p: 'Treasure Hunter: Metal Detector, by CaffeinesProduction, is a smaller Quest game set '
            + 'on one sunny tropical beach: follow audio and haptic signals, dig up 40 treasures and '
            + 'upgrade the detector through four levels. It released in August 2026 and is listed '
            + 'at about $3.99 — the cheapest way to try detecting on a Quest.' },
          { p: 'Treasure Hunter VR, from Lazy-Days LLC, is a $0.99 PC VR game on Steam (2023): '
            + 'metal detecting in virtual reality, with treasure money unlocking new maps and '
            + 'detectors. It needs a PC VR setup rather than a standalone Quest.' }
        ]
      },
      {
        heading: 'On PC',
        blocks: [
          { p: 'Treasure Hunter Simulator (DRAGO entertainment, 2018, $16.99) is the long-standing '
            + 'name in the genre: detecting countryside fields, including old battle sites, for '
            + 'artefacts. Its Steam reviews are Mixed (59% positive of about 1,100) — worth reading '
            + 'before you buy. It has also been released on Xbox.' },
          { p: 'Morgan: Metal Detective (Studio Morgan, 2025, $14.99) is the cosy option: a '
            + 'first-person adventure on a Cornish island where you find lost belongings and return '
            + 'them to the people who lost them. Mostly Positive on Steam.' },
          { p: 'Treasure Hunter: History of Monastery Gold (Ulab Games, 2023, $4.99) is an open-world, '
            + 'quest-driven detecting sim in the Eastern European countryside, rated Positive on Steam.' },
          { p: 'Three newer games are too recent to have a Steam review score yet. Metal Detector '
            + 'Island (BetDev, July 2026, $9.99) is a cosy island of signals, chests and upgrades. '
            + 'Dirt Fishing: Metal Detecting Simulator (CalmBee, September 2026, $8.99) moves '
            + 'between forests, beaches and deserts, with US coins to collect. The Nugget (OverLKD '
            + 'Studio, Early Access since November 2026, $14.99) is the one for prospectors: tune a '
            + 'detector, dig, wash paydirt, and manage food, water and fuel in the Australian outback.' }
        ]
      },
      {
        heading: 'On mobile',
        blocks: [
          { p: 'Treasure Hunter (Android) and Treasure Hunter World (iOS), from the makers of '
            + 'History of Monastery Gold, are free with in-app purchases: an open-world quest '
            + 'simulator of metal detecting. On Google Play it has over a million downloads and '
            + 'just under 4 stars from more than 13,000 ratings.' }
        ]
      },
      {
        heading: 'If you like digging more than detecting',
        blocks: [
          { p: 'Hydroneer, the Cave Digger series (including Cave Digger VR on Quest) and Gold Mining '
            + 'Simulator — the game once called Gold Rush: The Game — are mining and digging games '
            + 'rather than detecting games: their store pages do not mention a metal detector. They '
            + 'are worth a look if the shovel is the part you enjoy.' },
          { p: 'Coming later: The Detectorist Guild (Full Stop Studios and PQube) is announced for '
            + '2027, and a few smaller detecting games are wishlist-only on Steam for now.' }
        ]
      },
      {
        heading: 'Store pages',
        blocks: [
          { links: [
            { href: 'https://www.meta.com/experiences/treasure-hunter-metal-detector/1288572877671322/', label: 'Treasure Hunter: Metal Detector', note: 'Meta Horizon Store.', external: true },
            { href: 'https://store.steampowered.com/app/2165160', label: 'Treasure Hunter VR', note: 'Steam.', external: true },
            { href: 'https://store.steampowered.com/app/748300', label: 'Treasure Hunter Simulator', note: 'Steam.', external: true },
            { href: 'https://store.steampowered.com/app/2637220', label: 'Morgan: Metal Detective', note: 'Steam.', external: true },
            { href: 'https://store.steampowered.com/app/2383780', label: 'Treasure Hunter: History of Monastery Gold', note: 'Steam.', external: true },
            { href: 'https://store.steampowered.com/app/4916780', label: 'Metal Detector Island', note: 'Steam.', external: true },
            { href: 'https://store.steampowered.com/app/5039190', label: 'Dirt Fishing: Metal Detecting Simulator', note: 'Steam.', external: true },
            { href: 'https://store.steampowered.com/app/5277580', label: 'The Nugget', note: 'Steam, Early Access.', external: true },
            { href: 'https://play.google.com/store/apps/details?id=com.ulab.treasurehunter', label: 'Treasure Hunter', note: 'Google Play.', external: true }
          ] }
        ]
      }
    ],
    related: [
      { href: '/vr-metal-detecting-game', label: 'Metal detecting in Buried Worlds VR', note: 'How the signal works, and the loop around it.' },
      { href: '/gold-panning-vr', label: 'Gold panning in VR', note: 'The pan, the sluice and the puddling machine.' },
      { href: '/magnet-fishing-vr', label: 'Magnet fishing in VR', note: 'The medieval wells of Carcassonne.' }
    ]
  },

  // ---------------------------------------------------------------- Seniors
  // For the adult children and grandchildren who set a Quest up for an older
  // relative and search for something gentle to put on it. Every comfort claim
  // here is the seated-play page's, restated for that reader; the health and
  // safety link is Meta's own, checked on 25 November 2026.
  {
    slug: 'vr-games-for-seniors',
    lastModified: '2026-11-25',
    kind: 'WebPage',
    kicker: 'Seniors and first-time players',
    h1: 'A VR game for seniors: calm, seated, and nothing to fight',
    tagline: 'For the parent or grandparent with a new headset and no interest in zombies — what Buried Worlds VR asks of a player, and what it never does.',
    title: 'VR Games for Seniors: A Calm, Seated Pick | Buried Worlds VR',
    description: 'A VR game for seniors and first-time players: Buried Worlds VR plays seated, with no combat, no timers and real history. What to know before starting.',
    hero: {
      src: '/press/screenshots/05-coloma-diggings-2.jpg',
      alt: 'An eagle standing on the open ground at Coloma beside the player, the detector reading gold, a calm scene with nothing moving fast.',
      width: 1920,
      height: 1080
    },
    sections: [
      {
        heading: 'Why it suits an older player',
        blocks: [
          { p: 'Most of the best-known Quest games are about speed: shooting, swinging, dodging. '
            + 'Buried Worlds VR is about patience. You sweep a metal detector over the ground, dig '
            + 'where the tone climbs, and pan river gravel for gold, at whatever pace you like. It '
            + 'appeals to the same people who enjoy a garden, a museum or a day at the beach with a '
            + 'detector.' },
          { list: [
            'Seated play is a full mode, not a fallback. Nothing requires standing or crouching, and finds rise to chest height to be picked up.',
            'No combat, nothing that chases you, no jump scares, no timers and no way to fail by taking your time.',
            'Every destination is a real place with a real story: the Victorian goldfields, the 1849 California gold rush, a medieval French city, a Roman hoard in Suffolk and a Roman town on a Spanish beach.',
            'It plays offline once installed, with no other players and no chat.',
            'Three save slots, so a grandparent and a grandchild can each keep their own expedition on one headset.'
          ] }
        ]
      },
      {
        heading: 'What it does ask of a player',
        blocks: [
          { p: `It is honest to say what might not suit. The ${product.store} rates the game’s comfort `
            + `as ${product.comfort}, not Comfortable, because free movement is offered and because `
            + 'digging means looking down and reaching toward the ground. Both can be softened: '
            + 'choose teleport instead of free movement, and play seated.' },
          { p: 'It uses the two Quest controllers, not hand tracking, and some actions use both hands '
            + 'at once — shovelling into a pan, holding a magnet’s rope, pushing a machine around. '
            + 'Someone who is new to controllers will want a few minutes of help with the grip and '
            + 'trigger buttons at the start.' }
        ]
      },
      {
        heading: 'Setting it up for someone new to VR',
        blocks: [
          { steps: [
            { name: 'Try it first', body: `Start with the ${product.trial.toLowerCase()} rather than buying straight away. It covers the opening at Ballarat: the detector, a first dig and the river.` },
            { name: 'Choose seated and teleport', body: 'Set both in the game’s settings before the first session. It is the gentlest way to play.' },
            { name: 'Keep the first session short', body: 'Stop well before anyone feels tired or queasy. The game saves, and the expedition will be exactly where it was left.' },
            { name: 'Stay in the room', body: 'For the first session, sit nearby to help with the controllers and to keep the play area clear.' }
          ] },
          { p: 'Meta publishes health and safety warnings for its headsets, including advice for '
            + 'people with existing medical conditions. They are worth reading together before a '
            + 'first session.' },
          { links: [
            { href: 'https://www.meta.com/legal/quest/health-and-safety-warnings/', label: 'Meta Quest health and safety warnings', note: 'Meta’s own guidance, for any Quest headset.', external: true }
          ] }
        ]
      },
      {
        heading: 'Where to go in the game',
        blocks: [
          { p: 'Everyone starts at Ballarat, the gentlest of the five, where the river can be panned '
            + 'forever and no one runs out of things to do. The others open as the finds add up.' },
          { links: SITES }
        ]
      }
    ],
    related: [
      { href: '/seated-vr', label: 'Playing seated, in detail', note: 'What the Moderate comfort rating means here.' },
      { href: '/gift-for-metal-detectorists', label: 'Giving it as a gift', note: 'How to send a Quest game to someone else’s headset.' },
      { href: '/faq', label: 'Questions before buying', note: 'Headsets, languages, saves and the free trial.' }
    ]
  },

  // ---------------------------------------------------------------- Gifting
  // Built for the gift-buying season and the hobby-gift searches around it
  // ("gifts for metal detectorists"). The gifting mechanics are Meta's, taken
  // from its help article on app gifts, checked on 25 November 2026:
  // https://www.meta.com/help/quest/291343079251233/ — if Meta changes the
  // flow, change the steps here to match.
  {
    slug: 'gift-for-metal-detectorists',
    lastModified: '2026-11-25',
    kind: 'WebPage',
    kicker: 'Gifting on the Meta Horizon Store',
    h1: 'A gift for the metal detectorist who owns a Meta Quest',
    tagline: 'For the frozen, flooded and off-limits days: a detector, a gold pan and five real treasure sites, sent straight to their headset.',
    title: 'A VR Gift for Metal Detectorists — Buried Worlds VR on Quest',
    description: 'Buying for a metal detectorist or gold prospector who owns a Meta Quest? Give Buried Worlds VR: detect, dig and pan at five real sites. How gifting works.',
    ctaLabel: 'Gift it on the Meta Horizon Store',
    hero: {
      src: '/press/screenshots/10-ballarat-kangaroo.jpg',
      alt: 'A kangaroo in the Ballarat bush beside the holes it has dug, under a clear blue sky.',
      width: 1920,
      height: 1080
    },
    sections: [
      {
        heading: 'Who it suits',
        blocks: [
          { p: 'Buried Worlds VR is a calm treasure-hunting game for Meta Quest, made by someone who '
            + 'took a gold prospecting course before writing a line of it. It makes a good present '
            + 'for a few kinds of people:' },
          { list: [
            'A detectorist or prospector between outings — the months when the ground is frozen, the creek is up, or the permission has not come through.',
            'Someone who reads about hoards. Every destination is drawn from a real find: the Victorian goldfields, the 1849 California strike, the Hoxne Hoard in Suffolk, a Roman beach in Spain.',
            'Someone who wants a VR game with no combat, no timers and no one to beat, and who would rather play sitting down.'
          ] }
        ]
      },
      {
        heading: 'What they will be doing',
        blocks: [
          { p: 'Sweeping a metal detector low over the ground and watching a faceplate modelled on a '
            + 'real one: a strength bar, and a target scale where gold and lead deliberately overlap. '
            + 'Digging where the tone climbs. Panning river gravel until the colour settles. Later, '
            + 'running a sluice, blasting a claim with dynamite, lowering a fishing magnet into '
            + 'medieval wells and brushing Roman pieces out of a block of soil. Everything is worked '
            + 'with their own hands, and what they find is sold to buy the tools and tickets that '
            + 'open the next place.' },
          { links: SITES }
        ]
      },
      {
        heading: 'How to send it',
        blocks: [
          { p: `Games on the ${product.store} can be sent as gifts from a Quest headset, the Meta `
            + 'Horizon app on a phone, or the store website. In the Meta Horizon app:' },
          { steps: [
            { name: 'Find the game', body: `Tap Search and look up “${product.storeListingName}”, the name it is listed under.` },
            { name: 'Choose gift', body: 'Select the gift box at the top of the screen.' },
            { name: 'Pick the person', body: 'Find them, or enter their name or the email address their Meta account uses.' },
            { name: 'Add a note', body: 'Write an optional gift note, then confirm the purchase.' }
          ] },
          { p: 'They receive an email from Meta with a 25-digit code. To redeem it, they open the '
            + 'game’s page in the Meta Horizon app, tap Options, then Redeem gift, and enter the '
            + 'code. The game then installs on their headset like anything else they own.' },
          { links: [
            { href: 'https://www.meta.com/help/quest/291343079251233/', label: 'Meta’s help article on sending and redeeming app gifts', note: 'The headset and website versions of these steps.', external: true }
          ] }
        ]
      },
      {
        heading: 'Check before you buy',
        blocks: [
          { list: [
            `They need a ${product.devices.replace(' and ', ' or ')}. The game runs on the headset itself, with no PC. There is no Steam or PC VR version yet.`,
            `A gift is charged at the store’s standard public price — ${product.price}, shown in your own currency.`,
            'Meta can restrict gifts by country, so the game has to be available where they live.',
            'If the gift is not redeemed within 30 days it expires and the money comes back to you.',
            'Only the person who received it can ask for a return, and the refund goes to you.',
            `The game is rated ${product.ageRating}, is in ${product.languages.join(' and ')}, and plays offline once installed. The store rates its comfort as ${product.comfort}; the seated-play page explains what that means.`
          ] }
        ]
      },
      {
        heading: 'Not sure it is their kind of game?',
        blocks: [
          { p: 'Watch the two-minute trailer on the homepage — it is the loop, start to finish. If '
            + `you have a headset yourself, the ${product.trial.toLowerCase()} lets you play the `
            + 'opening at Ballarat before you spend anything: the detector, a first dig and the '
            + 'river.' }
        ]
      }
    ],
    related: [
      { href: '/vr-metal-detecting-game', label: 'The detector', note: 'How the signal works, and the loop around it.' },
      { href: '/gold-panning-vr', label: 'Gold panning in VR', note: 'The pan, the sluice and the puddling machine.' },
      { href: '/seated-vr', label: 'Playing seated', note: 'What the Moderate comfort rating means here.' },
      { href: '/faq', label: 'Questions before buying', note: 'Headsets, languages, saves and the free trial.' }
    ]
  }
];

export function findPage(slug) {
  return pages.find((page) => page.slug === String(slug).toLowerCase()) ?? null;
}
