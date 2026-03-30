import { Router } from 'express';
import * as Task from '../models/task.js';
import * as User from '../models/user.js';
import * as Feedback from '../models/feedback.js';
import { requireAuth, requireHousehold } from '../middleware/auth.js';

const router = Router();

// My tasks
router.get('/tasks', requireAuth, requireHousehold, async (req, res) => {
  const tasks = await Task.getUserTasks(req.session.userId);
  const completedCount = await Task.getCompletedCount(req.session.userId);
  const members = await User.getHouseholdMembers(req.session.householdId);

  res.render('pages/my-tasks', { tasks, completedCount, members });
});

// Household tasks
router.get('/household/tasks', requireAuth, requireHousehold, async (req, res) => {
  const tasks = await Task.getHouseholdTasks(req.session.householdId);
  const members = await User.getHouseholdMembers(req.session.householdId);

  res.render('pages/household-tasks', { tasks, members });
});

// Create task
router.post('/tasks', requireAuth, requireHousehold, async (req, res) => {
  const { title, description, assignedTo, priority, dueDate } = req.body;

  const task = await Task.create({
    householdId: req.session.householdId,
    title,
    description,
    createdBy: req.session.userId,
    assignedTo: assignedTo || null,
    priority,
    dueDate: dueDate || null,
  });

  if (req.headers['hx-request']) {
    const members = await User.getHouseholdMembers(req.session.householdId);
    return res.render('partials/task-card', { task, members, user: res.locals.user, layout: false });
  }
  res.redirect('/tasks');
});

// Complete task
router.post('/tasks/:id/complete', requireAuth, async (req, res) => {
  const task = await Task.complete(req.params.id, req.session.userId);

  if (req.headers['hx-request']) {
    res.set('HX-Trigger', 'taskCompleted');
    return res.render('partials/task-card', { task, members: [], user: res.locals.user, layout: false });
  }
  res.redirect('/tasks');
});

// Skip task
router.post('/tasks/:id/skip', requireAuth, async (req, res) => {
  await Task.skip(req.params.id);

  if (req.headers['hx-request']) {
    return res.send('');
  }
  res.redirect('/tasks');
});

// Update task
router.post('/tasks/:id/update', requireAuth, async (req, res) => {
  const { title, description, assignedTo, priority, dueDate } = req.body;
  const task = await Task.update(req.params.id, { title, description, assignedTo, priority, dueDate });

  if (req.headers['hx-request']) {
    const members = await User.getHouseholdMembers(req.session.householdId);
    return res.render('partials/task-card', { task, members, user: res.locals.user, layout: false });
  }
  res.redirect('/tasks');
});

// Delete task
router.post('/tasks/:id/delete', requireAuth, async (req, res) => {
  await Task.remove(req.params.id);

  if (req.headers['hx-request']) {
    return res.send('');
  }
  res.redirect('/tasks');
});

// Feedback
router.post('/tasks/:id/feedback', requireAuth, async (req, res) => {
  const { emoji, comment } = req.body;
  await Feedback.addFeedback({
    taskId: req.params.id,
    userId: req.session.userId,
    emoji,
    comment,
  });

  if (req.headers['hx-request']) {
    const feedback = await Feedback.getTaskFeedback(req.params.id);
    return res.render('partials/feedback', { feedback, layout: false });
  }
  res.redirect('/tasks');
});

router.get('/tasks/:id/feedback', requireAuth, async (req, res) => {
  const feedback = await Feedback.getTaskFeedback(req.params.id);

  if (req.headers['hx-request']) {
    return res.render('partials/feedback', { feedback, layout: false });
  }
  res.redirect('/tasks');
});

export default router;
