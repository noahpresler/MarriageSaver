import db from '../db/connection.js';

export async function create({ householdId, title, description, createdBy, assignedTo, priority, dueDate }) {
  const result = await db.execute({
    sql: `INSERT INTO tasks (household_id, title, description, created_by, assigned_to, priority, due_date)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [householdId, title, description || null, createdBy, assignedTo || null, priority || 'normal', dueDate || null],
  });

  return findById(result.lastInsertRowid);
}

export async function findById(id) {
  const result = await db.execute({
    sql: `SELECT t.*, u.display_name AS assigned_name, u.avatar_color AS assigned_color,
                 c.display_name AS created_by_name
          FROM tasks t
          LEFT JOIN users u ON t.assigned_to = u.id
          LEFT JOIN users c ON t.created_by = c.id
          WHERE t.id = ?`,
    args: [id],
  });
  return result.rows[0] || null;
}

export async function getHouseholdTasks(householdId, { status = 'pending' } = {}) {
  const result = await db.execute({
    sql: `SELECT t.*, u.display_name AS assigned_name, u.avatar_color AS assigned_color
          FROM tasks t
          LEFT JOIN users u ON t.assigned_to = u.id
          WHERE t.household_id = ? AND t.status = ?
          ORDER BY
            CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 WHEN 'low' THEN 2 END,
            t.due_date ASC NULLS LAST,
            t.created_at DESC`,
    args: [householdId, status],
  });
  return result.rows;
}

export async function getUserTasks(userId, { status = 'pending' } = {}) {
  const result = await db.execute({
    sql: `SELECT t.*, u.display_name AS assigned_name, u.avatar_color AS assigned_color
          FROM tasks t
          LEFT JOIN users u ON t.assigned_to = u.id
          WHERE t.assigned_to = ? AND t.status = ?
          ORDER BY
            CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 WHEN 'low' THEN 2 END,
            t.due_date ASC NULLS LAST,
            t.created_at DESC`,
    args: [userId, status],
  });
  return result.rows;
}

export async function complete(taskId, userId) {
  await db.execute({
    sql: `UPDATE tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP, completed_by = ?
          WHERE id = ?`,
    args: [userId, taskId],
  });
  return findById(taskId);
}

export async function skip(taskId) {
  await db.execute({ sql: `UPDATE tasks SET status = 'skipped' WHERE id = ?`, args: [taskId] });
  return findById(taskId);
}

export async function update(taskId, { title, description, assignedTo, priority, dueDate }) {
  await db.execute({
    sql: `UPDATE tasks SET title = ?, description = ?, assigned_to = ?, priority = ?, due_date = ?
          WHERE id = ?`,
    args: [title, description || null, assignedTo || null, priority || 'normal', dueDate || null, taskId],
  });
  return findById(taskId);
}

export async function remove(taskId) {
  await db.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [taskId] });
}

export async function getCompletedCount(userId) {
  const result = await db.execute({
    sql: 'SELECT COUNT(*) AS count FROM tasks WHERE completed_by = ? AND status = ?',
    args: [userId, 'completed'],
  });
  return Number(result.rows[0].count);
}
