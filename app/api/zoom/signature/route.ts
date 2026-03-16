import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const { meetingNumber, role } = await req.json()

    if (!meetingNumber) {
      return NextResponse.json(
        { error: "Missing meeting number" },
        { status: 400 }
      )
    }

    const sdkKey =
      process.env.ZOOM_SDK_KEY || process.env.NEXT_PUBLIC_ZOOM_SDK_KEY
    const sdkSecret = process.env.ZOOM_SDK_SECRET

    if (!sdkKey || !sdkSecret) {
      return NextResponse.json(
        { error: "Zoom SDK credentials not configured (need ZOOM_SDK_SECRET and ZOOM_SDK_KEY or NEXT_PUBLIC_ZOOM_SDK_KEY)" },
        { status: 500 }
      )
    }

    const iat = Math.floor(Date.now() / 1000) - 30
    const exp = iat + 60 * 60 * 2

    const header = {
      alg: "HS256",
      typ: "JWT"
    }

    const payload = {
      sdkKey,
      mn: meetingNumber,
      role,
      iat,
      exp,
      tokenExp: exp
    }

    const base64url = (source: Buffer) =>
      source
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")

    const encodedHeader = base64url(
      Buffer.from(JSON.stringify(header))
    )

    const encodedPayload = base64url(
      Buffer.from(JSON.stringify(payload))
    )

    const signature = crypto
      .createHmac("sha256", sdkSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest()

    const encodedSignature = base64url(signature)

    const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`

    return NextResponse.json({ signature: jwt })
  } catch (error) {
    return NextResponse.json(
      { error: "Signature generation failed" },
      { status: 500 }
    )
  }
}
