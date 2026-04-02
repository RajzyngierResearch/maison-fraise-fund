import { Router, Request, Response } from 'express';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db';
import { businesses, portraits } from '../db/schema';

const router = Router();

// GET /api/businesses
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(businesses);
    res.json(rows.map(b => ({
      ...b,
      lat: b.latitude ? parseFloat(String(b.latitude)) : null,
      lng: b.longitude ? parseFloat(String(b.longitude)) : null,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/businesses/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  try {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    res.json({
      ...business,
      lat: business.latitude ? parseFloat(String(business.latitude)) : null,
      lng: business.longitude ? parseFloat(String(business.longitude)) : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/businesses/:id/portraits
router.get('/:id/portraits', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(portraits)
      .where(eq(portraits.business_id, id))
      .orderBy(asc(portraits.sort_order), asc(portraits.created_at));

    res.json(rows.map(p => ({
      id: p.id,
      url: p.image_url,
      season: p.season,
      subject_name: p.subject_name,
      campaign_title: p.campaign_title,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
