import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { dodo, PRICING_PLANS, CREDIT_PACKS, DODO_PRODUCT_IDS } from '@/lib/dodo/config';
import { store } from '@/lib/data/store';

// Map Dodo product ID to plan ID or pack ID if metadata wasn't passed directly
function resolveProductType(productId?: string | null): { planId?: string; packId?: string } {
  if (!productId) return {};

  if (productId === DODO_PRODUCT_IDS.creator) return { planId: 'creator' };
  if (productId === DODO_PRODUCT_IDS.authority) return { planId: 'authority' };
  if (productId === DODO_PRODUCT_IDS.topup_50) return { packId: 'topup_50' };
  if (productId === DODO_PRODUCT_IDS.topup_150) return { packId: 'topup_150' };

  return {};
}

function getWebhookSecret(): string {
  // Check .env.local dynamically in case the user edited the secret without restarting Next.js
  try {
    const fs = require('fs');
    if (fs.existsSync('.env.local')) {
      const content = fs.readFileSync('.env.local', 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (
          (trimmed.startsWith('DODO_PAYMENTS_WEBHOOK_KEY=') ||
            trimmed.startsWith('DODO_PAYMENTS_WEBHOOK_SECRET=') ||
            trimmed.startsWith('DODO_WEBHOOK_SECRET=')) &&
          !trimmed.startsWith('#')
        ) {
          const idx = trimmed.indexOf('=');
          const val = trimmed.slice(idx + 1).trim();
          if (val && !val.includes('mock') && val.length > 5) return val;
        }
      }
    }
  } catch {}

  return (
    process.env.DODO_PAYMENTS_WEBHOOK_KEY ||
    process.env.DODO_PAYMENTS_WEBHOOK_SECRET ||
    process.env.DODO_WEBHOOK_SECRET ||
    ''
  ).trim();
}

