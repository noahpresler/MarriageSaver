import db from '../db/connection.js';
import crypto from 'crypto';

export function createHousehold(name) {
  const inviteCode = crypto.randomBytes(4).toString('hex');
  const result = db
    .prepare('INSERT INTO households (name, invite_code) VALUES (?, ?)')
    .run(name, inviteCode);

  return findById(result.lastInsertRowid);
}

export function findById(id) {
  return db.prepare('SELECT * FROM households WHERE id = ?').get(id);
}

export function findByInviteCode(code) {
  return db.prepare('SELECT * FROM households WHERE invite_code = ?').get(code);
}
