// The paid playtest study: a public application page and its private dashboard.
//
// /playtest is the page the recruitment post links to. It states the fee, the
// time, the payment conditions and the privacy note in full before it asks for
// anything, then takes an application. /admin/playtest is where those
// applications are screened and walked through the study.
//
// The page carries no analytics and is noindex: it is a temporary campaign
// surface holding contact details, and neither belongs in search results or in
// public visitor reporting. Count arrivals with a /go/ campaign link instead —
// that measures the same thing first-party and stores no identity.

import express from 'express';

import { createRateLimiter } from './feedback.mjs';
import {
  ageGroups,
  captureMethods,
  conditions,
  headsets,
  privacyNotes,
  promises,
  questionnaire,
  recruitmentPost,
  statuses,
  study,
  vrFrequencies
} from './data/playtest.mjs';
import { ApplicationValidationError, canSubmit, LIMITS } from './playtest-store.mjs';
import { csrfToken, readSession, safeEqual, signature } from './admin-session.mjs';

export { createPlaytestStore, normaliseApplication, normaliseSubmission } from './playtest-store.mjs';

const MAX_FORM_BYTES = 16 * 1024;

// A form fetched more than twelve hours ago is stale rather than suspicious —
// somebody left the tab open — and gets a plain "please send it again". Under
// three seconds is not a person reading a page of payment conditions.
const FORM_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const FORM_MIN_AGE_MS = 3000;

// A matched reference and email earn a token that authorises one application's
// submission for a day — long enough to write seven answers and go back for
// the link, short enough that a leaked one is not a standing key.
const SUBMISSION_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;

const STATUS_LABELS = Object.fromEntries(statuses.map((status) => [status.id, status.label]));
const HEADSET_LABELS = Object.fromEntries(headsets.map((headset) => [headset.id, headset.label]));
const FREQUENCY_LABELS = Object.fromEntries(vrFrequencies.map((entry) => [entry.id, entry.label]));
const CAPTURE_LABELS = Object.fromEntries(captureMethods.map((entry) => [entry.id, entry.label]));
const AGE_SHORT = { adult: '18 or over', minor: '13–17, with a guardian' };
const EMAIL_KINDS = { invited: 'Invitation', declined: 'Not this round', paid: 'Payment sent', receipt: 'Submission receipt', 'receipt-update': 'Update receipt' };

/** Everything the form posted, kept so a rejected submission re-renders filled in. */
function formValues(body = {}) {
  return {
    email: String(body.email ?? '').slice(0, LIMITS.email),
    horizonUsername: String(body.horizonUsername ?? '').slice(0, LIMITS.horizonUsername + 1),
    headset: String(body.headset ?? ''),
    vrFrequency: String(body.vrFrequency ?? ''),
    captureMethod: String(body.captureMethod ?? ''),
    recentGames: String(body.recentGames ?? '').slice(0, LIMITS.recentGames),
    country: String(body.country ?? '').slice(0, LIMITS.country),
    playedBefore: Boolean(body.playedBefore),
    ageGroup: String(body.ageGroup ?? ''),
    notes: String(body.notes ?? '').slice(0, LIMITS.notes),
    paypalOk: Boolean(body.paypalOk),
    canFinish: Boolean(body.canFinish),
    acceptedTerms: Boolean(body.acceptedTerms)
  };
}

function csvValue(value) {
  const string = value === null || value === undefined ? '' : String(value);
  return `"${string.replaceAll('"', '""')}"`;
}

/**
 * The note sent to the developer when an application arrives. No applicant
 * data on purpose: the page promises Meta is the only third party details go
 * to, and this transits a mail provider. The dashboard has everything else.
 */
