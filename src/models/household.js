import db from '../db/connection.js';
import crypto from 'crypto';

export async function createHousehold(name) {
  const inviteCode = crypto.randomBytes(4).toString('hex');
  const result = await db.execute({
    sql: 'INSERT INTO households (name, invite_code) VALUES (?, ?)',
    args: [name, inviteCode],
  });

  return findById(result.lastInsertRowid);
}

export async function findById(id) {
  const result = await db.execute({ sql: 'SELECT * FROM households WHERE id = ?', args: [id] });
  return result.rows[0] || null;
}

export async function findByInviteCode(code) {
  const result = await db.execute({
    sql: 'SELECT * FROM households WHERE invite_code = ?',
    args: [code],
  });
  return result.rows[0] || null;
}
