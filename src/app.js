import express from 'express';
import cookieSession from 'cookie-session';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadUser } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import householdRoutes from './routes/household.js';
import taskRoutes from './routes/tasks.js';
import ideaRoutes from './routes/ideas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sessions (cookie-based, no server-side store needed)
app.use(
  cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'change-me-in-production'],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    sameSite: 'lax',
  })
);

// Load user into res.locals for templates
app.use(loadUser);

// Routes
app.use(authRoutes);
app.use(householdRoutes);
app.use(taskRoutes);
app.use(ideaRoutes);

// Splash page
app.get('/', (req, res) => {
  if (req.session.userId && req.session.householdId) {
    return res.redirect('/tasks');
  }
  res.render('pages/splash');
});

export default app;
