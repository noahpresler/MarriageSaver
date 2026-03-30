import pool from '../db/connection.js';

export async function create({ householdId, title, description, createdBy, assignedTo, priority, dueDate, recurrenceInterval, recurrenceLabel }) {
  const { rows } = await pool.query(
    `INSERT INTO tasks (household_id, title, description, created_by, assigned_to, priority, due_date, recurrence_interval, recurrence_label)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [householdId, title, description || null, createdBy, assignedTo || null, priority || 'normal', dueDate || null, recurrenceInterval || null, recurrenceLabel || null]
  );
  return findById(rows[0].id);
}

export async function findById(id) {
  const { rows } = await pool.query(
    `SELECT t.*, u.display_name AS assigned_name, u.avatar_color AS assigned_color,
            c.display_name AS created_by_name
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     LEFT JOIN users c ON t.created_by = c.id
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function getHouseholdTasks(householdId, { status = 'pending' } = {}) {
  const { rows } = await pool.query(
    `SELECT t.*, u.display_name AS assigned_name, u.avatar_color AS assigned_color
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     WHERE t.household_id = $1 AND t.status = $2
     ORDER BY
       CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 WHEN 'low' THEN 2 END,
       t.due_date ASC NULLS LAST,
       t.created_at DESC`,
    [householdId, status]
  );
  return rows;
}

export async function getUserTasks(userId, { status = 'pending' } = {}) {
  const { rows } = await pool.query(
    `SELECT t.*, u.display_name AS assigned_name, u.avatar_color AS assigned_color
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     WHERE t.assigned_to = $1 AND t.status = $2
     ORDER BY
       CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 WHEN 'low' THEN 2 END,
       t.due_date ASC NULLS LAST,
       t.created_at DESC`,
    [userId, status]
  );
  return rows;
}

export async function complete(taskId, userId) {
  await pool.query(
    `UPDATE tasks SET status = 'completed', completed_at = NOW(), completed_by = $1
     WHERE id = $2`,
    [userId, taskId]
  );

  const completedTask = await findById(taskId);

  // If this task is recurring, spawn the next instance
  if (completedTask && completedTask.recurrence_interval) {
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + completedTask.recurrence_interval);
    const dueDateStr = nextDueDate.toISOString().split('T')[0];

    await create({
      householdId: completedTask.household_id,
      title: completedTask.title,
      description: completedTask.description,
      createdBy: completedTask.created_by,
      assignedTo: completedTask.assigned_to,
      priority: completedTask.priority,
      dueDate: dueDateStr,
      recurrenceInterval: completedTask.recurrence_interval,
      recurrenceLabel: completedTask.recurrence_label,
    });
  }

  return completedTask;
}

export async function skip(taskId) {
  await pool.query(`UPDATE tasks SET status = 'skipped' WHERE id = $1`, [taskId]);

  const skippedTask = await findById(taskId);

  // If recurring, still spawn the next instance
  if (skippedTask && skippedTask.recurrence_interval) {
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + skippedTask.recurrence_interval);
    const dueDateStr = nextDueDate.toISOString().split('T')[0];

    await create({
      householdId: skippedTask.household_id,
      title: skippedTask.title,
      description: skippedTask.description,
      createdBy: skippedTask.created_by,
      assignedTo: skippedTask.assigned_to,
      priority: skippedTask.priority,
      dueDate: dueDateStr,
      recurrenceInterval: skippedTask.recurrence_interval,
      recurrenceLabel: skippedTask.recurrence_label,
    });
  }

  return skippedTask;
}

export async function update(taskId, { title, description, assignedTo, priority, dueDate, recurrenceInterval, recurrenceLabel }) {
  await pool.query(
    `UPDATE tasks SET title = $1, description = $2, assigned_to = $3, priority = $4, due_date = $5,
     recurrence_interval = $6, recurrence_label = $7
     WHERE id = $8`,
    [title, description || null, assignedTo || null, priority || 'normal', dueDate || null, recurrenceInterval || null, recurrenceLabel || null, taskId]
  );
  return findById(taskId);
}

export async function remove(taskId) {
  await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
}

export async function getCompletedCount(userId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS count FROM tasks WHERE completed_by = $1 AND status = $2',
    [userId, 'completed']
  );
  return Number(rows[0].count);
}
