"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getMyProfile, updateMyProfile, updateMyAvatar } from "./actions.ts"

type Profile = {
  display_name?: string | null
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  phone_number?: string | null
  job_title?: string | null
  company?: string | null
  bio?: string | null
  city?: string | null
  country?: string | null
  avatar_url?: string | null
  email_updates_enabled?: boolean | null
  inbox_emails_enabled?: boolean | null
  is_public?: boolean | null
  plan_name?: string | null
  billing_url?: string | null
  social_links?: any
  can_list_in_directory?: boolean
}

type SocialLink = {
  platform: string
  url: string
}

const SOCIAL_PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: "fa-linkedin", color: "bg-blue-600" },
  { id: "twitter", label: "Twitter", icon: "fa-twitter", color: "bg-sky-500" },
  { id: "instagram", label: "Instagram", icon: "fa-instagram", color: "bg-pink-500" },
  { id: "facebook", label: "Facebook", icon: "fa-facebook", color: "bg-blue-500" },
  { id: "github", label: "GitHub", icon: "fa-github", color: "bg-gray-800" },
  { id: "youtube", label: "YouTube", icon: "fa-youtube", color: "bg-red-600" },
  { id: "tiktok", label: "TikTok", icon: "fa-tiktok", color: "bg-black" },
  { id: "website", label: "Website", icon: "fa-globe", color: "bg-gray-500" },
]

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]

function normalizeSocialLinks(value: any): { platform: string; url: string }[] {
  if (!value) return []

  // If it's already an array, filter and validate
  if (Array.isArray(value)) {
    return value.filter(
      (item) => item && typeof item === "object" && typeof item.platform === "string" && typeof item.url === "string",
    )
  }

  // If it's an object, convert to array via Object.entries
  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([platform, url]) => typeof platform === "string" && typeof url === "string")
      .map(([platform, url]) => ({ platform, url: url as string }))
  }

  return []
}

