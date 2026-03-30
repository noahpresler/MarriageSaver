import { Router } from 'express';
import * as Task from '../models/task.js';
import * as User from '../models/user.js';
import * as Feedback from '../models/feedback.js';
import { requireAuth, requireHousehold } from '../middleware/auth.js';

const router = Router();

// My tasks
router.get('/tasks', requireAuth, requireHousehold, (req, res) => {
  const tasks = Task.getUserTasks(req.session.userId);
  const completedCount = Task.getCompletedCount(req.session.userId);
  const members = User.getHouseholdMembers(req.session.householdId);

  res.render('pages/my-tasks', { tasks, completedCount, members });
});

// Household tasks
router.get('/household/tasks', requireAuth, requireHousehold, (req, res) => {
  const tasks = Task.getHouseholdTasks(req.session.householdId);
  const members = User.getHouseholdMembers(req.session.householdId);

  res.render('pages/household-tasks', { tasks, members });
});

// Create task
router.post('/tasks', requireAuth, requireHousehold, (req, res) => {
  const { title, description, assignedTo, priority, dueDate } = req.body;

  const task = Task.create({
    householdId: req.session.householdId,
    title,
    description,
    createdBy: req.session.userId,
    assignedTo: assignedTo || null,
    priority,
    dueDate: dueDate || null,
  });

  if (req.headers['hx-request']) {
    const members = User.getHouseholdMembers(req.session.householdId);
    return res.render('partials/task-card', { task, members, user: res.locals.user });
  }
  res.redirect('/tasks');
});

// Complete task
router.post('/tasks/:id/complete', requireAuth, (req, res) => {
  const task = Task.complete(req.params.id, req.session.userId);

  if (req.headers['hx-request']) {
    res.set('HX-Trigger', 'taskCompleted');
    return res.render('partials/task-card', { task, members: [], user: res.locals.user });
  }
  res.redirect('/tasks');
});

// Skip task
router.post('/tasks/:id/skip', requireAuth, (req, res) => {
  Task.skip(req.params.id);

  if (req.headers['hx-request']) {
    return res.send('');
  }
  res.redirect('/tasks');
});

// Update task
router.post('/tasks/:id/update', requireAuth, (req, res) => {
  const { title, description, assignedTo, priority, dueDate } = req.body;
  const task = Task.update(req.params.id, { title, description, assignedTo, priority, dueDate });

  if (req.headers['hx-request']) {
    const members = User.getHouseholdMembers(req.session.householdId);
    return res.render('partials/task-card', { task, members, user: res.locals.user });
  }
  res.redirect('/tasks');
});

// Delete task
router.post('/tasks/:id/delete', requireAuth, (req, res) => {
  Task.remove(req.params.id);

  if (req.headers['hx-request']) {
    return res.send('');
  }
  res.redirect('/tasks');
});

// Feedback
router.post('/tasks/:id/feedback', requireAuth, (req, res) => {
  const { emoji, comment } = req.body;
  Feedback.addFeedback({
    taskId: req.params.id,
    userId: req.session.userId,
    emoji,
    comment,
  });

  if (req.headers['hx-request']) {
    const feedback = Feedback.getTaskFeedback(req.params.id);
    return res.render('partials/feedback', { feedback });
  }
  res.redirect('/tasks');
});

router.get('/tasks/:id/feedback', requireAuth, (req, res) => {
  const feedback = Feedback.getTaskFeedback(req.params.id);

  if (req.headers['hx-request']) {
    return res.render('partials/feedback', { feedback });
  }
  res.redirect('/tasks');
});

export default router;
