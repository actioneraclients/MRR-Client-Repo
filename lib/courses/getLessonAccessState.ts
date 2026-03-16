export type LessonAccessState = "LOCKED" | "AVAILABLE" | "CURRENT" | "COMPLETED"

export type LessonRecord = {
  id: string
  release_date?: string | null
  drip_days?: number | null
  requires_previous_completion?: boolean | null
}

export type ProgressRecord = {
  completed?: boolean
  completed_at?: string
}

export type EnrollmentRecord = {
  started_at?: string | null
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getLessonAccessState({
  lesson,
  previousLesson,
  progressMap,
  enrollment,
}: {
  lesson: LessonRecord
  previousLesson?: LessonRecord | null
  progressMap: Record<string, ProgressRecord>
  enrollment: EnrollmentRecord
}): LessonAccessState {
  const now = new Date()

  // FIRST LESSON OF COURSE → ALWAYS AVAILABLE
  if (!previousLesson) {
    const progress = progressMap[lesson.id]
    if (progress?.completed) return "COMPLETED"
    return "AVAILABLE"
  }

  const progress = progressMap[lesson.id]

  if (progress?.completed) {
    return "COMPLETED"
  }

  // If lesson.release_date exists and release_date > now → LOCKED
  if (lesson.release_date) {
    const releaseDate = new Date(lesson.release_date)
    if (releaseDate > now) {
      return "LOCKED"
    }
  }

  // If lesson.drip_days exists → release = enrollment.started_at + drip_days, if release > now → LOCKED
  if (lesson.drip_days != null && lesson.drip_days > 0 && enrollment?.started_at) {
    const startedAt = new Date(enrollment.started_at)
    const release = addDays(startedAt, lesson.drip_days)
    if (release > now) {
      return "LOCKED"
    }
  }

  // If lesson.requires_previous_completion = true AND previousLesson NOT completed → LOCKED
  if (lesson.requires_previous_completion) {
    const prevProgress = progressMap[previousLesson.id]
    if (!prevProgress?.completed) {
      return "LOCKED"
    }
  }

  // 6. Otherwise → AVAILABLE
  return "AVAILABLE"
}
