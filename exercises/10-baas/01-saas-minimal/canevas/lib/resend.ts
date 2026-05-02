import { Resend } from 'resend';

/**
 * Client Resend paresseux — voir lib/stripe.ts pour le pourquoi.
 */
let cached: Resend | null = null;

function getResend(): Resend {
  if (!cached) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        'RESEND_API_KEY is required. Configure your .env.local before sending an email.'
      );
    }
    cached = new Resend(key);
  }
  return cached;
}

export async function sendWelcomeEmail(to: string, name: string) {
  return getResend().emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to,
    subject: 'Bienvenue sur Tasky Pro 🚀',
    html: `
      <h1>Bienvenue ${name} !</h1>
      <p>Merci de t'être inscrit à Tasky Pro. Tu es sur le free plan ; passe au Pro depuis ton dashboard pour débloquer toutes les features.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Aller au dashboard</a></p>
    `,
  });
}
