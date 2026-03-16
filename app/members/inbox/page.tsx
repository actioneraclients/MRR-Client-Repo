"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  getConversations,
  getConversationMessages,
  getGroupMessages,
  markConversationRead,
  markGroupMessageRead,
  deleteConversation,
  deleteGroupMessage,
  sendMessage,
  type ConversationWithParticipant,
  type ConversationMessage,
} from "./actions"
import { getSiteUpdates, markSiteUpdateRead, markAllSiteUpdatesRead, type SiteUpdate } from "./site-updates-actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<"messages" | "updates" | "group">("messages")

  const [conversations, setConversations] = useState<ConversationWithParticipant[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [brandBackgroundColor] = useState<string>("#3B82F6")

  const [conversationModalOpen, setConversationModalOpen] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithParticipant | null>(null)
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isSendingReply, setIsSendingReply] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const [siteUpdates, setSiteUpdates] = useState<SiteUpdate[]>([])
  const [isLoadingSiteUpdates, setIsLoadingSiteUpdates] = useState(true)
  const [selectedUpdate, setSelectedUpdate] = useState<SiteUpdate | null>(null)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)

  const [groupMessages, setGroupMessages] = useState<any[]>([])
  const [isLoadingGroupMessages, setIsLoadingGroupMessages] = useState(true)
  const [selectedGroupMessage, setSelectedGroupMessage] = useState<any | null>(null)
  const [groupModalOpen, setGroupModalOpen] = useState(false)

  const hydrateConversationRow = async (conversation: ConversationWithParticipant) => {
    try {
      const messages = await getConversationMessages(conversation.id)

      const latest = messages.length > 0 ? messages[messages.length - 1] : null
      const firstIncoming = messages.find((m) => m.sender_id === conversation.other_user_id)

      const hydratedName =
        conversation.other_user_name && conversation.other_user_name !== "Unknown User"
          ? conversation.other_user_name
          : firstIncoming?.sender_name || "Unknown User"
      const hydratedAvatar = conversation.other_user_avatar_url || firstIncoming?.sender_avatar_url || undefined

      return {
        ...conversation,
        other_user_name: hydratedName,
        other_user_avatar_url: hydratedAvatar,
        latest_message_body: (conversation as any).latest_message_body || latest?.body || null,
      } as ConversationWithParticipant & { latest_message_body?: string | null }
    } catch (e) {
      console.error("hydrateConversationRow error:", e)
      return conversation
    }
  }

  useEffect(() => {
    async function fetchConversations() {
      setIsLoadingConversations(true)
      try {
        const data = await getConversations()

        const hydrated = await Promise.all(data.map((c) => hydrateConversationRow(c)))
        setConversations(hydrated)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setIsLoadingConversations(false)
      }
    }
    fetchConversations()
  }, [])

  useEffect(() => {
    async function fetchSiteUpdates() {
      setIsLoadingSiteUpdates(true)
      try {
        const data = await getSiteUpdates()
        setSiteUpdates(data)
      } catch (error) {
        console.error("Error fetching site updates:", error)
      } finally {
        setIsLoadingSiteUpdates(false)
      }
    }
    fetchSiteUpdates()
  }, [])

  useEffect(() => {
    async function fetchGroupMessages() {
      setIsLoadingGroupMessages(true)
      try {
        const data = await getGroupMessages()
        setGroupMessages(data)
      } catch (error) {
        console.error("Error fetching group messages:", error)
      } finally {
        setIsLoadingGroupMessages(false)
      }
    }
    fetchGroupMessages()
  }, [])

  useEffect(() => {
    if (conversationModalOpen && !isLoadingMessages && conversationMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
    }
  }, [conversationModalOpen, isLoadingMessages])

  useEffect(() => {
    if (conversationModalOpen && conversationMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversationMessages.length])

  const handleConversationClick = async (conversation: ConversationWithParticipant) => {
    setSelectedConversation(conversation)
    setConversationModalOpen(true)
    setIsLoadingMessages(true)

    try {
      await markConversationRead(conversation.id)
      setConversations((prev) => prev.map((c) => (c.id === conversation.id ? { ...c, is_unread: false } : c)))

      const messages = await getConversationMessages(conversation.id)
      setConversationMessages(messages)

      const otherParticipantMessage = messages.find((m) => m.sender_id === conversation.other_user_id)

      if (otherParticipantMessage) {
        const hydratedName = otherParticipantMessage.sender_name || conversation.other_user_name
        const hydratedAvatar = otherParticipantMessage.sender_avatar_url || conversation.other_user_avatar_url

        setSelectedConversation((prev) =>
          prev
            ? {
                ...prev,
                other_user_name: hydratedName,
                other_user_avatar_url: hydratedAvatar,
              }
            : prev,
        )

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversation.id
              ? {
                  ...c,
                  other_user_name: hydratedName,
                  other_user_avatar_url: hydratedAvatar,
                  latest_message_body: (c as any).latest_message_body || messages[messages.length - 1]?.body || null,
                }
              : c,
          ),
        )
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversation.id
              ? {
                  ...c,
                  latest_message_body: (c as any).latest_message_body || messages[messages.length - 1]?.body || null,
                }
              : c,
          ),
        )
      }
    } catch (error) {
      console.error("Error opening conversation:", error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    setConversationToDelete(conversationId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!conversationToDelete) return
    setIsDeleting(true)
    try {
      await deleteConversation(conversationToDelete)
      setConversations((prev) => prev.filter((c) => c.id !== conversationToDelete))
      setDeleteDialogOpen(false)
      setConversationToDelete(null)
    } catch (error) {
      console.error("Error deleting conversation:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConversation || !replyText.trim()) return

    setIsSendingReply(true)
    try {
      await sendMessage(selectedConversation.id, replyText.trim())

      const messages = await getConversationMessages(selectedConversation.id)
      setConversationMessages(messages)
      setReplyText("")

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? {
                ...c,
                latest_message_body: messages[messages.length - 1]?.body || (c as any).latest_message_body || null,
                last_message_at: (messages[messages.length - 1] as any)?.created_at || c.last_message_at,
              }
            : c,
        ),
      )
    } catch (error) {
      console.error("Error sending reply:", error)
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle reply submission logic here
  }

  const handleUpdateClick = async (update: SiteUpdate) => {
    setSelectedUpdate(update)
    setUpdateModalOpen(true)

    if (!update.is_read) {
      try {
        await markSiteUpdateRead(update.id)
        setSiteUpdates((prev) => prev.map((u) => (u.id === update.id ? { ...u, is_read: true } : u)))
      } catch (error) {
        console.error("Error marking update as read:", error)
      }
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllSiteUpdatesRead()
      setSiteUpdates((prev) => prev.map((u) => ({ ...u, is_read: true })))
    } catch (error) {
      console.error("Error marking all updates as read:", error)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div id="inbox-header" className="mb-8">
        <div className="bg-gradient-to-br from-primary/5 via-purple-50 to-pink-50 rounded-2xl p-8 border border-primary/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Inbox & Notifications</h1>
              <p className="text-lg text-gray-600">Stay connected with your community and platform updates</p>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-20 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-inbox text-3xl text-primary"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="inbox-tabs" className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap gap-4 px-4 sm:px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("messages")}
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === "messages"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <i className="fa-solid fa-envelope mr-2"></i>
              Messages
              {conversations.filter((c) => c.is_unread).length > 0 && (
                <span className="ml-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                  {conversations.filter((c) => c.is_unread).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("updates")}
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === "updates"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <i className="fa-solid fa-bullhorn mr-2"></i>
              Site Updates
              {siteUpdates.filter((u) => !u.is_read).length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {siteUpdates.filter((u) => !u.is_read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("group")}
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === "group"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <i className="fa-solid fa-users mr-2"></i>
              Group Messages
              {groupMessages.filter((m) => !m.is_read).length > 0 && (
                <span className="ml-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                  {groupMessages.filter((m) => !m.is_read).length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "messages" && (
        <div id="messages-content">
          <div id="messages-list">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">All</button>
                </div>
              </div>

              <div className="p-6">
                {isLoadingConversations ? (
                  <div className="text-center text-gray-500">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="text-center text-gray-500">No conversations yet</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {conversations.map((conversation) => {
                      const displayName = conversation.other_user_name || "Unknown User"
                      const displayAvatar = conversation.other_user_avatar_url || undefined
                      const preview = (conversation as any).latest_message_body || "No messages yet"

                      return (
                        <div
                          key={conversation.id}
                          onClick={() => handleConversationClick(conversation)}
                          className={`
                            relative flex flex-col min-h-[160px] sm:h-[180px] p-5 rounded-xl border cursor-pointer
                            transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                            ${
                              conversation.is_unread
                                ? "border-l-4 border-l-primary bg-primary/5 border-gray-200"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }
                          `}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                            <div className="flex items-center space-x-3 min-w-0">
                              <Avatar className="w-10 h-10 flex-shrink-0 overflow-hidden">
                                <AvatarImage
                                  className="object-cover w-full h-full"
                                  src={displayAvatar || "/placeholder.svg"}
                                  alt={displayName}
                                />
                                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">{displayName}</h3>
                                {conversation.other_user_username && (
                                  <span className="text-xs text-gray-500">@{conversation.other_user_username}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {formatRelativeTime(conversation.last_message_at)}
                            </span>
                          </div>

                          <div className="flex-1 min-h-0">
                            <p className="text-sm text-gray-600 line-clamp-2">{preview}</p>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            {conversation.is_unread ? (
                              <div className="flex items-center space-x-1.5">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                <span className="text-xs font-medium text-primary">Unread</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">View conversation →</span>
                            )}
                            <button
                              onClick={(e) => handleDeleteClick(e, conversation.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                              aria-label="Delete conversation"
                            >
                              <i className="fa-solid fa-trash text-xs"></i>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {conversations.length > 0 && (
                <div className="p-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Showing {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "updates" && (
        <div id="updates-content">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Site Updates</h2>
                {siteUpdates.some((u) => !u.is_read) && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    Mark All Read
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {isLoadingSiteUpdates ? (
                <div className="text-center text-gray-500">Loading updates...</div>
              ) : siteUpdates.length === 0 ? (
                <div className="text-center text-gray-500">No site updates yet</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {siteUpdates.map((update) => (
                    <div
                      key={update.id}
                      onClick={() => handleUpdateClick(update)}
                      className={`
                        rounded-xl border p-5 cursor-pointer hover:shadow-md transition
                        ${update.is_read ? "bg-white border-gray-200" : "border-l-4 border-l-primary bg-primary/5 border-gray-200"}
                      `}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10 overflow-hidden">
                          <AvatarImage
                            src={update.admin_avatar_url || "/placeholder.svg"}
                            className="object-cover w-full h-full"
                          />
                          <AvatarFallback>{update.admin_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-gray-900">{update.admin_name}</div>
                          <div className="text-xs text-gray-500">{formatRelativeTime(update.created_at)}</div>
                        </div>
                      </div>

                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{update.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">{update.body}</p>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        {!update.is_read ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                            <span className="text-xs font-medium text-primary">New</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">View update →</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {siteUpdates.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Showing {siteUpdates.length} update{siteUpdates.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "group" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Group Messages</h2>
          </div>

          <div className="p-6">
            {isLoadingGroupMessages ? (
              <div className="text-center text-gray-500">Loading group messages...</div>
            ) : groupMessages.length === 0 ? (
              <div className="text-center text-gray-500">No group messages yet</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={async () => {
                      if (!msg.is_read) {
                        await markGroupMessageRead(msg.id)
                        setGroupMessages((prev) =>
                          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)),
                        )
                      }

                      setSelectedGroupMessage({ ...msg, is_read: true })
                      setGroupModalOpen(true)
                    }}
                    className={`
                      relative flex flex-col min-h-[160px] sm:h-[180px] p-5 rounded-xl border cursor-pointer
                      transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                      ${
                        !msg.is_read
                          ? "border-l-4 border-l-primary bg-primary/5 border-gray-200"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }
                    `}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {msg.groups?.name ?? "Group"}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(msg.created_at)}
                        </span>
                      </div>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            await deleteGroupMessage(msg.id)
                            setGroupMessages((prev) => prev.filter((m) => m.id !== msg.id))
                          } catch (error) {
                            console.error("Error deleting group message:", error)
                            alert("Failed to delete message")
                          }
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        aria-label="Delete group message"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>

                    <div className="flex-1 min-h-0">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {msg.body}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {!msg.is_read ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                          <span className="text-xs font-medium text-primary">Unread</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">View message →</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {conversationModalOpen && selectedConversation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
            setConversationModalOpen(false)
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const firstIncomingMessage = conversationMessages.find(
                (m) => m.sender_id === selectedConversation.other_user_id,
              )

              const headerName =
                selectedConversation.other_user_name || firstIncomingMessage?.sender_name || "Unknown User"

              const headerAvatar =
                selectedConversation.other_user_avatar_url || firstIncomingMessage?.sender_avatar_url || undefined

              return (
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 overflow-hidden">
                      <AvatarImage
                        src={headerAvatar || "/placeholder.svg"}
                        alt={headerName}
                        className="object-cover w-full h-full"
                      />
                      <AvatarFallback>{headerName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Conversation with {headerName}</h3>
                      {selectedConversation.other_user_username && (
                        <span className="text-sm text-gray-500">@{selectedConversation.other_user_username}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setConversationModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <i className="fa-solid fa-times text-xl"></i>
                  </button>
                </div>
              )
            })()}
            <div className="flex-1 overflow-y-auto max-h-[60vh]">
              <div className="p-6 space-y-4">
                {isLoadingMessages ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : conversationMessages.length === 0 ? (
                  <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
                ) : (
                  conversationMessages.map((message) => {
                    const otherUserId =
                      selectedConversation.participant_one === selectedConversation.other_user_id
                        ? selectedConversation.participant_one
                        : selectedConversation.participant_two
                    const isMe = message.sender_id !== otherUserId
                    return (
                      <div key={message.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`flex max-w-[85%] sm:max-w-md items-end gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                          <Avatar className="w-8 h-8 shrink-0 overflow-hidden">
                            <AvatarImage
                              src={message.sender_avatar_url || undefined}
                              alt={isMe ? "You" : message.sender_name || "User"}
                              className="object-cover w-full h-full"
                            />
                            <AvatarFallback>
                              {(message.sender_name || (isMe ? "Y" : "U")).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div
                            className={`rounded-lg px-4 py-2 text-sm leading-relaxed ${
                              isMe ? "text-white" : "bg-gray-100 text-gray-800"
                            }`}
                            style={isMe ? { backgroundColor: brandBackgroundColor } : undefined}
                          >
                            <div className="mb-1 text-xs opacity-70">
                              {isMe ? "You" : message.sender_name || "Unknown User"}
                            </div>
                            <div>{message.body}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendReply} className="flex flex-col space-y-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSendingReply ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {groupModalOpen && selectedGroupMessage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setGroupModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedGroupMessage.groups?.name ?? "Group Message"}
              </h3>
              <button
                onClick={() => setGroupModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 whitespace-pre-wrap text-gray-700">
              {selectedGroupMessage.body}
            </div>
          </div>
        </div>
      )}

      {updateModalOpen && selectedUpdate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setUpdateModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 overflow-hidden">
                  <AvatarImage
                    src={selectedUpdate.admin_avatar_url || "/placeholder.svg"}
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback>{selectedUpdate.admin_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedUpdate.admin_name}</h3>
                  <span className="text-sm text-gray-500">{formatRelativeTime(selectedUpdate.created_at)}</span>
                </div>
              </div>
              <button onClick={() => setUpdateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedUpdate.title}</h2>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{selectedUpdate.body}</div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone and all messages will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
