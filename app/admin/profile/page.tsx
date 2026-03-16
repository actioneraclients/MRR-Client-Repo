"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

interface ProfileData {
  admin_display_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
}

export default function AdminProfilePage() {
  const supabase = getSupabaseBrowserClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")

  const [formData, setFormData] = useState<ProfileData>({
    admin_display_name: "",
    first_name: "",
    last_name: "",
    email: "",
  })

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("admin_display_name, first_name, last_name, email")
          .eq("id", user.id)
          .single()

        if (profile) {
          setFormData({
            admin_display_name: profile.admin_display_name || "",
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            email: profile.email || user.email || "",
          })
        } else {
          setFormData((prev) => ({
            ...prev,
            email: user.email || "",
          }))
        }
      }
      setLoading(false)
    }

    fetchProfile()
  }, [supabase])

  const showToastNotification = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleSave = async () => {
    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      showToastNotification("Not authenticated", "error")
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        admin_display_name: formData.admin_display_name,
        first_name: formData.first_name,
        last_name: formData.last_name,
      })
      .eq("id", user.id)

    if (error) {
      showToastNotification("Failed to save profile", "error")
    } else {
      showToastNotification("Profile saved successfully!")
    }

    setSaving(false)
  }

  const handleChangePassword = async () => {
    setSendingReset(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      showToastNotification("Unable to retrieve your email address", "error")
      setSendingReset(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/admin/profile`,
    })

    if (error) {
      showToastNotification("Failed to send password reset email", "error")
    } else {
      showToastNotification("Password reset email sent! Check your inbox.")
    }

    setSendingReset(false)
  }

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="space-y-6">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Admin Profile</h1>
          <p className="text-gray-600">Manage your internal identity settings.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="space-y-6">
            {/* Admin Display Name */}
            <div>
              <label htmlFor="admin_display_name" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Display Name
              </label>
              <input
                type="text"
                id="admin_display_name"
                value={formData.admin_display_name || ""}
                onChange={(e) => setFormData({ ...formData, admin_display_name: e.target.value })}
                placeholder="Enter your admin display name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">This name will be shown in the admin interface.</p>
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Enter your first name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Enter your last name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email || ""}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Email address cannot be changed here.</p>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* Security section below profile form */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Security</h2>
          <p className="text-gray-600 text-sm mb-6">Manage your account security settings.</p>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Password</h3>
                <p className="text-xs text-gray-500 mt-1">
                  We&apos;ll send a password reset link to your email address.
                </p>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={sendingReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingReset ? "Sending..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg ${
              toastType === "success" ? "bg-green-600" : "bg-red-600"
            } text-white font-medium`}
          >
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  )
}
