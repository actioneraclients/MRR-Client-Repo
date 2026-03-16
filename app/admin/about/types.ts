export type AboutSection = {
  id: string
  type: string
  enabled: boolean
  background_mode?: string
  background_color?: string
  content: any
}

export type TeamMember = {
  id: string
  name: string
  role: string
  image_url?: string
  bio?: string
}
