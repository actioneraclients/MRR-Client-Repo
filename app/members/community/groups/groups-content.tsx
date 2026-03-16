import { createClient } from "@/lib/supabase/server"
import { getUserGroupsForListing } from "./actions"
import { getGroupCategories } from "./actions/get-group-categories"
import { canUserCreateGroups } from "./actions/can-user-create-groups"
import { canUserCreatePrivateGroup } from "./actions/can-user-create-private-group"
import { getAdminJoinRequests } from "./actions/get-admin-join-requests"
import GroupsListingUI from "./groups-listing-ui"

export default async function GroupsContent() {
  const supabase = await createClient()
  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("upgrade_link")
    .limit(1)
    .maybeSingle()
  const upgradeLink = siteSettings?.upgrade_link ?? null

  const [groups, categories, canCreateGroups, canCreatePrivateGroup, adminJoinRequests] = await Promise.all([
    getUserGroupsForListing(),
    getGroupCategories(),
    canUserCreateGroups(),
    canUserCreatePrivateGroup(),
    getAdminJoinRequests(),
  ])

  return (
    <GroupsListingUI
      initialGroups={groups}
      categories={categories}
      canCreateGroups={canCreateGroups}
      canCreatePrivateGroup={canCreatePrivateGroup}
      adminJoinRequests={adminJoinRequests}
      upgradeLink={upgradeLink}
    />
  )
}
