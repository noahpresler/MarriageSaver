import { Router } from 'express';
import * as Household from '../models/household.js';
import * as User from '../models/user.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/household/setup', requireAuth, (req, res) => {
  if (req.session.householdId) return res.redirect('/tasks');
  res.render('pages/household-setup', { error: null });
});

router.post('/household/create', requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.render('pages/household-setup', { error: 'Household name is required' });
  }

  const household = Household.createHousehold(name.trim());
  User.joinHousehold(req.session.userId, household.id);
  req.session.householdId = household.id;

  res.redirect('/tasks');
});

router.post('/household/join', requireAuth, (req, res) => {
  const { inviteCode } = req.body;
  const household = Household.findByInviteCode(inviteCode?.trim());

  if (!household) {
    return res.render('pages/household-setup', { error: 'Invalid invite code' });
  }

  User.joinHousehold(req.session.userId, household.id);
  req.session.householdId = household.id;

  res.redirect('/tasks');
});

router.get('/household', requireAuth, (req, res) => {
  if (!req.session.householdId) return res.redirect('/household/setup');

  const household = Household.findById(req.session.householdId);
  const members = User.getHouseholdMembers(req.session.householdId);

  res.render('pages/household', { household, members });
});

router.get('/join/:inviteCode', (req, res) => {
  const household = Household.findByInviteCode(req.params.inviteCode);
  if (!household) {
    return res.redirect('/?error=invalid-invite');
  }

  if (!req.session.userId) {
    req.session.pendingInvite = req.params.inviteCode;
    return res.redirect('/register');
  }

  User.joinHousehold(req.session.userId, household.id);
  req.session.householdId = household.id;
  res.redirect('/tasks');
});

export default router;
