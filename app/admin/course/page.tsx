"use client"

import { useState } from "react"

interface Course {
  id: string
  title: string
  description: string
  instructions: string
  image: string
  status: "Active" | "In Review" | "Draft" | "Archived"
  isPrimary: boolean
  modules: number
  lessons: number
  enrollments: number
  completion: number
  updatedAt: string
}

const coursesData: Course[] = [
  {
    id: "digital-marketing",
    title: "Digital Marketing Mastery",
    description: "Complete guide to modern digital marketing strategies",
    instructions:
      "This comprehensive course covers everything from SEO and content marketing to social media advertising and email campaigns. Students will learn practical skills and strategies used by top marketing professionals.",
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/b4bdde4df1-ae472d62cec46a8d50b8.png",
    status: "Active",
    isPrimary: true,
    modules: 8,
    lessons: 42,
    enrollments: 1284,
    completion: 87,
    updatedAt: "2 hours ago",
  },
  {
    id: "fullstack-web",
    title: "Full Stack Web Development",
    description: "Learn React, Node.js, and modern web technologies",
    instructions:
      "Master both frontend and backend development with this comprehensive full-stack course. Build real-world applications using React, Node.js, and modern development practices.",
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/1cac03a7d8-5b4c658fbb65a193e4f9.png",
    status: "In Review",
    isPrimary: false,
    modules: 12,
    lessons: 67,
    enrollments: 892,
    completion: 78,
    updatedAt: "1 day ago",
  },
  {
    id: "data-science",
    title: "Data Science Fundamentals",
    description: "Python, machine learning, and data visualization",
    instructions:
      "Learn the fundamentals of data science including Python programming, statistical analysis, machine learning algorithms, and data visualization techniques.",
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/0b27246a34-8f5388c668601a4811c7.png",
    status: "Draft",
    isPrimary: false,
    modules: 6,
    lessons: 28,
    enrollments: 445,
    completion: 65,
    updatedAt: "3 days ago",
  },
  {
    id: "mobile-app",
    title: "Mobile App Development",
    description: "Build iOS and Android apps with React Native",
    instructions:
      "Create cross-platform mobile applications using React Native. Learn to build, test, and deploy apps for both iOS and Android platforms.",
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/8138a8b1f5-051cadd30e8ce5958a62.png",
    status: "Archived",
    isPrimary: false,
    modules: 10,
    lessons: 55,
    enrollments: 623,
    completion: 72,
    updatedAt: "1 week ago",
  },
]

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>(coursesData)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [newCourseModalOpen, setNewCourseModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [openStatusSubmenu, setOpenStatusSubmenu] = useState<string | null>(null)

  const getStatusColor = (status: Course["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "In Review":
        return "bg-yellow-100 text-yellow-800"
      case "Draft":
        return "bg-gray-100 text-gray-800"
      case "Archived":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const openQuickView = (course: Course) => {
    setSelectedCourse(course)
    setQuickViewOpen(true)
  }

  const closeQuickView = () => {
    setQuickViewOpen(false)
    setSelectedCourse(null)
  }

  const toggleDropdown = (courseId: string) => {
    setOpenDropdown(openDropdown === courseId ? null : courseId)
    setOpenStatusSubmenu(null)
  }

  const toggleStatusSubmenu = (courseId: string) => {
    setOpenStatusSubmenu(openStatusSubmenu === courseId ? null : courseId)
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600 mt-1">Manage your courses, status, and availability in the platform</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search courses..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>

            {/* Filters */}
            <div className="relative">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fa-solid fa-filter mr-2 text-gray-400"></i>
                Filters
                <i className="fa-solid fa-chevron-down ml-2 text-xs text-gray-400"></i>
              </button>
              {filtersOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-4 z-10">
                  <div className="px-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Status</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          defaultChecked
                        />
                        <span className="ml-2 text-sm text-gray-700">All</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Draft</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">In Review</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Archived</span>
                      </label>
                    </div>
                  </div>
                  <div className="px-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Visibility</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Private</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Public</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* New Course Button */}
            <button
              onClick={() => setNewCourseModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              New Course
            </button>
          </div>
        </div>

        {/* Courses Table */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modules
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lessons
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center cursor-pointer" onClick={() => openQuickView(course)}>
                          <img
                            className="w-12 h-12 rounded-lg mr-4 object-cover"
                            src={course.image || "/placeholder.svg"}
                            alt={`${course.title} thumbnail`}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{course.title}</div>
                            <div className="text-sm text-gray-500">{course.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}
                        >
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="primaryCourse"
                            className="sr-only peer"
                            checked={course.isPrimary}
                            readOnly
                          />
                          {course.isPrimary ? (
                            <div className="w-5 h-5 bg-blue-600 border-2 border-blue-600 rounded-full peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2">
                              <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 hover:border-blue-400"></div>
                          )}
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.modules}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.lessons}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{course.updatedAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap relative">
                        <button onClick={() => toggleDropdown(course.id)} className="text-gray-400 hover:text-gray-600">
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        {openDropdown === course.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                            <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                              <i className="fa-solid fa-edit mr-2 text-gray-400"></i>
                              Open Builder
                            </span>
                            <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                              <i className="fa-solid fa-copy mr-2 text-gray-400"></i>
                              Duplicate
                            </span>
                            {course.isPrimary ? (
                              <span className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                                <i className="fa-solid fa-star mr-2 text-gray-300"></i>
                                Set Primary (Current)
                              </span>
                            ) : (
                              <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                                <i className="fa-solid fa-star mr-2 text-gray-400"></i>
                                Set Primary
                              </span>
                            )}
                            <div className="relative">
                              <span
                                onClick={() => toggleStatusSubmenu(course.id)}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <i className="fa-solid fa-circle-dot mr-2 text-gray-400"></i>
                                Change Status
                                <i className="fa-solid fa-chevron-right ml-auto text-xs"></i>
                              </span>
                              {openStatusSubmenu === course.id && (
                                <div className="absolute left-full top-0 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 ml-1">
                                  <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    Draft
                                  </span>
                                  <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    In Review
                                  </span>
                                  <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    Active
                                  </span>
                                  <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    Archived
                                  </span>
                                </div>
                              )}
                            </div>
                            <hr className="my-2 border-gray-100" />
                            <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                              <i className="fa-solid fa-archive mr-2 text-gray-400"></i>
                              Archive
                            </span>
                            <span
                              onClick={() => {
                                setDeleteModalOpen(true)
                                setOpenDropdown(null)
                              }}
                              className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
                            >
                              <i className="fa-solid fa-trash mr-2 text-red-400"></i>
                              Delete
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* New Course Modal */}
      {newCourseModalOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setNewCourseModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create New Course</h2>
              <button onClick={() => setNewCourseModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter course title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the course"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Instructions</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detailed instructions and objectives for the course"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <i className="fa-solid fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                  <input type="file" className="hidden" accept="image/*" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Select category</option>
                    <option>Technology</option>
                    <option>Marketing</option>
                    <option>Business</option>
                    <option>Design</option>
                    <option>Personal Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Public</option>
                    <option>Private</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Status</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Draft</option>
                  <option>In Review</option>
                  <option>Active</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setNewCourseModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setDeleteModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <i className="fa-solid fa-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Course</h2>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this course? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Drawer */}
      {quickViewOpen && (
        <>
          <div onClick={closeQuickView} className="fixed inset-0 bg-black bg-opacity-25 z-40"></div>
          <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-xl transform transition-transform duration-300">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Course Overview</h2>
                <button onClick={closeQuickView} className="text-gray-400 hover:text-gray-600">
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {selectedCourse && (
                  <div>
                    <div className="mb-6">
                      <img
                        className="w-full h-32 object-cover rounded-lg mb-4"
                        src={selectedCourse.image || "/placeholder.svg"}
                        alt={`${selectedCourse.title} cover image`}
                      />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedCourse.title}</h3>
                      <p className="text-gray-600 mb-4">{selectedCourse.description}</p>
                      <div className="prose prose-sm text-gray-600">
                        <p>{selectedCourse.instructions}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">{selectedCourse.modules}</div>
                        <div className="text-sm text-gray-600">Modules</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">{selectedCourse.lessons}</div>
                        <div className="text-sm text-gray-600">Lessons</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedCourse.enrollments.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Enrollments</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">{selectedCourse.completion}%</div>
                        <div className="text-sm text-gray-600">Completion</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Open Builder
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Set Primary
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Change Status
                  </button>
                </div>
                <button className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  Archive Course
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
