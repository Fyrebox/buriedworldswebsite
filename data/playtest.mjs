// The paid playtest study: its terms, its numbers and the shape of the
// application form.
//
// Everything a would-be tester is promised lives here rather than in the
// template, for the same reason the store facts do: the fee appears in the page
// copy, in the conditions table, in the confirmation page and in the Reddit post
// that sends people here, and a study is exactly when those drift apart.
//
// `termsVersion` is stored with every application. If the terms change, bump it —
// an applicant is owed the deal that was on screen when they applied, and after a
// change the only way to know which one that was is the version on their row.

export const study = {
  termsVersion: '2026-09-15',
  fee: 'US$10',
  feeAmount: '10',
  feeCurrency: 'USD',
  playMinutes: 20,
  questionnaireMinutes: 5,
  // Deliberately the sum of the two above, not a round number chosen separately.
  totalMinutes: 25,
  deadlineHours: 72,
  paymentWindowHours: 48,
  places: 5,
  payoutMethod: 'PayPal',
  // 13 is the floor for three separate reasons: Meta requires it for a Quest
  // account, the game is rated IARC 13+, and the privacy policy promises not
  // to collect anything from anyone younger. Under 18 needs a parent or
  // guardian — PayPal's own terms require account holders to be 18, so the
  // payment goes to the guardian's account and the agreement is theirs.
  minAge: 13,
  // No study contact address is published. Questions go to the Discord, which
  // every page already links; submissions come in through the questionnaire
  // form; and data requests go to the privacy address on /privacy, which a
  // privacy policy has to carry. The site sends its own mail through SES.
  privacyEmail: 'privacy@buriedworlds.com'
};

// Supported headsets. Kept separate from product.devicesList because the study
// recruits for a subset: Quest Pro is in the product's device list, but there is
// no point holding a paid place open for a headset almost nobody testing owns.
export const headsets = [
  { id: 'quest-2', label: 'Meta Quest 2' },
  { id: 'quest-3', label: 'Meta Quest 3' },
  { id: 'quest-3s', label: 'Meta Quest 3S' },
  { id: 'quest-pro', label: 'Meta Quest Pro' }
];

export const vrFrequencies = [
  { id: 'weekly-plus', label: 'Most weeks or more' },
  { id: 'monthly', label: 'A few times a month' },
  { id: 'rarely', label: 'Rarely — it mostly sits on the shelf' },
  { id: 'new', label: 'I am new to VR' }
];

// Who is applying. PayPal will not open an account for anyone under 18, so a
// younger tester's payment has to go to a parent or guardian — which also
// makes that adult the person who agrees to the study on the tester's behalf.
export const ageGroups = [
  { id: 'adult', label: 'I am 18 or over' },
  {
    id: 'minor',
    label: 'I am 13 to 17. A parent or guardian has agreed to my taking part, and the payment will go to their PayPal account.'
  }
];

export const captureMethods = [
  { id: 'recording', label: 'I can record gameplay video from the headset' },
  { id: 'screenshots', label: 'Screenshots and written notes instead' }
];

// The application's status as the study moves through it. `invited` means the
// site emailed them a store key; `joined` (shown as "Key redeemed") means the
// Keys page in the Meta developer dashboard shows that key redeemed — the one
// proof available that a real Meta account now holds the game. The id stays
// `joined` because rows were written under it.
export const statuses = [
  { id: 'new', label: 'New', hint: 'Applied. Not yet screened.' },
  { id: 'waitlist', label: 'Waitlist', hint: 'Suitable, held in reserve.' },
  { id: 'invited', label: 'Invited', hint: 'Key emailed. Waiting for them to redeem it.' },
  { id: 'joined', label: 'Key redeemed', hint: 'The Keys page in the Meta dashboard shows it redeemed. They have the game.' },
  { id: 'testing', label: 'Testing', hint: 'Playing, inside their 72 hours.' },
  { id: 'submitted', label: 'Submitted', hint: 'Questionnaire and evidence received.' },
  { id: 'paid', label: 'Paid', hint: 'Payment sent.' },
  { id: 'declined', label: 'Declined', hint: 'Not selected, or withdrew.' }
];

// What the page promises before it asks for anything. Each is a commitment that
// has to survive contact with a tester who reads it back to you.
export const promises = [
  {
    label: 'Pay',
    body: `${study.fee} by ${study.payoutMethod}, sent within ${study.paymentWindowHours} hours of your submission arriving. Payment does not depend on liking the game, finding bugs, or posting a review.`
  },
  {
    label: 'Time',
    body: `About ${study.playMinutes} minutes playing plus a ${study.questionnaireMinutes}-minute questionnaire. Breaks and the download do not count.`
  },
  {
    label: 'Hardware',
    body: 'Meta Quest 2, Quest 3, Quest 3S or Quest Pro, and working controllers.'
  },
  {
    label: 'Access',
    body: 'A free key after selection, emailed to you, redeemed in the Meta Horizon app on the account you own the headset with. Yours to keep.'
  },
  {
    label: 'Feedback',
    body: 'A short questionnaire on this site, plus a link to a short clip or a few screenshots from your session — enough to show you played, not a record of all of it. No webcam, no room footage.'
  },
  {
    label: 'Eligibility',
    body: `${study.minAge} or over, and new to Buried Worlds VR. Under 18 is welcome with a parent or `
      + `guardian's agreement — the payment then goes to their ${study.payoutMethod} account, since `
      + `${study.payoutMethod} requires account holders to be 18. Either way, there must be a `
      + `${study.payoutMethod} account the money can reach where you live.`
  }
];

