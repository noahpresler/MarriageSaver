import db from '../db/connection.js';

export function create({ householdId, title, description, createdBy, assignedTo, priority, dueDate }) {
  const result = db
    .prepare(
      `INSERT INTO tasks (household_id, title, description, created_by, assigned_to, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(householdId, title, description || null, createdBy, assignedTo || null, priority || 'normal', dueDate || null);

  return findById(result.lastInsertRowid);
}

export function findById(id) {
  return db
    .prepare(
      `SELECT t.*, u.display_name AS assigned_name, u.avatar_color AS assigned_color,
              c.display_name AS created_by_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users c ON t.created_by = c.id
       WHERE t.id = ?`
    )
    .get(id);
}

export function getHouseholdTasks(householdId, { status = 'pending' } = {}) {
  return db
    .prepare(
      `SELECT t.*, u.display_name AS assigned_name, u.avatar_color AS assigned_color
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.household_id = ? AND t.status = ?
       ORDER BY
         CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 WHEN 'low' THEN 2 END,
         t.due_date ASC NULLS LAST,
         t.created_at DESC`
    )
    .all(householdId, status);
}

export function getUserTasks(userId, { status = 'pending' } = {}) {
  return db
    .prepare(
      `SELECT t.*, u.display_name AS assigned_name, u.avatar_color AS assigned_color
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.assigned_to = ? AND t.status = ?
       ORDER BY
         CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 WHEN 'low' THEN 2 END,
         t.due_date ASC NULLS LAST,
         t.created_at DESC`
    )
    .all(userId, status);
}

export function complete(taskId, userId) {
  db.prepare(
    `UPDATE tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP, completed_by = ?
     WHERE id = ?`
  ).run(userId, taskId);
  return findById(taskId);
}

export function skip(taskId) {
  db.prepare(`UPDATE tasks SET status = 'skipped' WHERE id = ?`).run(taskId);
  return findById(taskId);
}

export function update(taskId, { title, description, assignedTo, priority, dueDate }) {
  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, assigned_to = ?, priority = ?, due_date = ?
     WHERE id = ?`
  ).run(title, description || null, assignedTo || null, priority || 'normal', dueDate || null, taskId);
  return findById(taskId);
}

export function remove(taskId) {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
}

export function getCompletedCount(userId) {
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM tasks WHERE completed_by = ? AND status = ?')
    .get(userId, 'completed');
  return row.count;
}
