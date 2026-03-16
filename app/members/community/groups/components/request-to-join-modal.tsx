"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface RequestToJoinModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function RequestToJoinModal({ open, onClose, onConfirm }: RequestToJoinModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request to Join</DialogTitle>
          <DialogDescription>
            A request to join this group will be sent to the moderator. Once approved, you'll get access to this group.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Proceed</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
