"use client"

import { useEffect, useState } from "react"
import { ZoomMtg } from "@zoom/meetingsdk"

type Props = {
  meetingNumber: string
  passcode?: string
  userName?: string
  role?: 0 | 1
}

export default function ZoomRoom({
  meetingNumber,
  passcode = "",
  userName = "Actionera Academy",
  role = 0,
}: Props) {
  const [status, setStatus] = useState<"loading" | "joining" | "error">("loading")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    async function startZoom() {
      try {
        setStatus("loading")

        const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY
        if (!sdkKey) throw new Error("Missing NEXT_PUBLIC_ZOOM_SDK_KEY")

        const res = await fetch("/api/zoom/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meetingNumber, role }),
        })

        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`Signature error: ${res.status} ${txt}`)
        }

        const { signature } = await res.json()
        if (!signature) throw new Error("No signature returned")

        setStatus("joining")

        ZoomMtg.setZoomJSLib("https://source.zoom.us/2.18.2/lib", "/av")
        ZoomMtg.preLoadWasm()
        ZoomMtg.prepareWebSDK()

        ZoomMtg.init({
          leaveUrl: window.location.origin,
          success: function () {
            ZoomMtg.join({
              sdkKey,
              signature,
              meetingNumber,
              passWord: passcode,
              userName,
              success: function () {
                console.log("Zoom joined")
              },
              error: function (err) {
                console.error(err)
                setStatus("error")
                setError("Zoom join failed")
              },
            })
          },
          error: function (err) {
            console.error(err)
            setStatus("error")
            setError("Zoom init failed")
          },
        })
      } catch (e: any) {
        console.error(e)
        setStatus("error")
        setError(e?.message || "Zoom failed")
      }
    }

    startZoom()
  }, [meetingNumber, passcode, role, userName])

  return (
    <div className="w-full min-h-[75vh]">
      {status !== "joining" && (
        <div className="mb-3 rounded-md border bg-white p-3 text-sm">
          {status === "loading" && "Loading Zoom…"}
          {status === "error" && (
            <div className="text-red-600">
              <div className="font-medium">Zoom failed to load</div>
              <div>{error}</div>
            </div>
          )}
        </div>
      )}

      <div id="zmmtg-root" />
    </div>
  )
}
