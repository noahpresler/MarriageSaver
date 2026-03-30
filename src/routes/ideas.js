import { Router } from 'express';
import * as Task from '../models/task.js';
import * as User from '../models/user.js';
import { requireAuth, requireHousehold } from '../middleware/auth.js';

const router = Router();

const IDEA_POOL = [
  { title: 'Deep clean the refrigerator', category: 'cleaning', description: 'Remove all items, wipe down shelves, check expiration dates' },
  { title: 'Organize the junk drawer', category: 'organizing', description: 'Sort, declutter, and add dividers' },
  { title: 'Clean out the garage', category: 'cleaning', description: 'Sweep, organize tools, donate what you don\'t need' },
  { title: 'Meal prep for the week', category: 'cooking', description: 'Plan meals, shop, and prep ingredients for the coming week' },
  { title: 'Fix that thing that\'s been bugging you', category: 'maintenance', description: 'You know the one. The squeaky door, the dripping faucet...' },
  { title: 'Wash all the windows', category: 'cleaning', description: 'Inside and out — let the sunshine in' },
  { title: 'Organize the pantry', category: 'organizing', description: 'Check dates, group items, make a shopping list for staples' },
  { title: 'Deep clean the bathroom', category: 'cleaning', description: 'Scrub grout, clean mirrors, organize cabinets' },
  { title: 'Start a small garden or plant herbs', category: 'outdoor', description: 'Basil, mint, and rosemary are easy starters' },
  { title: 'Clean under all the furniture', category: 'cleaning', description: 'Move the couch. You might find treasure (or dust bunnies)' },
  { title: 'Organize digital photos', category: 'digital', description: 'Sort into albums, delete duplicates, back up to cloud' },
  { title: 'Update emergency contacts', category: 'admin', description: 'Review contacts on phones, with doctors, and at schools' },
  { title: 'Clean and organize the closets', category: 'organizing', description: 'Donate clothes you haven\'t worn in a year' },
  { title: 'Test smoke detectors and replace batteries', category: 'maintenance', description: 'Safety first!' },
  { title: 'Write thank-you notes', category: 'social', description: 'Think of someone who helped you recently and say thanks' },
  { title: 'Plan a fun family activity', category: 'social', description: 'Game night, movie marathon, or a day trip' },
  { title: 'Sort through the mail pile', category: 'admin', description: 'Shred junk, file important docs, pay any bills' },
  { title: 'Clean the oven', category: 'cleaning', description: 'It\'s probably been a while...' },
  { title: 'Vacuum the car', category: 'cleaning', description: 'Clean interior, check tire pressure, top off washer fluid' },
  { title: 'Rotate seasonal clothes', category: 'organizing', description: 'Store off-season clothes, bring out what you need' },
];

router.get('/ideas', requireAuth, requireHousehold, async (req, res) => {
  const suggestions = getRandomIdeas(3);
  const members = await User.getHouseholdMembers(req.session.householdId);

  res.render('pages/ideas', { suggestions, members });
});

router.post('/ideas/generate', requireAuth, requireHousehold, async (req, res) => {
  const suggestions = getRandomIdeas(3);
  const members = await User.getHouseholdMembers(req.session.householdId);

  if (req.headers['hx-request']) {
    return res.render('partials/idea-list', { suggestions, members, layout: false });
  }
  res.render('pages/ideas', { suggestions, members });
});

router.post('/ideas/adopt', requireAuth, requireHousehold, async (req, res) => {
  const { title, description, assignedTo } = req.body;

  await Task.create({
    householdId: req.session.householdId,
    title,
    description,
    createdBy: req.session.userId,
    assignedTo: assignedTo || null,
    priority: 'normal',
  });

  if (req.headers['hx-request']) {
    res.set('HX-Trigger', 'ideaAdopted');
    return res.send('<div class="adopted-message">Added to your task list!</div>');
  }
  res.redirect('/tasks');
});

function getRandomIdeas(count) {
  const shuffled = [...IDEA_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default router;
