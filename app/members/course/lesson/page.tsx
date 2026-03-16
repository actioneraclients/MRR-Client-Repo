"use client"

import type React from "react"

import { useState } from "react"

export default function LessonPage() {
  const [isCompleted, setIsCompleted] = useState(false)
  const [journalSaved, setJournalSaved] = useState(false)

  const handleMarkComplete = () => {
    setIsCompleted(true)
    console.log("Lesson completed")
  }

  const handleSaveJournal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const journalData = {
      moduleId: "build-integrate",
      lessonId: "connecting-app-payments",
      lessonTitle: "Connecting Your App to Payments",
      answers: {
        question1: formData.get("question1"),
        question2: formData.get("question2"),
        question3: formData.get("question3"),
      },
      timestamp: new Date().toISOString(),
    }

    console.log("Saving journal entry:", journalData)
    setJournalSaved(true)

    setTimeout(() => {
      setJournalSaved(false)
    }, 2000)
  }

  return (
    <div className="px-8 pb-12">
      {/* Sub-Navigation */}
      <div id="sub-navigation" className="sticky top-16 bg-gray-50 z-40 border-b border-gray-200 mb-8">
        <div className="flex space-x-4 overflow-x-auto py-3">
          <span className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full font-medium cursor-pointer">
            Overview
          </span>
          <span className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full font-medium cursor-pointer">
            Modules
          </span>
          <span className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full font-medium cursor-pointer">
            Journal
          </span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div id="breadcrumb" className="flex items-center text-sm text-gray-500 mb-6">
        <span className="hover:text-primary cursor-pointer">Home</span>
        <i className="fa-solid fa-chevron-right mx-2"></i>
        <span className="hover:text-primary cursor-pointer">Course</span>
        <i className="fa-solid fa-chevron-right mx-2"></i>
        <span className="hover:text-primary cursor-pointer">Build &amp; Integrate</span>
        <i className="fa-solid fa-chevron-right mx-2"></i>
        <span className="text-gray-900 font-medium">Connecting Your App to Payments</span>
      </div>

      {/* Lesson Header */}
      <div id="lesson-header" className="bg-white rounded-2xl p-8 mb-8 border border-gray-100 shadow-sm">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Connecting Your App to Payments</h1>
            <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full font-medium text-sm">
              {isCompleted ? "Completed" : "In Progress"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleMarkComplete}
              className={`${
                isCompleted ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90"
              } text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center`}
            >
              <i className="fa-solid fa-check mr-2"></i>
              {isCompleted ? "Completed" : "Mark Complete"}
            </button>
            <button className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all">
              Next Lesson
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div id="content-area" className="max-w-none">
        {/* Main Content Column */}
        <div id="main-content-column" className="space-y-8">
          {/* Video Block */}
          <div id="video-block" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-700 relative group cursor-pointer">
              <img
                className="w-full h-full object-cover opacity-30"
                src="/payment-integration-dashboard-with-code-editor-and-api-d.jpg"
                alt="payment integration dashboard with code editor and API documentation"
              />
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-play text-3xl text-primary ml-1"></i>
                </div>
              </div>
              <div className="absolute top-4 left-4">
                <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">18:05</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
                  <h3 className="font-semibold mb-1">Payment Gateway Integration</h3>
                  <p className="text-sm opacity-90">
                    Learn how to securely connect Stripe, PayPal, and other payment processors
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Text Lesson Block */}
          <div id="text-lesson-block" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Lesson Content</h2>

              <p className="text-gray-700 mb-6 leading-relaxed">
                In this lesson, we'll dive deep into the critical process of integrating payment systems into your MRR
                platform. Payment processing is one of the most important aspects of any subscription-based business, as
                it directly impacts your revenue flow and customer experience.
              </p>

              <p className="text-gray-700 mb-6 leading-relaxed">
                We'll start by exploring the different payment gateway options available, including Stripe, PayPal, and
                other popular processors. You'll learn about the pros and cons of each platform, helping you make an
                informed decision based on your specific business needs and target market.
              </p>

              <p className="text-gray-700 mb-6 leading-relaxed">
                The implementation process can seem daunting at first, but we'll break it down into manageable steps.
                From setting up your merchant accounts to configuring webhook endpoints, you'll gain a comprehensive
                understanding of how modern payment systems work behind the scenes.
              </p>

              <p className="text-gray-700 mb-6 leading-relaxed">
                Security is paramount when handling customer payment information. We'll cover PCI compliance
                requirements, best practices for storing sensitive data, and how to implement proper encryption
                protocols to protect your customers and your business from potential security breaches.
              </p>
            </div>
          </div>

          {/* Audio Block */}
          <div id="audio-block" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              <i className="fa-solid fa-headphones text-2xl text-purple-500"></i>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Expert Interview: Payment Security</h3>
                <p className="text-gray-600">Bonus conversation with payment industry expert</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <audio controls className="w-full mb-3">
                <source src="#" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>payment-security-interview.mp3</span>
                <span>Duration: 15:32</span>
              </div>
            </div>
          </div>

          {/* Resources Block */}
          <div id="resources-block" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fa-solid fa-link mr-3 text-primary"></i>
              Helpful Resources
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-external-link-alt text-primary"></i>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-primary">Stripe API Documentation</h4>
                    <p className="text-sm text-gray-600">Complete guide to Stripe's payment APIs</p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">API</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-external-link-alt text-primary"></i>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-primary">PayPal Developer Center</h4>
                    <p className="text-sm text-gray-600">Integration guides and SDK downloads</p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">SDK</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-external-link-alt text-primary"></i>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-primary">PCI Compliance Guide</h4>
                    <p className="text-sm text-gray-600">Essential security requirements for payment processing</p>
                  </div>
                </div>
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Security</span>
              </div>
            </div>
          </div>

          {/* Images Block */}
          <div id="images-block" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fa-solid fa-images mr-3 text-primary"></i>
              Visual Examples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="group cursor-pointer">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2 group-hover:shadow-lg transition-shadow">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="/stripe-dashboard-payment-analytics-interface.jpg"
                    alt="stripe dashboard payment analytics interface"
                  />
                </div>
                <h4 className="font-medium text-gray-900 text-sm">Stripe Dashboard</h4>
                <p className="text-xs text-gray-600">Payment analytics overview</p>
              </div>

              <div className="group cursor-pointer">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2 group-hover:shadow-lg transition-shadow">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="/paypal-integration-webhook-configuration-screen.jpg"
                    alt="paypal integration webhook configuration screen"
                  />
                </div>
                <h4 className="font-medium text-gray-900 text-sm">PayPal Webhooks</h4>
                <p className="text-xs text-gray-600">Real-time event handling</p>
              </div>

              <div className="group cursor-pointer">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2 group-hover:shadow-lg transition-shadow">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="/payment-security-ssl-certificate-and-encryption-setup.jpg"
                    alt="payment security ssl certificate and encryption setup"
                  />
                </div>
                <h4 className="font-medium text-gray-900 text-sm">Security Setup</h4>
                <p className="text-xs text-gray-600">SSL and encryption config</p>
              </div>
            </div>
          </div>

          {/* Downloads Block */}
          <div id="downloads-block" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fa-solid fa-download mr-3 text-primary"></i>
              Download Materials
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-file-pdf text-red-500 text-xl"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Payment Integration Checklist</h4>
                    <p className="text-sm text-gray-600">Complete implementation guide • 2.3 MB</p>
                  </div>
                </div>
                <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center">
                  <i className="fa-solid fa-download mr-2"></i>
                  Download
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-file-code text-blue-500 text-xl"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Sample Integration Code</h4>
                    <p className="text-sm text-gray-600">Ready-to-use code templates • 856 KB</p>
                  </div>
                </div>
                <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center">
                  <i className="fa-solid fa-download mr-2"></i>
                  Download
                </button>
              </div>
            </div>
          </div>

          {/* Call-to-Action Block */}
          <div
            id="cta-block"
            className="bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-2xl p-8 border border-primary/20"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Implement Payments?</h3>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                Get personalized guidance on your payment integration strategy. Book a 1-on-1 consultation with our
                experts to accelerate your implementation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all">
                  Book Strategy Call
                </button>
                <button className="border border-primary text-primary hover:bg-primary/5 px-8 py-3 rounded-xl font-semibold transition-all">
                  Visit Payment Tools
                </button>
              </div>
            </div>
          </div>

          {/* Journal Questions Block */}
          <div id="journal-block" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fa-solid fa-pen-to-square mr-3 text-secondary"></i>
              Reflection Questions
            </h3>
            <p className="text-gray-600 mb-6">
              Take a moment to reflect on this lesson and plan your implementation strategy.
            </p>

            <form id="journal-form" className="space-y-6" onSubmit={handleSaveJournal}>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">1. Payment Gateway Selection</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Which payment gateways are most suitable for your target market and why? Consider factors like fees,
                  features, and geographic coverage.
                </p>
                <textarea
                  name="question1"
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  rows={4}
                  placeholder="Share your thoughts on payment gateway selection..."
                ></textarea>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">2. Security Implementation</h4>
                <p className="text-sm text-gray-600 mb-3">
                  What specific security measures will you implement to protect customer payment data? List at least
                  three key security practices you'll prioritize.
                </p>
                <textarea
                  name="question2"
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  rows={4}
                  placeholder="Outline your security implementation strategy..."
                ></textarea>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">3. Failed Payment Strategy</h4>
                <p className="text-sm text-gray-600 mb-3">
                  How will you handle failed payments and subscription recovery? Outline your dunning management
                  approach and customer communication strategy.
                </p>
                <textarea
                  name="question3"
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  rows={4}
                  placeholder="Describe your failed payment recovery approach..."
                ></textarea>
              </div>

              <button
                type="submit"
                className={`w-full ${
                  journalSaved ? "bg-accent hover:bg-accent/90" : "bg-secondary hover:bg-secondary/90"
                } text-white py-3 rounded-xl font-semibold transition-all`}
              >
                {journalSaved ? (
                  <>
                    <i className="fa-solid fa-check mr-2"></i>
                    Saved to Journal
                  </>
                ) : (
                  "Save Journal"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div id="footer-nav" className="bg-white rounded-2xl p-6 mt-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors">
            <i className="fa-solid fa-chevron-left"></i>
            <span className="font-medium">Previous Lesson</span>
            <div className="hidden sm:block text-sm text-gray-500 ml-2">Platform Selection Guide</div>
          </button>

          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-all">
            Back to Modules
          </button>

          <button className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors">
            <div className="hidden sm:block text-sm text-gray-500 mr-2">Database Design &amp; Setup</div>
            <span className="font-medium">Next Lesson</span>
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