// The payment conditions, published before anyone applies and repeated in the
// invitation. Written as situations rather than as rules so that the awkward
// cases — the ones where a tester would otherwise wonder whether they are about
// to be argued with — each have a stated answer.
export const conditions = [
  {
    situation: 'You complete the session and submit the questionnaire with a clip or screenshots',
    outcome: `Paid ${study.fee}.`
  },
  {
    situation: 'You disliked the game, found no bugs, or could not work out how to play it',
    outcome: 'Paid in full. Getting stuck is the finding, not a failed test.'
  },
  {
    situation: 'A crash, a blocker or motion discomfort stops the session',
    outcome: 'Stop. Send a short note about what happened with whatever evidence you have. Paid in full — nobody is asked to sit through discomfort twice.'
  },
  {
    situation: 'Your recording failed',
    outcome: 'Screenshots and specific notes are accepted instead. No unpaid replay.'
  },
  {
    situation: 'Something is missing from your submission',
    outcome: 'You will be emailed exactly what, within three days, and can update your submission for a week.'
  },
  {
    situation: 'The study is cancelled after you accepted a place',
    outcome: `Paid ${study.fee} if you had started, half if you had not.`
  },
  {
    situation: 'A submission is copied, fabricated, or claimed twice',
    outcome: 'Not paid, with the specific reason given and a week to dispute it.'
  }
];

// Stated in full on the page before the first form field. The study collects
// contact details, which is a different promise from the one the rest of the
// site makes, so it is made explicitly rather than by link.
export const privacyNotes = [
  `Your email address, Meta Horizon username, country and answers are stored so the study can be run. They are never sold, never used to advertise to you, and never added to a mailing list. The only email you will get from us is about your own application: a note when your submission arrives, and anything missing from it.`,
  `The PayPal account the payment goes to is asked for only when you submit your session, and only from testers who were offered a place. It is stored with your application and deleted with it.`,
  `Unsuccessful applications are deleted 30 days after the study closes. Recordings and contact details are deleted 90 days after final payment. Findings are kept only with names and addresses removed.`,
  `If you are under 18, we store that a parent or guardian agreed rather than who they are, and we may ask them to confirm by email before a place is offered. Nothing is collected from anyone under ${study.minAge}.`,
  `If you are offered a place, your key is emailed to you by this site. Nothing about you is sent to Meta by us; Meta learns of you only when you redeem the key, under Meta's own terms.`,
  `This page carries no analytics and sets no cookies.`,
  `You can ask to see, correct or delete your application at any time, before or after the study, through the privacy page. Quote the reference shown when you apply.`
];

// The questionnaire, from the strategy document. Seven questions, in this
// order, and all of them about the tester's own experience rather than the
// game's quality — a stuck player is the most useful result the study can
// produce, and the questions are shaped so that saying so is easy.
export const questionnaire = {
  before: [
    'Start a new game in an empty save slot. Do not look up the controls, watch a video or ask anyone — working out what the game teaches badly is the whole point, and getting stuck is a result, not a failure.',
    `Play for about ${study.playMinutes} minutes. Breaks do not count; if a crash, a blocker or motion discomfort stops you, stop, and tell us what happened. You are paid in full either way.`,
    'Capture something that shows you played: a clip of two or three minutes, or a handful of screenshots. It does not need to cover the whole session — it is there to show the session happened.',
    'Then quit to the hub and come back into the same save once, so we learn whether your progress returns.'
  ],
  // Stable ids: answers are stored against these, so reordering or rewording a
  // question never orphans what a tester already wrote.
  questions: [
    { id: 'first-goal', text: 'What did you think you were supposed to do first?' },
    { id: 'confusion', text: 'Where did you get confused, and what did you try next?' },
    { id: 'detect-dig', text: 'How did detecting and digging feel? Describe anything awkward or satisfying.' },
    { id: 'best-moment', text: 'What was your most satisfying discovery or moment?' },
    { id: 'wanted-to-stop', text: 'Was there a point where you wanted to stop? What caused it?' },
    { id: 'discomfort', text: 'Did you experience discomfort, difficulty reaching objects, unreadable text or technical problems?' },
    { id: 'play-again', text: 'Would you voluntarily play again? What would you want to do next?' }
  ],
  progressOptions: [
    { id: 'yes', label: 'Yes, everything was there' },
    { id: 'no', label: 'No, something was missing or reset' },
    { id: 'unsure', label: 'Not sure' }
  ],
  // How to get a clip or screenshots off a Quest, because most people never have.
  evidenceHelp: [
    'On the headset, press the Meta button, open Camera, and choose Record or Take photo. The controller shortcut is Meta button + trigger.',
    'Open the Meta Horizon app on your phone → Gallery. Your recording syncs over Wi-Fi in a few minutes.',
    'Share it from there to YouTube as Unlisted, or to Google Drive or Dropbox, and paste the link below. A link anyone with it can open is all we need.'
  ]
};

// Which applications may submit. The three between being told and being
// paid; and Submitted again, so a tester asked for a correction can update
// what they sent. Before Invited there is no key to have played with, and
// after Paid the study is over for that person.
export const submittableStatuses = ['invited', 'joined', 'testing', 'submitted'];

