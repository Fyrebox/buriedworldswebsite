// The French pages: /fr, /fr/jeu-vr-detecteur-de-metaux, /fr/orpaillage-vr.
//
// The game ships in French, and French searches for a VR metal detecting or
// gold panning game have almost no competition. Each page here is the French
// counterpart of an English one — the homepage, /vr-metal-detecting-game and
// /gold-panning-vr — and the two are tied together with hreflang, so a search
// engine shows each reader the version in their language rather than treating
// the pair as duplicates.
//
// The facts are the English pages' facts (data/pages.mjs, data/content.mjs),
// translated rather than restated. If a number changes there, change it here.
//
// These render through views/guide.pug like the English guides. `path` is the
// full URL path (the English pages use `slug`), `alternate` is the English
// counterpart's path, and `ui` carries the template's own words in French.

import { product } from './content.mjs';

const ui = {
  lang: 'fr',
  ogLocale: 'fr_FR',
  home: '/fr',
  readNext: 'À lire aussi',
  cta: 'Essai gratuit sur Meta Quest',
  secondary: { href: '/fr', label: 'Buried Worlds VR en français' },
  priceLine: `Essai gratuit de ${product.trialMinutes} minutes, puis 9,99 $ US sur le ${product.store}`,
  devices: 'Quest 2, Quest 3, Quest 3S et Quest Pro'
};

// The destination pages exist in English only, and say so.
const SITES = [
  { href: '/destinations/ballarat', label: 'Ballarat, Australie', note: 'Batée et machine à puddler. Ouvert dès le départ. (en anglais)' },
  { href: '/destinations/coloma', label: 'Coloma, Californie', note: 'Sluice et dynamite. Débloqué à 1 000. (en anglais)' },
  { href: '/destinations/carcassonne', label: 'Carcassonne, France', note: 'Pêche à l’aimant dans les puits. Débloqué à 5 000. (en anglais)' },
  { href: '/destinations/hoxne', label: 'Hoxne, Suffolk', note: 'Le bloc de terre au pinceau. Débloqué à 8 000. (en anglais)' },
  { href: '/destinations/bolonia', label: 'Bolonia, Espagne', note: 'La plage au tamis. Débloqué à 12 500. (en anglais)' }
];

