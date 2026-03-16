/**
 * Central registry for Sales Page Builder section types.
 * Maps section type keys to display labels.
 */
export const SECTION_REGISTRY: Record<string, string> = {
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

export function getSectionLabel(type: string): string {
  return SECTION_REGISTRY[type] ?? type
}
