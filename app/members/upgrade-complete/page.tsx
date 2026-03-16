import { createClient } from "@/lib/supabase/server"
import ActivateButton from "./ActivateButton"

export default async function UpgradeCompletePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let planName: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_id, plans(name)")
      .eq("id", user.id)
      .single()

    planName = profile?.plans?.name ?? null
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          🎉 Upgrade Successful
        </h1>

        <p className="text-slate-600 mb-6">
          Your subscription has been activated.
        </p>

        {planName && (
          <div className="mb-6">
            <span className="text-sm text-slate-500">Current Plan:</span>
            <div className="text-lg font-semibold text-indigo-600">
              {planName}
            </div>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <ActivateButton />
        </div>
      </div>
    </div>
  )
}
