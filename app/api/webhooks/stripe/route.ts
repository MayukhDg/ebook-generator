import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { store } from '@/lib/data/store';
import { PRICING_PLANS, CREDIT_PACKS } from '@/lib/stripe/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey || secretKey.includes('mock') || !webhookSecret) {
      return NextResponse.json({ message: 'Stripe webhook in mock mode' }, { status: 200 });
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2024-09-30.acacia' as any });
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const planId = session.metadata?.planId;
        const packId = session.metadata?.packId;

        if (planId) {
          const plan = PRICING_PLANS.find((p) => p.id === planId);
          if (plan) {
            await store.addCredits(
              '00000000-0000-0000-0000-000000000001',
              plan.creditsPerMonth,
              'subscription_grant',
              { plan: plan.id, stripe_session_id: session.id }
            );
          }
        } else if (packId) {
          const pack = CREDIT_PACKS.find((p) => p.id === packId);
          if (pack) {
            await store.addCredits(
              '00000000-0000-0000-0000-000000000001',
              pack.credits,
              'credit_purchase',
              { pack: pack.id, stripe_session_id: session.id }
            );
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id, subscription.status);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription cancelled:', subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook handling failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
