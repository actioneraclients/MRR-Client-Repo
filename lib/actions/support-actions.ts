"use server"

import { Resend } from "resend"

const SUPPORT_TYPE_LABELS: Record<string, string> = {
  technical: "Technical Support",
  billing: "Billing Questions",
  content: "Content Issues",
  report: "Report Member",
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendSupportMessage(formData: FormData): Promise<{ success: true }> {
  const fullName = (formData.get("fullName") as string)?.trim()
  const email = (formData.get("email") as string)?.trim()
  const supportType = (formData.get("supportType") as string)?.trim()
  const priority = (formData.get("priority") as string)?.trim() || "medium"
  const subject = (formData.get("subject") as string)?.trim()
  const message = (formData.get("message") as string)?.trim()

  if (!fullName) {
    throw new Error("Full name is required.")
  }
  if (!email) {
    throw new Error("Email address is required.")
  }
  if (!supportType) {
    throw new Error("Support type is required.")
  }
  if (!subject) {
    throw new Error("Subject is required.")
  }
  if (!message) {
    throw new Error("Message is required.")
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("Email service is not configured. Please try again later.")
  }

  const toEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL
  if (!toEmail) {
    throw new Error("Support email is not configured. Please try again later.")
  }

  const supportTypeLabel = SUPPORT_TYPE_LABELS[supportType] ?? supportType
  const priorityLabel = PRIORITY_LABELS[priority] ?? priority
  const emailSubject = `${supportTypeLabel} [${priorityLabel}]`

  const textBody = [
    "NEW SUPPORT REQUEST",
    "Submitted via Support Form",
    "",
    "---",
    "",
    "Full Name",
    fullName,
    "",
    "Email",
    email,
    "",
    "Support Type",
    supportTypeLabel,
    "",
    "Priority",
    priorityLabel,
    "",
    "Subject",
    subject,
    "",
    "Message",
    "---",
    message,
  ].join("\n")

  const htmlBody = [
    '<div style="background-color:#f4f6f8;padding:32px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;">',
    '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;padding:24px;">',
    '<div style="margin-bottom:24px;">',
    '<h1 style="margin:0 0 8px 0;font-size:20px;font-weight:bold;color:#111;">New Support Request</h1>',
    '<p style="margin:0;font-size:16px;color:#555;">Submitted via Support Form</p>',
    '<div style="margin-top:20px;height:1px;background-color:#e5e7eb;"></div>',
    "</div>",
    '<div style="margin-bottom:24px;">',
    '<p style="margin:0 0 4px 0;font-size:16px;font-weight:bold;color:#111;">Full Name</p>',
    `<p style="margin:0 0 16px 0;font-size:16px;color:#333;">${escapeHtml(fullName)}</p>`,
    '<p style="margin:0 0 4px 0;font-size:16px;font-weight:bold;color:#111;">Email</p>',
    `<p style="margin:0 0 16px 0;font-size:16px;color:#333;">${escapeHtml(email)}</p>`,
    '<p style="margin:0 0 4px 0;font-size:16px;font-weight:bold;color:#111;">Support Type</p>',
    `<p style="margin:0 0 16px 0;font-size:16px;color:#333;">${escapeHtml(supportTypeLabel)}</p>`,
    '<p style="margin:0 0 4px 0;font-size:16px;font-weight:bold;color:#111;">Priority</p>',
    `<p style="margin:0 0 16px 0;font-size:16px;color:#333;">${escapeHtml(priorityLabel)}</p>`,
    '<p style="margin:0 0 4px 0;font-size:16px;font-weight:bold;color:#111;">Subject</p>',
    `<p style="margin:0 0 16px 0;font-size:16px;color:#333;">${escapeHtml(subject)}</p>`,
    "</div>",
    '<div style="margin-bottom:0;">',
    '<p style="margin:0 0 8px 0;font-size:16px;font-weight:bold;color:#111;">Message</p>',
    `<div style="background-color:#f1f3f5;padding:16px;border-radius:6px;font-size:16px;color:#333;margin:0;">${escapeHtml(message).replace(/\n/g, "<br>")}</div>`,
    "</div>",
    "</div>",
    "</div>",
  ].join("")

  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Support <onboarding@resend.dev>",
    to: toEmail,
    replyTo: email,
    subject: emailSubject,
    text: textBody,
    html: htmlBody,
  })

  if (error) {
    throw new Error(error.message || "Failed to send support message. Please try again.")
  }

  return { success: true }
}
