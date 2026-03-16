export type BlockType =
  | "headline"
  | "section"
  | "text"
  | "video"
  | "image"
  | "audio"
  | "download"
  | "journal"
  | "callout"
  | "divider"
  | "embed"

export interface BaseBlock {
  id: string
  type: BlockType
}

export interface HeadlineBlock extends BaseBlock {
  type: "headline"
  content: string
}

export interface SectionBlock extends BaseBlock {
  type: "section"
  content: string
}

export interface TextBlock extends BaseBlock {
  type: "text"
  content: string
}

export interface ImageBlock extends BaseBlock {
  type: "image"
  imageUrl: string
  caption?: string
}

export interface VideoBlock extends BaseBlock {
  type: "video"
  videoUrl: string
  description?: string
}

export interface AudioBlock extends BaseBlock {
  type: "audio"
  audio_url: string
  description?: string
}

export interface DownloadBlock extends BaseBlock {
  type: "download"
  file_url: string
  file_name: string
  description?: string
}

export interface JournalBlock extends BaseBlock {
  type: "journal"
  question: string
}

export interface CalloutBlock extends BaseBlock {
  type: "callout"
  content: string
}

export interface DividerBlock extends BaseBlock {
  type: "divider"
}

export interface EmbedBlock extends BaseBlock {
  type: "embed"
  embed: string
}

export type CourseBlock =
  | HeadlineBlock
  | SectionBlock
  | TextBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | DownloadBlock
  | JournalBlock
  | CalloutBlock
  | DividerBlock
  | EmbedBlock

export function parseCourseBlocks(data: unknown): CourseBlock[] {
  if (!Array.isArray(data)) return []
  return data as CourseBlock[]
}
