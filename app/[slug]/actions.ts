"use server"

import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { isReservedPublicSlug, normalizePublicSlug } from "@/lib/slug"

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}

export async function getOptInPageBySlug(slug: string) {
  const normalized = normalizePublicSlug(slug)
  if (!normalized) return null
  if (isReservedPublicSlug(normalized)) return null

  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from("opt_in_pages")
    .select("*")
    .eq("slug", normalized)
    .eq("is_active", true)
    .maybeSingle()

  if (error || !data) return null
  return data
}

export async function getSalesPageBySlug(slug: string) {
  const normalized = normalizePublicSlug(slug)
  if (!normalized) return null
  if (isReservedPublicSlug(normalized)) return null

  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from("sales_pages")
    .select("id, title, slug, is_homepage, sections")
    .eq("slug", normalized)
    .maybeSingle()

  if (error || !data) return null
  return data as { id: string; title: string; slug: string; is_homepage: boolean; sections: unknown[] }
}

export async function submitOptInRegistration(input: {
  slug: string
  firstName: string
  lastName: string
  email: string
  password: string
  phoneNumber?: string
  captchaToken: string
}): Promise<
  | { ok: true; redirectTo: string }
  | { ok: false; error: string }
> {
  const {
    slug,
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    captchaToken,
  } = input

  if (!process.env.RECAPTCHA_SECRET_KEY) {
    return { ok: false, error: "reCAPTCHA not configured" }
  }

  if (!captchaToken) {
    return { ok: false, error: "Captcha verification failed" }
  }

  const supabaseService = getServiceRoleClient()

  // 1️⃣ Validate slug + fetch opt-in page
  const { data: optInPage, error: pageError } = await supabaseService
    .from("opt_in_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()

  if (pageError || !optInPage) {
    return { ok: false, error: "Invalid or inactive opt-in page" }
  }

  // 2️⃣ Verify reCAPTCHA
  const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captchaToken,
    }).toString(),
  })

  const verify = (await verifyRes.json()) as { success?: boolean }
  if (verify.success !== true) {
    return { ok: false, error: "Captcha verification failed" }
  }

  // 3️⃣ Check if email exists
  const { data: listData } = await supabaseService.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  const existingUser =
    listData?.users?.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase()) ?? null

  let userId: string | null = null

  // 4️⃣ Case A — New User
  if (!existingUser) {
    const supabase = await createServerClient()

    const fullName = `${firstName} ${lastName}`.trim()

    const emailRedirectTo =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
      `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/login`

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          phone_number: phoneNumber?.trim() || null,
        },
      },
    })

    if (error) {
      return { ok: false, error: error.message }
    }

    userId = data.user?.id ?? null

    // Assign plan if present
    if (userId && optInPage.plan_id) {
      await supabaseService
        .from("profiles")
        .update({ plan_id: optInPage.plan_id })
        .eq("id", userId)
    }
  }

  // 5️⃣ Fetch plan to get webhook URL (uses ghl_webhook_url from plans table)
  let webhookUrl: string | null = null

  if (optInPage.plan_id) {
    const { data: plan } = await supabaseService
      .from("plans")
      .select("ghl_webhook_enabled, ghl_webhook_url")
      .eq("id", optInPage.plan_id)
      .maybeSingle()

    if (plan?.ghl_webhook_enabled && plan?.ghl_webhook_url) {
      webhookUrl = plan.ghl_webhook_url
    }
  }

  // 6️⃣ Trigger webhook (ALWAYS — both new and existing user)
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phoneNumber ?? "",
          event: slug,
        }),
      })
    } catch (err) {
      console.error("Webhook trigger failed:", err)
    }
  }

  // 7️⃣ Redirect to confirmation page
  return {
    ok: true,
    redirectTo: `/${slug}/confirm`,
  }
}
