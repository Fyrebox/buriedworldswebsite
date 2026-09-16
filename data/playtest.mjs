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
  termsVersion: '2026-09-16',
  fee: 'US$10',
  feeAmount: '10',
  feeCurrency: 'USD',
  playMinutes: 20,
  questionnaireMinutes: 5,
  // Deliberately the sum of the two above, not a round number chosen separately.
  totalMinutes: 25,
  deadlineHours: 168,
  // How the deadline reads in copy — "168 hours" reads like fine print.
  deadlineLabel: 'a week',
  paymentWindowHours: 48,
  places: 5,
  payoutMethod: 'PayPal',
  // The bar for payment: this much in the game's own money, shown on a
  // marketplace screenshot. In-game dollars, not real ones — the copy says so
  // every time, because the fee happens to be the same number.
  minLoot: '$10',
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
  { id: 'testing', label: 'Testing', hint: 'Playing, inside their week.' },
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
    body: `A short questionnaire on this site, plus a screenshot of the marketplace showing at least ${study.minLoot} of finds in the game's own money. A clip is welcome but optional. No webcam, no room footage.`
  },
  {
    label: 'Stuck?',
    body: 'Message the developer on Discord and he will walk you through it. Asking costs you nothing and does not affect payment.'
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
    situation: `You play about ${study.playMinutes} minutes, your marketplace shows at least ${study.minLoot} of finds (the game's money), and you answer every question from your own session`,
    outcome: `Paid ${study.fee} — whether or not you liked the game.`
  },
  {
    situation: `Your marketplace shows less than ${study.minLoot}`,
    outcome: 'Not paid yet. Ask on Discord — the developer will walk you through it — then keep playing and submit once you are over.'
  },
  {
    situation: 'You are not sure what to do, or something seems broken',
    outcome: 'Ask on Discord before your week runs out. A walk-through does not affect payment.'
  },
  {
    situation: 'Something is missing from your submission',
    outcome: 'You will be emailed exactly what, within three days, and can update your submission for a week.'
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
    `Play for about ${study.playMinutes} minutes. Breaks do not count.`,
    `Before you finish, open the marketplace and take a screenshot showing the value of what you have found — at least ${study.minLoot} in the game's own money. That screenshot is the proof of play. A short clip is welcome but optional.`,
    'If you are stuck at any point, message the developer on Discord. He will walk you through it, and it does not affect your payment.',
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
  // How to get a screenshot off a Quest, because most people never have.
  evidenceHelp: [
    'With the marketplace open, press the Meta button, open Camera, and choose Take photo. The controller shortcut is Meta button + trigger.',
    'Open the Meta Horizon app on your phone → Gallery. The screenshot syncs over Wi-Fi in a minute or two.',
    'Share it from there to Google Drive, Dropbox, or any image host, and paste the link on this page. A link anyone with it can open is all we need. A clip goes the same way — YouTube as Unlisted works well — if you want to add one.'
  ]
};

// Which applications may submit. The three between being told and being
// paid; and Submitted again, so a tester asked for a correction can update
// what they sent. Before Invited there is no key to have played with, and
// after Paid the study is over for that person.
export const submittableStatuses = ['invited', 'joined', 'testing', 'submitted'];


// The recruitment post, generated from the terms above so it cannot say one
// thing while the page says another. Shown on the dashboard to copy from.
// r/playtesters wants a text post under its Paid Playtest flair with the cash
// amount stated; recheck the subreddit's rules the day you post.
export function recruitmentPost({ siteUrl, applyUrl = `${siteUrl}/playtest` }) {
  return {
    title: `[Paid] ${study.fee} for a ${study.totalMinutes}-minute Buried Worlds VR playtest — Meta Quest owners, ${study.minAge}+`,
    body: [
      `I'm the developer of Buried Worlds VR, a Quest treasure-hunting game — metal detecting, digging, panning for gold across five real places where real treasure was found.`,
      ``,
      `I'm looking for ${study.places} Quest players to test the opening and tell me where it loses them.`,
      ``,
      `- **Pay:** ${study.fee} via ${study.payoutMethod}, sent within ${study.paymentWindowHours} hours of your submission.`,
      `- **Time:** about ${study.playMinutes} minutes playing plus a ${study.questionnaireMinutes}-minute questionnaire, any time within ${study.deadlineLabel}.`,
      `- **Hardware:** Quest 2, 3, 3S or Pro.`,
      `- **Access:** a free key, emailed to you after selection. Yours to keep.`,
      `- **What earns the fee:** play about ${study.playMinutes} minutes, get at least ${study.minLoot} of finds in the game's own money, screenshot the marketplace, and answer seven short questions on the site. Stuck? Message me on Discord and I'll walk you through it — that doesn't affect payment.`,
      `- **Eligibility:** ${study.minAge}+ (under 18 with a parent or guardian's agreement, and the payment goes to their ${study.payoutMethod}), new to Buried Worlds VR, and a ${study.payoutMethod} account the money can reach.`,
      ``,
      `Honest criticism is what I'm paying for. Payment doesn't depend on liking the game, and you're not asked to leave a store review.`,
      ``,
      `Apply here: ${applyUrl}`,
      ``,
      `Applying doesn't guarantee a place — I pick for a spread of headsets and VR experience, and you'll hear either way. Please keep email addresses out of the comments.`
    ].join('\n')
  };
}
