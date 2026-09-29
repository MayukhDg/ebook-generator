import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { store } from '@/lib/data/store';
import { polar, PRICING_PLANS, CREDIT_PACKS, POLAR_PRODUCT_IDS } from '@/lib/polar/config';

function resolveProductType(productId?: string | null): { planId?: string; packId?: string } {
  if (!productId) return {};
  if (productId === POLAR_PRODUCT_IDS.creator) return { planId: 'creator' };
  if (productId === POLAR_PRODUCT_IDS.authority) return { planId: 'authority' };
  if (productId === POLAR_PRODUCT_IDS.topup_50) return { packId: 'topup_50' };
  if (productId === POLAR_PRODUCT_IDS.topup_150) return { packId: 'topup_150' };
  return {};
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const profile = await store.getProfile(user?.id);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = process.env.POLAR_ORGANIZATION_ID;
    if (!orgId) {
      return NextResponse.json({ error: 'Polar not configured' }, { status: 500 });
    }

    // 1. Fetch recent orders from Polar Sandbox
    const ordersRes = await polar.orders.list({
      organizationId: orgId,
      limit: 20,
    });

    const orders = ordersRes.result?.items || [];
    let newlyCredited = 0;
    let newPlan: string | null = null;

    // 2. Fetch existing transactions to avoid double-crediting
    const existingTxs = await store.getCreditTransactions(profile.id);
    const existingOrderIds = new Set<string>();

    for (const tx of existingTxs) {
      const oid = (tx.metadata as any)?.polar_order_id;
      if (oid) existingOrderIds.add(oid);
    }

    // 3. Process any paid order matching this user that hasn't been credited yet
    for (const order of orders) {
      if (order.status !== 'paid') continue;
      if (existingOrderIds.has(order.id)) continue;

      const metadata = (order.metadata as Record<string, any>) || {};
      const orderUserId = metadata.userId || order.customer?.externalId || (order.customer?.metadata as any)?.userId;

      // Match user by ID or email
      const isUserMatch = 
        orderUserId === profile.id || 
        (order.customer?.email && order.customer.email.toLowerCase() === (profile.email || '').toLowerCase());
      
      if (!isUserMatch) continue;

      let planId = metadata.planId;
      let packId = metadata.packId;

      if (!planId && !packId && order.productId) {
        const resolved = resolveProductType(order.productId);
        planId = resolved.planId;
        packId = resolved.packId;
      }

      if (planId) {
        const plan = PRICING_PLANS.find((p) => p.id === planId);
        if (plan && plan.creditsPerMonth > 0) {
          await store.addCredits(
            profile.id,
            plan.creditsPerMonth,
            'subscription_grant',
            { plan: plan.id, polar_order_id: order.id, provider: 'polar', synced_on_return: true }
          );
          if (plan.id === 'creator' || plan.id === 'authority') {
            await store.updateSubscriptionTier(profile.id, plan.id as any);
            newPlan = plan.name;
          }
          newlyCredited += plan.creditsPerMonth;
          existingOrderIds.add(order.id);
        }
      } else if (packId) {
        const pack = CREDIT_PACKS.find((p) => p.id === packId);
        if (pack && pack.credits > 0) {
          await store.addCredits(
            profile.id,
            pack.credits,
            'credit_purchase',
            { pack: pack.id, polar_order_id: order.id, provider: 'polar', synced_on_return: true }
          );
          newlyCredited += pack.credits;
          existingOrderIds.add(order.id);
        }
      }
    }

    const updatedProfile = await store.getProfile(profile.id);

    return NextResponse.json({
      success: true,
      newlyCredited,
      newPlan,
      currentBalance: updatedProfile?.credits_balance,
      currentTier: updatedProfile?.subscription_tier,
    });
  } catch (error: any) {
    console.error('Error syncing Polar orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = GET;
