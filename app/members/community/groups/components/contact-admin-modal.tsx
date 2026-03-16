"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getGroupOwnerInfo } from "../actions/group-join-requests"

interface ContactAdminModalProps {
  open: boolean
  onClose: () => void
  groupId: string
  groupName: string
}

export function ContactAdminModal({ open, onClose, groupId, groupName }: ContactAdminModalProps) {
  const [message, setMessage] = useState("")
  const [ownerName, setOwnerName] = useState("the group admin")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (open && groupId) {
      setMessage(
        `Hi,\n\nRegarding my request to join the "${groupName}" group, I would like to inquire about the reason why my request was denied.\n\nThank you.`,
      )
      getGroupOwnerInfo(groupId).then((result) => {
        if (result.success && result.owner) {
          setOwnerName(result.owner.display_name)
        }
      })
    }
  }, [open, groupId, groupName])

  const handleSend = async () => {
    setIsSending(true)
    // For now, just show confirmation - actual messaging integration would go here
    alert(`Message sent to ${ownerName}`)
    setIsSending(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Group Admin</DialogTitle>
          <DialogDescription>
            Send a message to {ownerName} regarding your membership request for "{groupName}".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Write your message..."
            className="w-full"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !message.trim()}>
            {isSending ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
