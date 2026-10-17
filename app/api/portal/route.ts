import { NextRequest, NextResponse } from 'next/server';
import { dodo } from '@/lib/dodo/config';
import { store } from '@/lib/data/store';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_API_KEY;
    if (!dodoApiKey || dodoApiKey.includes('mock') || dodoApiKey.includes('placeholder')) {
      return NextResponse.json({
        url: '/dashboard?simulated_portal=true',
        simulated: true,
        message: 'Dodo Payments customer portal simulated in local development.',
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const profile = await store.getProfile(user.id);

    let customerId = profile?.dodo_customer_id;

    // If customerId is not recorded on profile yet, search Dodo by email
    if (!customerId && user.email) {
      try {
        const customerList = await dodo.customers.list({ email: user.email });
        if (customerList.items && customerList.items.length > 0) {
          customerId = customerList.items[0].customer_id;
        }
      } catch (lookupErr) {
        console.warn('Could not query customer by email from Dodo:', lookupErr);
      }
    }

    if (!customerId) {
      return NextResponse.json({
        url: '/dashboard',
        message: 'No active Dodo Payments subscription or customer profile found yet.',
      });
    }

    // Create a customer portal session for the customer
    const session = await dodo.customers.customerPortal.create(customerId, {
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.link });
  } catch (error: any) {
    console.error('Dodo customer portal error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}