export function applicationNotice(application, { siteUrl }) {
  const headset = HEADSET_LABELS[application.headset] ?? application.headset;
  const frequency = FREQUENCY_LABELS[application.vrFrequency] ?? application.vrFrequency;
  const evidence = application.captureMethod === 'recording' ? 'can record gameplay' : 'screenshots and notes';
  const before = application.playedBefore ? 'has played before' : 'new to the game';
  const age = AGE_SHORT[application.ageGroup] ?? application.ageGroup;
  return {
    subject: `New playtest application ${application.reference} — ${headset}`,
    text: [
      `A new playtest application has arrived.`,
      ``,
      `Reference:  ${application.reference}`,
      `Headset:    ${headset}`,
      `Plays VR:   ${frequency}`,
      `Evidence:   ${evidence}`,
      `History:    ${before}`,
      `Age:        ${age}`,
      ``,
      `Open it:    ${siteUrl}/admin/playtest/${application.id}`,
      ``,
      `This note carries no contact details by design; they are on the dashboard.`
    ].join('\n')
  };
}

/** To the developer: a submission arrived. No answers, no PayPal, no address. */
export function submissionNotice(application, submission, { siteUrl, corrected }) {
  const headset = HEADSET_LABELS[submission.headsetPlayed] ?? submission.headsetPlayed;
  return {
    subject: `${corrected ? 'Updated' : 'New'} playtest submission ${application.reference} — ${headset}, ${submission.minutesPlayed} min`,
    text: [
      corrected ? `A tester has updated their submission.` : `A playtest submission has arrived. The 48-hour payment window starts now.`,
      ``,
      `Reference:  ${application.reference}`,
      `Headset:    ${headset}`,
      `Played:     about ${submission.minutesPlayed} minutes`,
      `Progress:   ${submission.progressReturned === 'yes' ? 'returned after relaunch' : submission.progressReturned === 'no' ? 'DID NOT return after relaunch' : 'unsure whether it returned'}`,
      `Evidence:   marketplace screenshot linked${submission.clipUrl ? ', plus a clip' : ''}`,
      ``,
      `Open it:    ${siteUrl}/admin/playtest/${application.id}`,
      ``,
      `Answers and the PayPal account are on the dashboard, not in this note.`
    ].join('\n')
  };
}

/** To the tester: we have it, and what happens next. */
export function submissionReceipt(application, { corrected, siteUrl }) {
  return {
    subject: `Buried Worlds VR playtest ${application.reference} — ${corrected ? 'update' : 'submission'} received`,
    text: [
      corrected
        ? `Thanks — your updated submission for ${application.reference} has replaced the earlier one.`
        : `Thanks — your submission for ${application.reference} has arrived.`,
      ``,
      `Payment of ${study.fee} is sent by ${study.payoutMethod} within ${study.paymentWindowHours} hours to the account you gave. It does not depend on whether you liked the game, found bugs, or finished anything.`,
      `If something is missing, you will hear from this address within three days with exactly what, and you can update your submission at ${siteUrl}/playtest/questionnaire using the same reference and email.`,
      ``,
      `This is the only kind of email the study sends. Nothing else will ever be sent to this address.`
    ].join('\n')
  };
}

/**
 * The emails a status change sends to the applicant. Plain text, one screen,
 * and each says what happens next and what the applicant need not do.
 * Rendered on the dashboard before the click, so nothing goes out unseen.
 */
