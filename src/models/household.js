import pool from '../db/connection.js';
import crypto from 'crypto';

export async function createHousehold(name) {
  const inviteCode = crypto.randomBytes(4).toString('hex');
  const { rows } = await pool.query(
    'INSERT INTO households (name, invite_code) VALUES ($1, $2) RETURNING *',
    [name, inviteCode]
  );
  return rows[0];
}

export async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM households WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function findByInviteCode(code) {
  const { rows } = await pool.query('SELECT * FROM households WHERE invite_code = $1', [code]);
  return rows[0] || null;
}
