import { NextRequest, NextResponse } from 'next/server';
import { dodo, PRICING_PLANS, CREDIT_PACKS } from '@/lib/dodo/config';
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

    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_API_KEY;
    const isRealDodo = dodoApiKey && !dodoApiKey.includes('mock') && !dodoApiKey.includes('placeholder') && dodoApiKey.trim().length > 10;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const fallbackSuccess = successUrl || `${appUrl}/dashboard?payment=success`;
    const fallbackCancel = cancelUrl || `${appUrl}/#pricing`;

    if (isRealDodo) {
      let productId = '';

      if (resolvedPlanId) {
        const plan = PRICING_PLANS.find((p) => p.id === resolvedPlanId);
        if (!plan) {
          return NextResponse.json({ error: `Invalid plan ID: ${resolvedPlanId}` }, { status: 400 });
        }
        productId = plan.dodoProductId || '';
        if (!productId) {
          return NextResponse.json(
            { 
              error: `Dodo Payments Product ID for plan "${resolvedPlanId}" is not configured. Please set DODO_PRODUCT_${resolvedPlanId.toUpperCase()} in your .env.local file.` 
            }, 
            { status: 500 }
          );
        }
      } else if (resolvedPackId) {
        const pack = CREDIT_PACKS.find((p) => p.id === resolvedPackId);
        if (!pack) {
          return NextResponse.json({ error: `Invalid credit pack ID: ${resolvedPackId}` }, { status: 400 });
        }
        productId = pack.dodoProductId || '';
        if (!productId) {
          return NextResponse.json(
            { 
              error: `Dodo Payments Product ID for pack "${resolvedPackId}" is not configured. Please set DODO_PRODUCT_${resolvedPackId.toUpperCase()} in your .env.local file.` 
            }, 
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json({ error: 'Neither planId nor packId was provided' }, { status: 400 });
      }

      // Construct metadata with string values for tracking
      const metadata: Record<string, string> = {};
      if (userId) metadata.userId = userId;
      if (resolvedPlanId) metadata.planId = resolvedPlanId;
      if (resolvedPackId) metadata.packId = resolvedPackId;

      // Create Dodo Payments Checkout Session
      const session = await dodo.checkoutSessions.create({
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        return_url: fallbackSuccess,
        cancel_url: fallbackCancel,
        customer: user?.email ? {
          email: user.email,
          name: (user.user_metadata as any)?.full_name || user.email.split('@')[0],
        } : undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      if (!session.checkout_url) {
        throw new Error('No checkout URL returned from Dodo Payments session');
      }

      return NextResponse.json({ url: session.checkout_url, sessionId: session.session_id });
    } else {
      // Instant Sandbox / Local Mode Simulation
      // In local mode without active Dodo credentials, grant credits directly so user flow works 100%
      const targetUserId = userId || '00000000-0000-0000-0000-000000000001';

      if (resolvedPlanId) {
        const plan = PRICING_PLANS.find((p) => p.id === resolvedPlanId);
        if (plan) {
          await store.addCredits(
            targetUserId,
            plan.creditsPerMonth,
            'subscription_grant',
            { plan: plan.id, simulated: true, provider: 'dodo' }
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
            { pack: pack.id, simulated: true, provider: 'dodo' }
          );
        }
      }

      const redirectUrl = fallbackSuccess.includes('?')
        ? `${fallbackSuccess}&simulated=true`
        : `${fallbackSuccess}?simulated=true`;

      return NextResponse.json({
        url: redirectUrl,
        simulated: true,
        message: 'Dodo Payments sandbox simulation completed. Credits credited to test account.',
      });
    }
  } catch (error: any) {
    console.error('Dodo Payments checkout creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create Dodo Payments checkout session' },
      { status: 500 }
    );
  }
}