function verifyDodoWebhook(rawBody: string, headers: Record<string, string>, secret: string): any {
  const cleanSecret = secret.trim();

  // Normalize all incoming header keys to lowercase
  const normalizedHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    normalizedHeaders[k.toLowerCase()] = v;
  }

  // Ensure webhook-* headers exist, mapping from svix-* if present
  normalizedHeaders['webhook-id'] = normalizedHeaders['webhook-id'] || normalizedHeaders['svix-id'] || '';
  normalizedHeaders['webhook-signature'] = normalizedHeaders['webhook-signature'] || normalizedHeaders['svix-signature'] || '';
  normalizedHeaders['webhook-timestamp'] = normalizedHeaders['webhook-timestamp'] || normalizedHeaders['svix-timestamp'] || '';

  // 1. Try Standard Webhooks standard parsing (auto-handles whsec_ prefix and base64)
  try {
    const wh = new Webhook(cleanSecret);
    return wh.verify(rawBody, normalizedHeaders);
  } catch (err1) {
    // 2. Try raw format if the secret was stored without base64 encoding
    try {
      const whRaw = new Webhook(cleanSecret, { format: 'raw' });
      return whRaw.verify(rawBody, normalizedHeaders);
    } catch (err2) {
      // 3. Try base64-encoded secret
      try {
        const base64Secret = Buffer.from(cleanSecret, 'utf-8').toString('base64');
        const whB64 = new Webhook(base64Secret);
        return whB64.verify(rawBody, normalizedHeaders);
      } catch (err3) {
        // 4. Try explicitly stripping 'whsec_' prefix
        if (cleanSecret.startsWith('whsec_')) {
          try {
            const stripped = cleanSecret.slice('whsec_'.length);
            const whStrip = new Webhook(stripped);
            return whStrip.verify(rawBody, normalizedHeaders);
          } catch {}
        }
        throw err1;
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    const webhookSecret = getWebhookSecret();

    let event: any;

    if (webhookSecret && !webhookSecret.includes('mock') && webhookSecret.length > 5) {
      try {
        event = verifyDodoWebhook(rawBody, headers, webhookSecret);
      } catch (err: any) {
        console.error('Dodo Payments webhook signature verification failed:', err.message);
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
    const data = event.data || {};

    console.log(`[Dodo Payments Webhook] Received event: ${eventType} (ID: ${data?.payment_id || data?.id || 'n/a'})`);

    switch (eventType) {
      // -----------------------------------------------------------------------
      // 1. Payment Succeeded (One-time credit pack top-ups or subscription charges)
      // -----------------------------------------------------------------------
      case 'payment.succeeded': {
        const metadata = data.metadata || {};
        const customer = data.customer || {};
        const userId = metadata.userId || customer.customer_id;
        const paymentId = data.payment_id || data.id;

        let planId = metadata.planId;
        let packId = metadata.packId;

        // Fallback: Check product_id or product_cart if metadata didn't have plan/pack
        const productId = data.product_id || (data.product_cart && data.product_cart[0]?.product_id);
        if (!planId && !packId && productId) {
          const resolved = resolveProductType(productId);
          planId = resolved.planId;
          packId = resolved.packId;
        }

        if (userId) {
          if (packId) {
            const pack = CREDIT_PACKS.find((p) => p.id === packId);
            if (pack) {
              console.log(`[Dodo Webhook] Granting ${pack.credits} credits for pack "${pack.id}" to user ${userId}`);
              await store.addCredits(
                userId,
                pack.credits,
                'credit_purchase',
                {
                  pack: pack.id,
                  dodo_payment_id: paymentId,
                  dodo_customer_id: customer.customer_id,
                  provider: 'dodo',
                }
              );
            }
          } else if (planId) {
            const plan = PRICING_PLANS.find((p) => p.id === planId);
            if (plan && plan.creditsPerMonth > 0) {
              console.log(`[Dodo Webhook] Granting ${plan.creditsPerMonth} credits for plan "${plan.id}" to user ${userId}`);
              await store.addCredits(
                userId,
                plan.creditsPerMonth,
                'subscription_grant',
                {
                  plan: plan.id,
                  dodo_payment_id: paymentId,
                  dodo_customer_id: customer.customer_id,
                  dodo_subscription_id: data.subscription_id,
                  provider: 'dodo',
                }
              );

              // Upgrade subscription tier
              await store.updateSubscriptionTier(
                userId,
                plan.id as any,
                customer.customer_id,
                data.subscription_id || undefined
              );
            }
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 2. Subscription Active / Renewed
      // -----------------------------------------------------------------------
      case 'subscription.active':
      case 'subscription.renewed':
      case 'subscription.updated': {
        const metadata = data.metadata || {};
        const customer = data.customer || {};
        const userId = metadata.userId || customer.customer_id;
        const subscriptionId = data.subscription_id || data.id;

        let planId = metadata.planId;
        const productId = data.product_id;
        if (!planId && productId) {
          const resolved = resolveProductType(productId);
          planId = resolved.planId;
        }

        if (userId && planId) {
          const plan = PRICING_PLANS.find((p) => p.id === planId);
          if (plan && plan.creditsPerMonth > 0) {
            console.log(`[Dodo Webhook] Subscription activated/renewed for user ${userId} -> Plan: ${plan.id}`);
            await store.addCredits(
              userId,
              plan.creditsPerMonth,
              'subscription_grant',
              {
                plan: plan.id,
                dodo_subscription_id: subscriptionId,
                dodo_customer_id: customer.customer_id,
                provider: 'dodo',
                event: eventType,
              }
            );

            await store.updateSubscriptionTier(
              userId,
              plan.id as any,
              customer.customer_id,
              subscriptionId
            );
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 3. Subscription Cancelled / On Hold / Expired
      // -----------------------------------------------------------------------
      case 'subscription.cancelled':
      case 'subscription.on_hold':
      case 'subscription.expired': {
        const metadata = data.metadata || {};
        const customer = data.customer || {};
        const userId = metadata.userId || customer.customer_id;

        if (userId) {
          console.log(`[Dodo Webhook] Subscription cancelled/expired for user ${userId}. Reverting to free starter tier.`);
          await store.updateSubscriptionTier(
            userId,
            'free',
            customer.customer_id,
            data.subscription_id || data.id
          );
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 4. Refund Succeeded
      // -----------------------------------------------------------------------
      case 'refund.succeeded': {
        console.log(`[Dodo Webhook] Refund processed for payment: ${data.payment_id || data.id}`);
        break;
      }

      default:
        console.log(`[Dodo Webhook] Unhandled event type: ${eventType}`);
        break;
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error: any) {
    console.error('Dodo Payments webhook processing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'OpusCraft Dodo Payments webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
