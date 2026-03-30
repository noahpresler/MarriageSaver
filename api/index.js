import 'dotenv/config';
import { runMigrations } from '../src/db/migrate.js';
import app from '../src/app.js';

let migrated = false;

export default async function handler(req, res) {
  if (!migrated) {
    await runMigrations();
    migrated = true;
  }
  return app(req, res);
}
