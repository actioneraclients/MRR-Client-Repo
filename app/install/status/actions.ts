"use server"

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export type InstallStatusState = {
  submitted?: boolean
  error?: string
}

export async function submitInstallStatus(
  _prevState: InstallStatusState | null,
  formData: FormData
): Promise<InstallStatusState> {
  // Safely extract form fields
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const site = String(formData.get("site") ?? "").trim()
  const status = String(formData.get("status") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()

  const submissionData = { name, email, phone, site, status, notes }
  console.log("[submitInstallStatus] Form submission data:", submissionData)

  // Detect install type for badge styling
  let installLabel: string
  let installColor: string
  let installIcon: string
  if (status.includes("Install & Merge")) {
    installLabel = "Install & Merge"
    installColor = "#dc2626"
    installIcon = "🔴"
  } else if (status.includes("Install & Replace")) {
    installLabel = "Install & Replace"
    installColor = "#ca8a04"
    installIcon = "🟡"
  } else if (status.includes("Install New")) {
    installLabel = "Install New"
    installColor = "#16a34a"
    installIcon = "🟢"
  } else {
    installLabel = "Install"
    installColor = "#6b7280"
    installIcon = "⚪"
  }

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  const n = escape(name)
  const e = escape(email)
  const p = escape(phone)
  const s = escape(site)
  const st = escape(status)
  const no = escape(notes)

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:40px 0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:auto;background:white;padding:28px;border-radius:8px;font-family:Arial,Helvetica,sans-serif">
    <h1 style="font-size:22px;font-weight:700;margin-bottom:20px">MRR Community Platform Install Request</h1>
    <p style="font-size:14px;letter-spacing:1px;font-weight:700;margin-top:24px;margin-bottom:8px;color:#6b7280">CLIENT DETAILS</p>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="width:140px;padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">Name</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${n}</td></tr>
      <tr><td style="width:140px;padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">Email</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${e}</td></tr>
      <tr><td style="width:140px;padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">Phone</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${p || "—"}</td></tr>
      <tr><td style="width:140px;padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">Community Site</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${s}</td></tr>
    </table>
    <p style="font-size:14px;letter-spacing:1px;font-weight:700;margin-top:24px;margin-bottom:8px;color:#6b7280">INSTALLATION TYPE</p>
    <div style="margin:16px 0">
      <span style="display:inline-block;padding:10px 16px;border-radius:6px;font-weight:600;color:white;background:${installColor};font-size:16px">${installIcon} ${installLabel}</span>
    </div>
    <p style="font-size:14px;letter-spacing:1px;font-weight:700;margin-top:24px;margin-bottom:8px;color:#6b7280">SELECTED INSTALLATION PATH DESCRIPTION</p>
    <div style="margin:16px 0;font-size:15px;color:#374151;line-height:1.5">${st}</div>
    <p style="font-size:14px;letter-spacing:1px;font-weight:700;margin-top:24px;margin-bottom:8px;color:#6b7280">ADDITIONAL NOTES</p>
    <div style="background:#f9fafb;padding:14px;border-radius:6px;margin-top:10px;color:#374151">${no || "No additional notes submitted."}</div>
  </div>
</body>
</html>
`

  if (!process.env.RESEND_API_KEY) {
    console.error("[submitInstallStatus] RESEND_API_KEY is not set")
    return { error: "Email service is not configured. Please try again later." }
  }

  const { data, error } = await resend.emails.send({
    from: "Actionera Academy <noreply@actioneraacademy.com>",
    to: ["robert@actionera.com"],
    subject: `MRR Install Status - ${name}`,
    html,
  })

  if (error) {
    console.error("[submitInstallStatus] Resend API error:", error)
    return {
      error: "Failed to send your submission. Please try again or contact support.",
    }
  }

  console.log("[submitInstallStatus] Email sent successfully. Resend result:", data)
  return { submitted: true }
}
