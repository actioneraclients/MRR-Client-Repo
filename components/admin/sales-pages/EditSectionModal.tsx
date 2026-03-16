"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ImageUploader } from "./ImageUploader"
import {
  getEducationSectionOptions,
  getPlansForMembershipSection,
  type EducationExpertOption,
  type EducationContentOption,
  type PlanForMembershipSection,
} from "@/app/admin/sales-pages/builder/sales-pages-actions"

type FieldKind = "input" | "textarea" | "image_url" | "link_url"

type SectionField = {
  key: string
  label: string
  kind: FieldKind
}

const HERO_ANCHOR_OPTIONS = [
  { value: "#membership-plans", label: "Membership Plans" },
  { value: "#community-vision", label: "Community Vision" },
  { value: "#courses", label: "Courses" },
  { value: "#marketplace", label: "Marketplace" },
  { value: "#custom", label: "Custom" },
]

const DEFAULT_COMMUNITY_VISION_BULLETS = [
  "Experts, practitioners, coaches, creators, and guides",
  "People building a message, movement, or mission-driven business",
  "Curious learners who value quality, depth, and contribution",
]

type MemberExperienceBox = {
  icon: string
  title: string
  bullet1: string
  bullet2: string
  bullet3: string
}

const DEFAULT_MEMBER_EXPERIENCE_BOXES: MemberExperienceBox[] = [
  {
    icon: "",
    title: "Community Connection",
    bullet1: "Community feed and shared conversations",
    bullet2: "Discover members via the directory",
    bullet3: "Messaging and relationship-building",
  },
  {
    icon: "",
    title: "Groups & Experiences",
    bullet1: "Join groups by topic and intent",
    bullet2: "Participate in guided discussions",
    bullet3: "Attend community experiences and live sessions",
  },
  {
    icon: "",
    title: "Learning & Growth",
    bullet1: "Education content shared by contributors",
    bullet2: "Courses for deeper transformation",
    bullet3: "Tools and resources to support action",
  },
]

type CommunityFeaturesFeature = {
  image: string
  title: string
  description: string
  bullet1: string
  bullet2: string
  bullet3: string
}

const DEFAULT_COMMUNITY_FEATURES: CommunityFeaturesFeature[] = [
  {
    image: "",
    title: "Member Feed",
    description: "A central place for updates, insights, and conversation where members engage and contribute.",
    bullet1: "Real-time updates and member posts",
    bullet2: "Rich media support for images, videos, and links",
    bullet3: "Engagement through comments, reactions, and shares",
  },
  {
    image: "",
    title: "Groups",
    description: "Focused spaces for real discussion, accountability, and transformation.",
    bullet1: "Topic-specific and intent-based groups",
    bullet2: "Public and private group options",
    bullet3: "Leader-guided discussions and accountability",
  },
]

const SECTION_FIELDS: Record<string, SectionField[]> = {
  hero: [], // Rendered by custom form
  community_vision: [], // Rendered by custom form
  community_features: [], // Rendered by custom form
  member_experience: [], // Rendered by custom form
  education_section: [], // Rendered by custom form
  courses_section: [], // Rendered by custom form
  marketplace_section: [], // Rendered by custom form
  tool_highlight: [], // Rendered by custom form
  masterclasses_highlight: [], // Rendered by custom form
  ai_mentors: [
    { key: "headline", label: "Headline", kind: "input" },
    { key: "intro", label: "Intro", kind: "textarea" },
  ],
  membership_plans: [], // Rendered by custom form
  founders_bridge: [], // Rendered by custom form
  cta: [
    { key: "headline", label: "Headline", kind: "input" },
    { key: "button_text", label: "Button Text", kind: "input" },
    { key: "button_link", label: "Button Link", kind: "link_url" },
  ],
  generic: [], // Rendered by custom form
}

export function getSectionFields(type: string): SectionField[] {
  return SECTION_FIELDS[type] ?? []
}

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  community_vision: "Community Vision",
  community_features: "Community Features",
  member_experience: "Member Experience",
  education_section: "Education",
  courses_section: "Courses",
  marketplace_section: "Marketplace",
  ai_mentors: "AI Mentors",
  tool_highlight: "Tool Highlight Section",
  masterclasses_highlight: "Masterclasses Highlight",
  membership_plans: "Membership Plans",
  founders_bridge: "Founders Bridge",
  cta: "CTA",
  generic: "Generic Section",
}

export type SectionForEdit = {
  id: string
  type: string
  enabled: boolean
  settings?: Record<string, unknown>
  content?: Record<string, string | string[] | MemberExperienceBox[] | CommunityFeaturesFeature[] | Record<string, string> | MarketplaceHighlight[] | ToolHighlightFeature[] | MasterclassesBox[] | string | null | undefined>
}

type MasterclassesBox = {
  title: string
  text: string
  bullets: string[]
}

type ToolHighlightFeature = {
  icon: string
  title: string
  subtitle: string
}

type CoursesSectionCard = {
  description: string
  bullet1: string
  bullet2: string
  bullet3: string
}

type MarketplaceHighlight = {
  title: string
  text: string
}

function normalizeHeroContent(c: Record<string, unknown> | undefined): Record<string, string | boolean> {
  const raw = c ?? {}
  return {
    headline: String(raw.headline ?? ""),
    hero_text: String(raw.hero_text ?? raw.subheadline ?? ""),
    video_url: String(raw.video_url ?? ""),
    hero_image: String(raw.hero_image ?? raw.background_image ?? ""),
    primary_button_text: String(raw.primary_button_text ?? ""),
    primary_button_anchor: String(raw.primary_button_anchor ?? raw.primary_button_url ?? "#membership-plans"),
    backgroundImage: raw.backgroundImage === true || raw.backgroundImage === "true",
  }
}

function normalizeCommunityVisionContent(c: Record<string, unknown> | undefined): {
  headline: string
  body: string
  box_subheadline: string
  image: string
  bullets: string[]
} {
  const raw = c ?? {}
  const legacyBullets = [
    raw.bullet_1 ?? raw.bullet1,
    raw.bullet_2 ?? raw.bullet2,
    raw.bullet_3 ?? raw.bullet3,
  ].filter(Boolean) as string[]
  const bullets = Array.isArray(raw.bullets) && raw.bullets.length > 0
    ? (raw.bullets as string[])
    : legacyBullets.length > 0
      ? legacyBullets
      : DEFAULT_COMMUNITY_VISION_BULLETS
  return {
    headline: String(raw.headline ?? ""),
    body: String(raw.body ?? ""),
    box_subheadline: String(raw.box_subheadline ?? "Who it's for:"),
    image: String(raw.image ?? ""),
    bullets,
  }
}

