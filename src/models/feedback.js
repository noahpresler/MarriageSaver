import db from '../db/connection.js';

export async function addFeedback({ taskId, userId, emoji, comment }) {
  const result = await db.execute({
    sql: 'INSERT INTO task_feedback (task_id, user_id, emoji, comment) VALUES (?, ?, ?, ?)',
    args: [taskId, userId, emoji || null, comment || null],
  });

  const row = await db.execute({
    sql: 'SELECT * FROM task_feedback WHERE id = ?',
    args: [result.lastInsertRowid],
  });
  return row.rows[0] || null;
}

export async function getTaskFeedback(taskId) {
  const result = await db.execute({
    sql: `SELECT tf.*, u.display_name, u.avatar_color
          FROM task_feedback tf
          JOIN users u ON tf.user_id = u.id
          WHERE tf.task_id = ?
          ORDER BY tf.created_at ASC`,
    args: [taskId],
  });
  return result.rows;
}