export function statusEmails(application, { siteUrl, key = '' }) {
  const ref = application.reference;
  return {
    invited: {
      subject: `Buried Worlds VR playtest ${ref} — you're in`,
      text: [
        `You've been offered a place in the Buried Worlds VR playtest.`,
        ``,
        `Your key:   ${key || '(no key on file)'}`,
        ``,
        `Redeem it on the Meta account you own the headset with: open the Meta Horizon app on your phone, go to Store → Redeem Code (or Menu → Redeem Code, depending on version), and enter it. The game then installs on your headset like any purchase. The key is yours to keep.`,
        ``,
        `The brief and the questions are here:`,
        `${siteUrl}/playtest/questionnaire`,
        ``,
        `You have ${study.deadlineLabel} from this email. Play about ${study.playMinutes} minutes, get at least ${study.minLoot} of finds in the game's own money, and take a screenshot of the marketplace showing it. Then submit on that page with your reference (${ref}) and this email address. Payment of ${study.fee} follows by ${study.payoutMethod} within ${study.paymentWindowHours} hours — whether or not you liked it.`,
        ``,
        `Stuck, or not sure what to do? Message the developer on Discord and he'll walk you through it. Asking does not affect payment. If ${study.deadlineLabel} stops being realistic, say so before it runs out and you'll get more.`
      ].join('\n')
    },
    declined: {
      subject: `Buried Worlds VR playtest ${ref} — not this round`,
      text: [
        `Thanks for applying to the Buried Worlds VR playtest. There isn't a place for you this round.`,
        ``,
        `That's almost always about which headsets were already covered, not about you. If another round opens it will be announced on the Discord first, and you're welcome to apply again.`,
        ``,
        `Your application will be deleted 30 days after this round closes, as the page said. Nothing else will be sent to this address.`
      ].join('\n')
    },
    paid: {
      subject: `Buried Worlds VR playtest ${ref} — payment sent`,
      text: [
        `${study.fee} has been sent by ${study.payoutMethod} to the account you gave with your submission. It can take a little while to show.`,
        ``,
        `Thank you — what you wrote is going straight into the next build. Your answers and details are deleted 90 days from now; the game key is yours to keep.`,
        ``,
        `Nothing else will be sent to this address.`
      ].join('\n')
    }
  };
}

