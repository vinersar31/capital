import nodemailer from "nodemailer";

export interface SendExportInput {
  buffer: Buffer;
  filename: string;
  note?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  /** Recipient — always read from the server environment, never the client. */
  to: string;
}

/** Read SMTP + recipient settings from server-only env secrets. */
export function readSmtpConfig(): SmtpConfig | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, EXPORT_EMAIL_TO } =
    process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EXPORT_EMAIL_TO) return null;
  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 465),
    user: SMTP_USER,
    pass: SMTP_PASS,
    from: SMTP_FROM || SMTP_USER,
    to: EXPORT_EMAIL_TO,
  };
}

export async function sendExportEmail(
  config: SmtpConfig,
  input: SendExportInput,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({
    from: config.from,
    to: config.to,
    subject: `Capital report — ${new Date().toLocaleDateString("en-GB")}`,
    text: input.note
      ? `Attached is your latest Capital report (Excel).\n\n${input.note}`
      : "Attached is your latest Capital report (Excel).",
    attachments: [
      {
        filename: input.filename,
        content: input.buffer,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });
}

/** Mask an address for display so the secret recipient isn't fully exposed. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "•••";
  return `${user.slice(0, 1)}${"•".repeat(Math.max(1, user.length - 1))}@${domain}`;
}
