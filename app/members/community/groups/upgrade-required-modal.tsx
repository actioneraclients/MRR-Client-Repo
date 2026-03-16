"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface UpgradeRequiredModalProps {
  open: boolean
  onClose: () => void
  context?: "groups" | "events" | "content"
  upgradeLink?: string | null
}

export function UpgradeRequiredModal({ open, onClose, context = "groups", upgradeLink }: UpgradeRequiredModalProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    if (upgradeLink) {
      router.push(upgradeLink)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade Required</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-600">
            {context === "events"
              ? "Your current plan does not allow you to create events."
              : context === "content"
                ? "Your current plan does not allow you to create content."
                : "Your current plan does not allow you to create a group."}
            <br />
            {context === "events"
              ? "Upgrade to a plan that includes event creation."
              : context === "content"
                ? "Upgrade to a plan that includes content creation."
                : "Upgrade to a plan that includes group creation."}
          </p>
          <p className="text-gray-600 mt-4">
            {context === "events"
              ? "You can still view community events and attend them through the event websites."
              : context === "content"
                ? "You can still view and access all educational content in the library."
                : "You can, however, join a group if it is public or request to join if it's request to join."}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex flex-col items-center gap-1">
            <Button onClick={handleUpgrade} disabled={!upgradeLink}>
              Upgrade Plan
            </Button>
            {!upgradeLink && <span className="text-xs text-gray-500">Upgrade link not configured</span>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
