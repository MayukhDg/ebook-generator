import { NextRequest, NextResponse } from 'next/server';
import { polar, PRICING_PLANS, CREDIT_PACKS } from '@/lib/polar/config';
import { store } from '@/lib/data/store';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, packId, successUrl, cancelUrl } = body;

    // Normalize planId vs packId (in case the frontend passes topup_50 as planId)
    const resolvedPackId = packId || (typeof planId === 'string' && planId.startsWith('topup_') ? planId : null);
    const resolvedPlanId = !resolvedPackId ? planId : null;

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '';

    const polarToken = process.env.POLAR_ACCESS_TOKEN;
    const isRealPolar = polarToken && !polarToken.includes('mock') && polarToken.trim().length > 10;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const fallbackSuccess = successUrl || `${appUrl}/dashboard?payment=success`;
    const fallbackCancel = cancelUrl || `${appUrl}/#pricing`;

    if (isRealPolar) {
      let productId = '';

      if (resolvedPlanId) {
        const plan = PRICING_PLANS.find((p) => p.id === resolvedPlanId);
        if (!plan) {
          return NextResponse.json({ error: `Invalid plan ID: ${resolvedPlanId}` }, { status: 400 });
        }
        productId = plan.polarProductId;
        if (!productId) {
          return NextResponse.json(
            { 
              error: `Polar Product ID for plan "${resolvedPlanId}" is not configured. Please set POLAR_PRODUCT_${resolvedPlanId.toUpperCase()} in your .env.local file.` 
            }, 
            { status: 500 }
          );
        }
      } else if (resolvedPackId) {
        const pack = CREDIT_PACKS.find((p) => p.id === resolvedPackId);
        if (!pack) {
          return NextResponse.json({ error: `Invalid credit pack ID: ${resolvedPackId}` }, { status: 400 });
        }
        productId = pack.polarProductId;
        if (!productId) {
          return NextResponse.json(
            { 
              error: `Polar Product ID for pack "${resolvedPackId}" is not configured. Please set POLAR_PRODUCT_${resolvedPackId.toUpperCase()} in your .env.local file.` 
            }, 
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json({ error: 'Neither planId nor packId was provided' }, { status: 400 });
      }

      // Add checkout_id placeholder polar replaces on redirect
      const successUrlWithId = fallbackSuccess.includes('?')
        ? `${fallbackSuccess}&checkout_id={CHECKOUT_ID}`
        : `${fallbackSuccess}?checkout_id={CHECKOUT_ID}`;

      // Construct metadata with only non-empty values (Polar requires string length >= 1)
      const metadata: Record<string, string> = {};
      if (userId) metadata.userId = userId;
      if (resolvedPlanId) metadata.planId = resolvedPlanId;
      if (resolvedPackId) metadata.packId = resolvedPackId;

      // Create Polar Checkout Session
      const checkout = await polar.checkouts.create({
        products: [productId],
        successUrl: successUrlWithId,
        returnUrl: fallbackCancel,
        customerEmail: user?.email || undefined,
        externalCustomerId: userId || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      return NextResponse.json({ url: checkout.url });
    } else {
      // Instant Sandbox / Local Mode Simulation
      // In local mode without active Polar credentials, grant credits directly so user flow works 100%
      const targetUserId = userId || '00000000-0000-0000-0000-000000000001';

      if (resolvedPlanId) {
        const plan = PRICING_PLANS.find((p) => p.id === resolvedPlanId);
        if (plan) {
          await store.addCredits(
            targetUserId,
            plan.creditsPerMonth,
            'subscription_grant',
            { plan: plan.id, simulated: true, provider: 'polar' }
          );
          if (plan.id === 'creator' || plan.id === 'authority') {
            await store.updateSubscriptionTier(targetUserId, plan.id as any);
          }
        }
      } else if (resolvedPackId) {
        const pack = CREDIT_PACKS.find((p) => p.id === resolvedPackId);
        if (pack) {
          await store.addCredits(
            targetUserId,
            pack.credits,
            'credit_purchase',
            { pack: pack.id, simulated: true, provider: 'polar' }
          );
        }
      }

      const redirectUrl = fallbackSuccess.includes('?')
        ? `${fallbackSuccess}&simulated=true`
        : `${fallbackSuccess}?simulated=true`;

      return NextResponse.json({
        url: redirectUrl,
        simulated: true,
        message: 'Sandbox payment completed. Credits credited to test account.',
      });
    }
  } catch (error: any) {
    console.error('Polar checkout creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout session' }, { status: 500 });
  }
}
