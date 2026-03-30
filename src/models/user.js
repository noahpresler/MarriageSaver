import pool from '../db/connection.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

const AVATAR_COLORS = [
  '#f9d976', '#f9a876', '#f97676', '#76b5f9',
  '#76f9b5', '#d976f9', '#76f9f0', '#f976c4',
];

export async function createUser({ email, displayName, password }) {
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const { rows } = await pool.query(
    'INSERT INTO users (email, display_name, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, displayName, passwordHash, avatarColor]
  );

  return rows[0];
}

export async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

export async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function authenticate(email, password) {
  const user = await findByEmail(email);
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password_hash)) return null;
  return user;
}

export async function joinHousehold(userId, householdId) {
  await pool.query('UPDATE users SET household_id = $1 WHERE id = $2', [householdId, userId]);
  return findById(userId);
}

export async function getHouseholdMembers(householdId) {
  const { rows } = await pool.query(
    'SELECT id, display_name, avatar_color FROM users WHERE household_id = $1',
    [householdId]
  );
  return rows;
}
