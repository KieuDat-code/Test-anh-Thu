import pg from 'pg';
import { INITIAL_USERS, INITIAL_TASKS } from '../data/initialData';
import { Task, User, TaskActivity } from '../types';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let pool: pg.Pool | null = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

// In-memory fallback if no PostgreSQL connection URL provided
let usersMemory: User[] = [...INITIAL_USERS];
let tasksMemory: Task[] = [...INITIAL_TASKS];
let activeUserIdMemory: string | null = null;

let isInitialized = false;

export async function initDb() {
  if (!pool || isInitialized) return;

  try {
    const client = await pool.connect();
    try {
      // 1. Create Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          avatar TEXT,
          role VARCHAR(50) DEFAULT 'Member',
          google_id VARCHAR(255)
        );
      `);

      // 2. Create Tasks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(100) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          due_date VARCHAR(50),
          priority VARCHAR(50) DEFAULT 'Medium',
          status VARCHAR(50) DEFAULT 'To Do',
          created_by VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
          progress INT DEFAULT 0,
          tags TEXT[],
          created_at VARCHAR(100),
          updated_at VARCHAR(100)
        );
      `);

      // 3. Create Task Assignees join table
      await client.query(`
        CREATE TABLE IF NOT EXISTS task_assignees (
          task_id VARCHAR(100) REFERENCES tasks(id) ON DELETE CASCADE,
          user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
          PRIMARY KEY (task_id, user_id)
        );
      `);

      // 4. Create Activities table
      await client.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id VARCHAR(100) PRIMARY KEY,
          task_id VARCHAR(100) REFERENCES tasks(id) ON DELETE CASCADE,
          user_id VARCHAR(100),
          user_name VARCHAR(255),
          user_avatar TEXT,
          action TEXT NOT NULL,
          timestamp VARCHAR(100) NOT NULL
        );
      `);

      // Seed Users if table empty
      const userRes = await client.query('SELECT COUNT(*) FROM users');
      if (parseInt(userRes.rows[0].count, 10) === 0) {
        for (const u of INITIAL_USERS) {
          await client.query(
            `INSERT INTO users (id, name, email, avatar, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
            [u.id, u.name, u.email, u.avatar, u.role]
          );
        }
      }

      // Seed Tasks if table empty
      const taskRes = await client.query('SELECT COUNT(*) FROM tasks');
      if (parseInt(taskRes.rows[0].count, 10) === 0) {
        for (const t of INITIAL_TASKS) {
          await client.query(
            `INSERT INTO tasks (id, title, description, due_date, priority, status, created_by, progress, tags, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING`,
            [t.id, t.title, t.description, t.dueDate, t.priority, t.status, t.createdBy, t.progress, t.tags, t.createdAt, t.updatedAt]
          );

          for (const assigneeId of t.assigneeIds) {
            await client.query(
              `INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [t.id, assigneeId]
            );
          }

          for (const act of t.activities) {
            await client.query(
              `INSERT INTO activities (id, task_id, user_id, user_name, user_avatar, action, timestamp)
               VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
              [act.id, t.id, act.userId, act.userName, act.userAvatar, act.action, act.timestamp]
            );
          }
        }
      }

      isInitialized = true;
      console.log('PostgreSQL Database initialized successfully.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error initializing PostgreSQL Database:', err);
  }
}

// Database Helper functions

export async function getUsers(): Promise<User[]> {
  if (!pool) return usersMemory;
  await initDb();
  const res = await pool.query('SELECT id, name, email, avatar, role, google_id as "googleId" FROM users');
  return res.rows;
}

export async function addUser(user: User): Promise<User> {
  if (!pool) {
    usersMemory.push(user);
    return user;
  }
  await initDb();
  await pool.query(
    `INSERT INTO users (id, name, email, avatar, role, google_id) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar, google_id = EXCLUDED.google_id`,
    [user.id, user.name, user.email, user.avatar, user.role, user.googleId || null]
  );
  return user;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  if (!pool) {
    const idx = usersMemory.findIndex(u => u.id === id);
    if (idx === -1) return null;
    usersMemory[idx] = { ...usersMemory[idx], ...updates };
    return usersMemory[idx];
  }
  await initDb();
  const currentRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (currentRes.rows.length === 0) return null;
  const curr = currentRes.rows[0];

  const name = updates.name !== undefined ? updates.name : curr.name;
  const email = updates.email !== undefined ? updates.email : curr.email;
  const avatar = updates.avatar !== undefined ? updates.avatar : curr.avatar;
  const role = updates.role !== undefined ? updates.role : curr.role;

  await pool.query('UPDATE users SET name = $1, email = $2, avatar = $3, role = $4 WHERE id = $5', [
    name,
    email,
    avatar,
    role,
    id,
  ]);

  return { id, name, email, avatar, role, googleId: curr.google_id };
}

