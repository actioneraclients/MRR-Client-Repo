import { createClient } from "@/lib/supabase/server"
import LegalPageLayout from "@/components/legal/LegalPageLayout"

export default async function TermsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("legal_pages")
    .select("*")
    .eq("page_type", "terms")
    .single()

  return (
    <LegalPageLayout
      title="Terms of Service"
      content={data?.content ?? ""}
    />
  )
}
