import type { NextApiRequest, NextApiResponse } from "next";
import { checkInMemoryRateLimit, getIp } from "@/lib/rateLimiter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // Rate limit: 5 submissions per 10 minutes per IP
  const ip = getIp(req);
  const { allowed, remaining, resetAt } = checkInMemoryRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
  res.setHeader("X-RateLimit-Limit", "5");
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
  if (!allowed) {
    return res.status(429).json({ error: "Too many requests. Please wait before submitting again." });
  }

  const { name, email, subject, message } = req.body as Record<string, string>;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  // Length limits
  if (name.length > 100 || email.length > 254 || message.length > 5000) {
    return res.status(400).json({ error: "Input exceeds maximum allowed length." });
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  const smtpHost = process.env.SMTP_HOST;

  if (smtpHost) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: process.env.SMTP_USERNAME
          ? { user: process.env.SMTP_USERNAME, pass: process.env.SMTP_PASSWORD }
          : undefined,
      });

      const toAddress = process.env.SMTP_FROM ?? process.env.CONTACT_EMAIL ?? `support@${req.headers.host}`;

      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? `"${name}" <noreply@${req.headers.host}>`,
        replyTo: `"${name}" <${email}>`,
        to: toAddress,
        subject: `[Contact Form] ${subject || "New message from website"}`,
        text: `From: ${name} <${email}>\nSubject: ${subject ?? "(no subject)"}\n\n${message}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#334155">New contact form submission</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#64748b;width:80px">Name</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#6B5CE7">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Subject</td><td style="padding:8px 0;color:#0f172a">${subject ?? "(none)"}</td></tr>
            </table>
            <hr style="margin:16px 0;border-color:#e2e8f0;" />
            <p style="color:#334155;white-space:pre-wrap;line-height:1.6">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>`,
      });
    } catch (err: unknown) {
      console.error("[contact] SMTP send failed:", err);
      return res.status(500).json({ error: "Failed to send message. Please try emailing us directly." });
    }
  } else {
    console.log(
      "[contact] Dev fallback — no SMTP configured.\n",
      JSON.stringify({ name, email, subject, message }, null, 2)
    );
  }

  return res.status(200).json({ ok: true });
}
