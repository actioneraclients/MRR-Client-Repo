import AdminExpertsClient from "./experts-client"
import { getAdminExperts, getProfilesForExpertSelect, getExpertTags } from "./actions"

export default async function ExpertsPage() {
  const [expertsResult, profilesResult, tagsResult] = await Promise.all([
    getAdminExperts(),
    getProfilesForExpertSelect(),
    getExpertTags(),
  ])

  // Map to client-expected format
  const experts = expertsResult.items.map((item) => ({
    id: item.id,
    profile_id: item.profile_id,
    name: item.name,
    title: item.title || "",
    business_name: item.business_name,
    avatar_url: item.image_url,
    expert_tags: item.expert_tags || [],
    status: item.is_active ? ("active" as const) : ("inactive" as const),
    bio: null as string | null,
    business_about: null as string | null,
    website_url: null as string | null,
    slug: item.slug,
  }))

  return <AdminExpertsClient initialItems={experts} profiles={profilesResult.profiles} expertTags={tagsResult.tags} />
}
