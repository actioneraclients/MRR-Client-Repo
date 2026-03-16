"use client"

import { useState } from "react"
import { JVProfileModal } from "./_components/JVProfileModal"
import { DirectoryListingModal } from "./_components/DirectoryListingModal"
import { JVOffersModal } from "./_components/JVOffersModal"

export default function JVProfilePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false)
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Hero Bar Section */}
      <div
        id="jv-profile-hero"
        className="bg-gradient-to-r from-primary/5 to-white border border-primary/10 rounded-2xl p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold text-brandDark mb-3">JV Profile Setup</h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Create and manage your Joint Venture profile to connect with potential partners and showcase your offers.
            </p>
          </div>
        </div>
      </div>

      {/* Three Cards Grid */}
      <div id="jv-profile-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Create JV Profile */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="relative bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full"
        >
          <div className="flex flex-col h-full">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-6">
              <i className="fa-solid fa-user-plus text-white text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-brandDark mb-4">Create JV Profile</h3>
            <p className="text-gray-600 leading-relaxed flex-grow">
              Setup your JV profile, which will be displayed in the JV Directory for potential partners to discover you.
            </p>
            <div className="mt-6 flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform duration-300">
              <span>Get Started</span>
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </div>
          </div>
        </div>

        {/* Card 2: Manage Directory Listing */}
        <div
          onClick={() => setIsDirectoryModalOpen(true)}
          className="relative bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full"
        >
          <div className="flex flex-col h-full">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-6">
              <i className="fa-solid fa-list-check text-white text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-brandDark mb-4">Manage Directory Listing</h3>
            <p className="text-gray-600 leading-relaxed flex-grow">
              Manage the settings of your Directory Listing and control how your JV Profile is displayed to others.
            </p>
            <div className="mt-6 flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform duration-300">
              <span>Manage Settings</span>
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </div>
          </div>
        </div>

        {/* Card 3: JV Offers */}
        <div
          onClick={() => setIsOffersModalOpen(true)}
          className="relative bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full"
        >
          <div className="flex flex-col h-full">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-6">
              <i className="fa-solid fa-gift text-white text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-brandDark mb-4">JV Offers</h3>
            <p className="text-gray-600 leading-relaxed flex-grow">
              Create your JV Offers for JV Partners to know what you have to offer and how they can collaborate with
              you.
            </p>
            <div className="mt-6 flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform duration-300">
              <span>Create Offers</span>
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div id="jv-profile-info" className="bg-gradient-to-br from-primary/5 to-blue-100/50 rounded-2xl p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-secondary to-orange-600 rounded-xl flex items-center justify-center mr-4">
            <i className="fa-solid fa-lightbulb text-white text-xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-brandDark">Why Complete Your JV Profile?</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Increase Visibility</h3>
            <p className="text-gray-600 text-sm">
              A complete profile helps potential partners find you in the JV Directory and understand your expertise and
              offerings.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Build Trust</h3>
            <p className="text-gray-600 text-sm">
              Showcase your experience, past collaborations, and what makes you a valuable JV partner to build
              credibility.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Attract Quality Partners</h3>
            <p className="text-gray-600 text-sm">
              Clear offers and profile information help you connect with partners who align with your business goals and
              values.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Save Time</h3>
            <p className="text-gray-600 text-sm">
              Answer common questions upfront in your profile so you can focus conversations on partnership
              opportunities.
            </p>
          </div>
        </div>
      </div>

      <JVProfileModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <DirectoryListingModal open={isDirectoryModalOpen} onOpenChange={setIsDirectoryModalOpen} />
      <JVOffersModal open={isOffersModalOpen} onOpenChange={setIsOffersModalOpen} />
    </div>
  )
}