function normalizeMemberExperienceContent(c: Record<string, unknown> | undefined): {
  headline: string
  subheadline: string
  boxes: MemberExperienceBox[]
} {
  const raw = c ?? {}
  const rawBoxes = raw.boxes
  const boxes = Array.isArray(rawBoxes) && rawBoxes.length > 0
    ? (rawBoxes as Record<string, unknown>[]).map((b) => ({
        icon: String(b.icon ?? ""),
        title: String(b.title ?? ""),
        bullet1: String(b.bullet1 ?? ""),
        bullet2: String(b.bullet2 ?? ""),
        bullet3: String(b.bullet3 ?? ""),
      }))
    : DEFAULT_MEMBER_EXPERIENCE_BOXES
  return {
    headline: String(raw.headline ?? ""),
    subheadline: String(raw.subheadline ?? ""),
    boxes,
  }
}

function normalizeMasterclassesContent(c: Record<string, unknown> | undefined): Record<string, string | MasterclassesBox[]> {
  const raw = c ?? {}
  const defaultBoxes: MasterclassesBox[] = [
    { title: "LIVE Events", text: "Host powerful live sessions directly inside your community.", bullets: ["Schedule and promote upcoming sessions", "Engage members in real-time learning", "Record sessions for future viewing"] },
    { title: "Expert Led", text: "Invite experts to share their knowledge with your community.", bullets: ["Feature guest experts and speakers", "Deliver deep-dive training sessions", "Create high-value educational events"] },
    { title: "Lead Your Own", text: "Community owners can run their own masterclasses anytime.", bullets: ["Teach your expertise live", "Build authority in your niche", "Create repeat learning experiences"] },
  ]
  const rawBoxes = raw.boxes
  const boxes = Array.isArray(rawBoxes) && rawBoxes.length > 0
    ? (rawBoxes as Record<string, unknown>[]).map((b) => {
        const rawBullets = Array.isArray(b.bullets) ? (b.bullets as unknown[]).map((x) => String(x ?? "")) : [String(b.bullet1 ?? ""), String(b.bullet2 ?? ""), String(b.bullet3 ?? "")]
        const bullets = rawBullets.length >= 3 ? rawBullets.slice(0, 3) : [...rawBullets, ...Array(3 - Math.max(0, rawBullets.length)).fill("")]
        return { title: String(b.title ?? ""), text: String(b.text ?? ""), bullets }
      })
    : defaultBoxes
  return {
    headline: String(raw.headline ?? "Host Powerful Masterclasses Inside Your Community"),
    subheadline: String(raw.subheadline ?? "Bring your members together through live learning experiences led by experts and community leaders."),
    boxes,
    image: String(raw.image ?? ""),
  }
}

function normalizeMembershipPlansContent(c: Record<string, unknown> | undefined): Record<string, string | string[]> {
  const raw = c ?? {}
  const plans = Array.isArray(raw.plans) ? (raw.plans as string[]).filter((x) => typeof x === "string") : []
  return {
    headline: String(raw.headline ?? ""),
    subheadline: String(raw.subheadline ?? raw.intro ?? ""),
    plans,
  }
}

function normalizeFoundersBridgeContent(c: Record<string, unknown> | undefined): Record<string, string> {
  const raw = c ?? {}
  return {
    headline: String(raw.headline ?? ""),
    subheadline: String(raw.subheadline ?? raw.description ?? ""),
    button_text: String(raw.button_text ?? ""),
    button_url: String(raw.button_url ?? raw.button_link ?? ""),
  }
}

function normalizeGenericContent(c: Record<string, unknown> | undefined): Record<string, string | string[]> {
  const raw = c ?? {}
  const bullets = Array.isArray(raw.bullets) ? (raw.bullets as string[]).filter((x) => typeof x === "string") : []
  return {
    headline: String(raw.headline ?? ""),
    body: String(raw.body ?? ""),
    bullets,
    image: String(raw.image ?? raw.image_url ?? ""),
    video_url: String(raw.video_url ?? ""),
    layout: String(raw.layout ?? "image-right"),
  }
}

function normalizeToolHighlightContent(c: Record<string, unknown> | undefined): Record<string, string | ToolHighlightFeature[]> {
  const raw = c ?? {}
  const defaultFeatures: ToolHighlightFeature[] = [
    { icon: "", title: "Feature One", subtitle: "Short explanation of this feature" },
    { icon: "", title: "Feature Two", subtitle: "Short explanation of this feature" },
    { icon: "", title: "Feature Three", subtitle: "Short explanation of this feature" },
    { icon: "", title: "Feature Four", subtitle: "Short explanation of this feature" },
  ]
  const rawFeatures = raw.features
  const features = Array.isArray(rawFeatures) && rawFeatures.length > 0
    ? (rawFeatures as Record<string, unknown>[]).map((f) => ({
        icon: String(f.icon ?? ""),
        title: String(f.title ?? ""),
        subtitle: String(f.subtitle ?? ""),
      }))
    : defaultFeatures
  return {
    badge_title: String(raw.badge_title ?? "Powerful Feature"),
    headline: String(raw.headline ?? "Highlight Your Best Tools"),
    subheadline: String(raw.subheadline ?? "Showcase powerful tools available inside your community."),
    features,
    image: String(raw.image ?? ""),
  }
}

function normalizeMarketplaceSectionContent(c: Record<string, unknown> | undefined): Record<string, string | MarketplaceHighlight[]> {
  const raw = c ?? {}
  const defaultHighlights: MarketplaceHighlight[] = [
    { title: "Feature coaching and service offers", text: "Showcase your expertise through your offerings" },
    { title: "Create visibility with aligned members", text: "Reach people who already value what you do" },
    { title: "Build credibility through trusted association", text: "Your presence in the community adds authority" },
    { title: "Drive leads from community traffic", text: "Convert engaged members into clients" },
  ]
  const rawHighlights = raw.highlights
  const highlights = Array.isArray(rawHighlights) && rawHighlights.length > 0
    ? (rawHighlights as Record<string, unknown>[]).map((h) => ({
        title: String(h.title ?? ""),
        text: String(h.text ?? ""),
      }))
    : defaultHighlights
  return {
    headline: String(raw.headline ?? ""),
    subheadline: String(raw.subheadline ?? ""),
    highlights,
    image_url: String(raw.image_url ?? ""),
  }
}

