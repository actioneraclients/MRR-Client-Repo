"use client"

import { useActionState } from "react"
import { submitInstallStatus } from "./actions"

export default function InstallStatusPage() {
  const [state, formAction] = useActionState(submitInstallStatus, null)

  if (state?.submitted) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">
          Thank you!
        </h1>
        <p>
          Your installation status has been submitted. Robert will review your
          information and follow up with the next steps for installing your
          MRR Community Platform.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-16 px-6">

      <h1 className="text-3xl font-bold mb-6">
        MRR Community Platform Installation
      </h1>

      <p className="mb-6">
        We are preparing to install the final version of the
        <strong> MRR Community Platform 2.0 </strong> on your site.
      </p>

      <p className="mb-6">
        Depending on the current state of your site, the installation process
        may follow one of three different paths. Each path has a different
        level of complexity and timeline.
      </p>

      <p className="mb-10">
        Please select the option below that best describes your current site
        so we can schedule the correct installation process.
      </p>

      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {state.error}
          </div>
        )}

        <input
          name="name"
          required
          placeholder="Full Name"
          className="w-full border rounded p-3"
        />

        <input
          name="email"
          required
          type="email"
          placeholder="Email"
          className="w-full border rounded p-3"
        />

        <input
          name="phone"
          placeholder="Phone Number"
          className="w-full border rounded p-3"
        />

        <input
          name="site"
          required
          placeholder="Community Site Name or URL"
          className="w-full border rounded p-3"
        />

        <div className="space-y-4">

          <label className="block border p-5 rounded cursor-pointer">
            <input
              type="radio"
              name="status"
              value="Install & Replace (Version 1.5 installed with little content. Database will be replaced and site will restart fresh.)"
              required
              className="mr-2"
            />
            <strong>Install & Replace</strong>
            <p className="text-sm mt-2">
              You currently have version 1.5 installed but have not added
              significant content.
            </p>
            <p className="text-sm mt-1">
              We will replace the database with the new 2.0 system. Any content
              currently in your site will be overwritten and you will restart
              with the new platform.
            </p>
            <p className="text-sm mt-2 font-semibold">
              Priority: #1 (Fastest installation)
            </p>
          </label>

          <label className="block border p-5 rounded cursor-pointer">
            <input
              type="radio"
              name="status"
              value="Install New (No existing community site installed yet)"
              className="mr-2"
            />
            <strong>Install New</strong>
            <p className="text-sm mt-2">
              You have not installed a community site yet.
            </p>
            <p className="text-sm mt-1">
              After submitting this form, Robert will send instructions for the
              access information needed so we can install your platform.
            </p>
            <p className="text-sm mt-2 font-semibold">
              Priority: #1 (After access details are provided)
            </p>
          </label>

          <label className="block border p-5 rounded cursor-pointer">
            <input
              type="radio"
              name="status"
              value="Install & Merge (Version 1.5 installed with active data that must be preserved)"
              className="mr-2"
            />
            <strong>Install & Merge</strong>
            <p className="text-sm mt-2">
              You have version 1.5 installed and your site contains data that
              must be preserved.
            </p>
            <p className="text-sm mt-1">
              We will carefully merge your existing database with the new 2.0
              system. This requires more time and attention to ensure that
              your data and content are preserved.
            </p>
            <p className="text-sm mt-2 font-semibold">
              Priority: #2 (Most complex installation)
            </p>
          </label>

        </div>

        <textarea
          name="notes"
          placeholder="Optional notes or additional details"
          className="w-full border rounded p-3"
        />

        <button
          type="submit"
          className="bg-black text-white px-6 py-3 rounded"
        >
          Submit Installation Status
        </button>

      </form>

    </div>
  )
}
