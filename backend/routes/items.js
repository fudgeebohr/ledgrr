const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { requireAuth } = require('../middleware/auth');

// Every route in this file requires a logged-in user, and every query is
// scoped to that user's own items so different accounts never see each other's data.
router.use(requireAuth);

// Helper: build a mongo filter object from query params, always scoped to the owner
function buildFilter(query, ownerId) {
  const filter = { owner: ownerId };
  if (query.payer && query.payer !== 'all') filter.payer = query.payer;
  if (query.platform && query.platform !== 'all') filter.platform = query.platform;
  return filter;
}

// GET /api/items -> list the current user's items, optionally filtered by payer/platform
router.get('/', async (req, res) => {
  try {
    const filter = buildFilter(req.query, req.user.id);
    const items = await Item.find(filter).sort({ dueDate: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/meta -> distinct payers & platforms for THIS user, for filter dropdowns
router.get('/meta', async (req, res) => {
  try {
    const [payers, platforms] = await Promise.all([
      Item.distinct('payer', { owner: req.user.id }),
      Item.distinct('platform', { owner: req.user.id }),
    ]);
    res.json({ payers: payers.sort(), platforms: platforms.sort() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/summary -> totals for the current filter, scoped to this user
router.get('/summary', async (req, res) => {
  try {
    const filter = buildFilter(req.query, req.user.id);
    const items = await Item.find(filter);
    const summary = items.reduce(
      (acc, item) => {
        acc.totalMonthlyDue += item.monthlyDue;
        acc.totalRemaining += item.remainingAmount;
        acc.totalOutstandingItems += 1;
        acc.totalOriginal += item.totalAmount;
        acc.totalPaid += item.amountPaid;
        return acc;
      },
      {
        totalMonthlyDue: 0,
        totalRemaining: 0,
        totalOutstandingItems: 0,
        totalOriginal: 0,
        totalPaid: 0,
      }
    );
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items -> create new item, owned by the current user
router.post('/', async (req, res) => {
  try {
    const { itemName, payer, platform, monthlyDue, monthsToPay, dueDate, notes } = req.body;
    const item = new Item({
      owner: req.user.id,
      itemName,
      payer,
      platform,
      monthlyDue,
      monthsToPay,
      dueDate,
      notes,
      monthsPaid: 0,
    });
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/items/:id -> edit item fields (only if it belongs to the current user)
router.put('/:id', async (req, res) => {
  try {
    const updates = (({ itemName, payer, platform, monthlyDue, monthsToPay, monthsPaid, dueDate, notes }) => ({
      itemName,
      payer,
      platform,
      monthlyDue,
      monthsToPay,
      monthsPaid,
      dueDate,
      notes,
    }))(req.body);

    // Strip undefined keys so partial updates work
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const updated = await Item.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Item not found' });

    // If the edit pushed monthsPaid to/over monthsToPay, auto-remove (fully paid off)
    if (updated.monthsPaid >= updated.monthsToPay) {
      await Item.findByIdAndDelete(updated._id);
      return res.json({ removed: true, item: updated });
    }

    res.json({ removed: false, item: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/items/:id/pay -> mark one more month as paid, advance due date,
// and auto-remove the item once monthsPaid reaches monthsToPay
router.patch('/:id/pay', async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user.id });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.monthsPaid += 1;

    if (item.monthsPaid >= item.monthsToPay) {
      await Item.findByIdAndDelete(item._id);
      return res.json({ removed: true, item });
    }

    const next = new Date(item.dueDate);
    next.setMonth(next.getMonth() + 1);
    item.dueDate = next;

    await item.save();
    res.json({ removed: false, item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/items/:id/unpay -> undo last month paid
router.patch('/:id/unpay', async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user.id });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.monthsPaid > 0) {
      item.monthsPaid -= 1;
      const prev = new Date(item.dueDate);
      prev.setMonth(prev.getMonth() - 1);
      item.dueDate = prev;
      await item.save();
    }

    res.json({ removed: false, item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/items/:id -> manually remove an item (only if it belongs to the current user)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Item.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, item: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