export async function getActiveUserId(): Promise<string | null> {
  return activeUserIdMemory;
}

export async function setActiveUserId(id: string | null) {
  activeUserIdMemory = id;
}

export async function getTasks(filters?: {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueDateFilter?: string;
}): Promise<Task[]> {
  if (!pool) {
    let filtered = [...tasksMemory];
    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (filters?.status && filters.status !== 'All') {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters?.priority && filters.priority !== 'All') {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }
    if (filters?.assigneeId && filters.assigneeId !== 'All') {
      filtered = filtered.filter(t => t.assigneeIds.includes(filters.assigneeId!));
    }
    if (filters?.dueDateFilter && filters.dueDateFilter !== 'All') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (filters.dueDateFilter === 'Today') {
        filtered = filtered.filter(t => t.dueDate === todayStr);
      } else if (filters.dueDateFilter === 'Overdue') {
        filtered = filtered.filter(t => t.dueDate < todayStr && t.status !== 'Done');
      } else if (filters.dueDateFilter === 'This Week') {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        filtered = filtered.filter(t => t.dueDate >= todayStr && t.dueDate <= nextWeekStr);
      }
    }
    return filtered;
  }

  await initDb();

  // Query database
  const tasksRes = await pool.query(`
    SELECT t.id, t.title, t.description, t.due_date as "dueDate", t.priority, t.status,
           t.created_by as "createdBy", t.progress, t.tags, t.created_at as "createdAt", t.updated_at as "updatedAt"
    FROM tasks t
    ORDER BY t.created_at DESC
  `);

  const assigneesRes = await pool.query('SELECT task_id, user_id FROM task_assignees');
  const activitiesRes = await pool.query(`
    SELECT id, task_id, user_id as "userId", user_name as "userName", user_avatar as "userAvatar", action, timestamp
    FROM activities ORDER BY timestamp DESC
  `);

  const assigneesMap: Record<string, string[]> = {};
  for (const row of assigneesRes.rows) {
    if (!assigneesMap[row.task_id]) assigneesMap[row.task_id] = [];
    assigneesMap[row.task_id].push(row.user_id);
  }

  const activitiesMap: Record<string, TaskActivity[]> = {};
  for (const row of activitiesRes.rows) {
    if (!activitiesMap[row.task_id]) activitiesMap[row.task_id] = [];
    activitiesMap[row.task_id].push({
      id: row.id,
      timestamp: row.timestamp,
      userId: row.userId,
      userName: row.userName,
      userAvatar: row.userAvatar,
      action: row.action,
    });
  }

  let tasksList: Task[] = tasksRes.rows.map(row => ({
    ...row,
    assigneeIds: assigneesMap[row.id] || [],
    activities: activitiesMap[row.id] || [],
    tags: row.tags || [],
  }));

  // Apply filters
  if (filters?.search && filters.search.trim() !== '') {
    const q = filters.search.toLowerCase();
    tasksList = tasksList.filter(
      t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }
  if (filters?.status && filters.status !== 'All') {
    tasksList = tasksList.filter(t => t.status === filters.status);
  }
  if (filters?.priority && filters.priority !== 'All') {
    tasksList = tasksList.filter(t => t.priority === filters.priority);
  }
  if (filters?.assigneeId && filters.assigneeId !== 'All') {
    tasksList = tasksList.filter(t => t.assigneeIds.includes(filters.assigneeId!));
  }
  if (filters?.dueDateFilter && filters.dueDateFilter !== 'All') {
    const todayStr = new Date().toISOString().split('T')[0];
    if (filters.dueDateFilter === 'Today') {
      tasksList = tasksList.filter(t => t.dueDate === todayStr);
    } else if (filters.dueDateFilter === 'Overdue') {
      tasksList = tasksList.filter(t => t.dueDate < todayStr && t.status !== 'Done');
    } else if (filters.dueDateFilter === 'This Week') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      tasksList = tasksList.filter(t => t.dueDate >= todayStr && t.dueDate <= nextWeekStr);
    }
  }

  return tasksList;
}

