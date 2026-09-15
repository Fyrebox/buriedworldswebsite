// The guide pages: /vr-metal-detecting-game, /gold-panning-vr, /seated-vr,
// /hoxne-hoard, /how-to-play, /faq, /about, /updates.
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
      src: '/press/screenshots/01-ballarat-detector.jpg',
      alt: 'A metal detector coil swept low over dry ground, the faceplate lit with a rising signal.',
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
      { href: '/seated-vr', label: 'Playing seated', note: 'What the Moderate comfort rating means here.' },
      { href: '/how-to-play', label: 'How the game works', note: 'The loop, the travel hub and the unlock order.' }
    ]
  },

  {
    slug: 'gold-panning-vr',
    kind: 'WebPage',
    kicker: 'Ballarat and Coloma',
    h1: 'Gold panning in VR: the pan, the sluice and the puddling machine',
    tagline: 'Three real ways of getting gold out of dirt, each one worked with your hands.',
    title: 'Gold Panning in VR — Buried Worlds VR on Meta Quest',
    description: 'Gold panning in VR, by hand: swirl a pan at the river in Ballarat, run a sluice at Coloma, and bring a colonial puddling machine back to life. On Meta Quest.',
    hero: {
      src: '/press/screenshots/02-ballarat-panning.jpg',
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
      { href: '/how-to-play', label: 'How the game works', note: 'Unlock order, the travel hub, the marketplace.' }
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
      src: '/press/screenshots/05-coloma-diggings.jpg',
      alt: 'Open diggings at Coloma under a wide sky, a calm scene with nothing moving fast.',
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
      src: '/press/screenshots/03-coloma-mine.jpg',
      alt: 'A mine entrance at Coloma with a blast socket set at its mouth.',
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
        q: 'How much is it?',
        a: `${product.price} on the ${product.store}. Meta shows the price in your own currency and region, so the exact figure you see may differ.`
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
        a: `${product.languages.join(' and ')}, with six languages planned, translated by people rather than by machine.`
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
        q: 'What does Early Access mean here?',
        a: 'The expedition is complete and playable — five destinations, the whole tool set, both languages. It is also still being extended, with more destinations planned. Every claim on this site is true of the build you can buy today; nothing is promised on a date.'
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
          { p: `It released on ${product.releaseDateLabel} in ${product.status} on the `
            + `${product.store}, and is being extended from there. The updates page keeps the `
            + 'record.' }
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
            { href: 'mailto:press@buriedworlds.com', label: 'press@buriedworlds.com', note: 'For coverage, keys and interviews.' },
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
    kind: 'WebPage',
    kicker: 'Changelog',
    h1: 'Updates',
    tagline: 'What has shipped, dated, and what is being worked on. Nothing here is promised on a date.',
    title: 'Buried Worlds VR Updates and Roadmap',
    description: 'Every update to Buried Worlds VR since its Early Access release on 26 August 2026, and what is being worked on next. Dated and specific, no promises about when.',
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
        heading: 'Being worked on',
        blocks: [
          { p: 'These are in progress, in no particular order, and none of them has a date. '
            + 'They move to the list below when they ship.' },
          { list: [
            'A claim survey at Coloma, so there is evidence to read before money changes hands on a mine, followed by richer and poorer stretches of river. The six claims are not yet meaningfully different from one another, and the developer considers that the most important gap in the game.',
            'More destinations after the current five, working toward twelve in the full version.',
            'Six languages, translated by people rather than by machine.'
          ] }
        ]
      }
    ],
    updates: [
      {
        date: '2026-09-06',
        label: '6 September 2026',
        title: 'Official teaser published',
        body: [
          'A 1:41 teaser is now on YouTube: sweeping the detector, digging, and panning the river at Ballarat. It plays from the Ballarat destination page here without loading anything from YouTube until you press play.'
        ]
      },
      {
        date: product.releaseDate,
        label: product.releaseDateLabel,
        title: `Version ${product.version} — Early Access release`,
        body: [
          `${product.name} is out on the ${product.store} for ${product.devices}, in ${product.status}, at ${product.price}.`,
          'Five destinations, each drawn from a real place where real treasure was found: Ballarat, Coloma, Carcassonne, Hoxne and Bolonia. The whole tool set — detector, pickaxe, gold pan and shovel, sluice box, dynamite, fishing magnet, cleaning brush and hand sand scoop. Three save slots. English and French. Seated or standing, teleport or free movement. No internet connection needed once installed.'
        ]
      }
    ],
    related: [
      { href: '/about', label: 'About', note: 'Who made it and how it is built.' },
      { href: '/faq', label: 'What Early Access means here', note: 'And every other question before buying.' }
    ]
  }
];

export function findPage(slug) {
  return pages.find((page) => page.slug === String(slug).toLowerCase()) ?? null;
}
