import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  // Récupérer ou créer le customer Stripe
  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.emailAddresses[0]?.emailAddress,
      metadata: { clerk_user_id: userId },
    });
    customerId = customer.id;

    await supabaseAdmin.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      status: 'free',
    });
  }

  // Créer la session Checkout
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      { price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, quantity: 1 },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?cancelled=true`,
    metadata: { clerk_user_id: userId },
  });

  return NextResponse.json({ url: session.url });
}
