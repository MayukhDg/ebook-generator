const fs = require('fs');
const { Webhook } = require('standardwebhooks');

// 1. Load environment from .env.local
const env = {};
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  });
}

async function run() {
  const secret = env.DODO_PAYMENTS_WEBHOOK_KEY || env.DODO_PAYMENTS_WEBHOOK_SECRET || env.DODO_WEBHOOK_SECRET || 'whsec_dodo_mock_test_secret_1234567890';

  // Get current user ID from Supabase if configured, otherwise fallback to mock user
  let targetUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'author@opuscraft.ai',
    credits_balance: 185,
    subscription_tier: 'creator',
  };

  if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && !env.NEXT_PUBLIC_SUPABASE_URL.includes('mock')) {
    try {
      const userRes = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/profiles?select=id,email,credits_balance,subscription_tier&limit=1', {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
        },
      });
      if (userRes.ok) {
        const users = await userRes.json();
        if (users[0]) targetUser = users[0];
      }
    } catch (e) {
      console.warn('Using default mock profile for simulation:', e.message);
    }
  }

  console.log(`\n========================================`);
  console.log(`Dodo Payments Webhook Simulator`);
  console.log(`Target User: ${targetUser.email} (ID: ${targetUser.id})`);
  console.log(`Current Balance: ${targetUser.credits_balance} credits`);
  console.log(`Current Tier: ${targetUser.subscription_tier}`);
  console.log(`========================================\n`);

  const mode = process.argv[2] || 'topup_50';
  let eventPayload;

  if (mode === 'creator' || mode === 'authority') {
    const isAuthority = mode === 'authority';
    const planCredits = isAuthority ? 500 : 150;
    const planName = isAuthority ? 'Agency Operator' : 'Authority Creator';
    const planProductId = isAuthority
      ? env.DODO_PRODUCT_AUTHORITY || 'pdt_authority_sub'
      : env.DODO_PRODUCT_CREATOR || 'pdt_creator_sub';

    eventPayload = {
      business_id: 'bus_dodo_sandbox',
      timestamp: new Date().toISOString(),
      type: 'subscription.active',
      data: {
        subscription_id: 'sub_dodo_' + Date.now(),
        status: 'active',
        product_id: planProductId,
        customer: {
          customer_id: 'cus_dodo_' + targetUser.id.slice(0, 8),
          email: targetUser.email,
          name: 'OpusCraft Author',
        },
        metadata: {
          userId: targetUser.id,
          planId: mode,
        },
      },
    };
    console.log(`Simulating subscription: ${planName} Plan -> +${planCredits} credits + ${mode} tier...`);
  } else {
    const is150 = mode === 'topup_150';
    const packCredits = is150 ? 150 : 50;
    const packPrice = is150 ? '$49' : '$19';
    const packProductId = is150
      ? env.DODO_PRODUCT_TOPUP_150 || 'pdt_topup_150'
      : env.DODO_PRODUCT_TOPUP_50 || 'pdt_topup_50';

    eventPayload = {
      business_id: 'bus_dodo_sandbox',
      timestamp: new Date().toISOString(),
      type: 'payment.succeeded',
      data: {
        payment_id: 'pay_dodo_' + Date.now(),
        status: 'succeeded',
        product_id: packProductId,
        customer: {
          customer_id: 'cus_dodo_' + targetUser.id.slice(0, 8),
          email: targetUser.email,
        },
        metadata: {
          userId: targetUser.id,
          packId: mode,
        },
      },
    };
    console.log(`Simulating one-time purchase: ${mode} Pack (${packPrice} -> +${packCredits} credits)...`);
  }

  const rawPayload = JSON.stringify(eventPayload);
  const msgId = 'msg_dodo_' + Date.now();
  const timestamp = new Date();

  // Sign with standardwebhooks (Standard Webhooks spec used by Dodo Payments)
  const wh = new Webhook(secret);
  const signature = wh.sign(msgId, timestamp, rawPayload);

  console.log('Sending signed event to http://localhost:3000/api/webhooks/dodo ...');

  const res = await fetch('http://localhost:3000/api/webhooks/dodo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'webhook-id': msgId,
      'webhook-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
      'webhook-signature': signature,
    },
    body: rawPayload,
  });

  const resBody = await res.json().catch(() => ({}));
  console.log(`Response HTTP Status: ${res.status}`);
  console.log('Response Body:', resBody);

  if (res.ok) {
    console.log('\nSUCCESS! Dodo Payments webhook processed and verified successfully.');
  } else {
    console.error('\nFAILED! Webhook returned error response.');
  }
}

run().catch(console.error);