export async function addTask(task: Task): Promise<Task> {
  if (!pool) {
    tasksMemory.unshift(task);
    return task;
  }
  await initDb();
  await pool.query(
    `INSERT INTO tasks (id, title, description, due_date, priority, status, created_by, progress, tags, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [task.id, task.title, task.description, task.dueDate, task.priority, task.status, task.createdBy, task.progress, task.tags, task.createdAt, task.updatedAt]
  );

  for (const assigneeId of task.assigneeIds) {
    await pool.query('INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      task.id,
      assigneeId,
    ]);
  }

  for (const act of task.activities) {
    await pool.query(
      `INSERT INTO activities (id, task_id, user_id, user_name, user_avatar, action, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [act.id, task.id, act.userId, act.userName, act.userAvatar, act.action, act.timestamp]
    );
  }

  return task;
}

export async function updateTask(id: string, updates: Partial<Task>, actingUser?: User): Promise<Task | null> {
  if (!pool) {
    const idx = tasksMemory.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const existing = tasksMemory[idx];
    const user = actingUser || usersMemory[0];
    const activities = [...existing.activities];

    if (updates.status && updates.status !== existing.status) {
      activities.unshift({
        id: `act-${Date.now()}-1`,
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        action: `Moved task from "${existing.status}" to "${updates.status}"`,
      });
    }

    if (updates.priority && updates.priority !== existing.priority) {
      activities.unshift({
        id: `act-${Date.now()}-2`,
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        action: `Changed priority from "${existing.priority}" to "${updates.priority}"`,
      });
    }

    const updatedTask = {
      ...existing,
      ...updates,
      activities,
      updatedAt: new Date().toISOString(),
    };
    tasksMemory[idx] = updatedTask;
    return updatedTask;
  }

  await initDb();
  const allTasks = await getTasks();
  const existing = allTasks.find(t => t.id === id);
  if (!existing) return null;

  const user = actingUser || (await getUsers())[0];
  const newActivities: TaskActivity[] = [];

  if (updates.status && updates.status !== existing.status) {
    newActivities.push({
      id: `act-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      action: `Moved task from "${existing.status}" to "${updates.status}"`,
    });
  }

  if (updates.priority && updates.priority !== existing.priority) {
    newActivities.push({
      id: `act-${Date.now()}-2`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      action: `Changed priority from "${existing.priority}" to "${updates.priority}"`,
    });
  }

  const title = updates.title !== undefined ? updates.title : existing.title;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const dueDate = updates.dueDate !== undefined ? updates.dueDate : existing.dueDate;
  const priority = updates.priority !== undefined ? updates.priority : existing.priority;
  const status = updates.status !== undefined ? updates.status : existing.status;
  const progress = updates.progress !== undefined ? updates.progress : existing.progress;
  const tags = updates.tags !== undefined ? updates.tags : existing.tags;
  const updatedAt = new Date().toISOString();

  await pool.query(
    `UPDATE tasks SET title = $1, description = $2, due_date = $3, priority = $4, status = $5, progress = $6, tags = $7, updated_at = $8
     WHERE id = $9`,
    [title, description, dueDate, priority, status, progress, tags, updatedAt, id]
  );

  if (updates.assigneeIds) {
    await pool.query('DELETE FROM task_assignees WHERE task_id = $1', [id]);
    for (const aId of updates.assigneeIds) {
      await pool.query('INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)', [id, aId]);
    }
  }

  for (const act of newActivities) {
    await pool.query(
      `INSERT INTO activities (id, task_id, user_id, user_name, user_avatar, action, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [act.id, id, act.userId, act.userName, act.userAvatar, act.action, act.timestamp]
    );
  }

  const updatedTasks = await getTasks();
  return updatedTasks.find(t => t.id === id) || null;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (!pool) {
    const len = tasksMemory.length;
    tasksMemory = tasksMemory.filter(t => t.id !== id);
    return tasksMemory.length < len;
  }
  await initDb();
  const res = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function addTaskActivity(id: string, action: string, user: User): Promise<Task | null> {
  const newAct: TaskActivity = {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    action: action || 'Updated task details',
  };

  if (!pool) {
    const idx = tasksMemory.findIndex(t => t.id === id);
    if (idx === -1) return null;
    tasksMemory[idx].activities.unshift(newAct);
    tasksMemory[idx].updatedAt = new Date().toISOString();
    return tasksMemory[idx];
  }

  await initDb();
  await pool.query(
    `INSERT INTO activities (id, task_id, user_id, user_name, user_avatar, action, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [newAct.id, id, newAct.userId, newAct.userName, newAct.userAvatar, newAct.action, newAct.timestamp]
  );
  await pool.query('UPDATE tasks SET updated_at = $1 WHERE id = $2', [new Date().toISOString(), id]);

  const updatedTasks = await getTasks();
  return updatedTasks.find(t => t.id === id) || null;
}
