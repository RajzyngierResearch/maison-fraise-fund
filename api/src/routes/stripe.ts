import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { stripe } from '../lib/stripe';
import { db } from '../db';
import { orders, popupRsvps, popupRequests, campaignCommissions } from '../db/schema';
import { logger } from '../lib/logger';

const router = Router();

// POST /api/stripe/webhook
// Note: this route receives a raw Buffer body (configured in app.ts)
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed', err);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const type = pi.metadata?.type;

      if (!type || type === 'order') {
        // Legacy order flow
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.stripe_payment_intent_id, pi.id));
        if (order && order.status === 'pending') {
          await db.update(orders).set({ status: 'paid' }).where(eq(orders.id, order.id));
          logger.info(`Order ${order.id} marked paid via webhook`);
        }
      } else if (type === 'popup_rsvp') {
        const [rsvp] = await db
          .select()
          .from(popupRsvps)
          .where(eq(popupRsvps.stripe_payment_intent_id, pi.id));
        if (rsvp && rsvp.status === 'pending') {
          await db.update(popupRsvps).set({ status: 'paid' }).where(eq(popupRsvps.id, rsvp.id));
          logger.info(`Popup RSVP ${rsvp.id} marked paid via webhook`);
        }
      } else if (type === 'popup_request') {
        const [request] = await db
          .select()
          .from(popupRequests)
          .where(eq(popupRequests.stripe_payment_intent_id, pi.id));
        if (request && request.status === 'pending') {
          await db.update(popupRequests).set({ status: 'paid' }).where(eq(popupRequests.id, request.id));
          logger.info(`Popup request ${request.id} marked paid via webhook`);
        }
      } else if (type === 'campaign_commission') {
        const [commission] = await db
          .select()
          .from(campaignCommissions)
          .where(eq(campaignCommissions.stripe_payment_intent_id, pi.id));
        if (commission && commission.status === 'pending') {
          await db.update(campaignCommissions).set({ status: 'paid' }).where(eq(campaignCommissions.id, commission.id));
          logger.info(`Campaign commission ${commission.id} marked paid via webhook`);
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const type = pi.metadata?.type;

      if (!type || type === 'order') {
        await db.update(orders).set({ status: 'cancelled' }).where(eq(orders.stripe_payment_intent_id, pi.id));
      } else if (type === 'popup_rsvp') {
        await db.update(popupRsvps).set({ status: 'cancelled' }).where(eq(popupRsvps.stripe_payment_intent_id, pi.id));
      } else if (type === 'popup_request') {
        await db.update(popupRequests).set({ status: 'cancelled' }).where(eq(popupRequests.stripe_payment_intent_id, pi.id));
      } else if (type === 'campaign_commission') {
        await db.update(campaignCommissions).set({ status: 'cancelled' }).where(eq(campaignCommissions.stripe_payment_intent_id, pi.id));
      }
    }
  } catch (err) {
    // Log but return 200 — Stripe will retry on non-2xx responses
    logger.error('Webhook handler error', err);
  }

  res.json({ received: true });
});

export default router;
