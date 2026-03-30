import pool from '../db/connection.js';

export async function addFeedback({ taskId, userId, emoji, comment }) {
  const { rows } = await pool.query(
    'INSERT INTO task_feedback (task_id, user_id, emoji, comment) VALUES ($1, $2, $3, $4) RETURNING *',
    [taskId, userId, emoji || null, comment || null]
  );
  return rows[0];
}

export async function getTaskFeedback(taskId) {
  const { rows } = await pool.query(
    `SELECT tf.*, u.display_name, u.avatar_color
     FROM task_feedback tf
     JOIN users u ON tf.user_id = u.id
     WHERE tf.task_id = $1
     ORDER BY tf.created_at ASC`,
    [taskId]
  );
  return rows;
}
