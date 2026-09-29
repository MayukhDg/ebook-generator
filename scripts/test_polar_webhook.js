const fs = require('fs');
const { Webhook } = require('standardwebhooks');

// 1. Load environment from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
});

async function run() {
  const secret = env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Error: POLAR_WEBHOOK_SECRET is not set in .env.local');
    process.exit(1);
  }

  // Get current user ID from Supabase
  const userRes = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/profiles?select=id,email,credits_balance,subscription_tier&limit=1', {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  const users = await userRes.json();
  const targetUser = users[0];

  if (!targetUser) {
    console.error('Error: No profile found in Supabase database.');
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`Polar Sandbox Webhook Simulator`);
  console.log(`Target User: ${targetUser.email} (ID: ${targetUser.id})`);
  console.log(`Current Balance: ${targetUser.credits_balance} credits`);
  console.log(`Current Tier: ${targetUser.subscription_tier}`);
  console.log(`========================================\n`);

  const mode = process.argv[2] || 'topup_50';
  let eventPayload;

  if (mode === 'creator') {
    eventPayload = {
      type: 'order.paid',
      data: {
        id: 'ord_sandbox_' + Date.now(),
        status: 'paid',
        paid: true,
        productId: env.POLAR_PRODUCT_CREATOR,
        metadata: {
          userId: targetUser.id,
          planId: 'creator',
        },
      },
    };
    console.log('Simulating purchase: Authority Creator Plan ($29/mo -> +100 credits + Creator tier)...');
  } else {
    eventPayload = {
      type: 'order.paid',
      data: {
        id: 'ord_sandbox_' + Date.now(),
        status: 'paid',
        paid: true,
        productId: env.POLAR_PRODUCT_TOPUP_50,
        metadata: {
          userId: targetUser.id,
          packId: 'topup_50',
        },
      },
    };
    console.log('Simulating purchase: Top-Up 50 Pack ($19 -> +50 credits)...');
  }

  const rawPayload = JSON.stringify(eventPayload);
  const msgId = 'msg_' + Date.now();
  const timestamp = new Date();

  // Sign with standardwebhooks
  const wh = new Webhook(secret);
  const signature = wh.sign(msgId, timestamp, rawPayload);

  console.log('Sending signed event to http://localhost:3000/api/webhooks/polar ...');

  const res = await fetch('http://localhost:3000/api/webhooks/polar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'webhook-id': msgId,
      'webhook-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
      'webhook-signature': signature,
    },
    body: rawPayload,
  });

  const resBody = await res.json();
  console.log(`Response HTTP Status: ${res.status}`);
  console.log('Response Body:', resBody);

  // Check updated balance
  const updatedRes = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + `/rest/v1/profiles?id=eq.${targetUser.id}&select=credits_balance,subscription_tier`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  const [updatedUser] = await updatedRes.json();
  console.log(`\nNew Balance: ${updatedUser.credits_balance} credits (+${updatedUser.credits_balance - targetUser.credits_balance})`);
  console.log(`New Tier: ${updatedUser.subscription_tier}`);
  console.log(`\nWebhook simulation completed successfully!\n`);
}

run().catch(console.error);
