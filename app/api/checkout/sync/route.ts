import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { store } from '@/lib/data/store';
import { dodo, PRICING_PLANS, CREDIT_PACKS, DODO_PRODUCT_IDS } from '@/lib/dodo/config';

function resolveProductType(productId?: string | null): { planId?: string; packId?: string } {
  if (!productId) return {};
  if (productId === DODO_PRODUCT_IDS.creator) return { planId: 'creator' };
  if (productId === DODO_PRODUCT_IDS.authority) return { planId: 'authority' };
  if (productId === DODO_PRODUCT_IDS.topup_50) return { packId: 'topup_50' };
  if (productId === DODO_PRODUCT_IDS.topup_150) return { packId: 'topup_150' };
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

    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_API_KEY;
    if (!dodoApiKey || dodoApiKey.includes('mock') || dodoApiKey.includes('placeholder')) {
      return NextResponse.json({
        success: true,
        newlyCredited: 0,
        newPlan: null,
        currentBalance: profile.credits_balance,
        currentTier: profile.subscription_tier,
        simulated: true,
      });
    }

    // 1. Fetch recent payments from Dodo Payments
    const paymentsRes = await dodo.payments.list({
      page_size: 20,
    });

    const payments = paymentsRes.items || [];
    let newlyCredited = 0;
    let newPlan: string | null = null;

    // 2. Fetch existing transactions to avoid double-crediting
    const existingTxs = await store.getCreditTransactions(profile.id);
    const existingPaymentIds = new Set<string>();

    for (const tx of existingTxs) {
      const pid = (tx.metadata as any)?.dodo_payment_id;
      if (pid) existingPaymentIds.add(pid);
    }

    // 3. Process any succeeded payment matching this user that hasn't been credited yet
    for (const payment of payments) {
      if (payment.status !== 'succeeded') continue;
      if (existingPaymentIds.has(payment.payment_id)) continue;

      const metadata = (payment.metadata as Record<string, any>) || {};
      const paymentUserId = metadata.userId || payment.customer?.customer_id;

      // Match user by ID or email
      const isUserMatch = 
        paymentUserId === profile.id || 
        (payment.customer?.email && payment.customer.email.toLowerCase() === (profile.email || '').toLowerCase());
      
      if (!isUserMatch) continue;

      let planId = metadata.planId;
      let packId = metadata.packId;

      if (!planId && !packId) {
        // Try product_id or product_cart if available
        const lineItem = (payment as any).product_cart && (payment as any).product_cart[0];
        const rawProductId = (payment as any).product_id || lineItem?.product_id;
        if (rawProductId) {
          const resolved = resolveProductType(rawProductId);
          planId = resolved.planId;
          packId = resolved.packId;
        }
      }

      if (planId) {
        const plan = PRICING_PLANS.find((p) => p.id === planId);
        if (plan && plan.creditsPerMonth > 0) {
          await store.addCredits(
            profile.id,
            plan.creditsPerMonth,
            'subscription_grant',
            {
              plan: plan.id,
              dodo_payment_id: payment.payment_id,
              provider: 'dodo',
              synced_on_return: true,
            }
          );
          if (plan.id === 'creator' || plan.id === 'authority') {
            await store.updateSubscriptionTier(profile.id, plan.id as any, payment.customer?.customer_id);
            newPlan = plan.name;
          }
          newlyCredited += plan.creditsPerMonth;
          existingPaymentIds.add(payment.payment_id);
        }
      } else if (packId) {
        const pack = CREDIT_PACKS.find((p) => p.id === packId);
        if (pack && pack.credits > 0) {
          await store.addCredits(
            profile.id,
            pack.credits,
            'credit_purchase',
            {
              pack: pack.id,
              dodo_payment_id: payment.payment_id,
              provider: 'dodo',
              synced_on_return: true,
            }
          );
          newlyCredited += pack.credits;
          existingPaymentIds.add(payment.payment_id);
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
    console.error('Error syncing Dodo Payments:', error);
    return NextResponse.json({ error: error?.message || 'Failed to sync payments' }, { status: 500 });
  }
}

export const POST = GET;
