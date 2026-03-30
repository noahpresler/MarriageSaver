import pool from '../db/connection.js';

export async function create({ householdId, title, description, createdBy, assignedTo, priority, dueDate }) {
  const { rows } = await pool.query(
    `INSERT INTO tasks (household_id, title, description, created_by, assigned_to, priority, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [householdId, title, description || null, createdBy, assignedTo || null, priority || 'normal', dueDate || null]
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
  return findById(taskId);
}

export async function skip(taskId) {
  await pool.query(`UPDATE tasks SET status = 'skipped' WHERE id = $1`, [taskId]);
  return findById(taskId);
}

export async function update(taskId, { title, description, assignedTo, priority, dueDate }) {
  await pool.query(
    `UPDATE tasks SET title = $1, description = $2, assigned_to = $3, priority = $4, due_date = $5
     WHERE id = $6`,
    [title, description || null, assignedTo || null, priority || 'normal', dueDate || null, taskId]
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
