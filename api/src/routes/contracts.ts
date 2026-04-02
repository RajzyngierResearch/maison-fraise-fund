import { Router, Request, Response } from 'express';
import { eq, and, lte, gte } from 'drizzle-orm';
import { db } from '../db';
import { employmentContracts, users, businesses, popupNominations } from '../db/schema';
import { sendPushNotification } from '../lib/push';
import { logger } from '../lib/logger';

const router = Router();

// POST /api/contracts/:id/accept
router.post('/:id/accept', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { user_id } = req.body;
  if (isNaN(id) || !user_id) {
    res.status(400).json({ error: 'user_id is required' });
    return;
  }

  try {
    const [contract] = await db.select().from(employmentContracts).where(
      and(eq(employmentContracts.id, id), eq(employmentContracts.user_id, user_id))
    );
    if (!contract) { res.status(404).json({ error: 'Contract not found' }); return; }
    if (contract.status !== 'pending') { res.status(400).json({ error: 'Contract already resolved' }); return; }

    await db.update(employmentContracts).set({ status: 'active' }).where(eq(employmentContracts.id, id));

    const [business] = await db.select().from(businesses).where(eq(businesses.id, contract.business_id));
    const [user] = await db.select().from(users).where(eq(users.id, user_id));
    const userName = user?.display_name ?? user?.email?.split('@')[0] ?? 'Someone';
    const bizName = business?.name ?? 'a business';

    // Notify everyone who has ever nominated this user (implicit followers)
    const nominators = await db
      .select({ nominator_id: popupNominations.nominator_id })
      .from(popupNominations)
      .where(eq(popupNominations.nominee_id, user_id));

    const uniqueIds = [...new Set(nominators.map(n => n.nominator_id))];

    const followerUsers = await Promise.all(
      uniqueIds.map(uid => db.select({ push_token: users.push_token })
        .from(users).where(eq(users.id, uid)).then(r => r[0]))
    );

    for (const follower of followerUsers) {
      if (follower?.push_token) {
        sendPushNotification(follower.push_token, {
          title: 'Maison Fraise',
          body: `${userName} is now at ${bizName}.`,
          data: { screen: 'home' },
        }).catch(() => {});
      }
    }

    res.json({ success: true });
  } catch (err) {
    logger.error('Contract accept error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/contracts/:id/decline
router.post('/:id/decline', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { user_id } = req.body;
  if (isNaN(id) || !user_id) {
    res.status(400).json({ error: 'user_id is required' });
    return;
  }

  try {
    const [contract] = await db.select().from(employmentContracts).where(
      and(eq(employmentContracts.id, id), eq(employmentContracts.user_id, user_id))
    );
    if (!contract) { res.status(404).json({ error: 'Contract not found' }); return; }

    await db.update(employmentContracts).set({ status: 'declined' }).where(eq(employmentContracts.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
