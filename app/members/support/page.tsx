"use client"

import { useState, useEffect, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/browser"
import { sendSupportMessage } from "@/lib/actions/support-actions"

const initialFormState = {
  fullName: "",
  email: "",
  supportType: "",
  priority: "medium",
  subject: "",
  message: "",
}

export default function SupportPage() {
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [pageTitle, setPageTitle] = useState("Support Center")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [supportType, setSupportType] = useState("")
  const [priority, setPriority] = useState("medium")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const fetchNavTitle = async () => {
      const { data } = await supabase.from("site_settings").select("member_navigation").single()

      if (data?.member_navigation) {
        try {
          const navItems =
            typeof data.member_navigation === "string" ? JSON.parse(data.member_navigation) : data.member_navigation
          const supportNav = navItems.find((item: { id: string }) => item.id === "support")
          if (supportNav?.label) {
            setPageTitle(supportNav.label)
          }
        } catch {
          // Keep default title on parse error
        }
      }
    }
    fetchNavTitle()
  }, [])

  const resetForm = () => {
    setFullName(initialFormState.fullName)
    setEmail(initialFormState.email)
    setSupportType(initialFormState.supportType)
    setPriority(initialFormState.priority)
    setSubject(initialFormState.subject)
    setMessage(initialFormState.message)
    setError(null)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set("fullName", fullName)
      formData.set("email", email)
      formData.set("supportType", supportType)
      formData.set("priority", priority)
      formData.set("subject", subject)
      formData.set("message", message)
      await sendSupportMessage(formData)
      setShowSuccessModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeModal = () => {
    setShowSuccessModal(false)
    resetForm()
  }

  return (
    <div className="px-8 pb-12">
      {/* Support Header */}
      <div id="support-header" className="bg-white rounded-2xl p-8 mb-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
            <p className="text-gray-600">Get help when you need it. We're here to support your success.</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-primary/10 to-purple-600/10 p-4 rounded-xl">
              <i className="fa-solid fa-headset text-2xl text-primary"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support Form */}
      <div id="support-form" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mr-3">
            <i className="fa-solid fa-envelope text-white"></i>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Contact Support</h2>
            <p className="text-sm text-gray-600">Send us a message and we'll get back to you soon</p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Type</label>
              <div className="relative">
                <select
                  name="supportType"
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none bg-white"
                >
                  <option value="">Select support type</option>
                  <option value="technical">Technical Support</option>
                  <option value="billing">Billing Questions</option>
                  <option value="content">Content Issues</option>
                  <option value="report">Report Member</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
              <div className="relative">
                <select
                  name="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              name="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              placeholder="Please provide detailed information about your issue or question..."
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-paper-plane mr-2"></i>
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-check text-accent text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
            <p className="text-gray-600 mb-6">
              Thank you for contacting support. We'll get back to you within 24-48 hours.
            </p>
            <button
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
