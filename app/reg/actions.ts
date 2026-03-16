"use server"

import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"

function getServiceRoleClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  })
}

export async function assignPlanToProfile(userId: string, planId: string): Promise<{ ok: boolean; error?: string }> {
  // Validate inputs
  if (!userId || !planId) {
    return { ok: false, error: "Missing userId or planId" }
  }

  try {
    const supabase = getServiceRoleClient()

    // Validate plan exists
    const { data: plan, error: planError } = await supabase.from("plans").select("id").eq("id", planId).single()

    if (planError || !plan) {
      return { ok: false, error: "Plan not found or inactive" }
    }

    // Update profile with plan_id
    const { error: updateError } = await supabase.from("profiles").update({ plan_id: planId }).eq("id", userId)

    if (updateError) {
      return { ok: false, error: updateError.message }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function registerUserWithRecaptcha(input: {
  firstName: string
  lastName: string
  email: string
  password: string
  phoneNumber?: string
  captchaToken: string
}): Promise<{ ok: true; userId?: string } | { ok: false; error: string }> {
  const { firstName, lastName, email, password, phoneNumber, captchaToken } = input

  if (!process.env.RECAPTCHA_SECRET_KEY) {
    return { ok: false, error: "reCAPTCHA not configured" }
  }
  if (!captchaToken || captchaToken.trim() === "") {
    return { ok: false, error: "Please complete the captcha" }
  }

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

  const supabase = await createClient()
  const emailRedirectTo =
    process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/members/dashboard`
  const fullName = `${firstName} ${lastName}`.trim()

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

  return { ok: true, userId: data.user?.id }
}
