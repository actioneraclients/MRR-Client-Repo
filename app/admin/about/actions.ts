"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { normalizeSections } from "./utils"

export async function uploadAboutImage(formData: FormData) {
  const file = formData.get("file") as File | null
  if (!file) throw new Error("No file provided")

  const supabase = await createClient()

  const ext = file.name.split(".").pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const path = `about/${filename}`

  const { error } = await supabase.storage
    .from("about")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    })

  if (error) {
    console.error("Upload error:", error)
    throw new Error(error.message)
  }

  const { data } = supabase.storage
    .from("about")
    .getPublicUrl(path)

  revalidatePath("/admin/about")
  return { url: data.publicUrl }
}

export async function getAboutPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("about_page")
    .select("*")
    .limit(1)
    .maybeSingle()

  if (!data) return null

  return {
    ...data,
    sections: normalizeSections(data.sections),
  }
}

export async function getBrandColors() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("brand_background_color, brand_primary_color, brand_accent_color")
    .limit(1)
    .maybeSingle()

  return {
    brandBackground: data?.brand_background_color || "#f7f4ef",
    brandPrimary: data?.brand_primary_color || "#1f2937",
    brandAccent: data?.brand_accent_color || "#d97706",
  }
}

export async function saveAboutSections(sections: any[]) {
  const supabase = await createClient()

  const normalized = sections
    .flat()
    .filter(Boolean)
    .map((s) => ({
      id: s.id,
      type: s.type,
      enabled: s.enabled ?? true,
      background_mode: s.background_mode ?? "transparent",
      background_color: s.background_color ?? null,
      content: s.content ?? {},
    }))

  // get existing row
  const { data: page, error: fetchError } = await supabase
    .from("about_page")
    .select("id")
    .limit(1)
    .single()

  if (fetchError) {
    console.error("saveAboutSections fetch error:", fetchError)
    throw new Error(fetchError.message)
  }

  const { error } = await supabase
    .from("about_page")
    .update({ sections: normalized })
    .eq("id", page.id)

  if (error) {
    console.error("saveAboutSections update error:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin/about")
  revalidatePath("/about")
  revalidatePath("/about/[slug]")
  return { success: true }
}

export async function setAboutPublished(isPublished: boolean) {
  const supabase = await createClient()

  const { data: existing, error: existingErr } = await supabase
    .from("about_page")
    .select("id")
    .limit(1)
    .maybeSingle()

  if (existingErr) {
    console.error("setAboutPublished fetch error:", existingErr)
    throw new Error(existingErr.message)
  }

  if (existing) {
    const { error } = await supabase
      .from("about_page")
      .update({ is_published: isPublished })
      .eq("id", existing.id)
    if (error) {
      console.error("setAboutPublished update error:", error)
      throw new Error(error.message)
    }
  } else {
    const { error } = await supabase
      .from("about_page")
      .insert({ sections: [], is_published: isPublished })
    if (error) {
      console.error("setAboutPublished insert error:", error)
      throw new Error(error.message)
    }
  }

  revalidatePath("/admin/about")
  revalidatePath("/about")
  revalidatePath("/about/[slug]")
  return { success: true }
}
