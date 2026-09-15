// Outbound email, for the one thing the site sends: a note to the developer
// when a playtest application arrives.
//
// Sent through whatever SMTP_URL names — in practice Google Workspace, with an
// App Password, since bellare.com.au already lives there and that adds no new
// vendor and no DNS. Unset, and nothing is sent: the site works exactly as it
// did, and a missing variable on a fresh deploy is a quiet dashboard rather
// than a crashed one.
//
// The message deliberately carries no applicant data. The application page
// promises that Meta is the only third party an applicant's details go to,
// and an email transits Google. So the note says that someone applied, which
// headset, and where to look — and the dashboard, one click away, has the rest.

import nodemailer from 'nodemailer';

export function createMailer({ smtpUrl = '', from = '', onError = (error) => console.error('[mail]', error) } = {}) {
  if (!smtpUrl) return null;
  let sender = from;
  if (!sender) {
    // Gmail rewrites From to the authenticated user anyway; default to it so
    // the header and the envelope agree.
    try {
      sender = decodeURIComponent(new URL(smtpUrl).username);
    } catch {
      sender = '';
    }
  }
  if (!sender) throw new Error('SMTP_FROM is required when SMTP_URL does not carry a username');

  const transport = nodemailer.createTransport(smtpUrl);

  return {
    from: sender,
    /** Resolves when the mail is handed to the server; rejects on refusal. */
    async send({ to, subject, text }) {
      return transport.sendMail({ from: sender, to, subject, text });
    },
    /** For a fire-and-forget caller: never throws, reports through onError. */
    sendQuietly(message) {
      return this.send(message).catch(onError);
    },
    close() {
      transport.close();
    }
  };
}