const countries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
]

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showAvatarSuccessModal, setShowAvatarSuccessModal] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [bio, setBio] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [inboxNotifications, setInboxNotifications] = useState(false)
  const [isPublic, setIsPublic] = useState<boolean>(true)
  const [planName, setPlanName] = useState<string | null>(null)
  const [billingUrl, setBillingUrl] = useState<string | null>(null)
  const [canListInDirectory, setCanListInDirectory] = useState<boolean>(false)

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [showSocialModal, setShowSocialModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [socialPlatform, setSocialPlatform] = useState("")
  const [socialUrl, setSocialUrl] = useState("")

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getMyProfile()
        setProfile(data)
        if (data) {
          setFullName(data.full_name || "")
          setPhoneNumber(data.phone_number || data.phone || "")
          setJobTitle(data.job_title || "")
          setCompany(data.company || "")
          setBio(data.bio || "")
          setCity(data.city || "")
          setCountry(data.country || "")
          setEmailUpdates(data.email_updates_enabled ?? true)
          setInboxNotifications(data.inbox_emails_enabled ?? false)
          setIsPublic(data.is_public ?? true)
          setAvatarUrl(data.avatar_url || null)
          setPlanName(data.plan_name || null)
          setBillingUrl(data.billing_url || null)
          setSocialLinks(normalizeSocialLinks((data as any)?.social_links))
          setCanListInDirectory(data.can_list_in_directory ?? false)
        }
      } catch (error) {
        console.error("Failed to load profile:", error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const displayName = fullName || profile?.display_name || "Unnamed User"

  const displayAvatarUrl = avatarUrl || "/images/design-mode/avatar-5(1).jpg"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const result = await updateMyProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        job_title: jobTitle,
        company: company,
        bio: bio,
        city: city,
        country: country,
        email_updates_enabled: emailUpdates,
        inbox_emails_enabled: inboxNotifications,
        is_public: isPublic,
        social_links: socialLinks,
        can_list_in_directory: canListInDirectory,
      })
      if (result.success) {
        setShowSuccessModal(true)
      } else {
        alert(result.error || "Failed to update profile")
      }
    } catch (error) {
      alert("An error occurred while saving your profile")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_AVATAR_SIZE) {
      setErrorMessage("File too large. Max size is 5MB.")
      setShowErrorModal(true)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setErrorMessage("Unsupported file type.")
      setShowErrorModal(true)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const result = await updateMyAvatar(formData)

      if (result?.success === true) {
        if (result.avatar_url) {
          setAvatarUrl(result.avatar_url)
        }
        setShowAvatarSuccessModal(true)
      } else {
        setErrorMessage(result?.error || "Failed to upload avatar. Please try again.")
        setShowErrorModal(true)
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.")
      setShowErrorModal(true)
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCloseAvatarSuccessModal = () => {
    setShowAvatarSuccessModal(false)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading profile...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {showAvatarSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-check text-green-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Avatar Updated</h3>
              <p className="text-gray-600 mb-2">Your profile picture has been updated successfully.</p>
              <p className="text-gray-500 text-sm mb-6">
                You can refresh the page now to see the updated avatar everywhere.
              </p>
              <button
                onClick={handleCloseAvatarSuccessModal}
                className="w-full px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-times text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Avatar Upload Error</h3>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-check text-green-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Profile Updated</h3>
              <p className="text-gray-600 mb-6">Your profile changes have been saved successfully.</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSocialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">{editingIndex !== null ? "Edit Social Link" : "Add Social Link"}</h3>

            <div className="space-y-4">
              <select
                value={socialPlatform}
                onChange={(e) => setSocialPlatform(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl"
              >
                <option value="">Select platform</option>
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>

              <input
                type="url"
                placeholder="https://..."
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button type="button" onClick={() => setShowSocialModal(false)} className="px-4 py-2 text-gray-600">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!socialPlatform || !socialUrl) return

                  setSocialLinks((prev) => {
                    if (editingIndex !== null) {
                      const copy = [...prev]
                      copy[editingIndex] = { platform: socialPlatform, url: socialUrl }
                      return copy
                    }
                    return [...prev, { platform: socialPlatform, url: socialUrl }]
                  })

                  setShowSocialModal(false)
                }}
                className="px-6 py-2 bg-primary text-white rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="profile-header" className="mb-8">
        <div className="bg-gradient-to-br from-primary/5 via-purple-50 to-pink-50 rounded-2xl p-8 border border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
              <p className="text-lg text-gray-600">Manage your account information and preferences</p>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-20 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-user-cog text-3xl text-primary"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div id="profile-sidebar" className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <img
                  src={displayAvatarUrl || "/placeholder.svg"}
                  alt="Profile Picture"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? (
                    <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                  ) : (
                    <i className="fa-solid fa-camera text-sm"></i>
                  )}
                </button>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{displayName}</h3>
              <p className="text-gray-600">{planName ? `${planName} Member` : "Member"}</p>
              {billingUrl && (
                <p className="mt-3 text-sm text-gray-600">
                  To manage the billing for your account,{" "}
                  <a
                    href={billingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline"
                  >
                    click here
                  </a>
                  .
                </p>
              )}
              <div className="mt-4">
                <Link
                  href="/members/upgrade"
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Upgrade Membership
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div id="profile-main" className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div id="personal-info-section" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="">Select country</option>
                      {countries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div id="social-links-section" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Social Links</h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null)
                    setSocialPlatform("")
                    setSocialUrl("")
                    setShowSocialModal(true)
                  }}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Add Link
                </button>
              </div>

              <div className="space-y-4">
                {socialLinks.length === 0 && <p className="text-sm text-gray-500">No social links added yet.</p>}

                {socialLinks.map((link, index) => {
                  const platformMeta = SOCIAL_PLATFORMS.find((p) => p.id === link.platform)

                  return (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${platformMeta?.color || "bg-gray-400"}`}
                      >
                        <i className={`fa-brands ${platformMeta?.icon || "fa-globe"} text-white`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{platformMeta?.label || link.platform}</div>
                        <div className="text-sm text-gray-600 break-all">{link.url}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(index)
                          setSocialPlatform(link.platform)
                          setSocialUrl(link.url)
                          setShowSocialModal(true)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <i className="fa-solid fa-pencil"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSocialLinks((prev) => prev.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-600"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div id="notifications-section" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-envelope text-primary"></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Receive email updates from site managers</div>
                      <div className="text-sm text-gray-600">
                        Get notified about important announcements and updates
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailUpdates(!emailUpdates)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      emailUpdates ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        emailUpdates ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-inbox text-primary"></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Receive email notifications for inbox activity</div>
                      <div className="text-sm text-gray-600">Get notified when you receive new messages</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInboxNotifications(!inboxNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      inboxNotifications ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        inboxNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div
              id="directory-visibility-section"
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Directory Visibility</h2>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-eye text-primary"></i>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Make your profile public in the directory</div>
                    <div className="text-sm text-gray-600">
                      Toggle to control whether your profile appears in the public directory
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (canListInDirectory) {
                      setIsPublic(!isPublic)
                    }
                  }}
                  disabled={!canListInDirectory}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPublic ? "bg-primary" : "bg-gray-300"
                  } ${!canListInDirectory ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {!canListInDirectory && (
                <p className="mt-3 text-sm text-red-600">Your plan does not allow a directory listing.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
