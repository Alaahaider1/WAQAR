import nodemailer from "nodemailer";

export const runtime = "nodejs";

const SUBJECTS = [
  "Product & Fragrance Advice",
  "Orders & Delivery",
  "Returns & Exchanges",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Please submit a valid contact form." }, { status: 400 });
  }

  if (!isRecord(payload)) {
    return Response.json({ error: "Please submit a valid contact form." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (!name || name.length > 200 || /[\r\n]/.test(name)) {
    return Response.json({ error: "Please enter a valid name under 200 characters." }, { status: 400 });
  }
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (subject && !SUBJECTS.includes(subject as (typeof SUBJECTS)[number])) {
    return Response.json({ error: "Please select a valid subject." }, { status: 400 });
  }
  if (!message || message.length > 10000) {
    return Response.json({ error: "Please enter a message under 10,000 characters." }, { status: 400 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!user || !pass || !to) {
    console.error("Contact email is not configured. Set GMAIL_USER, GMAIL_APP_PASSWORD, and CONTACT_TO_EMAIL.");
    return Response.json({ error: "Email service is not configured. Please try again later." }, { status: 503 });
  }

  const submittedAt = new Date().toISOString();
  const category = subject || "No category selected";
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${category}`,
    `Submitted: ${submittedAt}`,
    "",
    "Message:",
    message,
  ].join("\n");

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: user,
      to,
      replyTo: email,
      subject: `WAQAR Contact: ${category} — ${name}`,
      text,
    });

    return Response.json({ accepted: true });
  } catch {
    console.error("Contact email could not be sent through Gmail SMTP.");
    return Response.json({ error: "We could not send your message. Please try again." }, { status: 502 });
  }
}
