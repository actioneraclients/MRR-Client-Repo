// Type definitions for Member Feed / Community feature

export interface FeedPost {
  id: string
  author_id: string
  body: string
  image_url: string | null
  document_url: string | null
  document_name: string | null
  link_url: string | null
  video_url: string | null
  context_type: string
  context_id?: string | null
  context_label: string
  parent_id: string | null
  status: string
  created_at: string
  // Joined from profiles
  author?: {
    name?: string
    display_name?: string
    avatar_url: string | null
  }
  // Computed
  replies?: FeedReply[]
}

export interface FeedReply {
  id: string
  author_id: string
  body: string
  parent_id: string
  status: string
  created_at: string
  video_url?: string | null
  // Joined from profiles
  author?: {
    name?: string
    display_name?: string
    avatar_url: string | null
  }
}

// Legacy types kept for backwards compatibility with admin
export interface Post {
  id: string
  author_id: string
  content: string
  photo_url: string | null
  document_url: string | null
  document_name: string | null
  created_at: string
  updated_at: string
  author?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
  comments?: Comment[]
  comment_count?: number
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  author?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface Report {
  id: string
  reporter_id: string
  post_id: string | null
  comment_id: string | null
  reason: string
  details: string | null
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  created_at: string
}

export interface CommunityGuidelines {
  id: string
  content: string
  updated_at: string
  updated_by: string | null
}
