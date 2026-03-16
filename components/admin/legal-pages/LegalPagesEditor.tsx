"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import RichTextEditor from "@/components/admin/RichTextEditor"
import { updateLegalPage } from "@/app/admin/legal-pages/actions"

type Props = {
  initialTerms?: string
  initialPrivacy?: string
}

export default function LegalPagesEditor({
  initialTerms = "",
  initialPrivacy = "",
}: Props) {
  const router = useRouter()
  const [termsContent, setTermsContent] = useState(initialTerms)
  const [privacyContent, setPrivacyContent] = useState(initialPrivacy)
  const [savingTerms, setSavingTerms] = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)

  const handleSaveTerms = async () => {
    setSavingTerms(true)
    try {
      await updateLegalPage("terms", termsContent)
      toast.success("Terms saved")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSavingTerms(false)
    }
  }

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true)
    try {
      await updateLegalPage("privacy", privacyContent)
      toast.success("Privacy policy saved")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSavingPrivacy(false)
    }
  }

  return (
    <div className="space-y-12 max-w-4xl">
      {/* Terms */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Terms of Service</h2>
          <p className="text-sm text-gray-500">This content appears on /terms</p>
        </div>
        <RichTextEditor value={termsContent} onChange={setTermsContent} />
        <button
          onClick={handleSaveTerms}
          disabled={savingTerms}
          className="mt-4 px-4 py-2 bg-black text-white rounded-md disabled:opacity-50"
        >
          {savingTerms ? "Saving…" : "Save Terms"}
        </button>
      </div>

      {/* Privacy */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Privacy Policy</h2>
          <p className="text-sm text-gray-500">This content appears on /privacy</p>
        </div>
        <RichTextEditor value={privacyContent} onChange={setPrivacyContent} />
        <button
          onClick={handleSavePrivacy}
          disabled={savingPrivacy}
          className="mt-4 px-4 py-2 bg-black text-white rounded-md disabled:opacity-50"
        >
          {savingPrivacy ? "Saving…" : "Save Privacy Policy"}
        </button>
      </div>
    </div>
  )
}
