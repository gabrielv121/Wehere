/**
 * Optional email sending. If RESEND_API_KEY is set, sends via Resend.
 * Otherwise logs to console (dev). Set RESEND_FROM e.g. "WeHere <onboarding@resend.dev>".
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM ?? 'WeHere <onboarding@resend.dev>';

export interface OrderConfirmationData {
  eventName: string;
  eventDate: string;
  section: string;
  row?: string | null;
  quantity: number;
  totalPrice: number;
  orderId: string;
}

export interface SellerSaleNotificationData {
  eventName: string;
  eventDate: string;
  section: string;
  row?: string | null;
  quantity: number;
  totalPrice: number;
  sellerPayout: number;
  orderId: string;
  transferLink: string;
  deadlineAt: string; // ISO – e.g. 24h from now
  buyerName?: string | null;
}

export async function sendSellerSaleNotification(to: string, data: SellerSaleNotificationData): Promise<void> {
  const deadline = new Date(data.deadlineAt).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const text = [
    `You have a sale!`,
    ``,
    `Event: ${data.eventName}`,
    `Date: ${data.eventDate}`,
    `Section: ${data.section}${data.row ? `, Row ${data.row}` : ''} · ${data.quantity} ticket(s)`,
    `Sale total: $${Number(data.totalPrice).toFixed(2)}`,
    `Your payout (after fee): $${Number(data.sellerPayout).toFixed(2)}`,
    ``,
    `You have 24 hours to transfer the ticket to the buyer.`,
    `Deadline: ${deadline}`,
    ``,
    `Transfer your ticket here (Ticketmaster):`,
    data.transferLink,
    ``,
    `After you send the ticket, mark it as sent in your WeHere account (My Sales).`,
    `The buyer will then confirm receipt so your payout can be released.`,
    ``,
    `Order ID: ${data.orderId}`,
  ].join('\n');

  const subject = `You sold tickets: ${data.eventName}`;
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [to],
          subject,
          text,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('[email] Resend failed:', res.status, err);
      }
    } catch (e) {
      console.error('[email] Resend error:', e);
    }
  } else {
    console.log('[email] (no RESEND_API_KEY) Seller sale notification:', { to, subject, data });
  }
}

export interface BuyerTicketSentData {
  eventName: string;
  eventDate: string;
  section: string;
  row?: string | null;
  quantity: number;
  orderId: string;
  confirmLink: string;
  buyerName?: string | null;
}

export async function sendBuyerTicketSentNotification(to: string, data: BuyerTicketSentData): Promise<void> {
  const text = [
    `Your ticket has been sent!`,
    ``,
    `The seller has marked your ticket as sent for:`,
    ``,
    `Event: ${data.eventName}`,
    `Date: ${data.eventDate}`,
    `Section: ${data.section}${data.row ? `, Row ${data.row}` : ''} · ${data.quantity} ticket(s)`,
    ``,
    `Please confirm when you receive it so we can complete the order and release the seller's payout.`,
    ``,
    `Confirm receipt here:`,
    data.confirmLink,
    ``,
    `(You can also go to My Tickets in your account and click "I received my ticket.")`,
    ``,
    `Order ID: ${data.orderId}`,
  ].join('\n');

  const subject = `Ticket sent: ${data.eventName} — please confirm receipt`;
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [to],
          subject,
          text,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('[email] Resend failed:', res.status, err);
      }
    } catch (e) {
      console.error('[email] Resend error:', e);
    }
  } else {
    console.log('[email] (no RESEND_API_KEY) Buyer ticket-sent notification:', { to, subject, data });
  }
}

export async function sendOrderConfirmation(to: string, data: OrderConfirmationData): Promise<void> {
  const subject = `Order confirmed: ${data.eventName}`;
  const text = [
    `Your order is confirmed.`,
    ``,
    `Event: ${data.eventName}`,
    `Date: ${data.eventDate}`,
    `Section: ${data.section}${data.row ? `, Row ${data.row}` : ''}`,
    `Quantity: ${data.quantity}`,
    `Total: $${Number(data.totalPrice).toFixed(2)}`,
    ``,
    `Order ID: ${data.orderId}`,
    ``,
    `Thank you for using WeHere.`,
  ].join('\n');

  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [to],
          subject,
          text,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('[email] Resend failed:', res.status, err);
      }
    } catch (e) {
      console.error('[email] Resend error:', e);
    }
  } else {
    console.log('[email] (no RESEND_API_KEY) Order confirmation:', { to, subject, data });
  }
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const subject = 'Reset your WeHere password';
  const text = `Use this link to set a new password (valid for 1 hour):\n\n${resetLink}\n\nIf you didn't request this, ignore this email.`;

  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [to],
          subject,
          text,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('[email] Resend failed:', res.status, err);
      }
    } catch (e) {
      console.error('[email] Resend error:', e);
    }
  } else {
    console.log('[email] (no RESEND_API_KEY) Password reset:', { to, resetLink });
  }
}

export async function sendVerificationEmail(to: string, verifyLink: string): Promise<void> {
  const subject = 'Verify your WeHere account';
  const text = `Click this link to verify your email (valid for 24 hours):\n\n${verifyLink}\n\nIf you didn't create an account, ignore this email.`;

  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [to],
          subject,
          text,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('[email] Resend failed:', res.status, err);
      }
    } catch (e) {
      console.error('[email] Resend error:', e);
    }
  } else {
    console.log('[email] (no RESEND_API_KEY) Verification:', { to, verifyLink });
  }
}
