import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const userId = session.metadata?.userId

          if (userId && subscriptionId) {
            // Get subscription details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)

            // Determine tier based on price
            let tier: 'BASIC' | 'PRO' | 'ENTERPRISE' = 'PRO'
            const planName = session.metadata?.planName?.toUpperCase()
            if (planName === 'ENTERPRISE') tier = 'ENTERPRISE'

            // Update user subscription
            await prisma.user.update({
              where: { id: userId },
              data: {
                stripeSubscriptionId: subscriptionId,
                subscriptionTier: tier,
                subscriptionStatus: subscription.status,
                subscriptionEndDate: new Date(subscription.current_period_end * 1000),
              },
            })
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Find user by customer ID
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: subscription.customer as string }
        })

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: subscription.status,
              subscriptionEndDate: new Date(subscription.current_period_end * 1000),
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Find user by customer ID
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: subscription.customer as string }
        })

        if (user) {
          // Downgrade to free tier
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionTier: 'FREE',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null,
            },
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
