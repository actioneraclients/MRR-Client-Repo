import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any
        const customerId = session.customer as string

        let priceId: string | null = null
        let subscriptionId: string | null = null

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription)
          subscriptionId = subscription.id
          priceId = subscription.items.data[0]?.price?.id ?? null
        } else {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
          priceId = lineItems.data[0]?.price?.id ?? null
        }

        if (!priceId) {
          console.error("No priceId found for checkout session:", session.id)
          break
        }

        // Check if this is a course purchase (stripe_price_id matches a course)
        const { data: course } = await supabase
          .from("courses")
          .select("id")
          .eq("stripe_price_id", priceId)
          .limit(1)
          .maybeSingle()

        if (course) {
          console.log("Course purchase matched for price:", priceId, "course:", course.id)

          const customer = await stripe.customers.retrieve(customerId)
          const email = typeof customer !== "string" ? customer.email : null

          let { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single()

          if (!profile && email) {
            const result = await supabase
              .from("profiles")
              .select("id")
              .eq("email", email)
              .single()
            profile = result.data
          }

          if (!profile) {
            console.error("No profile found for Stripe customer (course purchase):", customerId)
            break
          }

          const { data: existingEnrollment } = await supabase
            .from("course_enrollments")
            .select("id")
            .eq("user_id", profile.id)
            .eq("course_id", course.id)
            .maybeSingle()

          if (existingEnrollment) {
            console.log("Course enrollment already existed for user", profile.id, "course", course.id)
            break
          }

          const { error: enrollError } = await supabase
            .from("course_enrollments")
            .insert({
              course_id: course.id,
              user_id: profile.id,
              access_type: "paid",
              stripe_payment_id: session.payment_intent ?? session.id,
              started_at: new Date().toISOString(),
              progress_percent: 0,
            })

          if (enrollError) {
            console.error("Course enrollment insert failed:", enrollError)
            break
          }

          console.log("Course enrollment inserted for user", profile.id, "course", course.id)
          break
        }

        console.log("No matching course found for price:", priceId, "- falling back to plan logic")

        const { data: plan } = await supabase
          .from("plans")
          .select("id")
          .eq("stripe_price_id", priceId)
          .single()

        if (!plan) {
          console.error("No matching plan found for price:", priceId)
          break
        }

        const customer = await stripe.customers.retrieve(customerId)
        const email = typeof customer !== "string" ? customer.email : null

        let { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (!profile && email) {
          const result = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single()
          profile = result.data
        }

        if (!profile) {
          console.error("No profile found for Stripe customer:", customerId)
          break
        }

        await supabase
          .from("profiles")
          .update({
            plan_id: plan.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq("id", profile.id)

        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as any
        const customerId = subscription.customer as string
        const subscriptionId = subscription.id
        const priceId = subscription.items.data[0]?.price?.id ?? null

        if (!priceId) {
          console.error("No priceId found for subscription:", subscriptionId)
          break
        }

        const { data: plan } = await supabase
          .from("plans")
          .select("id")
          .eq("stripe_price_id", priceId)
          .single()

        if (!plan) {
          console.error("No matching plan found for price:", priceId)
          break
        }

        const customer = await stripe.customers.retrieve(customerId)
        const email = typeof customer !== "string" ? customer.email : null

        let { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (!profile && email) {
          const result = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single()
          profile = result.data
        }

        if (!profile) {
          console.error("No profile found for Stripe customer:", customerId)
          break
        }

        await supabase
          .from("profiles")
          .update({
            plan_id: plan.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq("id", profile.id)

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any
        const customerId = subscription.customer as string

        const { data: freePlan } = await supabase
          .from("plans")
          .select("id")
          .eq("is_free", true)
          .single()

        if (!freePlan) break

        await supabase
          .from("profiles")
          .update({
            plan_id: freePlan.id,
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId)

        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
