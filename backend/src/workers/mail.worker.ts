import redisClient from "../config/redis.js";
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.ethereal.email";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || '"Live Quiz" <no-reply@livequiz.com>';

// Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER && SMTP_PASS ? {
    user: SMTP_USER,
    pass: SMTP_PASS,
  } : undefined,
});

export async function queueMail(to: string, subject: string, text: string, html: string) {
  const mailJob = {
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  };
  await redisClient.lPush("mail:queue", JSON.stringify(mailJob));
  console.log(`[Mail Queue] Queued email to: ${to} with subject: ${subject}`);
}

export async function processMailQueue() {
  try {
    const jobString = await redisClient.rPop("mail:queue");
    if (!jobString) return;

    const job = JSON.parse(jobString);
    console.log(`[Mail Worker] Processing email job to: ${job.to}`);

    if (!SMTP_USER || !SMTP_PASS) {
      console.log("-----------------------------------------");
      console.log(`[MAIL DEVELOPMENT LOG] Sending email:`);
      console.log(`To: ${job.to}`);
      console.log(`Subject: ${job.subject}`);
      console.log(`Text: ${job.text}`);
      console.log("-----------------------------------------");
    } else {
      await transporter.sendMail(job);
      console.log(`[Mail Worker] Email sent successfully to: ${job.to}`);
    }
  } catch (error) {
    console.error("[Mail Worker] Error sending mail from queue:", error);
  }
}

let intervalId: NodeJS.Timeout | null = null;

export function startMailWorker(pollIntervalMs = 1500) {
  if (intervalId) return;
  console.log(`[Mail Worker] Mail queue processor started (polling every ${pollIntervalMs}ms)`);
  
  intervalId = setInterval(async () => {
    await processMailQueue();
  }, pollIntervalMs);
}

export function stopMailWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Mail Worker] Mail queue processor stopped.");
  }
}
