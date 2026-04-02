import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { users, memberships, editorialPieces, employmentContracts } from '../db/schema';

const router = Router();

// GET /api/profiles/:userId
router.get('/:userId', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    res.status(400).json({ error: 'invalid_user_id' });
    return;
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        display_name: users.display_name,
        portrait_url: users.portrait_url,
        worker_status: users.worker_status,
        portal_opted_in: users.portal_opted_in,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: 'user_not_found' });
      return;
    }

    const [activeMembership] = await db
      .select({ tier: memberships.tier })
      .from(memberships)
      .where(and(eq(memberships.user_id, userId), eq(memberships.status, 'active')))
      .limit(1);

    // Derive worker_status dynamically from employment contracts if not set on user
    let workerStatus: string | null = user.worker_status;
    if (!workerStatus) {
      const [activeContract] = await db
        .select({ status: employmentContracts.status })
        .from(employmentContracts)
        .where(and(eq(employmentContracts.user_id, userId), eq(employmentContracts.status, 'active')))
        .limit(1);

      if (activeContract) {
        workerStatus = 'active';
      } else {
        const [completedContract] = await db
          .select({ status: employmentContracts.status })
          .from(employmentContracts)
          .where(and(eq(employmentContracts.user_id, userId), eq(employmentContracts.status, 'completed')))
          .limit(1);
        if (completedContract) {
          workerStatus = 'alumni';
        }
      }
    }

    const editorial_pieces = await db
      .select({
        id: editorialPieces.id,
        title: editorialPieces.title,
        tag: editorialPieces.tag,
        published_at: editorialPieces.published_at,
        commission_cents: editorialPieces.commission_cents,
      })
      .from(editorialPieces)
      .where(and(eq(editorialPieces.author_user_id, userId), eq(editorialPieces.status, 'published')))
      .orderBy(desc(editorialPieces.published_at));

    res.json({
      user: {
        id: user.id,
        display_name: user.display_name,
        membership_tier: activeMembership?.tier ?? null,
        portrait_url: user.portrait_url,
        worker_status: workerStatus,
        portal_opted_in: user.portal_opted_in,
      },
      editorial_pieces,
    });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
