import db from '../db/connection.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

const AVATAR_COLORS = [
  '#f9d976', '#f9a876', '#f97676', '#76b5f9',
  '#76f9b5', '#d976f9', '#76f9f0', '#f976c4',
];

export async function createUser({ email, displayName, password }) {
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const result = await db.execute({
    sql: 'INSERT INTO users (email, display_name, password_hash, avatar_color) VALUES (?, ?, ?, ?)',
    args: [email, displayName, passwordHash, avatarColor],
  });

  return findById(result.lastInsertRowid);
}

export async function findByEmail(email) {
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
  return result.rows[0] || null;
}

export async function findById(id) {
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
  return result.rows[0] || null;
}

export async function authenticate(email, password) {
  const user = await findByEmail(email);
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password_hash)) return null;
  return user;
}

export async function joinHousehold(userId, householdId) {
  await db.execute({
    sql: 'UPDATE users SET household_id = ? WHERE id = ?',
    args: [householdId, userId],
  });
  return findById(userId);
}

export async function getHouseholdMembers(householdId) {
  const result = await db.execute({
    sql: 'SELECT id, display_name, avatar_color FROM users WHERE household_id = ?',
    args: [householdId],
  });
  return result.rows;
}
