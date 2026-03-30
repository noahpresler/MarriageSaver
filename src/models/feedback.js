import db from '../db/connection.js';

export function addFeedback({ taskId, userId, emoji, comment }) {
  const result = db
    .prepare('INSERT INTO task_feedback (task_id, user_id, emoji, comment) VALUES (?, ?, ?, ?)')
    .run(taskId, userId, emoji || null, comment || null);

  return db.prepare('SELECT * FROM task_feedback WHERE id = ?').get(result.lastInsertRowid);
}

export function getTaskFeedback(taskId) {
  return db
    .prepare(
      `SELECT tf.*, u.display_name, u.avatar_color
       FROM task_feedback tf
       JOIN users u ON tf.user_id = u.id
       WHERE tf.task_id = ?
       ORDER BY tf.created_at ASC`
    )
    .all(taskId);
}