function normalizeCoursesSectionContent(c: Record<string, unknown> | undefined): Record<string, string | CoursesSectionCard> {
  const raw = c ?? {}
  const defaultCard = (prefix: string, def: CoursesSectionCard) => {
    const o = (raw[prefix] as Record<string, unknown>) ?? {}
    return {
      description: String(o.description ?? def.description),
      bullet1: String(o.bullet1 ?? def.bullet1),
      bullet2: String(o.bullet2 ?? def.bullet2),
      bullet3: String(o.bullet3 ?? def.bullet3),
    }
  }
  return {
    headline: String(raw.headline ?? ""),
    subheadline: String(raw.subheadline ?? ""),
    free_courses: defaultCard("free_courses", {
      description: "Lead generation + onboarding into the community",
      bullet1: "Open to all visitors",
      bullet2: "Introduction to community value",
      bullet3: "Gateway to membership",
    }),
    member_courses: defaultCard("member_courses", {
      description: "Included for certain membership levels",
      bullet1: "Exclusive to paying members",
      bullet2: "Core transformation content",
      bullet3: "Ongoing learning path",
    }),
    paid_courses: defaultCard("paid_courses", {
      description: "Premium deep dives offered by selected creators",
      bullet1: "Advanced specialized training",
      bullet2: "Expert-led deep dives",
      bullet3: "Revenue opportunity for creators",
    }),
    featured_image: String(raw.featured_image ?? ""),
  }
}

function normalizeEducationSectionContent(c: Record<string, unknown> | undefined): Record<string, string | null> {
  const raw = c ?? {}
  return {
    headline: String(raw.headline ?? ""),
    description: String(raw.description ?? ""),
    expert_id: raw.expert_id ? String(raw.expert_id) : null,
    video_id: raw.video_id ? String(raw.video_id) : null,
    article_id: raw.article_id ? String(raw.article_id) : null,
    audio_id: raw.audio_id ? String(raw.audio_id) : null,
    document_id: raw.document_id ? String(raw.document_id) : null,
  }
}

function normalizeCommunityFeaturesContent(c: Record<string, unknown> | undefined): {
  headline: string
  features: CommunityFeaturesFeature[]
} {
  const raw = c ?? {}
  const rawFeatures = raw.features
  const features = Array.isArray(rawFeatures) && rawFeatures.length > 0
    ? (rawFeatures as Record<string, unknown>[]).map((f) => ({
        image: String(f.image ?? ""),
        title: String(f.title ?? ""),
        description: String(f.description ?? ""),
        bullet1: String(f.bullet1 ?? ""),
        bullet2: String(f.bullet2 ?? ""),
        bullet3: String(f.bullet3 ?? ""),
      }))
    : DEFAULT_COMMUNITY_FEATURES
  return {
    headline: String(raw.headline ?? ""),
    features,
  }
}

interface EditSectionModalProps {
  isOpen: boolean
  onClose: () => void
  section: SectionForEdit | null
  pageId: string
  onSave: (updatedSection: SectionForEdit) => void
}

