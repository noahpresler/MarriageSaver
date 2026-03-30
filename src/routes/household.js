import { Router } from 'express';
import * as Household from '../models/household.js';
import * as User from '../models/user.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/household/setup', requireAuth, (req, res) => {
  if (req.session.householdId) return res.redirect('/tasks');
  res.render('pages/household-setup', { error: null });
});

router.post('/household/create', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.render('pages/household-setup', { error: 'Household name is required' });
  }

  const household = await Household.createHousehold(name.trim());
  await User.joinHousehold(req.session.userId, Number(household.id));
  req.session.householdId = Number(household.id);

  res.redirect('/tasks');
});

router.post('/household/join', requireAuth, async (req, res) => {
  const { inviteCode } = req.body;
  const household = await Household.findByInviteCode(inviteCode?.trim());

  if (!household) {
    return res.render('pages/household-setup', { error: 'Invalid invite code' });
  }

  await User.joinHousehold(req.session.userId, Number(household.id));
  req.session.householdId = Number(household.id);

  res.redirect('/tasks');
});

router.get('/household', requireAuth, async (req, res) => {
  if (!req.session.householdId) return res.redirect('/household/setup');

  const household = await Household.findById(req.session.householdId);
  const members = await User.getHouseholdMembers(req.session.householdId);

  res.render('pages/household', { household, members });
});

router.get('/join/:inviteCode', async (req, res) => {
  const household = await Household.findByInviteCode(req.params.inviteCode);
  if (!household) {
    return res.redirect('/?error=invalid-invite');
  }

  if (!req.session.userId) {
    req.session.pendingInvite = req.params.inviteCode;
    return res.redirect('/register');
  }

  await User.joinHousehold(req.session.userId, Number(household.id));
  req.session.householdId = Number(household.id);
  res.redirect('/tasks');
});

export default router;
