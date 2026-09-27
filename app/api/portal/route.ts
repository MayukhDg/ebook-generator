import { NextRequest, NextResponse } from 'next/server';
import { polar } from '@/lib/polar/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const polarToken = process.env.POLAR_ACCESS_TOKEN;
    if (!polarToken || polarToken.includes('mock')) {
      return NextResponse.json({
        url: '/dashboard?simulated_portal=true',
        simulated: true,
        message: 'Polar customer portal simulated in local development.',
      });
    }

    // Create a customer portal session for the authenticated user
    const session = await polar.customerSessions.create({
      externalCustomerId: user.id,
    });

    return NextResponse.json({ url: session.customerPortalUrl });
  } catch (error: any) {
    console.error('Customer portal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}
