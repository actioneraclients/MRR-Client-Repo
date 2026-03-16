import LoginForm from "./login-form"
import { createClient } from "@/lib/supabase/server"

export default async function LoginPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from("site_settings")
    .select("enable_google_auth")
    .eq("id", 1)
    .single()

  const enableGoogleAuth = settings?.enable_google_auth ?? false

  return <LoginForm enableGoogleAuth={enableGoogleAuth} />
}
