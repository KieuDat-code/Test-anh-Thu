import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getUsers,
  addUser,
  updateUser,
  getActiveUserId,
  setActiveUserId,
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  addTaskActivity,
  initDb,
} from './src/lib/db';
import { Task, User } from './src/types';

dotenv.config();

export const app = express();

app.use(express.json());

// CORS headers setup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Middleware to ensure Database initialized
app.use(async (req, res, next) => {
  try {
    await initDb();
  } catch (err) {
    console.error('DB init error:', err);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------------------------------------------
// Auth Endpoints
// --------------------------------------------------

// 1. Get Google OAuth URL
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const redirectUri = `${appUrl}/auth/callback`;

  if (!clientId || clientId.trim() === '') {
    const demoUrl = `${appUrl}/auth/callback?code=demo_google_code&state=demo`;
    res.json({
      url: demoUrl,
      configured: false,
      message: 'GOOGLE_CLIENT_ID not set. Using simulated Google SSO popup for preview.',
    });
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  res.json({
    url: googleAuthUrl,
    configured: true,
    redirectUri,
  });
});

// 2. OAuth Callback handler
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code } = req.query;
  const usersList = await getUsers();

  let authenticatedUser = usersList[0];

  if (code && code !== 'demo_google_code') {
    authenticatedUser = {
      id: `usr-google-${Date.now().toString().slice(-4)}`,
      name: 'Google Auth User',
      email: 'google.user@workspace.io',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'Member',
      googleId: String(code),
    };
    await addUser(authenticatedUser);
  }

  await setActiveUserId(authenticatedUser.id);

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google SSO Authentication</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; text-align: center; }
          .card { background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 400px; }
          .spinner { border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #6366f1; border-radius: 50%; width: 28px; height: 28px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h3>Authentication Successful</h3>
          <p>Signing in as <strong>${authenticatedUser.name}</strong> (${authenticatedUser.email})...</p>
          <p style="font-size: 0.85rem; color: #94a3b8;">This window will close automatically.</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_AUTH_SUCCESS',
              user: ${JSON.stringify(authenticatedUser)}
            }, '*');
            setTimeout(() => {
              window.close();
            }, 600);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// 3. Get current active session user
app.get('/api/auth/me', async (req, res) => {
  const usersList = await getUsers();
  const activeId = await getActiveUserId();
  const user = usersList.find(u => u.id === activeId) || usersList[0];
  res.json({ user, activeUserId: activeId });
});

// 4. Set current user profile
app.post('/api/auth/switch-user', async (req, res) => {
  const { userId } = req.body;
  const usersList = await getUsers();
  const found = usersList.find(u => u.id === userId);
  if (found) {
    await setActiveUserId(found.id);
    res.json({ success: true, user: found });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// --------------------------------------------------
// User Management APIs
// --------------------------------------------------

app.get('/api/users', async (req, res) => {
  const usersList = await getUsers();
  res.json(usersList);
});

app.post('/api/users', async (req, res) => {
  const { name, email, avatar, role } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    name,
    email,
    avatar: avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    role: role || 'Member',
  };

  const created = await addUser(newUser);
  res.status(201).json(created);
});

app.patch('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, avatar, role } = req.body;

  const updated = await updateUser(id, { name, email, avatar, role });
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(updated);
});

// --------------------------------------------------
// Task Management APIs
// --------------------------------------------------

app.get('/api/tasks', async (req, res) => {
  const { search, status, priority, assigneeId, dueDateFilter } = req.query;

  const tasksList = await getTasks({
    search: typeof search === 'string' ? search : undefined,
    status: typeof status === 'string' ? status : undefined,
    priority: typeof priority === 'string' ? priority : undefined,
    assigneeId: typeof assigneeId === 'string' ? assigneeId : undefined,
    dueDateFilter: typeof dueDateFilter === 'string' ? dueDateFilter : undefined,
  });

  res.json(tasksList);
});

app.post('/api/tasks', async (req, res) => {
  const { title, description, dueDate, priority, status, assigneeIds, tags, progress } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Task title is required' });
    return;
  }

  const usersList = await getUsers();
  const activeId = await getActiveUserId();
  const creator = usersList.find(u => u.id === activeId) || usersList[0];

  const newTask: Task = {
    id: `task-${Date.now()}`,
    title,
    description: description || '',
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    priority: priority || 'Medium',
    status: status || 'To Do',
    createdBy: creator.id,
    assigneeIds: Array.isArray(assigneeIds) && assigneeIds.length > 0 ? assigneeIds : [creator.id],
    tags: Array.isArray(tags) ? tags : [],
    progress: typeof progress === 'number' ? progress : status === 'Done' ? 100 : 0,
    activities: [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: creator.id,
        userName: creator.name,
        userAvatar: creator.avatar,
        action: `Created task with status "${status || 'To Do'}"`,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = await addTask(newTask);
  res.status(201).json(created);
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, priority, status, assigneeIds, tags, progress } = req.body;

  const usersList = await getUsers();
  const activeId = await getActiveUserId();
  const currentUser = usersList.find(u => u.id === activeId) || usersList[0];

  const updated = await updateTask(
    id,
    { title, description, dueDate, priority, status, assigneeIds, tags, progress },
    currentUser
  );

  if (!updated) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json(updated);
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const deleted = await deleteTask(id);

  if (!deleted) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({ success: true, deletedId: id });
});

app.post('/api/tasks/:id/activity', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  const usersList = await getUsers();
  const activeId = await getActiveUserId();
  const currentUser = usersList.find(u => u.id === activeId) || usersList[0];

  const updated = await addTaskActivity(id, action, currentUser);

  if (!updated) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json(updated);
});

// --------------------------------------------------
// Vite Middleware / Static Serving for local container
// --------------------------------------------------

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
  }
}

// Start standalone dev server if not running in Vercel serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}
