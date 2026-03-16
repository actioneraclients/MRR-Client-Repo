"use server"

import { createClient } from "@/lib/supabase/server"

export async function uploadAboutImage(file: File) {
  const supabase = await createClient()

  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`

  const filePath = `about/${fileName}`

  const { error } = await supabase.storage
    .from("about-pages")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage
    .from("about-pages")
    .getPublicUrl(filePath)

  return data.publicUrl
}
