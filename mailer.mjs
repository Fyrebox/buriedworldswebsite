// Outbound email, for the one thing the site sends: a note to the developer
// when a playtest application arrives.
//
// Two ways to send, chosen by which variables are set:
//
//   SES_REGION + MAIL_FROM      Amazon SES, authenticated the way every AWS
//                               SDK is — AWS_ACCESS_KEY_ID and
//                               AWS_SECRET_ACCESS_KEY in the environment. An
//                               IAM key can be scoped to ses:SendEmail on one
//                               identity and revoked without touching anything
//                               else, which is the reason to prefer it.
//   SMTP_URL (+ SMTP_FROM)      Any SMTP server. Google Workspace with an App
//                               Password, in practice.
//
// Neither set, and nothing is sent: the site works exactly as it did, and a
// missing variable on a fresh deploy is a quiet dashboard rather than a
// crashed one.
//
// The message deliberately carries no applicant data. The application page
// promises that Meta is the only third party an applicant's details go to,
// and an email transits a mail provider. So the note says that someone
// applied, which headset, and where to look — and the dashboard, one click
// away, has the rest.

import nodemailer from 'nodemailer';

function fromUrlUser(smtpUrl) {
  try {
    return decodeURIComponent(new URL(smtpUrl).username);
  } catch {
    return '';
  }
}

function withQuiet(mailer, onError) {
  return {
    ...mailer,
    /** For a fire-and-forget caller: never throws, reports through onError. */
    sendQuietly(message) {
      return mailer.send(message).catch(onError);
    }
  };
}

/**
 * @param {object} options
 * @param {string} [options.sesRegion]   e.g. ap-southeast-2. Selects SES.
 * @param {string} [options.mailFrom]    The From address; must be a verified SES identity.
 * @param {object} [options.sesClient]   Injection point for tests: anything with send(command).
 * @param {string} [options.smtpUrl]     smtps://user:pass@host:port. Selects SMTP.
 * @param {string} [options.smtpFrom]    Defaults to the SMTP URL's user.
 */
export function createMailer({
  sesRegion = '',
  mailFrom = '',
  sesClient = null,
  smtpUrl = '',
  smtpFrom = '',
  onError = (error) => console.error('[mail]', error)
} = {}) {
  if (sesRegion || sesClient) {
    if (!mailFrom) throw new Error('MAIL_FROM is required with SES_REGION');
    return withQuiet(createSesMailer({ region: sesRegion, from: mailFrom, client: sesClient }), onError);
  }
  if (smtpUrl) {
    const from = smtpFrom || fromUrlUser(smtpUrl);
    if (!from) throw new Error('SMTP_FROM is required when SMTP_URL does not carry a username');
    return withQuiet(createSmtpMailer({ url: smtpUrl, from }), onError);
  }
  return null;
}

function createSesMailer({ region, from, client }) {
  // Loaded lazily so a deployment on SMTP never pays for the AWS SDK, and the
  // tests can hand in a stub client without touching the network.
  let clientPromise = client
    ? Promise.resolve({ client, SendEmailCommand: (input) => ({ input }) })
    : import('@aws-sdk/client-sesv2').then((sdk) => ({
      client: new sdk.SESv2Client({ region }),
      SendEmailCommand: (input) => new sdk.SendEmailCommand(input)
    }));
  return {
    transport: 'ses',
    from,
    async send({ to, subject, text }) {
      const { client: ses, SendEmailCommand } = await clientPromise;
      return ses.send(SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: { Text: { Data: text, Charset: 'UTF-8' } }
          }
        }
      }));
    },
    close() {
      clientPromise.then(({ client: ses }) => ses.destroy?.()).catch(() => {});
    }
  };
}

function createSmtpMailer({ url, from }) {
  const transport = nodemailer.createTransport(url);
  return {
    transport: 'smtp',
    from,
    async send({ to, subject, text }) {
      return transport.sendMail({ from, to, subject, text });
    },
    close() {
      transport.close();
    }
  };
}
