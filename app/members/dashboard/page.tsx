import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDashboard2Data } from "./actions"
import { Dashboard2Content } from "./_components/Dashboard2Content"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const data = await getDashboard2Data()

  return <Dashboard2Content {...data} />
}