export function EditSectionModal({
  isOpen,
  onClose,
  section,
  pageId,
  onSave,
}: EditSectionModalProps) {
  const [formData, setFormData] = useState<Record<string, string | string[]>>({})
  const [educationOptions, setEducationOptions] = useState<{
    experts: EducationExpertOption[]
    video: EducationContentOption[]
    article: EducationContentOption[]
    audio: EducationContentOption[]
    document: EducationContentOption[]
  } | null>(null)
  const [membershipPlans, setMembershipPlans] = useState<PlanForMembershipSection[]>([])

  useEffect(() => {
    if (!section) return
    const c = section.content ?? {}
    if (section.type === "hero") {
      setFormData(normalizeHeroContent(c as Record<string, unknown>))
    } else if (section.type === "community_vision") {
      setFormData(normalizeCommunityVisionContent(c as Record<string, unknown>) as Record<string, string | string[]>)
    } else if (section.type === "member_experience") {
      setFormData(normalizeMemberExperienceContent(c as Record<string, unknown>) as Record<string, string | string[] | MemberExperienceBox[]>)
    } else if (section.type === "community_features") {
      setFormData(normalizeCommunityFeaturesContent(c as Record<string, unknown>) as Record<string, string | string[] | CommunityFeaturesFeature[]>)
    } else if (section.type === "education_section" || section.type === "education") {
      setFormData(normalizeEducationSectionContent(c as Record<string, unknown>) as Record<string, string | string[]>)
    } else if (section.type === "courses_section" || section.type === "courses") {
      setFormData(normalizeCoursesSectionContent(c as Record<string, unknown>) as Record<string, string | string[] | CoursesSectionCard>)
    } else if (section.type === "marketplace_section" || section.type === "marketplace") {
      setFormData(normalizeMarketplaceSectionContent(c as Record<string, unknown>) as Record<string, string | string[] | MarketplaceHighlight[]>)
    } else if (section.type === "tool_highlight") {
      setFormData(normalizeToolHighlightContent(c as Record<string, unknown>) as Record<string, string | string[] | ToolHighlightFeature[]>)
    } else if (section.type === "masterclasses_highlight") {
      setFormData(normalizeMasterclassesContent(c as Record<string, unknown>) as Record<string, string | string[] | MasterclassesBox[]>)
    } else if (section.type === "membership_plans") {
      setFormData(normalizeMembershipPlansContent(c as Record<string, unknown>) as Record<string, string | string[]>)
    } else if (section.type === "founders_bridge") {
      setFormData(normalizeFoundersBridgeContent(c as Record<string, unknown>) as Record<string, string>)
    } else if (section.type === "generic") {
      setFormData(normalizeGenericContent(c as Record<string, unknown>) as Record<string, string | string[]>)
    } else {
      const flat: Record<string, string> = {}
      for (const [k, v] of Object.entries(c)) {
        if (typeof v === "string") flat[k] = v
        else if (Array.isArray(v)) flat[k] = (v as string[]).join("")
      }
      setFormData(flat)
    }
  }, [section])

  useEffect(() => {
    if (isOpen && (section?.type === "education_section" || section?.type === "education")) {
      getEducationSectionOptions().then(setEducationOptions)
    } else {
      setEducationOptions(null)
    }
  }, [isOpen, section?.type])

  useEffect(() => {
    if (isOpen && section?.type === "membership_plans") {
      getPlansForMembershipSection().then(setMembershipPlans)
    } else {
      setMembershipPlans([])
    }
  }, [isOpen, section?.type])

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleEducationIdChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleBulletsChange = (bullets: string[]) => {
    setFormData((prev) => ({ ...prev, bullets }))
  }

  const handleBoxesChange = (boxes: MemberExperienceBox[]) => {
    setFormData((prev) => ({ ...prev, boxes }))
  }

  const handleBoxChange = (index: number, updates: Partial<MemberExperienceBox>) => {
    const boxes = [...((formData.boxes as MemberExperienceBox[]) ?? [])]
    boxes[index] = { ...boxes[index], ...updates }
    handleBoxesChange(boxes)
  }

  const handleFeaturesChange = (features: CommunityFeaturesFeature[]) => {
    setFormData((prev) => ({ ...prev, features }))
  }

  const handleFeatureChange = (index: number, updates: Partial<CommunityFeaturesFeature>) => {
    const features = [...((formData.features as CommunityFeaturesFeature[]) ?? [])]
    features[index] = { ...features[index], ...updates }
    handleFeaturesChange(features)
  }

  const handleCoursesCardChange = (key: "free_courses" | "member_courses" | "paid_courses", field: string, value: string) => {
    const card = (formData[key] as CoursesSectionCard) ?? { description: "", bullet1: "", bullet2: "", bullet3: "" }
    setFormData((prev) => ({ ...prev, [key]: { ...card, [field]: value } }))
  }

  const handleHighlightsChange = (highlights: MarketplaceHighlight[]) => {
    setFormData((prev) => ({ ...prev, highlights }))
  }

  const handleHighlightChange = (index: number, updates: Partial<MarketplaceHighlight>) => {
    const highlights = [...((formData.highlights as MarketplaceHighlight[]) ?? [])]
    highlights[index] = { ...highlights[index], ...updates }
    handleHighlightsChange(highlights)
  }

  const handleToolFeaturesChange = (features: ToolHighlightFeature[]) => {
    setFormData((prev) => ({ ...prev, features }))
  }

  const handleToolFeatureChange = (index: number, updates: Partial<ToolHighlightFeature>) => {
    const features = [...((formData.features as ToolHighlightFeature[]) ?? [])]
    features[index] = { ...features[index], ...updates }
    handleToolFeaturesChange(features)
  }

  const handleMasterclassesBoxesChange = (boxes: MasterclassesBox[]) => {
    setFormData((prev) => ({ ...prev, boxes }))
  }

  const handleMasterclassesBoxChange = (index: number, updates: Partial<MasterclassesBox>) => {
    const boxes = [...((formData.boxes as MasterclassesBox[]) ?? [])]
    boxes[index] = { ...boxes[index], ...updates }
    handleMasterclassesBoxesChange(boxes)
  }

  const handleMembershipPlanToggle = (planId: string) => {
    const plans = (formData.plans as string[]) ?? []
    const next = plans.includes(planId) ? plans.filter((id) => id !== planId) : [...plans, planId]
    setFormData((prev) => ({ ...prev, plans: next }))
  }

  const handleGenericBulletsChange = (bullets: string[]) => {
    setFormData((prev) => ({ ...prev, bullets }))
  }

  const handleGenericBulletChange = (index: number, value: string) => {
    const bullets = [...((formData.bullets as string[]) ?? [])]
    bullets[index] = value
    handleGenericBulletsChange(bullets)
  }

  const handleSave = () => {
    if (!section) return
    if (section.type === "hero") {
      const heroContent = { ...formData, backgroundImage: formData.backgroundImage === true || formData.backgroundImage === "true" }
      onSave({
        ...section,
        content: heroContent as Record<string, unknown>,
        settings: section.settings ?? {},
      })
    } else if (section.type === "community_vision") {
      onSave({
        ...section,
        content: formData,
        settings: section.settings ?? {},
      })
    } else if (section.type === "member_experience") {
      onSave({
        ...section,
        content: formData,
        settings: section.settings ?? {},
      })
    } else if (section.type === "community_features") {
      onSave({
        ...section,
        content: formData,
        settings: section.settings ?? {},
      })
    } else if (section.type === "education_section" || section.type === "education") {
      const content: Record<string, string | null> = {
        headline: (formData.headline as string) ?? "",
        description: (formData.description as string) ?? "",
        expert_id: (formData.expert_id as string)?.trim() || null,
        video_id: (formData.video_id as string)?.trim() || null,
        article_id: (formData.article_id as string)?.trim() || null,
        audio_id: (formData.audio_id as string)?.trim() || null,
        document_id: (formData.document_id as string)?.trim() || null,
      }
      onSave({
        ...section,
        type: "education_section",
        content,
        settings: section.settings ?? {},
      })
    } else if (section.type === "courses_section" || section.type === "courses") {
      const free = (formData.free_courses as CoursesSectionCard) ?? {}
      const member = (formData.member_courses as CoursesSectionCard) ?? {}
      const paid = (formData.paid_courses as CoursesSectionCard) ?? {}
      onSave({
        ...section,
        type: "courses_section",
        content: {
          headline: (formData.headline as string) ?? "",
          subheadline: (formData.subheadline as string) ?? "",
          free_courses: { description: free.description ?? "", bullet1: free.bullet1 ?? "", bullet2: free.bullet2 ?? "", bullet3: free.bullet3 ?? "" },
          member_courses: { description: member.description ?? "", bullet1: member.bullet1 ?? "", bullet2: member.bullet2 ?? "", bullet3: member.bullet3 ?? "" },
          paid_courses: { description: paid.description ?? "", bullet1: paid.bullet1 ?? "", bullet2: paid.bullet2 ?? "", bullet3: paid.bullet3 ?? "" },
          featured_image: (formData.featured_image as string) ?? "",
        },
        settings: section.settings ?? {},
      })
    } else if (section.type === "marketplace_section" || section.type === "marketplace") {
      const highlights = (formData.highlights as MarketplaceHighlight[]) ?? []
      onSave({
        ...section,
        type: "marketplace_section",
        content: {
          headline: (formData.headline as string) ?? "",
          subheadline: (formData.subheadline as string) ?? "",
          highlights: highlights.map((h) => ({ title: h.title ?? "", text: h.text ?? "" })),
          image_url: (formData.image_url as string) ?? "",
        },
        settings: section.settings ?? {},
      })
    } else if (section.type === "tool_highlight") {
      const features = (formData.features as ToolHighlightFeature[]) ?? []
      onSave({
        ...section,
        type: "tool_highlight",
        content: {
          badge_title: (formData.badge_title as string) ?? "",
          headline: (formData.headline as string) ?? "",
          subheadline: (formData.subheadline as string) ?? "",
          features: features.map((f) => ({ icon: f.icon ?? "", title: f.title ?? "", subtitle: f.subtitle ?? "" })),
          image: (formData.image as string) ?? "",
        },
        settings: section.settings ?? {},
      })
    } else if (section.type === "masterclasses_highlight") {
      const boxes = (formData.boxes as MasterclassesBox[]) ?? []
      onSave({
        ...section,
        type: "masterclasses_highlight",
        content: {
          headline: (formData.headline as string) ?? "",
          subheadline: (formData.subheadline as string) ?? "",
          boxes: boxes.map((b) => {
            const bl = Array.isArray(b.bullets) ? b.bullets.slice(0, 3) : []
            const bullets = bl.length >= 3 ? bl : [...bl, ...Array(3 - bl.length).fill("")]
            return { title: b.title ?? "", text: b.text ?? "", bullets }
          }),
          image: (formData.image as string) ?? "",
        },
        settings: section.settings ?? {},
      })
    } else if (section.type === "membership_plans") {
      const plans = (formData.plans as string[]) ?? []
      onSave({
        ...section,
        type: "membership_plans",
        content: {
          headline: (formData.headline as string) ?? "",
          subheadline: (formData.subheadline as string) ?? "",
          plans,
        },
        settings: section.settings ?? {},
      })
    } else if (section.type === "founders_bridge") {
      onSave({
        ...section,
        type: "founders_bridge",
        content: {
          headline: (formData.headline as string) ?? "",
          subheadline: (formData.subheadline as string) ?? "",
          button_text: (formData.button_text as string) ?? "",
          button_url: (formData.button_url as string) ?? "",
        },
        settings: section.settings ?? {},
      })
    } else if (section.type === "generic") {
      const bullets = (formData.bullets as string[]) ?? []
      onSave({
        ...section,
        type: "generic",
        content: {
          headline: (formData.headline as string) ?? "",
          body: (formData.body as string) ?? "",
          bullets: bullets.filter((b) => typeof b === "string"),
          image: (formData.image as string) ?? "",
          video_url: (formData.video_url as string) ?? "",
          layout: (formData.layout as string) ?? "image-right",
        },
        settings: section.settings ?? {},
      })
    } else {
      const content: Record<string, string> = {}
      for (const [k, v] of Object.entries(formData)) {
        if (typeof v === "string") content[k] = v
      }
      onSave({
        ...section,
        content,
        settings: section.settings ?? {},
      })
    }
    onClose()
  }

  if (!section) return null

  const sectionTitle = SECTION_LABELS[section.type] ?? section.type

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-xl shadow-xl border bg-white"
        showCloseButton={true}
      >
        <div className="overflow-y-auto flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <DialogTitle className="text-lg font-semibold">
              {sectionTitle} Section
            </DialogTitle>
          </div>

          {section.type === "hero" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                  <Input
                    type="text"
                    value={(formData.headline as string) ?? ""}
                    onChange={(e) => handleChange("headline", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Text</label>
                  <textarea
                    value={(formData.hero_text as string) ?? ""}
                    onChange={(e) => handleChange("hero_text", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button Text</label>
                  <Input
                    type="text"
                    value={(formData.primary_button_text as string) ?? ""}
                    onChange={(e) => handleChange("primary_button_text", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button Anchor Target</label>
                  <select
                    value={(formData.primary_button_anchor as string) ?? "#membership-plans"}
                    onChange={(e) => handleChange("primary_button_anchor", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {HERO_ANCHOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                  <Input
                    type="url"
                    value={(formData.video_url as string) ?? ""}
                    onChange={(e) => handleChange("video_url", e.target.value)}
                    placeholder="https://..."
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image</label>
                  <ImageUploader
                    pageId={pageId}
                    value={(formData.hero_image as string) ?? ""}
                    onChange={(url) => handleChange("hero_image", url)}
                  />
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.backgroundImage === true || formData.backgroundImage === "true"}
                      onChange={(e) =>
                        handleChange("backgroundImage", e.target.checked ? "true" : "false")
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Make image background to hero</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {section.type === "community_vision" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                  <Input
                    type="text"
                    value={(formData.headline as string) ?? ""}
                    onChange={(e) => handleChange("headline", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                  <textarea
                    value={(formData.body as string) ?? ""}
                    onChange={(e) => handleChange("body", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Box Subheadline</label>
                  <Input
                    type="text"
                    value={(formData.box_subheadline as string) ?? "Who it's for:"}
                    onChange={(e) => handleChange("box_subheadline", e.target.value)}
                    placeholder="Who it's for:"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bullets</label>
                  <div className="space-y-2">
                    {((formData.bullets as string[]) ?? []).map((bullet, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const bullets = [...((formData.bullets as string[]) ?? [])]
                            bullets[i] = e.target.value
                            handleBulletsChange(bullets)
                          }}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const bullets = ((formData.bullets as string[]) ?? []).filter((_, j) => j !== i)
                            handleBulletsChange(bullets)
                          }}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const bullets = [...((formData.bullets as string[]) ?? []), ""]
                        handleBulletsChange(bullets)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Bullet
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <ImageUploader
                  pageId={pageId}
                  value={(formData.image as string) ?? ""}
                  onChange={(url) => handleChange("image", url)}
                />
              </div>
            </div>
          )}

          {(section.type === "courses_section" || section.type === "courses") && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <Input
                  type="text"
                  value={(formData.headline as string) ?? ""}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                <textarea
                  value={(formData.subheadline as string) ?? ""}
                  onChange={(e) => handleChange("subheadline", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Free Courses</h3>
                <div className="p-4 bg-green-50/50 rounded-xl border border-green-100 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <Input
                      type="text"
                      value={((formData.free_courses as CoursesSectionCard)?.description) ?? ""}
                      onChange={(e) => handleCoursesCardChange("free_courses", "description", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 1</label>
                    <Input
                      type="text"
                      value={((formData.free_courses as CoursesSectionCard)?.bullet1) ?? ""}
                      onChange={(e) => handleCoursesCardChange("free_courses", "bullet1", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 2</label>
                    <Input
                      type="text"
                      value={((formData.free_courses as CoursesSectionCard)?.bullet2) ?? ""}
                      onChange={(e) => handleCoursesCardChange("free_courses", "bullet2", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 3</label>
                    <Input
                      type="text"
                      value={((formData.free_courses as CoursesSectionCard)?.bullet3) ?? ""}
                      onChange={(e) => handleCoursesCardChange("free_courses", "bullet3", e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Member-Level Courses</h3>
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <Input
                      type="text"
                      value={((formData.member_courses as CoursesSectionCard)?.description) ?? ""}
                      onChange={(e) => handleCoursesCardChange("member_courses", "description", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 1</label>
                    <Input
                      type="text"
                      value={((formData.member_courses as CoursesSectionCard)?.bullet1) ?? ""}
                      onChange={(e) => handleCoursesCardChange("member_courses", "bullet1", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 2</label>
                    <Input
                      type="text"
                      value={((formData.member_courses as CoursesSectionCard)?.bullet2) ?? ""}
                      onChange={(e) => handleCoursesCardChange("member_courses", "bullet2", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 3</label>
                    <Input
                      type="text"
                      value={((formData.member_courses as CoursesSectionCard)?.bullet3) ?? ""}
                      onChange={(e) => handleCoursesCardChange("member_courses", "bullet3", e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Paid Courses</h3>
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <Input
                      type="text"
                      value={((formData.paid_courses as CoursesSectionCard)?.description) ?? ""}
                      onChange={(e) => handleCoursesCardChange("paid_courses", "description", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 1</label>
                    <Input
                      type="text"
                      value={((formData.paid_courses as CoursesSectionCard)?.bullet1) ?? ""}
                      onChange={(e) => handleCoursesCardChange("paid_courses", "bullet1", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 2</label>
                    <Input
                      type="text"
                      value={((formData.paid_courses as CoursesSectionCard)?.bullet2) ?? ""}
                      onChange={(e) => handleCoursesCardChange("paid_courses", "bullet2", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 3</label>
                    <Input
                      type="text"
                      value={((formData.paid_courses as CoursesSectionCard)?.bullet3) ?? ""}
                      onChange={(e) => handleCoursesCardChange("paid_courses", "bullet3", e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                <ImageUploader
                  pageId={pageId}
                  value={(formData.featured_image as string) ?? ""}
                  onChange={(url) => handleChange("featured_image", url)}
                />
              </div>
            </div>
          )}

          {(section.type === "marketplace_section" || section.type === "marketplace") && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <Input
                  type="text"
                  value={(formData.headline as string) ?? ""}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                <textarea
                  value={(formData.subheadline as string) ?? ""}
                  onChange={(e) => handleChange("subheadline", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Highlights</h3>
                <div className="space-y-4">
                  {((formData.highlights as MarketplaceHighlight[]) ?? []).map((highlight, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-600">Highlight {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const highlights = ((formData.highlights as MarketplaceHighlight[]) ?? []).filter((_, j) => j !== i)
                            handleHighlightsChange(highlights)
                          }}
                          className="text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          Remove Highlight
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                        <Input
                          type="text"
                          value={highlight.title}
                          onChange={(e) => handleHighlightChange(i, { title: e.target.value })}
                          className="w-full"
                          placeholder="Bold title"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Text</label>
                        <Input
                          type="text"
                          value={highlight.text}
                          onChange={(e) => handleHighlightChange(i, { text: e.target.value })}
                          className="w-full"
                          placeholder="Supporting text"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const highlights = [...((formData.highlights as MarketplaceHighlight[]) ?? []), { title: "", text: "" }]
                      handleHighlightsChange(highlights)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Highlight
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace Image</label>
                <ImageUploader
                  pageId={pageId}
                  value={(formData.image_url as string) ?? ""}
                  onChange={(url) => handleChange("image_url", url)}
                />
              </div>
            </div>
          )}

          {section.type === "masterclasses_highlight" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <Input
                  type="text"
                  value={(formData.headline as string) ?? ""}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                <textarea
                  value={(formData.subheadline as string) ?? ""}
                  onChange={(e) => handleChange("subheadline", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Feature Boxes</h3>
                <div className="space-y-4">
                  {((formData.boxes as MasterclassesBox[]) ?? []).map((box, i) => (
                    <div key={i} className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <div className="font-medium text-gray-700">Box {i + 1}</div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                        <Input
                          type="text"
                          value={box.title}
                          onChange={(e) => handleMasterclassesBoxChange(i, { title: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description Text</label>
                        <Input
                          type="text"
                          value={box.text}
                          onChange={(e) => handleMasterclassesBoxChange(i, { text: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Bullets</label>
                        <div className="space-y-2">
                          {[0, 1, 2].map((j) => (
                            <Input
                              key={j}
                              type="text"
                              value={box.bullets?.[j] ?? ""}
                              onChange={(e) => {
                                const bullets = [...(box.bullets ?? ["", "", ""])]
                                bullets[j] = e.target.value
                                handleMasterclassesBoxChange(i, { bullets })
                              }}
                              className="w-full"
                              placeholder={`Bullet ${j + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Masterclass Image Upload</label>
                <p className="text-xs text-gray-500 mb-2">This image appears on the right side of the section.</p>
                <ImageUploader
                  pageId={pageId}
                  value={(formData.image as string) ?? ""}
                  onChange={(url) => handleChange("image", url)}
                />
              </div>
            </div>
          )}

          {section.type === "tool_highlight" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Title</label>
                <Input
                  type="text"
                  value={(formData.badge_title as string) ?? ""}
                  onChange={(e) => handleChange("badge_title", e.target.value)}
                  className="w-full"
                  placeholder="e.g. Powerful Feature"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <Input
                  type="text"
                  value={(formData.headline as string) ?? ""}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                <textarea
                  value={(formData.subheadline as string) ?? ""}
                  onChange={(e) => handleChange("subheadline", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Feature Boxes</h3>
                <div className="space-y-4">
                  {((formData.features as ToolHighlightFeature[]) ?? []).map((feature, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-600">Feature {i + 1}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const features = [...((formData.features as ToolHighlightFeature[]) ?? [])]
                              const duplicated = { ...features[i] }
                              features.splice(i + 1, 0, duplicated)
                              handleToolFeaturesChange(features)
                            }}
                            className="text-sm text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const features = ((formData.features as ToolHighlightFeature[]) ?? []).filter((_, j) => j !== i)
                              handleToolFeaturesChange(features)
                            }}
                            className="text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Icon Upload</label>
                        <ImageUploader
                          pageId={pageId}
                          value={feature.icon}
                          onChange={(url) => handleToolFeatureChange(i, { icon: url })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                        <Input
                          type="text"
                          value={feature.title}
                          onChange={(e) => handleToolFeatureChange(i, { title: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
                        <Input
                          type="text"
                          value={feature.subtitle}
                          onChange={(e) => handleToolFeatureChange(i, { subtitle: e.target.value })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const features = [...((formData.features as ToolHighlightFeature[]) ?? []), { icon: "", title: "", subtitle: "" }]
                      handleToolFeaturesChange(features)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add Feature
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Large Image Upload</label>
                <p className="text-xs text-gray-500 mb-2">Main screenshot shown on the right side</p>
                <ImageUploader
                  pageId={pageId}
                  value={(formData.image as string) ?? ""}
                  onChange={(url) => handleChange("image", url)}
                />
              </div>
            </div>
          )}

          {section.type === "membership_plans" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <Input
                  type="text"
                  value={(formData.headline as string) ?? ""}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                <textarea
                  value={(formData.subheadline as string) ?? ""}
                  onChange={(e) => handleChange("subheadline", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-4">Choose which plans appear on this sales page. Order reflects selection order.</p>
                <div className="space-y-2">
                  {membershipPlans.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">No active plans. Create plans in Admin → Plans.</p>
                  ) : (
                    (() => {
                      const selectedIds = (formData.plans as string[]) ?? []
                      const selectedFirst = selectedIds
                        .map((id) => membershipPlans.find((p) => p.id === id))
                        .filter((p): p is PlanForMembershipSection => p != null)
                      const unselected = membershipPlans.filter((p) => !selectedIds.includes(p.id))
                      const orderedPlans = [...selectedFirst, ...unselected]
                      return orderedPlans.map((plan) => (
                        <label
                          key={plan.id}
                          className="flex items-center gap-4 py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(plan.id)}
                            onChange={() => handleMembershipPlanToggle(plan.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900">{plan.name}</span>
                              {plan.most_popular && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">Most Popular</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">
                              {plan.price != null && plan.currency != null
                                ? `${plan.currency} ${plan.price}`
                                : plan.price != null
                                  ? String(plan.price)
                                  : "—"}
                              {plan.billing ? ` / ${plan.billing}` : ""}
                            </div>
                          </div>
                        </label>
                      ))
                    })()
                  )}
                </div>
              </div>
            </div>
          )}

          {section.type === "founders_bridge" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <Input
                  type="text"
                  value={(formData.headline as string) ?? ""}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                <textarea
                  value={(formData.subheadline as string) ?? ""}
                  onChange={(e) => handleChange("subheadline", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                <Input
                  type="text"
                  value={(formData.button_text as string) ?? ""}
                  onChange={(e) => handleChange("button_text", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button URL</label>
                <Input
                  type="url"
                  value={(formData.button_url as string) ?? ""}
                  onChange={(e) => handleChange("button_url", e.target.value)}
                  placeholder="https://..."
                  className="w-full"
                />
              </div>
            </div>
          )}

          {section.type === "generic" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <Input
                  type="text"
                  value={(formData.headline as string) ?? ""}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  value={(formData.body as string) ?? ""}
                  onChange={(e) => handleChange("body", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Bullets</label>
                <div className="space-y-2">
                  {((formData.bullets as string[]) ?? []).map((bullet, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        type="text"
                        value={bullet}
                        onChange={(e) => handleGenericBulletChange(i, e.target.value)}
                        placeholder="Bullet text"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleGenericBulletsChange(((formData.bullets as string[]) ?? []).filter((_, j) => j !== i))}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleGenericBulletsChange([...((formData.bullets as string[]) ?? []), ""])}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Bullet
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Upload</label>
                <ImageUploader
                  pageId={pageId}
                  value={(formData.image as string) ?? ""}
                  onChange={(url) => handleChange("image", url)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL <span className="text-gray-400">(optional)</span></label>
                <Input
                  type="url"
                  value={(formData.video_url as string) ?? ""}
                  onChange={(e) => handleChange("video_url", e.target.value)}
                  placeholder="YouTube or video embed URL"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
                <select
                  value={(formData.layout as string) ?? "image-right"}
                  onChange={(e) => handleChange("layout", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="image-right">Image Right</option>
                  <option value="image-left">Image Left</option>
                  <option value="video-right">Video Right</option>
                  <option value="video-left">Video Left</option>
                </select>
              </div>
            </div>
          )}

          {(section.type === "education_section" || section.type === "education") && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <Input
                  type="text"
                  value={(formData.headline as string) ?? ""}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={(formData.description as string) ?? ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Featured Expert</h3>
                <select
                  value={(formData.expert_id as string) ?? ""}
                  onChange={(e) => handleEducationIdChange("expert_id", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">None</option>
                  {educationOptions?.experts.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                {(formData.expert_id as string) && educationOptions?.experts.find((e) => e.id === formData.expert_id) && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 flex gap-4">
                    <img
                      src={educationOptions.experts.find((e) => e.id === formData.expert_id)!.image_url || "https://placehold.co/64x64?text=Expert"}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">
                        {educationOptions.experts.find((e) => e.id === formData.expert_id)!.name}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {educationOptions.experts.find((e) => e.id === formData.expert_id)!.bio || "No bio"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Featured Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Video</label>
                    <select
                      value={(formData.video_id as string) ?? ""}
                      onChange={(e) => handleEducationIdChange("video_id", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">None</option>
                      {educationOptions?.video.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Article</label>
                    <select
                      value={(formData.article_id as string) ?? ""}
                      onChange={(e) => handleEducationIdChange("article_id", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">None</option>
                      {educationOptions?.article.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Audio</label>
                    <select
                      value={(formData.audio_id as string) ?? ""}
                      onChange={(e) => handleEducationIdChange("audio_id", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">None</option>
                      {educationOptions?.audio.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Document</label>
                    <select
                      value={(formData.document_id as string) ?? ""}
                      onChange={(e) => handleEducationIdChange("document_id", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">None</option>
                      {educationOptions?.document.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Content preview cards */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {((formData.video_id as string) && educationOptions?.video.find((c) => c.id === formData.video_id)) && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex gap-3">
                        <img
                          src={educationOptions!.video.find((c) => c.id === formData.video_id)!.image_url || "https://placehold.co/96x72?text=Video"}
                          alt=""
                          className="w-24 h-16 object-cover rounded shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">
                            {educationOptions!.video.find((c) => c.id === formData.video_id)!.title}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {educationOptions!.video.find((c) => c.id === formData.video_id)!.description || ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {((formData.article_id as string) && educationOptions?.article.find((c) => c.id === formData.article_id)) && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex gap-3">
                        <img
                          src={educationOptions!.article.find((c) => c.id === formData.article_id)!.image_url || "https://placehold.co/96x72?text=Article"}
                          alt=""
                          className="w-24 h-16 object-cover rounded shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">
                            {educationOptions!.article.find((c) => c.id === formData.article_id)!.title}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {educationOptions!.article.find((c) => c.id === formData.article_id)!.description || ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {((formData.audio_id as string) && educationOptions?.audio.find((c) => c.id === formData.audio_id)) && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex gap-3">
                        <img
                          src={educationOptions!.audio.find((c) => c.id === formData.audio_id)!.image_url || "https://placehold.co/96x72?text=Audio"}
                          alt=""
                          className="w-24 h-16 object-cover rounded shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">
                            {educationOptions!.audio.find((c) => c.id === formData.audio_id)!.title}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {educationOptions!.audio.find((c) => c.id === formData.audio_id)!.description || ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {((formData.document_id as string) && educationOptions?.document.find((c) => c.id === formData.document_id)) && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex gap-3">
                        <img
                          src={educationOptions!.document.find((c) => c.id === formData.document_id)!.image_url || "https://placehold.co/96x72?text=Doc"}
                          alt=""
                          className="w-24 h-16 object-cover rounded shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">
                            {educationOptions!.document.find((c) => c.id === formData.document_id)!.title}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {educationOptions!.document.find((c) => c.id === formData.document_id)!.description || ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {section.type === "community_features" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <Input
                  type="text"
                  value={(formData.headline as string) ?? ""}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Community Features</h3>
                <div className="space-y-4">
                  {((formData.features as CommunityFeaturesFeature[]) ?? []).map((feature, i) => (
                    <div
                      key={i}
                      className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-700">Feature {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const features = ((formData.features as CommunityFeaturesFeature[]) ?? []).filter((_, j) => j !== i)
                            handleFeaturesChange(features)
                          }}
                          className="text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          Remove Feature
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Image Upload</label>
                        <ImageUploader
                          pageId={pageId}
                          value={feature.image}
                          onChange={(url) => handleFeatureChange(i, { image: url })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                        <Input
                          type="text"
                          value={feature.title}
                          onChange={(e) => handleFeatureChange(i, { title: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                        <textarea
                          value={feature.description}
                          onChange={(e) => handleFeatureChange(i, { description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 1</label>
                          <Input
                            type="text"
                            value={feature.bullet1}
                            onChange={(e) => handleFeatureChange(i, { bullet1: e.target.value })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 2</label>
                          <Input
                            type="text"
                            value={feature.bullet2}
                            onChange={(e) => handleFeatureChange(i, { bullet2: e.target.value })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 3</label>
                          <Input
                            type="text"
                            value={feature.bullet3}
                            onChange={(e) => handleFeatureChange(i, { bullet3: e.target.value })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const features = [...((formData.features as CommunityFeaturesFeature[]) ?? []), {
                        image: "",
                        title: "",
                        description: "",
                        bullet1: "",
                        bullet2: "",
                        bullet3: "",
                      }]
                      handleFeaturesChange(features)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>
            </div>
          )}

          {section.type === "member_experience" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                  <Input
                    type="text"
                    value={(formData.headline as string) ?? ""}
                    onChange={(e) => handleChange("headline", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                  <Input
                    type="text"
                    value={(formData.subheadline as string) ?? ""}
                    onChange={(e) => handleChange("subheadline", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Experience Boxes</h3>
                <div className="space-y-4">
                  {((formData.boxes as MemberExperienceBox[]) ?? []).map((box, i) => (
                    <div
                      key={i}
                      className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-700">Box {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const boxes = ((formData.boxes as MemberExperienceBox[]) ?? []).filter((_, j) => j !== i)
                            handleBoxesChange(boxes)
                          }}
                          className="text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          Remove Box
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                        <ImageUploader
                          pageId={pageId}
                          value={box.icon}
                          onChange={(url) => handleBoxChange(i, { icon: url })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                        <Input
                          type="text"
                          value={box.title}
                          onChange={(e) => handleBoxChange(i, { title: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 1</label>
                          <Input
                            type="text"
                            value={box.bullet1}
                            onChange={(e) => handleBoxChange(i, { bullet1: e.target.value })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 2</label>
                          <Input
                            type="text"
                            value={box.bullet2}
                            onChange={(e) => handleBoxChange(i, { bullet2: e.target.value })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Bullet 3</label>
                          <Input
                            type="text"
                            value={box.bullet3}
                            onChange={(e) => handleBoxChange(i, { bullet3: e.target.value })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const boxes = [...((formData.boxes as MemberExperienceBox[]) ?? []), {
                        icon: "",
                        title: "",
                        bullet1: "",
                        bullet2: "",
                        bullet3: "",
                      }]
                      handleBoxesChange(boxes)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Experience Box
                  </button>
                </div>
              </div>
            </div>
          )}

          {section.type !== "hero" && section.type !== "community_vision" && section.type !== "member_experience" && section.type !== "community_features" && section.type !== "education_section" && section.type !== "education" && section.type !== "courses_section" && section.type !== "courses" && section.type !== "marketplace_section" && section.type !== "marketplace" && section.type !== "tool_highlight" && section.type !== "masterclasses_highlight" && section.type !== "membership_plans" && section.type !== "founders_bridge" && section.type !== "generic" && (() => {
            const fields = getSectionFields(section.type)
            if (fields.length === 0) return null
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map((field) => (
                  <div key={field.key} className={field.kind === "textarea" ? "md:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    {field.kind === "input" && (
                      <Input
                        type="text"
                        value={(formData[field.key] as string) ?? ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full"
                      />
                    )}
                    {field.kind === "textarea" && (
                      <textarea
                        value={(formData[field.key] as string) ?? ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                    {field.kind === "image_url" && (
                      <ImageUploader
                        pageId={pageId}
                        value={(formData[field.key] as string) ?? ""}
                        onChange={(url) => handleChange(field.key, url)}
                      />
                    )}
                    {field.kind === "link_url" && (
                      <Input
                        type="url"
                        value={(formData[field.key] as string) ?? ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder="https://..."
                        className="w-full"
                      />
                    )}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t px-6 pb-6 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md"
          >
            Save Section
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
