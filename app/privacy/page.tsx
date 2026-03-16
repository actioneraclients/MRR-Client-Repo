import { createClient } from "@/lib/supabase/server"
import LegalPageLayout from "@/components/legal/LegalPageLayout"

export default async function PrivacyPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("legal_pages")
    .select("*")
    .eq("page_type", "privacy")
    .single()

  return (
    <LegalPageLayout
      title="Privacy Policy"
      content={data?.content ?? ""}
    />
  )
}
