"use client"

import { useState } from "react"

export default function AdminBuilderPage() {
  const [activeTab, setActiveTab] = useState("structure")
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  const [showAddModuleModal, setShowAddModuleModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBlockComposer, setShowBlockComposer] = useState(false)
  const [showBlockSettingsDrawer, setShowBlockSettingsDrawer] = useState(false)
  const [showMobileBlockModal, setShowMobileBlockModal] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [currentBlockType, setCurrentBlockType] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [editorView, setEditorView] = useState<"none" | "module" | "lesson">("none")

  const handleSave = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const openBlockSettings = (blockId: string, blockType: string) => {
    setSelectedBlockId(blockId)
    setCurrentBlockType(blockType)
    setShowBlockSettingsDrawer(true)
  }

  const closeBlockSettings = () => {
    setShowBlockSettingsDrawer(false)
    setSelectedBlockId(null)
    setCurrentBlockType(null)
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Course Builder Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 -mx-8 px-8">
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <span className="hover:text-gray-700 cursor-pointer">Courses</span>
                  <i className="fa-solid fa-chevron-right mx-2 text-xs"></i>
                  <span>Digital Marketing Mastery</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Digital Marketing Mastery</h1>
              </div>
              <div className="flex items-center space-x-3">
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <i className="fa-solid fa-eye mr-2"></i>
                  Preview
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <i className="fa-solid fa-save mr-2"></i>
                  Save
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                    className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                  {showMoreDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                        <i className="fa-solid fa-copy mr-2 text-gray-400"></i>
                        Duplicate
                      </span>
                      <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                        <i className="fa-solid fa-download mr-2 text-gray-400"></i>
                        Export
                      </span>
                      <hr className="my-2 border-gray-100" />
                      <span
                        onClick={() => setShowDeleteModal(true)}
                        className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
                      >
                        <i className="fa-solid fa-trash mr-2 text-red-400"></i>
                        Delete
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("structure")}
                className={`px-1 py-2 text-sm font-medium transition-colors ${activeTab === "structure" ? "border-b-2 border-blue-600 text-blue-600" : "border-b-2 border-transparent text-gray-500"}`}
              >
                Structure
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-1 py-2 text-sm font-medium transition-colors ${activeTab === "settings" ? "border-b-2 border-blue-600 text-blue-600" : "border-b-2 border-transparent text-gray-500"}`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab("publishing")}
                className={`px-1 py-2 text-sm font-medium transition-colors ${activeTab === "publishing" ? "border-b-2 border-blue-600 text-blue-600" : "border-b-2 border-transparent text-gray-500"}`}
              >
                Publishing
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {/* Structure Tab */}
          {activeTab === "structure" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Course Outline */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Course Outline</h2>
                  <button
                    onClick={() => setShowAddModuleModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <i className="fa-solid fa-plus mr-2"></i>
                    Add Module
                  </button>
                </div>

                {/* Module Cards */}
                <div className="space-y-4">
                  {/* Module 1 */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-400 hover:text-gray-600 cursor-grab">
                          <i className="fa-solid fa-grip-vertical"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Getting Started</h3>
                          <p className="text-sm text-gray-500">5 lessons</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <i className="fa-solid fa-chevron-down"></i>
                        </button>
                        <div className="relative">
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lessons */}
                    <div className="space-y-2 pl-6">
                      <div
                        onClick={() => {
                          setSelectedLesson("intro")
                          setEditorView("lesson")
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 cursor-pointer ${selectedLesson === "intro" ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-400 hover:text-gray-600 cursor-grab">
                            <i className="fa-solid fa-grip-vertical text-sm"></i>
                          </div>
                          <div className="flex items-center space-x-2">
                            <i className="fa-solid fa-play-circle text-blue-500 text-sm"></i>
                            <span className="text-sm font-medium text-gray-900">Introduction to Digital Marketing</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-clock text-gray-400 text-xs" title="Scheduled"></i>
                          <div className="relative">
                            <button className="text-gray-400 hover:text-gray-600 p-1">
                              <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setSelectedLesson("fundamentals")
                          setEditorView("lesson")
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 cursor-pointer ${selectedLesson === "fundamentals" ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-400 hover:text-gray-600 cursor-grab">
                            <i className="fa-solid fa-grip-vertical text-sm"></i>
                          </div>
                          <div className="flex items-center space-x-2">
                            <i className="fa-solid fa-file-text text-green-500 text-sm"></i>
                            <span className="text-sm font-medium text-gray-900">Marketing Fundamentals</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-droplet text-gray-400 text-xs" title="Drip content"></i>
                          <div className="relative">
                            <button className="text-gray-400 hover:text-gray-600 p-1">
                              <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Module 2 */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-400 hover:text-gray-600 cursor-grab">
                          <i className="fa-solid fa-grip-vertical"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">SEO & Content Marketing</h3>
                          <p className="text-sm text-gray-500">7 lessons</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <i className="fa-solid fa-chevron-down"></i>
                        </button>
                        <div className="relative">
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pl-6">
                      <div
                        onClick={() => {
                          setSelectedLesson("seo-basics")
                          setEditorView("lesson")
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 cursor-pointer ${selectedLesson === "seo-basics" ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-400 hover:text-gray-600 cursor-grab">
                            <i className="fa-solid fa-grip-vertical text-sm"></i>
                          </div>
                          <div className="flex items-center space-x-2">
                            <i className="fa-solid fa-search text-purple-500 text-sm"></i>
                            <span className="text-sm font-medium text-gray-900">SEO Basics</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <button className="text-gray-400 hover:text-gray-600 p-1">
                              <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Editor Panel */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit sticky top-40">
                {editorView === "none" && (
                  <div className="text-center py-12">
                    <i className="fa-solid fa-mouse-pointer text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Module or Lesson</h3>
                    <p className="text-gray-600">Choose a module or lesson from the outline to edit its details.</p>
                  </div>
                )}

                {editorView === "lesson" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Lesson Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="Introduction to Digital Marketing"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sub-title</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Optional subtitle"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Release Schedule</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>Now</option>
                          <option>On Date</option>
                          <option>Drip after X days</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unlock Rule</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>None</option>
                          <option>Require previous lesson</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Est. Duration (minutes)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="15"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SEO Slug</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            defaultValue="introduction-to-digital-marketing"
                            readOnly
                          />
                          <button className="text-gray-400 hover:text-gray-600">
                            <i className="fa-solid fa-edit"></i>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>Public</option>
                          <option>Private</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Allow Comments</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowBlockComposer(true)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <i className="fa-solid fa-cube mr-2"></i>
                          Edit Blocks
                        </button>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                          Save Lesson
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="max-w-4xl space-y-8">
              {/* Course Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Course Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="Digital Marketing Mastery"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="Complete guide to modern digital marketing strategies"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Detailed course instructions and objectives"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <i className="fa-solid fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-600">Upload cover image</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Marketing</option>
                      <option>Technology</option>
                      <option>Business</option>
                      <option>Design</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Access & Visibility */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Access & Visibility</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Public</option>
                      <option>Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Type</label>
                    <div className="flex items-center space-x-2">
                      <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>Free</option>
                        <option>Included</option>
                        <option>Paid</option>
                      </select>
                      <span className="text-blue-600 hover:text-blue-700 text-sm cursor-pointer">
                        <i className="fa-solid fa-external-link-alt"></i>
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Limit Access to Groups/Plans</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Pro Plan</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Enterprise Plan</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress & Drip */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Progress & Drip</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Drip</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>None</option>
                      <option>By Date</option>
                      <option>X days from enrollment</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Required completion to unlock next lesson
                      </label>
                      <p className="text-xs text-gray-500">Students must complete current lesson to proceed</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Allow resume where left off</label>
                      <p className="text-xs text-gray-500">Students can continue from their last position</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Completion certificate</label>
                      <p className="text-xs text-gray-500">Generate certificate when course is completed</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Integrations */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Integrations</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Webhook on lesson complete</label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://your-webhook-url.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Webhook on course complete</label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://your-webhook-url.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Secret</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your webhook secret"
                    />
                  </div>
                </div>
              </div>

              {/* SEO & Sharing */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">SEO & Sharing</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="digital-marketing-mastery"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="SEO title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="SEO description"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Social Image</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <i className="fa-solid fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-600">Upload social sharing image</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Publishing Tab */}
          {activeTab === "publishing" && (
            <div className="max-w-4xl space-y-8">
              {/* Publish Checklist */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Publish Checklist</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <i className="fa-solid fa-check-circle text-green-500"></i>
                    <span className="text-sm text-gray-700">Has at least 1 module</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fa-solid fa-check-circle text-green-500"></i>
                    <span className="text-sm text-gray-700">Has at least 1 lesson</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fa-solid fa-check-circle text-green-500"></i>
                    <span className="text-sm text-gray-700">All lessons have valid blocks</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fa-solid fa-check-circle text-green-500"></i>
                    <span className="text-sm text-gray-700">Cover image is set</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fa-solid fa-check-circle text-green-500"></i>
                    <span className="text-sm text-gray-700">Visibility is configured</span>
                  </div>
                </div>
              </div>

              {/* Status Control */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Course Status</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                    <select
                      defaultValue="Active"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option>Draft</option>
                      <option>In Review</option>
                      <option>Active</option>
                      <option>Archived</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <label className="text-sm font-medium text-blue-900">Primary Course</label>
                      <p className="text-xs text-blue-700">
                        Only one course can be marked as primary. This will be the default course shown to new members.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                      <i className="fa-solid fa-rocket mr-2"></i>
                      Go Live
                    </button>
                    <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                      <i className="fa-solid fa-pause mr-2"></i>
                      Unpublish
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
                <p className="text-sm text-red-700 mb-4">
                  These actions are irreversible. Please proceed with caution.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <i className="fa-solid fa-trash mr-2"></i>
                  Delete Course
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Block Composer */}
      {showBlockComposer && (
        <div className="fixed inset-0 z-60 bg-white">
          <div className="h-full flex flex-col">
            {/* Composer Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowBlockComposer(false)}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <i className="fa-solid fa-arrow-left mr-2"></i>
                  Back to Builder
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Introduction to Digital Marketing</h2>
                  <p className="text-sm text-gray-500">Editing lesson blocks</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <i className="fa-solid fa-eye mr-2"></i>
                  Preview Lesson
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  <i className="fa-solid fa-save mr-2"></i>
                  Save
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Block Palette */}
              <div className="w-80 border-r border-gray-200 p-6 bg-gray-50 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Block Types</h3>
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-play-circle text-blue-500 text-xl"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">Video</h4>
                        <p className="text-xs text-gray-500">Embed videos from Vimeo, YouTube, or upload MP4</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-align-left text-green-500 text-xl"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">Text</h4>
                        <p className="text-xs text-gray-500">Rich text editor with formatting options</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-volume-up text-purple-500 text-xl"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">Audio</h4>
                        <p className="text-xs text-gray-500">Upload audio files with optional descriptions</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-file-pdf text-red-500 text-xl"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">Document</h4>
                        <p className="text-xs text-gray-500">Upload PDFs, Word docs, and other files</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-link text-orange-500 text-xl"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">Resource</h4>
                        <p className="text-xs text-gray-500">External links and downloadable resources</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-image text-indigo-500 text-xl"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">Image</h4>
                        <p className="text-xs text-gray-500">Upload and display images with captions</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-mouse-pointer text-yellow-500 text-xl"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">Call to Action</h4>
                        <p className="text-xs text-gray-500">Buttons and action prompts</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 p-6 bg-white overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wider">Lesson Content</h3>
                  <div className="space-y-4 min-h-96">
                    {/* Example blocks */}
                    <div
                      onClick={() => openBlockSettings("video-intro", "video")}
                      className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <i className="fa-solid fa-grip-vertical text-gray-400 cursor-grab"></i>
                          <i className="fa-solid fa-play-circle text-blue-500"></i>
                          <div>
                            <h4 className="font-medium text-gray-900">Welcome Video</h4>
                            <p className="text-sm text-gray-500">YouTube video • 5:32 duration</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-gray-400 hover:text-gray-600 p-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <i className="fa-solid fa-copy"></i>
                          </button>
                          <button className="text-gray-400 hover:text-red-600 p-1" onClick={(e) => e.stopPropagation()}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => openBlockSettings("text-overview", "text")}
                      className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <i className="fa-solid fa-grip-vertical text-gray-400 cursor-grab"></i>
                          <i className="fa-solid fa-align-left text-green-500"></i>
                          <div>
                            <h4 className="font-medium text-gray-900">Course Overview</h4>
                            <p className="text-sm text-gray-500">Text content • 247 words</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-gray-400 hover:text-gray-600 p-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <i className="fa-solid fa-copy"></i>
                          </button>
                          <button className="text-gray-400 hover:text-red-600 p-1" onClick={(e) => e.stopPropagation()}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center text-sm text-gray-500">
                    <p>
                      <i className="fa-solid fa-info-circle mr-1"></i> Drag to reorder blocks. Changes autosave every
                      5s.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Settings Drawer Overlay */}
      {showBlockSettingsDrawer && <div onClick={closeBlockSettings} className="fixed inset-0 bg-black/25 z-40"></div>}

      {/* Block Settings Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[560px] md:w-[680px] lg:w-[760px] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${showBlockSettingsDrawer ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Drawer Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i
              className={`fa-solid ${currentBlockType === "video" ? "fa-play-circle text-blue-500" : "fa-align-left text-green-500"} text-xl`}
            ></i>
            <input
              type="text"
              className="text-lg font-semibold text-gray-900 bg-transparent border-0 focus:ring-0 focus:outline-none"
              defaultValue="Block Title"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <i className="fa-solid fa-save mr-2"></i>
              Save
            </button>
            <button onClick={closeBlockSettings} className="text-gray-400 hover:text-gray-600 p-2">
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentBlockType === "video" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue="Welcome Video"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="YouTube, Vimeo, or MP4 URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transcript URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional transcript link"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Autoplay</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}

          {currentBlockType === "text" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue="Course Overview"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <div className="border border-gray-300 rounded-lg">
                  <div className="border-b border-gray-300 px-3 py-2 bg-gray-50 flex items-center space-x-2 text-sm">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <i className="fa-solid fa-bold"></i>
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <i className="fa-solid fa-italic"></i>
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <i className="fa-solid fa-link"></i>
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <i className="fa-solid fa-list-ul"></i>
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <i className="fa-solid fa-quote-right"></i>
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    className="w-full px-3 py-2 border-0 focus:ring-0 resize-none"
                    placeholder="Enter your text content..."
                  ></textarea>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <i className="fa-solid fa-copy mr-2"></i>
              Duplicate Block
            </button>
          </div>
          <button className="text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
            <i className="fa-solid fa-trash mr-2"></i>
            Delete Block
          </button>
        </div>
      </div>

      {/* Add Module Modal */}
      {showAddModuleModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowAddModuleModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add Module</h2>
              <button onClick={() => setShowAddModuleModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Module name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModuleModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <i className="fa-solid fa-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Course</h2>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this course? This action cannot be undone and will remove all modules,
              lessons, and student progress.
            </p>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-20 z-100 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <i className="fa-solid fa-check mr-2"></i>
          Changes saved successfully
        </div>
      )}
    </>
  )
}
