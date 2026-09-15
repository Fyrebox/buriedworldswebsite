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
  statuses,
  study,
  vrFrequencies
} from './data/playtest.mjs';
import { ApplicationValidationError, LIMITS } from './playtest-store.mjs';
import { csrfToken, readSession, safeEqual, signature } from './admin-session.mjs';

export { createPlaytestStore, normaliseApplication } from './playtest-store.mjs';

const MAX_FORM_BYTES = 16 * 1024;

// A form fetched more than twelve hours ago is stale rather than suspicious —
// somebody left the tab open — and gets a plain "please send it again". Under
// three seconds is not a person reading a page of payment conditions.
const FORM_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const FORM_MIN_AGE_MS = 3000;

const STATUS_LABELS = Object.fromEntries(statuses.map((status) => [status.id, status.label]));
const HEADSET_LABELS = Object.fromEntries(headsets.map((headset) => [headset.id, headset.label]));
const FREQUENCY_LABELS = Object.fromEntries(vrFrequencies.map((entry) => [entry.id, entry.label]));
const CAPTURE_LABELS = Object.fromEntries(captureMethods.map((entry) => [entry.id, entry.label]));
const AGE_SHORT = { adult: '18 or over', minor: '13–17, with a guardian' };

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
            'Your application could not be saved just now. Nothing was lost — please send it again in a minute, ' +
            `or email ${study.contactEmail}.`
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
    return res.render('admin-playtest', {
      pageTitle: 'Playtest applications — Buried Worlds VR',
      pagePath: '/admin/playtest',
      noIndex: true,
      disableAnalytics: true,
      applications: applications.map(decorate),
      summary,
      statuses,
      headsets,
      study,
      applicationsOpen,
      notice: req.query.saved === '1' ? 'Application updated.' : ''
    });
  });

  router.get('/admin/playtest/:id', async (req, res) => {
    const application = await store.getById(Number(req.params.id));
    if (!application) return res.status(404).send('Not found');
    return res.render('admin-playtest-detail', {
      pageTitle: `${application.reference} — Buried Worlds VR`,
      pagePath: req.path,
      noIndex: true,
      disableAnalytics: true,
      application: decorate(application),
      statuses,
      study,
      notice: req.query.saved === '1' ? 'Application updated.' : ''
    });
  });

  router.post('/admin/playtest/:id/status', requireCsrf, async (req, res) => {
    const application = await store.getById(Number(req.params.id));
    if (!application) return res.status(404).send('Not found');
    try {
      await store.setStatus(application.id, String(req.body.status ?? ''), req.body.adminNote ?? '');
    } catch (error) {
      if (!(error instanceof ApplicationValidationError)) throw error;
      return res.status(400).send(error.message);
    }
    return res.redirect(303, `/admin/playtest/${application.id}?saved=1`);
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
