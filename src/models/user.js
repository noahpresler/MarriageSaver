import db from '../db/connection.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

const AVATAR_COLORS = [
  '#f9d976', '#f9a876', '#f97676', '#76b5f9',
  '#76f9b5', '#d976f9', '#76f9f0', '#f976c4',
];

export function createUser({ email, displayName, password }) {
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const result = db
    .prepare(
      'INSERT INTO users (email, display_name, password_hash, avatar_color) VALUES (?, ?, ?, ?)'
    )
    .run(email, displayName, passwordHash, avatarColor);

  return findById(result.lastInsertRowid);
}

export function findByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function findById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function authenticate(email, password) {
  const user = findByEmail(email);
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password_hash)) return null;
  return user;
}

export function joinHousehold(userId, householdId) {
  db.prepare('UPDATE users SET household_id = ? WHERE id = ?').run(householdId, userId);
  return findById(userId);
}

export function getHouseholdMembers(householdId) {
  return db
    .prepare('SELECT id, display_name, avatar_color FROM users WHERE household_id = ?')
    .all(householdId);
}
