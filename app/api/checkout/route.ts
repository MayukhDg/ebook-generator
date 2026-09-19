import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PRICING_PLANS, CREDIT_PACKS } from '@/lib/stripe/config';
import { store } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, packId, successUrl, cancelUrl } = body;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const isRealStripe = secretKey && !secretKey.includes('mock') && secretKey.startsWith('sk_');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const fallbackSuccess = successUrl || `${appUrl}/dashboard?payment=success`;
    const fallbackCancel = cancelUrl || `${appUrl}/#pricing`;

    if (isRealStripe) {
      const stripe = new Stripe(secretKey, { apiVersion: '2024-09-30.acacia' as any });

      let lineItems: any[] = [];
      let mode: Stripe.Checkout.SessionCreateParams.Mode = 'subscription';

      if (planId) {
        const plan = PRICING_PLANS.find((p) => p.id === planId);
        if (!plan) return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });

        lineItems = [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `FolioCraft AI - ${plan.name}`,
                description: `${plan.creditsPerMonth} Credits / Month with ${plan.tagline}`,
              },
              unit_amount: plan.priceMonthly * 100,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ];
        mode = 'subscription';
      } else if (packId) {
        const pack = CREDIT_PACKS.find((p) => p.id === packId);
        if (!pack) return NextResponse.json({ error: 'Invalid credit pack ID' }, { status: 400 });

        lineItems = [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `FolioCraft AI - ${pack.name}`,
                description: `${pack.credits} Instant Top-Up Credits`,
              },
              unit_amount: pack.price * 100,
            },
            quantity: 1,
          },
        ];
        mode = 'payment';
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode,
        success_url: fallbackSuccess,
        cancel_url: fallbackCancel,
        metadata: {
          planId: planId || '',
          packId: packId || '',
        },
      });

      return NextResponse.json({ url: session.url });
    } else {
      // Instant Sandbox / Local Mode Simulation
      // In local mode without live Stripe credentials, grant credits directly so user flow works 100%
      if (planId) {
        const plan = PRICING_PLANS.find((p) => p.id === planId);
        if (plan) {
          await store.addCredits(
            '00000000-0000-0000-0000-000000000001',
            plan.creditsPerMonth,
            'subscription_grant',
            { plan: plan.id, simulated: true }
          );
        }
      } else if (packId) {
        const pack = CREDIT_PACKS.find((p) => p.id === packId);
        if (pack) {
          await store.addCredits(
            '00000000-0000-0000-0000-000000000001',
            pack.credits,
            'credit_purchase',
            { pack: pack.id, simulated: true }
          );
        }
      }

      return NextResponse.json({
        url: `${fallbackSuccess}&simulated=true`,
        simulated: true,
        message: 'Sandbox payment completed. Credits credited to test account.',
      });
    }
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
