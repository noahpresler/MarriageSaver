import 'dotenv/config';
import app from './app.js';
import { runMigrations } from './db/migrate.js';

const PORT = process.env.PORT || 3000;

// Run database migrations on startup
await runMigrations();

app.listen(PORT, () => {
  console.log(`MarriageSaver running on http://localhost:${PORT}`);
});
