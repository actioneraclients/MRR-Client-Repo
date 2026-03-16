"use client"

import Link from "next/link"

type Props = {
  canCreateCourses: boolean
  remainingCourses: number | null
  brandAccentColor: string | null
  label?: string
}

export function CreateCourseButton({
  canCreateCourses,
  remainingCourses,
  brandAccentColor,
  label = "Create Course",
}: Props) {
  if (!canCreateCourses) {
    return null
  }

  const isDisabled = remainingCourses === 0
  const buttonClassName =
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors " +
    (isDisabled
      ? "bg-gray-400 text-white cursor-not-allowed"
      : "text-white hover:brightness-90")

  return (
    <div className="flex flex-col items-end shrink-0">
      {isDisabled ? (
        <span className={buttonClassName}>
          <i className="fa-solid fa-plus text-xs"></i>
          {label}
        </span>
      ) : (
        <Link
          href="/members/courses/builder/new"
          className={buttonClassName}
          style={
            brandAccentColor
              ? { backgroundColor: brandAccentColor }
              : { backgroundColor: "#111827" }
          }
        >
          <i className="fa-solid fa-plus text-xs"></i>
          {label}
        </Link>
      )}
      {remainingCourses !== null && remainingCourses > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          You have {remainingCourses} course{remainingCourses !== 1 ? "s" : ""}{" "}
          remaining.
        </p>
      )}
      {remainingCourses === 0 && (
        <p className="text-xs text-red-600 mt-1">
          You have hit your course creation limit.{" "}
          <Link href="/members/support" className="underline">
            Contact Support
          </Link>{" "}
          to purchase more.
        </p>
      )}
    </div>
  )
}
