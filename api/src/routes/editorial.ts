import { Router, Request, Response } from 'express';
import { eq, and, desc, ilike, or, isNotNull } from 'drizzle-orm';
import { db } from '../db';
import { editorialPieces, memberships, users } from '../db/schema';
import { requireUser } from '../lib/auth';

const router = Router();

// GET /api/editorial — all published pieces; optional ?q= search, ?tag= filter
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
    const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : undefined;

    const conditions = [eq(editorialPieces.status, 'published')];
    if (q) {
      conditions.push(or(ilike(editorialPieces.title, `%${q}%`), ilike(editorialPieces.body, `%${q}%`))!);
    }
    if (tag) {
      conditions.push(eq(editorialPieces.tag, tag));
    }

    const rows = await db
      .select({
        id: editorialPieces.id,
        title: editorialPieces.title,
        author_display_name: users.display_name,
        published_at: editorialPieces.published_at,
        commission_cents: editorialPieces.commission_cents,
        tag: editorialPieces.tag,
      })
      .from(editorialPieces)
      .leftJoin(users, eq(editorialPieces.author_user_id, users.id))
      .where(and(...conditions))
      .orderBy(desc(editorialPieces.published_at));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// GET /api/editorial/mine — all pieces by current user (requireUser)
router.get('/mine', requireUser, async (req: Request, res: Response) => {
  const userId: number = (req as any).userId;
  try {
    const rows = await db
      .select()
      .from(editorialPieces)
      .where(eq(editorialPieces.author_user_id, userId))
      .orderBy(desc(editorialPieces.created_at));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// GET /api/editorial/:id — full piece (published only)
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'invalid_id' });
    return;
  }

  try {
    const [piece] = await db
      .select({
        id: editorialPieces.id,
        title: editorialPieces.title,
        body: editorialPieces.body,
        author_display_name: users.display_name,
        published_at: editorialPieces.published_at,
        commission_cents: editorialPieces.commission_cents,
        tag: editorialPieces.tag,
        status: editorialPieces.status,
      })
      .from(editorialPieces)
      .leftJoin(users, eq(editorialPieces.author_user_id, users.id))
      .where(and(eq(editorialPieces.id, id), eq(editorialPieces.status, 'published')))
      .limit(1);

    if (!piece) {
      res.status(404).json({ error: 'not_found' });
      return;
    }

    res.json(piece);
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// POST /api/editorial — submit new piece (requireUser + active membership)
router.post('/', requireUser, async (req: Request, res: Response) => {
  const userId: number = (req as any).userId;
  const { title, body, tag } = req.body;

  if (!title || typeof title !== 'string' || title.length > 200) {
    res.status(400).json({ error: 'invalid_title', message: 'Title is required and must be 200 characters or fewer.' });
    return;
  }
  if (!body || typeof body !== 'string' || body.length < 100) {
    res.status(400).json({ error: 'invalid_body', message: 'Body must be at least 100 characters.' });
    return;
  }

  try {
    const [activeMembership] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(eq(memberships.user_id, userId), eq(memberships.status, 'active')))
      .limit(1);

    if (!activeMembership) {
      res.status(403).json({ error: 'membership_required' });
      return;
    }

    const [piece] = await db
      .insert(editorialPieces)
      .values({
        author_user_id: userId,
        title,
        body,
        status: 'submitted',
        tag: tag !== undefined ? String(tag) : null,
      })
      .returning();

    res.status(201).json(piece);
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// PATCH /api/editorial/:id — edit piece (author only, draft/submitted only)
router.patch('/:id', requireUser, async (req: Request, res: Response) => {
  const userId: number = (req as any).userId;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'invalid_id' });
    return;
  }

  const { title, body, tag } = req.body;

  try {
    const [piece] = await db
      .select()
      .from(editorialPieces)
      .where(eq(editorialPieces.id, id))
      .limit(1);

    if (!piece) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    if (piece.author_user_id !== userId) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    if (piece.status !== 'draft' && piece.status !== 'submitted') {
      res.status(409).json({ error: 'not_editable', message: 'Piece can only be edited when in draft or submitted status.' });
      return;
    }

    const updates: Partial<{ title: string; body: string; tag: string | null; updated_at: Date }> = { updated_at: new Date() };
    if (title !== undefined) {
      if (typeof title !== 'string' || title.length > 200) {
        res.status(400).json({ error: 'invalid_title' });
        return;
      }
      updates.title = title;
    }
    if (body !== undefined) {
      if (typeof body !== 'string' || body.length < 100) {
        res.status(400).json({ error: 'invalid_body' });
        return;
      }
      updates.body = body;
    }
    if (tag !== undefined) {
      updates.tag = tag === null ? null : String(tag);
    }

    const [updated] = await db
      .update(editorialPieces)
      .set(updates)
      .where(eq(editorialPieces.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
