import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { INITIAL_USERS, INITIAL_TASKS } from './src/data/initialData.js';
import { Task, User } from './src/types.js';

dotenv.config();

let usersState: User[] = [...INITIAL_USERS];
let tasksState: Task[] = [...INITIAL_TASKS];
let activeUserId: string = usersState[0].id; // Default Alex Morgan

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS and iframe cookie headers setup if needed
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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/auth/callback`;

    if (!clientId || clientId.trim() === '') {
      // Unconfigured Google OAuth credentials - return demo URL
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
  app.get(['/auth/callback', '/auth/callback/'], (req, res) => {
    const { code } = req.query;

    // Simulate or authenticate user
    // Pick or create user from OAuth session
    let authenticatedUser = usersState[0]; // Default to Alex Morgan for demo or newly authorized user

    if (code === 'demo_google_code' || !code) {
      authenticatedUser = usersState[0];
    } else {
      // In production with client secret, exchange code with Google OAuth token endpoint
      // Here we match or create user based on session
      authenticatedUser = {
        id: `usr-google-${Date.now().toString().slice(-4)}`,
        name: 'Google Auth User',
        email: 'google.user@workspace.io',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: 'Member',
        googleId: String(code),
      };
      if (!usersState.some(u => u.email === authenticatedUser.email)) {
        usersState.push(authenticatedUser);
      }
    }

    activeUserId = authenticatedUser.id;

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google SSO Authentication</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; text-align: center; }
            .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); max-width: 400px; }
            .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; width: 28px; height: 28px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h3>Authentication Successful</h3>
            <p>Signing in as <strong>${authenticatedUser.name}</strong> (${authenticatedUser.email})...</p>
            <p style="font-size: 0.85rem; color: #64748b;">This popup will close automatically.</p>
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
  app.get('/api/auth/me', (req, res) => {
    const user = usersState.find(u => u.id === activeUserId) || usersState[0];
    res.json({ user, activeUserId });
  });

  // 4. Set current user profile (for fast testing / context switching)
  app.post('/api/auth/switch-user', (req, res) => {
    const { userId } = req.body;
    const found = usersState.find(u => u.id === userId);
    if (found) {
      activeUserId = found.id;
      res.json({ success: true, user: found });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // --------------------------------------------------
  // User Management APIs
  // --------------------------------------------------

  app.get('/api/users', (req, res) => {
    res.json(usersState);
  });

  app.post('/api/users', (req, res) => {
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

    usersState.push(newUser);
    res.status(201).json(newUser);
  });

  app.patch('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, avatar, role } = req.body;

    const idx = usersState.findIndex(u => u.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    usersState[idx] = {
      ...usersState[idx],
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(avatar !== undefined && { avatar }),
      ...(role !== undefined && { role }),
    };

    res.json(usersState[idx]);
  });

  // --------------------------------------------------
  // Task Management APIs
  // --------------------------------------------------

  app.get('/api/tasks', (req, res) => {
    const { search, status, priority, assigneeId, dueDateFilter } = req.query;

    let filtered = [...tasksState];

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'All') {
      filtered = filtered.filter(t => t.status === status);
    }

    if (priority && priority !== 'All') {
      filtered = filtered.filter(t => t.priority === priority);
    }

    if (assigneeId && assigneeId !== 'All') {
      filtered = filtered.filter(t => t.assigneeIds.includes(String(assigneeId)));
    }

    if (dueDateFilter && dueDateFilter !== 'All') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (dueDateFilter === 'Today') {
        filtered = filtered.filter(t => t.dueDate === todayStr);
      } else if (dueDateFilter === 'Overdue') {
        filtered = filtered.filter(t => t.dueDate < todayStr && t.status !== 'Done');
      } else if (dueDateFilter === 'This Week') {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        filtered = filtered.filter(t => t.dueDate >= todayStr && t.dueDate <= nextWeekStr);
      }
    }

    res.json(filtered);
  });

  app.post('/api/tasks', (req, res) => {
    const { title, description, dueDate, priority, status, assigneeIds, tags, progress } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Task title is required' });
      return;
    }

    const creator = usersState.find(u => u.id === activeUserId) || usersState[0];

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
      progress: typeof progress === 'number' ? progress : (status === 'Done' ? 100 : 0),
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

    tasksState.unshift(newTask);
    res.status(201).json(newTask);
  });

  app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const idx = tasksState.findIndex(t => t.id === id);

    if (idx === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const existing = tasksState[idx];
    const { title, description, dueDate, priority, status, assigneeIds, tags, progress } = req.body;

    const currentUser = usersState.find(u => u.id === activeUserId) || usersState[0];
    const activities = [...existing.activities];

    // Log changes
    if (status && status !== existing.status) {
      activities.unshift({
        id: `act-${Date.now()}-1`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        action: `Moved task from "${existing.status}" to "${status}"`,
      });
    }

    if (priority && priority !== existing.priority) {
      activities.unshift({
        id: `act-${Date.now()}-2`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        action: `Changed priority from "${existing.priority}" to "${priority}"`,
      });
    }

    const updatedTask: Task = {
      ...existing,
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(dueDate !== undefined && { dueDate }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      ...(assigneeIds !== undefined && { assigneeIds }),
      ...(tags !== undefined && { tags }),
      ...(progress !== undefined && { progress }),
      activities,
      updatedAt: new Date().toISOString(),
    };

    tasksState[idx] = updatedTask;
    res.json(updatedTask);
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = tasksState.length;
    tasksState = tasksState.filter(t => t.id !== id);

    if (tasksState.length === initialLen) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ success: true, deletedId: id });
  });

  app.post('/api/tasks/:id/activity', (req, res) => {
    const { id } = req.params;
    const { action } = req.body;

    const idx = tasksState.findIndex(t => t.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const currentUser = usersState.find(u => u.id === activeUserId) || usersState[0];
    const newActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      action: action || 'Updated task details',
    };

    tasksState[idx].activities.unshift(newActivity);
    tasksState[idx].updatedAt = new Date().toISOString();

    res.json(tasksState[idx]);
  });

  // --------------------------------------------------
  // Vite Middleware / Static Serving
  // --------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
