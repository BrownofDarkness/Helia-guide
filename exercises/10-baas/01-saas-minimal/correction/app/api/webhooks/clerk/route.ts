import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { sendWelcomeEmail } from '@/lib/resend';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface ClerkUserCreatedEvent {
  type: 'user.created';
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name?: string;
  };
}

export async function POST(request: Request) {
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await request.text();
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let event: ClerkUserCreatedEvent;
  try {
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkUserCreatedEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'user.created') {
    const email = event.data.email_addresses[0]?.email_address;
    const name = event.data.first_name ?? 'là';

    // Initialiser la subscription en free
    await supabaseAdmin.from('subscriptions').upsert({
      user_id: event.data.id,
      status: 'free',
    });

    // Email de bienvenue
    if (email) {
      await sendWelcomeEmail(email, name);
    }
  }

  return NextResponse.json({ received: true });
}
