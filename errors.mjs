// Final Express handlers for unknown routes and unexpected failures.
// API callers keep receiving JSON; human-facing pages get the branded recovery UI.

function isApiRequest(req) {
  return req.path === '/api' || req.path.startsWith('/api/');
}

function commonLocals(req, statusCode) {
  return {
    statusCode,
    pagePath: req.path,
    noIndex: true,
    requestedPath: req.path.slice(0, 160),
    retryUrl: req.method === 'GET' ? req.originalUrl : '/'
  };
}

export function notFoundHandler(req, res) {
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  if (isApiRequest(req)) {
    return res.status(404).json({ ok: false, error: 'not found' });
  }

  return res.status(404).render('error', {
    ...commonLocals(req, 404),
    pageTitle: 'Page not found — Buried Worlds VR',
    pageDescription: 'That trail does not lead to a page on the Buried Worlds VR website.'
  });
}

export function createErrorHandler({
  onError = (error) => console.error('[server]', error)
} = {}) {
  return function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);
    onError(error);
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');

    if (isApiRequest(req)) {
      return res.status(500).json({ ok: false, error: 'server error' });
    }

    return res.status(500).render('error', {
      ...commonLocals(req, 500),
      pageTitle: 'Something went wrong — Buried Worlds VR',
      pageDescription: 'The Buried Worlds VR website hit an unexpected problem.',
      disableAnalytics: true
    });
  };
}