export const frenchPages = [
  {
    path: '/fr',
    alternate: '/',
    lastModified: '2026-11-25',
    kind: 'WebPage',
    ui,
    kicker: 'Meta Quest 2, 3, 3S et Pro · en français',
    h1: 'Buried Worlds VR, la chasse au trésor en réalité virtuelle',
    tagline: 'Balayez le sol au détecteur de métaux, creusez là où le signal monte, lavez le gravier de la rivière à la batée. Pas de combat, pas de chrono.',
    title: 'Buried Worlds VR : jeu VR de détection de métaux sur Meta Quest',
    description: 'Détecteur de métaux, pioche et batée : cherchez de l’or et des trésors sur cinq sites historiques réels. Essai gratuit de 30 minutes sur Meta Quest.',
    hero: {
      src: '/press/screenshots/01-ballarat-detector-2.jpg',
      alt: 'Une main gantée tient un détecteur de métaux au-dessus d’une terre rouge ; l’écran identifie la cible comme du laiton.',
      width: 1920,
      height: 1080
    },
    sections: [
      {
        heading: 'Le jeu',
        blocks: [
          { p: 'Buried Worlds VR est un jeu de chasse au trésor pour Meta Quest, construit autour du '
            + 'plus vieux frisson qui soit : le moment où le sol rend quelque chose. Un détecteur en '
            + 'main, un signal qui monte, et un carré de terre qui cache peut-être une pièce, une '
            + 'pépite… ou rien du tout.' },
          { p: 'Chaque outil se manie de vos propres mains. Vous balayez la tête du détecteur au ras '
            + 'du sol, vous plantez la pioche à l’endroit marqué, vous faites tourner la batée dans '
            + 'la rivière jusqu’à ce que la boue parte et que l’or se dépose au fond. Le jeu est '
            + 'entièrement disponible en français.' }
        ]
      },
      {
        heading: 'La journée du prospecteur',
        blocks: [
          { steps: [
            { name: 'Détecter', body: 'Balayez le détecteur de métaux bas et lentement. Le signal vous dit ce qui se trouve en dessous avant même de creuser.' },
            { name: 'Creuser', body: 'Choisissez votre point et mettez la pioche au travail. Chaque trou est un petit pari.' },
            { name: 'Laver à la batée', body: 'Portez la terre à la rivière et cherchez l’or à la batée. Faites tourner, inclinez, et regardez la couleur se déposer.' },
            { name: 'Ranger et vendre', body: 'Remplissez la sacoche, pesez vos trouvailles chez le marchand, et transformez la poussière d’or en capital.' },
            { name: 'Voyager', body: 'Achetez un billet pour la ruée suivante. Cinq destinations, chacune tirée de son histoire réelle.' }
          ] }
        ]
      },
      {
        heading: 'Cinq lieux réels où de vrais trésors ont été trouvés',
        blocks: [
          { p: 'Chaque destination s’inspire d’une découverte documentée, et chacune change l’outil '
            + 'que vous avez en main : la ruée vers l’or victorienne en Australie, la Californie de '
            + '1849, les puits de la cité médiévale de Carcassonne, le trésor romain de Hoxne en '
            + 'Angleterre, et une plage romaine en Andalousie. Les lieux et leur histoire sont réels ; '
            + 'les personnages que vous croisez ne le sont pas.' },
          { links: SITES }
        ]
      },
      {
        heading: 'À votre rythme',
        blocks: [
          { list: [
            'Assis ou debout, avec téléportation ou déplacement libre.',
            `Le ${product.store} classe le confort du jeu comme « Modéré ».`,
            'Fonctionne directement sur le casque, sans PC ni câble, et hors ligne une fois installé.',
            'Trois emplacements de sauvegarde, pour trois prospecteurs différents.',
            'Disponible en français et en anglais.'
          ] }
        ]
      },
      {
        heading: 'Prix et essai gratuit',
        blocks: [
          { p: `Le ${product.store} propose un essai gratuit de ${product.trialMinutes} minutes : assez `
            + 'pour essayer le détecteur, déterrer une première trouvaille et laver la rivière à '
            + 'Ballarat. Le jeu coûte ensuite 9,99 $ US ; Meta affiche le prix dans votre devise, '
            + 'donc le montant exact peut varier. Il fonctionne sur Quest 2, Quest 3, Quest 3S et '
            + 'Quest Pro. Il n’existe pas encore de version Steam ou PC VR.' }
        ]
      },
      {
        heading: 'Qui le fabrique',
        blocks: [
          { p: 'Buried Worlds VR est conçu par un développeur indépendant qui travaille seul dans '
            + 'l’État de Victoria, en Australie, sous le nom de Bellare Studios. Avant d’écrire une '
            + 'ligne du jeu, il a suivi un stage de prospection aurifère : le comportement de la '
            + 'batée vient de là. Les retours se font depuis les paramètres du jeu ou sur Discord.' }
        ]
      }
    ],
    related: [
      { href: '/fr/jeu-vr-detecteur-de-metaux', label: 'La détection de métaux en VR', note: 'Le signal, l’écran du détecteur et la boucle de jeu.' },
      { href: '/fr/orpaillage-vr', label: 'L’orpaillage en VR', note: 'La batée, le sluice et la machine à puddler.' }
    ]
  },

  {
    path: '/fr/jeu-vr-detecteur-de-metaux',
    alternate: '/vr-metal-detecting-game',
    lastModified: '2026-11-25',
    kind: 'WebPage',
    ui,
    kicker: 'Meta Quest 2, 3, 3S et Pro',
    h1: 'Un jeu VR de détection de métaux construit autour du signal',
    tagline: 'Balayez la tête du détecteur, lisez l’écran, creusez là où le son monte. Pas de combat, pas de chrono : juste le sol et ce qu’il cache.',
    title: 'Jeu VR de détection de métaux sur Meta Quest | Buried Worlds VR',
    description: 'Un jeu VR de détection de métaux pour Meta Quest : balayez un détecteur réaliste, lisez les cibles, creusez et vendez vos trouvailles sur cinq sites réels.',
    hero: {
      src: '/press/screenshots/01-ballarat-detector-2.jpg',
      alt: 'Une main gantée tient un détecteur de métaux au-dessus d’une terre rouge ; l’écran identifie la cible comme du laiton.',
      width: 1920,
      height: 1080
    },
    sections: [
      {
        heading: 'Ce que la détection donne en VR',
        blocks: [
          { p: 'Le détecteur est le premier outil du jeu et toute sa raison d’être. Balayez le sol au '
            + 'ras de la tête de détection : il lit l’objet enfoui le plus proche et affiche le signal '
            + 'sur un écran inspiré d’un vrai détecteur, avec une barre de force et une échelle de '
            + 'cibles où l’or et le plomb se chevauchent volontairement. Un signal fort n’est jamais '
            + 'une promesse. C’est cette ambiguïté qui transforme un balayage en décision.' },
          { p: 'Chaque outil se manie de vos propres mains. Vous tenez le détecteur, vous orientez la '
            + 'tête, et quand le son monte, vous plantez la pioche exactement à l’endroit marqué. '
            + 'Aucun bouton ne remplace le geste.' }
        ]
      },
      {
        heading: 'Détecter, déterrer, ranger, vendre, voyager',
        blocks: [
          { steps: [
            { name: 'Détecter', body: 'Balayez le sol. Le signal vous dit qu’il y a quelque chose avant même de creuser.' },
            { name: 'Déterrer', body: 'Frappez à la pioche jusqu’à ce que l’objet remonte à hauteur des yeux. Chaque lieu change cette étape : batée, sluice, aimant, pinceau ou pelle à sable.' },
            { name: 'Ranger', body: 'Ramenez la trouvaille contre votre poitrine. Ce geste l’encaisse, et le total cumulé ne fait que monter.' },
            { name: 'Dépenser', body: 'Ouvrez le marché depuis votre poignet, où que vous soyez, et achetez les outils, permis et consommables qui ouvrent de nouveaux terrains.' },
            { name: 'Voyager', body: 'La valeur totale récupérée débloque la destination suivante. Les cartes verrouillées de l’écran de voyage indiquent ce qu’il vous reste à trouver.' }
          ] }
        ]
      },
      {
        heading: 'Un simulateur de détection sans l’ennui',
        blocks: [
          { p: 'La vraie détection, ce sont des heures de rien ponctuées d’un battement de cœur, et '
            + 'un simulateur fidèle de cela serait injouable. Buried Worlds VR garde le battement de '
            + 'cœur et compresse le rien : environ deux mille objets enfouis par destination, un '
            + 'signal qui veut dire quelque chose, et un rythme fixé par vous. Aucun combat, aucune '
            + 'pression de survie, aucun chrono. Le ton est calme et curieux.' },
          { p: `Jouez assis ou debout, en téléportation ou en déplacement libre. Le ${product.store} `
            + 'classe le confort du jeu comme « Modéré ».' }
        ]
      },
      {
        heading: 'Cinq lieux réels où de vrais trésors ont été trouvés',
        blocks: [
          { p: 'Chaque destination s’inspire d’une découverte documentée, et chacune change l’outil '
            + 'que vous avez en main. Les lieux et leur histoire sont réels ; les personnages ne le '
            + 'sont pas.' },
          { links: SITES }
        ]
      }
    ],
    related: [
      { href: '/fr/orpaillage-vr', label: 'L’orpaillage en VR', note: 'La batée, le sluice et la machine à puddler.' },
      { href: '/fr', label: 'Buried Worlds VR en français', note: 'Le jeu, les destinations, le prix et l’essai gratuit.' }
    ]
  },

  {
    path: '/fr/orpaillage-vr',
    alternate: '/gold-panning-vr',
    lastModified: '2026-11-25',
    kind: 'WebPage',
    ui,
    kicker: 'Ballarat et Coloma',
    h1: 'L’orpaillage en VR : la batée, le sluice et la machine à puddler',
    tagline: 'Trois vraies façons de sortir l’or de la terre, chacune maniée de vos mains.',
    title: 'Orpaillage en VR : chercher de l’or à la batée | Buried Worlds VR',
    description: 'Chercher de l’or en VR, à la main : la batée à Ballarat, le sluice à Coloma, et une machine à puddler coloniale à remettre en marche. Sur Meta Quest.',
    hero: {
      src: '/press/screenshots/02-ballarat-panning-2.jpg',
      alt: 'Une batée tenue à plat à la surface de la rivière, le gravier s’écoulant pendant qu’elle tourne.',
      width: 1920,
      height: 1080
    },
    sections: [
      {
        heading: 'La batée',
        blocks: [
          { p: 'Ballarat est la seule destination qui vend la batée et la pelle, et la seule qui '
            + 'enseigne l’orpaillage. Des chevrons dorés vous guident jusqu’à la rivière. Plongez la '
            + 'pelle pour prendre une motte de terre, versez-la dans la batée, tenez-la à plat à la '
            + 'surface de l’eau et faites-la tourner.' },
          { p: 'Le tas se délave et, s’il y a quelque chose dedans, une pépite se dépose au fond. '
            + 'Tournez trop vite et l’or part avec le gravier : une couleur d’alerte sur l’anneau et '
            + 'une vibration dans la main, jamais un arrêt brutal. L’orpaillage se répète à l’infini, '
            + 'c’est pourquoi Ballarat est l’endroit où revient un prospecteur bloqué, et la seule '
            + 'destination qui peut financer toute la carte à elle seule.' }
        ]
      },
      {
        heading: 'Le sluice',
        blocks: [
          { p: 'Le sluice se vend à Coloma, et seulement là, pour 200, acheté une fois. Il se place '
            + 'tout seul dans l’American River, la trémie en amont, et fait le travail que vous feriez '
            + 'sinon à la main avec la batée. Pelletez la terre dans la trémie, laissez couler la '
            + 'rivière, et ramassez ce qui tombe à la sortie.' },
          { p: 'Il est plus facile et plus productif que la batée, à dessein. Ballarat sert à '
            + 'apprendre ; Coloma sert à produire : c’est là que la rivière reçoit une machine et que '
            + 'l’argent commence à acheter l’accès au terrain.' }
        ]
      },
      {
        heading: 'La machine à puddler',
        blocks: [
          { p: 'Une machine à puddler coloniale abandonnée dort dans les placers de Ballarat : la '
            + 'tranchée circulaire et la herse tirées par un cheval, dont les mineurs victoriens se '
            + 'servaient pour briser l’argile et en libérer l’or. La remettre en marche est '
            + 'l’expédition de Ballarat.' },
          { steps: [
            { name: 'Réparer', body: 'Trois pièces manquent et traînent quelque part dans le monde. Chacune laisse une silhouette lumineuse à sa place. Trouvez-les, rapportez-les, remettez-les en place.' },
            { name: 'Remettre en service', body: 'La troisième pièce posée, la machine reprend vie : un grincement de vieux bois, et le bras qui traîne sa herse autour de la tranchée pour la première fois depuis soixante ans.' },
            { name: 'La faire tourner', body: 'Garnissez la tranchée d’argile, arrosez, poussez le palonnier autour du poteau central. La machine suit votre main, et l’or remonte de la tranchée.' }
          ] }
        ]
      },
      {
        heading: 'Les vraies techniques',
        blocks: [
          { p: 'Les trois sont réelles. La batée est la plus ancienne : un plat peu profond, de l’eau, '
            + 'et le fait que l’or est plus lourd que tout ce qui l’entoure. Le sluice applique le même '
            + 'principe à plus grande échelle : l’eau emporte les matériaux légers par-dessus des '
            + 'riffles qui retiennent les lourds. La machine à puddler était la réponse des champs '
            + 'aurifères victoriens à une argile trop compacte pour être lavée : un cheval tournait en '
            + 'rond en traînant des herses dans une tranchée inondée jusqu’à ce que l’argile se défasse '
            + 'et que l’or tombe.' },
          { note: 'Le développeur du jeu a suivi un stage de prospection aurifère avant de construire '
            + 'tout cela, et le comportement de la batée — la vitesse de rotation, la façon dont l’or '
            + 'repart si vous vous pressez — vient de là plutôt que d’autres jeux.' }
        ]
      },
      {
        heading: 'Par où commencer',
        blocks: [
          { links: SITES.slice(0, 2) }
        ]
      }
    ],
    related: [
      { href: '/fr/jeu-vr-detecteur-de-metaux', label: 'Le détecteur', note: 'Le fonctionnement du signal, et la boucle de jeu autour.' },
      { href: '/fr', label: 'Buried Worlds VR en français', note: 'Le jeu, les destinations, le prix et l’essai gratuit.' }
    ]
  }
];

/** English path → French path, for the hreflang links on the English side. */
export const frenchAlternateOf = Object.fromEntries(frenchPages.map((page) => [page.alternate, page.path]));

/**
 * The hreflang set for a page pair, as absolute URLs. Both pages in a pair
 * carry the same set, and x-default points at the English page.
 */
export function hreflangLinks(englishPath, frenchPath, siteUrl) {
  return [
    { hreflang: 'en', href: `${siteUrl}${englishPath}` },
    { hreflang: 'fr', href: `${siteUrl}${frenchPath}` },
    { hreflang: 'x-default', href: `${siteUrl}${englishPath}` }
  ];
}
