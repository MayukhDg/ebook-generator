import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { store } from '@/lib/data/store';
import { PRICING_PLANS, CREDIT_PACKS, POLAR_PRODUCT_IDS } from '@/lib/polar/config';

// Map product ID to plan ID or pack ID if metadata wasn't passed
function resolveProductType(productId?: string | null): { planId?: string; packId?: string } {
  if (!productId) return {};

  if (productId === POLAR_PRODUCT_IDS.creator) return { planId: 'creator' };
  if (productId === POLAR_PRODUCT_IDS.authority) return { planId: 'authority' };
  if (productId === POLAR_PRODUCT_IDS.topup_50) return { packId: 'topup_50' };
  if (productId === POLAR_PRODUCT_IDS.topup_150) return { packId: 'topup_150' };

  return {};
}

function verifyWebhook(rawBody: string, headers: Record<string, string>, secret: string): any {
  const cleanSecret = secret.trim();

  // 1. Standard Webhooks verification (natively supports whsec_ prefixed secrets)
  try {
    const wh = new Webhook(cleanSecret);
    return wh.verify(rawBody, headers);
  } catch (whErr: any) {
    // 2. Fallback to Polar SDK validateEvent in case of legacy raw string secrets
    try {
      return validateEvent(rawBody, headers, cleanSecret);
    } catch {
      throw whErr;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    let event: any;

    if (webhookSecret && !webhookSecret.includes('mock') && webhookSecret.trim().length > 5) {
      try {
        event = verifyWebhook(rawBody, headers, webhookSecret);
      } catch (err: any) {
        console.error('Polar webhook signature verification failed:', err.message);
        return NextResponse.json({ error: `Invalid webhook signature: ${err.message}` }, { status: 403 });
      }
    } else {
      // Local dev / test fallback
      try {
        event = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
    }

    const eventType = event.type;
    const data = event.data;

    console.log(`[Polar Webhook] Received event: ${eventType} (ID: ${data?.id || 'n/a'})`);

    switch (eventType) {
      // -----------------------------------------------------------------------
      // 1. Order Created / Paid (One-Time Purchases & Subscription Initial/Renewals)
      // -----------------------------------------------------------------------
      case 'order.created':
      case 'order.paid':
      case 'order.updated': {
        // Only grant credits if the order is actually paid
        const isPaid = data.paid === true || data.status === 'paid';
        if (!isPaid) {
          console.log(`[Polar Webhook] Order ${data.id} is not yet paid (status: ${data.status}). Skipping credit grant.`);
          break;
        }

        const metadata = data.metadata || {};
        const userId = metadata.userId || data.customer?.externalId || data.customer?.metadata?.userId;
        let planId = metadata.planId;
        let packId = metadata.packId;

        // Fallback: If metadata was empty, identify plan or pack from productId
        if (!planId && !packId && data.productId) {
          const resolved = resolveProductType(data.productId);
          planId = resolved.planId;
          packId = resolved.packId;
        }

        if (userId) {
          if (planId) {
            const plan = PRICING_PLANS.find((p) => p.id === planId);
            if (plan && plan.creditsPerMonth > 0) {
              console.log(`[Polar Webhook] Granting ${plan.creditsPerMonth} credits for plan "${plan.id}" to user ${userId}`);
              await store.addCredits(
                userId,
                plan.creditsPerMonth,
                'subscription_grant',
                {
                  plan: plan.id,
                  polar_order_id: data.id,
                  polar_customer_id: data.customerId,
                  polar_subscription_id: data.subscriptionId,
                }
              );

              // Upgrade subscription tier
              await store.updateSubscriptionTier(
                userId,
                plan.id as any,
                data.customerId,
                data.subscriptionId || undefined
              );
            }
          } else if (packId) {
            const pack = CREDIT_PACKS.find((p) => p.id === packId);
            if (pack) {
              console.log(`[Polar Webhook] Granting ${pack.credits} credits for pack "${pack.id}" to user ${userId}`);
              await store.addCredits(
                userId,
                pack.credits,
                'credit_purchase',
                {
                  pack: pack.id,
                  polar_order_id: data.id,
                  polar_customer_id: data.customerId,
                }
              );
            }
          } else {
            console.warn(`[Polar Webhook] Order ${data.id} has no matching plan or pack ID.`);
          }
        } else {
          console.warn(`[Polar Webhook] Could not extract userId for order ${data.id}. Customer email: ${data.customer?.email}`);
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 2. Subscription Created / Updated / Active
      // -----------------------------------------------------------------------
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active': {
        const metadata = data.metadata || {};
        const userId = metadata.userId || data.customer?.externalId || data.customer?.metadata?.userId;
        const productId = data.productId;

        if (userId) {
          let tier: 'creator' | 'authority' | 'free' = 'free';
          if (productId === POLAR_PRODUCT_IDS.authority || metadata.planId === 'authority') {
            tier = 'authority';
          } else if (productId === POLAR_PRODUCT_IDS.creator || metadata.planId === 'creator') {
            tier = 'creator';
          }

          if (data.status === 'active') {
            console.log(`[Polar Webhook] Subscription active. Updating user ${userId} to tier "${tier}"`);
            await store.updateSubscriptionTier(
              userId,
              tier,
              data.customerId,
              data.id
            );
          } else if (data.status === 'canceled' || data.status === 'revoked') {
            console.log(`[Polar Webhook] Subscription ended (${data.status}). Demoting user ${userId} to free tier.`);
            await store.updateSubscriptionTier(
              userId,
              'free',
              data.customerId,
              undefined
            );
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 3. Subscription Canceled / Revoked
      // -----------------------------------------------------------------------
      case 'subscription.canceled':
      case 'subscription.revoked': {
        const metadata = data.metadata || {};
        const userId = metadata.userId || data.customer?.externalId || data.customer?.metadata?.userId;

        if (userId) {
          console.log(`[Polar Webhook] Subscription ${data.id} canceled. Demoting user ${userId} to free tier.`);
          await store.updateSubscriptionTier(
            userId,
            'free',
            data.customerId,
            undefined
          );
        }
        break;
      }

      default:
        console.log(`[Polar Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Polar Webhook] Handler error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing error' }, { status: 500 });
  }
}
