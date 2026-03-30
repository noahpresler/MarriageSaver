import { Router } from 'express';
import * as User from '../models/user.js';
import * as Household from '../models/household.js';

const router = Router();

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/tasks');
  res.render('pages/login', { error: null });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = User.authenticate(email, password);

  if (!user) {
    return res.render('pages/login', { error: 'Invalid email or password' });
  }

  req.session.userId = user.id;
  req.session.displayName = user.display_name;
  req.session.avatarColor = user.avatar_color;
  req.session.householdId = user.household_id;

  if (!user.household_id) {
    return res.redirect('/household/setup');
  }
  res.redirect('/tasks');
});

router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/tasks');
  res.render('pages/register', { error: null });
});

router.post('/register', (req, res) => {
  const { email, displayName, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render('pages/register', { error: 'Passwords do not match' });
  }

  if (password.length < 6) {
    return res.render('pages/register', { error: 'Password must be at least 6 characters' });
  }

  const existing = User.findByEmail(email);
  if (existing) {
    return res.render('pages/register', { error: 'An account with this email already exists' });
  }

  const user = User.createUser({ email, displayName, password });

  req.session.userId = user.id;
  req.session.displayName = user.display_name;
  req.session.avatarColor = user.avatar_color;

  res.redirect('/household/setup');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

export default router;