export function createPlaytestRouter({
  store,
  siteUrl = '',
  applicationsOpen = true,
  formSecret = '',
  adminPassword = '',
  sessionSecret = '',
  // { to, sendQuietly } — a mailer from mailer.mjs plus the recipient. Absent,
  // applications are stored and nobody is told; the dashboard still shows them.
  notify = null,
  // Whether SES reports delivery events back (a configuration set is in use).
  // Only changes what the emails page says about empty columns.
  trackingConfigured = false,
  now = () => Date.now(),
  onError = (error) => console.error('[playtest]', error)
}) {
  if (!store) throw new Error('createPlaytestRouter requires a store');
  const router = express.Router();
  const adminEnabled = Boolean(adminPassword && sessionSecret.length >= 32);

  // One address should not be able to bury the study in noise. Generous enough
  // that a household behind one connection can both apply.
  const perAddress = createRateLimiter({ max: 8, windowMs: 60 * 60 * 1000, now });

  // A timestamp signed when the page is served. Without a configured secret the
  // check is skipped entirely rather than done badly: the honeypot and the rate
  // limiter still apply, and a form that silently rejects real applicants is far
  // worse than one that accepts a little spam.
  const formTokensEnabled = formSecret.length >= 32;

  function issueFormToken() {
    if (!formTokensEnabled) return '';
    const issuedAt = String(now());
    return `${issuedAt}.${signature(formSecret, `playtest:${issuedAt}`)}`;
  }

  function formTokenProblem(token) {
    if (!formTokensEnabled) return '';
    const [issuedRaw, received] = String(token ?? '').split('.');
    const issuedAt = Number(issuedRaw);
    if (!Number.isSafeInteger(issuedAt) || !received) return 'stale';
    if (!safeEqual(received, signature(formSecret, `playtest:${issuedRaw}`))) return 'stale';
    const age = now() - issuedAt;
    if (age > FORM_MAX_AGE_MS || age < 0) return 'stale';
    if (age < FORM_MIN_AGE_MS) return 'fast';
    return '';
  }

  // Every email to an applicant goes through here, so its SES message id is
  // recorded and the delivery events SNS pushes later can be matched to it.
  // Fire and forget, as everywhere: a refused send is logged, never surfaced
  // to the person whose action triggered it.
  function sendToApplicant(application, kind, message) {
    if (!notify) return;
    Promise.resolve(notify.sendQuietly({ to: application.email, ...message }))
      .then((result) => {
        const messageId = result && result.MessageId;
        if (messageId) return store.recordEmail({ applicationId: application.id, kind, recipient: application.email, messageId });
        return null;
      })
      .catch(onError);
  }

  function issueSubmissionToken(applicationId) {
    const expiresAt = String(now() + SUBMISSION_TOKEN_AGE_MS);
    return `${applicationId}.${expiresAt}.${signature(formSecret, `submission:${applicationId}:${expiresAt}`)}`;
  }

  /** The application id the token authorises, or null. */
  function readSubmissionToken(token) {
    if (!formTokensEnabled) return null;
    const [idRaw, expiresRaw, received] = String(token ?? '').split('.');
    const id = Number(idRaw);
    const expiresAt = Number(expiresRaw);
    if (!Number.isSafeInteger(id) || !Number.isSafeInteger(expiresAt) || !received) return null;
    if (expiresAt <= now()) return null;
    if (!safeEqual(received, signature(formSecret, `submission:${idRaw}:${expiresRaw}`))) return null;
    return id;
  }

  function submissionValues(body = {}) {
    const values = {
      headsetPlayed: String(body.headsetPlayed ?? ''),
      minutesPlayed: String(body.minutesPlayed ?? '').slice(0, 4),
      progressReturned: String(body.progressReturned ?? ''),
      evidenceUrl: String(body.evidenceUrl ?? '').slice(0, LIMITS.evidenceUrl),
      clipUrl: String(body.clipUrl ?? '').slice(0, LIMITS.evidenceUrl),
      evidenceNote: String(body.evidenceNote ?? '').slice(0, LIMITS.evidenceNote),
      paypalAccount: String(body.paypalAccount ?? '').slice(0, LIMITS.paypalAccount),
      ownAnswers: Boolean(body.ownAnswers),
      answers: {}
    };
    for (const question of questionnaire.questions) {
      values.answers[question.id] = String(body[`answer_${question.id}`] ?? '').slice(0, LIMITS.answer);
    }
    return values;
  }

  /** A stored submission, reshaped as form values so a correction starts filled in. */
  function valuesFromSubmission(submission) {
    if (!submission) return null;
    return {
      headsetPlayed: submission.headsetPlayed,
      minutesPlayed: String(submission.minutesPlayed),
      progressReturned: submission.progressReturned,
      evidenceUrl: submission.evidenceUrl,
      clipUrl: submission.clipUrl,
      evidenceNote: submission.evidenceNote,
      paypalAccount: submission.paypalAccount,
      ownAnswers: false,
      answers: { ...submission.answers }
    };
  }

  function renderQuestionnaire(req, res, {
    status = 200, lookup = { reference: '', email: '' }, lookupError = '',
    application = null, submissionToken = '', values = null, existing = null, error = '', errorField = ''
  } = {}) {
    return res.status(status).render('playtest-questionnaire', {
      pageTitle: 'Playtest questionnaire — Buried Worlds VR',
      pageDescription: `The ${questionnaire.questions.length} questions a Buried Worlds VR playtester answers after their session, submitted on this page.`,
      pagePath: '/playtest/questionnaire',
      noIndex: true,
      disableAnalytics: true,
      study,
      questionnaire,
      headsets,
      formToken: issueFormToken(),
      lookup,
      lookupError,
      application,
      submissionToken,
      values: values ?? submissionValues(),
      existing,
      error,
      errorField
    });
  }

  function renderForm(req, res, { status = 200, values = formValues(), error = '', errorField = '' } = {}) {
    return res.status(status).render('playtest', {
      pageTitle: `Paid playtest — ${study.fee} for ${study.totalMinutes} minutes — Buried Worlds VR`,
      pageDescription:
        `Buried Worlds VR is paying ${study.fee} to ${study.places} Meta Quest players for a ` +
        `${study.totalMinutes}-minute playtest of the game's opening.`,
      pagePath: '/playtest',
      noIndex: true,
      disableAnalytics: true,
      study,
      promises,
      conditions,
      privacyNotes,
      headsets,
      vrFrequencies,
      captureMethods,
      ageGroups,
      applicationsOpen,
      formToken: issueFormToken(),
      values,
      error,
      errorField
    });
  }

  router.use('/playtest', (req, res, next) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    next();
  });

  router.get('/playtest', (req, res) => renderForm(req, res));

  // The brief a selected tester follows, and the form they submit on. Public,
  // so it can be read before applying — the fewer surprises after a place is
  // offered, the better — but noindex like the rest of the study. The form
  // itself appears only once a reference and its email have been matched.
  router.get('/playtest/questionnaire', (req, res) => renderQuestionnaire(req, res));

  // Twenty tries an hour is plenty for a tester who has mistyped, and far too
  // few to guess a reference or an email.
  const perLookup = createRateLimiter({ max: 20, windowMs: 60 * 60 * 1000, now });
  const perSubmission = createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000, now });

  router.post(
    '/playtest/questionnaire/find',
    express.urlencoded({ extended: false, limit: MAX_FORM_BYTES }),
    async (req, res) => {
      res.set('Cache-Control', 'no-store');
      const lookup = {
        reference: String(req.body.reference ?? '').trim().toUpperCase().slice(0, 12),
        email: String(req.body.email ?? '').trim().slice(0, LIMITS.email)
      };
      if (!formTokensEnabled) {
        return renderQuestionnaire(req, res, { status: 503, lookup, lookupError: 'Submissions are not open right now. Please try again later.' });
      }
      if (!perLookup.take(req.ip ?? 'unknown')) {
        return renderQuestionnaire(req, res, { status: 429, lookup, lookupError: 'Too many attempts from this connection. Please try again in an hour.' });
      }
      const application = await store.findForSubmission(lookup.reference, lookup.email);
      // One message for every failure. Whether the reference exists is not
      // something a stranger should learn by trying.
      if (!application) {
        return renderQuestionnaire(req, res, { status: 404, lookup, lookupError: 'We couldn\u2019t match that reference and email address. Check both against the confirmation you were shown when you applied.' });
      }
      if (!canSubmit(application)) {
        const message = application.status === 'paid'
          ? 'This application has been paid and is closed. Thank you for taking part.'
          : 'This application hasn\u2019t been offered a place yet, so there is nothing to submit. You will be emailed if it is.';
        return renderQuestionnaire(req, res, { status: 403, lookup, lookupError: message });
      }
      const existing = await store.getSubmission(application.id);
      return renderQuestionnaire(req, res, {
        application,
        submissionToken: issueSubmissionToken(application.id),
        values: valuesFromSubmission(existing) ?? { ...submissionValues(), headsetPlayed: application.headset },
        existing
      });
    }
  );

  router.post(
    '/playtest/questionnaire',
    express.urlencoded({ extended: false, limit: MAX_FORM_BYTES }),
    async (req, res) => {
      res.set('Cache-Control', 'no-store');
      const applicationId = readSubmissionToken(req.body.submissionToken);
      if (applicationId === null) {
        return renderQuestionnaire(req, res, {
          status: 403,
          lookupError: 'Your session on this page had expired before it was sent. Find your application again below — nothing you typed has been lost if you use the browser\u2019s back button first.'
        });
      }
      if (!perSubmission.take(req.ip ?? 'unknown')) {
        return renderQuestionnaire(req, res, { status: 429, lookupError: 'Too many submissions from this connection. Please try again later.' });
      }
      const application = await store.getById(applicationId);
      if (!canSubmit(application)) {
        return renderQuestionnaire(req, res, { status: 403, lookupError: 'This application is no longer open for a submission.' });
      }
      const values = submissionValues(req.body);
      const existing = await store.getSubmission(application.id);
      let result;
      try {
        result = await store.saveSubmission(application.id, req.body);
      } catch (error) {
        if (error instanceof ApplicationValidationError) {
          return renderQuestionnaire(req, res, {
            status: 400, application, submissionToken: issueSubmissionToken(application.id),
            values, existing, error: error.message, errorField: error.field
          });
        }
        onError(error);
        return renderQuestionnaire(req, res, {
          status: 503, application, submissionToken: issueSubmissionToken(application.id),
          values, existing, error: 'Your submission could not be saved just now. Nothing was lost — please send it again in a minute.'
        });
      }

      if (notify) {
        const corrected = result.corrected;
        if (notify.to) {
          const notice = submissionNotice(result.application, result.submission, { siteUrl, corrected });
          Promise.resolve(notify.sendQuietly({ to: notify.to, ...notice })).catch(onError);
        }
        sendToApplicant(result.application, corrected ? 'receipt-update' : 'receipt', submissionReceipt(result.application, { corrected, siteUrl }));
      }

      return res.status(result.corrected ? 200 : 201).render('playtest-submitted', {
        pageTitle: 'Submission received — Buried Worlds VR',
        pagePath: '/playtest/questionnaire',
        noIndex: true,
        disableAnalytics: true,
        study,
        reference: result.application.reference,
        corrected: result.corrected
      });
    }
  );

  router.post(
    '/playtest',
    express.urlencoded({ extended: false, limit: MAX_FORM_BYTES }),
    async (req, res) => {
      res.set('Cache-Control', 'no-store');
      if (!applicationsOpen) {
        return renderForm(req, res, {
          status: 403,
          error: 'Applications for this round have closed.'
        });
      }

      // A hidden field no human sees and every naive bot fills in. Answered with
      // the ordinary thank-you page: telling a scraper it was spotted only
      // teaches whoever wrote it to stop filling the field in.
      if (String(req.body.website ?? '').trim() !== '') {
        return res.status(202).render('playtest-applied', {
          pageTitle: 'Application received — Buried Worlds VR',
          pagePath: '/playtest',
          noIndex: true,
          disableAnalytics: true,
          study,
          reference: '',
          duplicate: false
        });
      }

      const values = formValues(req.body);

      const tokenProblem = formTokenProblem(req.body.formToken);
      if (tokenProblem === 'stale') {
        return renderForm(req, res, {
          status: 400,
          values,
          error: 'This form had been open too long to send safely. Your answers are still here — please send it again.'
        });
      }
      if (tokenProblem === 'fast') {
        return renderForm(req, res, {
          status: 400,
          values,
          error: 'That arrived faster than the page can be read. Please send it again.'
        });
      }

      if (!perAddress.take(req.ip ?? 'unknown')) {
        return renderForm(req, res, {
          status: 429,
          values,
          error: 'Too many applications from this connection. Please try again later.'
        });
      }

      let result;
      try {
        result = await store.createApplication(req.body);
      } catch (error) {
        if (error instanceof ApplicationValidationError) {
          return renderForm(req, res, {
            status: 400,
            values,
            error: error.message,
            errorField: error.field
          });
        }
        onError(error);
        return renderForm(req, res, {
          status: 503,
          values,
          error:
            'Your application could not be saved just now. Nothing was lost — please send it again in a minute.'
        });
      }

      // Told once, on the first application from an address. A refresh or a
      // second submission returns the original and says nothing again. Fire
      // and forget: a mail server that is down must not turn into an applicant
      // being told their application failed.
      if (notify && notify.to && !result.duplicate) {
        const notice = applicationNotice(result.application, { siteUrl });
        Promise.resolve(notify.sendQuietly({ to: notify.to, ...notice })).catch(onError);
      }

      // Rendered rather than redirected so the reference never appears in a URL,
      // a browser history entry or a referrer header. A refresh re-posts, which
      // the duplicate path answers with the same reference.
      return res.status(result.duplicate ? 200 : 201).render('playtest-applied', {
        pageTitle: 'Application received — Buried Worlds VR',
        pagePath: '/playtest',
        noIndex: true,
        disableAnalytics: true,
        study,
        reference: result.application.reference,
        duplicate: result.duplicate
      });
    }
  );

  // ---- Private dashboard -------------------------------------------------

  router.use('/admin/playtest', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    if (!adminEnabled) return res.status(404).send('Not found');
    const expiresAt = readSession(req, sessionSecret, now);
    if (!expiresAt) return res.redirect(303, '/admin/login');
    req.adminExpiresAt = expiresAt;
    res.locals.csrf = csrfToken(sessionSecret, expiresAt);
    next();
  });
  router.use('/admin/playtest', express.urlencoded({ extended: false, limit: MAX_FORM_BYTES }));

  function requireCsrf(req, res, next) {
    const expected = csrfToken(sessionSecret, req.adminExpiresAt);
    if (!safeEqual(req.body._csrf ?? '', expected)) return res.status(403).send('Invalid form token');
    next();
  }

  function decorate(application) {
    return {
      ...application,
      headsetLabel: HEADSET_LABELS[application.headset] ?? application.headset,
      frequencyLabel: FREQUENCY_LABELS[application.vrFrequency] ?? application.vrFrequency,
      captureLabel: CAPTURE_LABELS[application.captureMethod] ?? application.captureMethod,
      ageLabel: AGE_SHORT[application.ageGroup] ?? application.ageGroup,
      statusLabel: STATUS_LABELS[application.status] ?? application.status
    };
  }

  // Declared before /:id so the filename is never read as an application id.
  router.get('/admin/playtest/export.csv', async (req, res) => {
    const columns = [
      'reference', 'created_at', 'status', 'email', 'horizon_username', 'headset',
      'vr_frequency', 'capture_method', 'recent_games', 'country', 'played_before', 'age_group',
      'notes', 'admin_note', 'terms_version', 'invited_at', 'joined_at', 'paid_at'
    ];
    const applications = await store.listApplications();
    const rows = applications.map((application) => [
      application.reference, application.createdAt, application.status, application.email,
      application.horizonUsername, application.headset, application.vrFrequency,
      application.captureMethod, application.recentGames, application.country,
      application.playedBefore, application.ageGroup, application.notes, application.adminNote,
      application.termsVersion, application.invitedAt, application.joinedAt, application.paidAt
    ]);
    const csv = [
      columns.join(','),
      ...rows.map((row) => row.map(csvValue).join(','))
    ].join('\n');
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="playtest-applications.csv"');
    return res.send(`${csv}\n`);
  });

  router.get('/admin/playtest', async (req, res) => {
    const [applications, summary] = await Promise.all([
      store.listApplications(),
      store.summarise()
    ]);
    const [keys, troubled] = await Promise.all([store.keySummary(), store.troubledApplicationIds()]);
    let notice = req.query.saved === '1' ? 'Application updated.' : '';
    if (req.query.keys !== undefined) {
      notice = `${Number(req.query.keys) || 0} key${Number(req.query.keys) === 1 ? '' : 's'} added`
        + (Number(req.query.skipped) ? `, ${Number(req.query.skipped)} already on file or not a key.` : '.');
    }
    return res.render('admin-playtest', {
      pageTitle: 'Playtest applications — Buried Worlds VR',
      pagePath: '/admin/playtest',
      noIndex: true,
      disableAnalytics: true,
      applications: applications.map((application) => ({ ...decorate(application), emailTrouble: troubled.has(application.id) })),
      summary,
      keys,
      statuses,
      headsets,
      study,
      applicationsOpen,
      mailConfigured: Boolean(notify),
      post: recruitmentPost({ siteUrl }),
      notice
    });
  });

  router.get('/admin/playtest/emails', async (req, res) => {
    const emails = await store.listEmails();
    return res.render('admin-playtest-emails', {
      pageTitle: 'Playtest emails — Buried Worlds VR',
      pagePath: '/admin/playtest/emails',
      noIndex: true,
      disableAnalytics: true,
      emails,
      emailKinds: EMAIL_KINDS,
      trackingConfigured: Boolean(trackingConfigured)
    });
  });

  router.get('/admin/playtest/submissions.csv', async (req, res) => {
    const columns = ['reference', 'email', 'status', 'submitted_at', 'updated_at', 'submission_count', 'headset_played',
      'minutes_played', 'progress_returned', 'evidence_url', 'clip_url', 'evidence_note', 'paypal_account',
      ...questionnaire.questions.map((question) => `answer_${question.id}`)];
    const rows = (await store.listSubmissions()).map((entry) => [
      entry.reference, entry.email, entry.status, entry.submittedAt, entry.updatedAt, entry.submissionCount,
      entry.headsetPlayed, entry.minutesPlayed, entry.progressReturned, entry.evidenceUrl, entry.clipUrl, entry.evidenceNote,
      entry.paypalAccount, ...questionnaire.questions.map((question) => entry.answers[question.id] ?? '')
    ]);
    const csv = [columns.join(','), ...rows.map((row) => row.map(csvValue).join(','))].join('\n');
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="playtest-submissions.csv"');
    return res.send(`${csv}\n`);
  });

  router.get('/admin/playtest/:id', async (req, res) => {
    const application = await store.getById(Number(req.params.id));
    if (!application) return res.status(404).send('Not found');
    const [submission, held, keys, emails] = await Promise.all([
      store.getSubmission(application.id), store.keyFor(application.id), store.keySummary(), store.emailsFor(application.id)
    ]);
    const sentLabels = {
      invited: 'Application updated. The invitation, with their key, has been emailed to them.',
      declined: 'Application updated. They have been emailed that there is no place this round.',
      paid: 'Application updated. They have been emailed that payment was sent.',
      unconfigured: 'Application updated — but no email was sent: mail is not configured on this deployment. Tell them yourself.'
    };
    let notice = req.query.saved === '1' ? (sentLabels[req.query.sent] ?? 'Application updated.') : '';
    let problem = '';
    if (req.query.problem === 'no-keys') problem = 'Not invited: there are no unused keys. Paste more on the applications page, then try again.';
    return res.render('admin-playtest-detail', {
      pageTitle: `${application.reference} — Buried Worlds VR`,
      pagePath: req.path,
      noIndex: true,
      disableAnalytics: true,
      application: decorate(application),
      submission: submission && { ...submission, headsetLabel: HEADSET_LABELS[submission.headsetPlayed] ?? submission.headsetPlayed },
      held,
      keys,
      emails,
      emailKinds: EMAIL_KINDS,
      previews: statusEmails(application, { siteUrl, key: held ? held.key : '(the next unused key)' }),
      mailConfigured: Boolean(notify),
      questionnaire,
      statuses,
      study,
      notice,
      problem
    });
  });

  // Three transitions write to the applicant; the rest only record. Invited
  // needs a key and refuses without one — a "you're in" email with no key in
  // it would be worse than no email. The email goes out after the status is
  // saved, fire and forget, and the redirect says which one was sent so the
  // dashboard can confirm it.
  router.post('/admin/playtest/:id/status', requireCsrf, async (req, res) => {
    const application = await store.getById(Number(req.params.id));
    if (!application) return res.status(404).send('Not found');
    const nextStatus = String(req.body.status ?? '');
    const changed = nextStatus !== application.status;
    let key = '';
    if (nextStatus === 'invited' && changed) {
      const assigned = await store.assignKey(application.id);
      if (!assigned) return res.redirect(303, `/admin/playtest/${application.id}?problem=no-keys`);
      key = assigned.key;
    }
    let updated;
    try {
      updated = await store.setStatus(application.id, nextStatus, req.body.adminNote ?? '');
    } catch (error) {
      if (!(error instanceof ApplicationValidationError)) throw error;
      return res.status(400).send(error.message);
    }
    let sent = '';
    if (changed && ['invited', 'declined', 'paid'].includes(nextStatus)) {
      if (notify) {
        sendToApplicant(updated, nextStatus, statusEmails(updated, { siteUrl, key })[nextStatus]);
        sent = nextStatus;
      } else {
        sent = 'unconfigured';
      }
    }
    return res.redirect(303, `/admin/playtest/${application.id}?saved=1${sent ? `&sent=${sent}` : ''}`);
  });

  router.post('/admin/playtest/keys', requireCsrf, async (req, res) => {
    const result = await store.addKeys(req.body.keys ?? '');
    return res.redirect(303, `/admin/playtest?keys=${result.added}&skipped=${result.skipped}`);
  });

  // Erasure on request. The study promises deletion on demand and after the
  // retention window, and a promise that needs a database console to keep is one
  // that quietly does not get kept.
  router.post('/admin/playtest/:id/delete', requireCsrf, async (req, res) => {
    await store.deleteApplication(Number(req.params.id));
    return res.redirect(303, '/admin/playtest?saved=1');
  });

  return router;
}
