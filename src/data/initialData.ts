import { User, Task } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Alex Morgan',
    email: 'alex.morgan@workspace.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Admin',
    googleId: 'google-10192837461',
  },
  {
    id: 'usr-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@workspace.io',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Member',
    googleId: 'google-10192837462',
  },
  {
    id: 'usr-3',
    name: 'Marcus Vance',
    email: 'marcus.vance@workspace.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Member',
    googleId: 'google-10192837463',
  },
  {
    id: 'usr-4',
    name: 'Elena Rostova',
    email: 'elena.rostova@workspace.io',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'Member',
    googleId: 'google-10192837464',
  },
];

const today = new Date();
const formatDate = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-101',
    title: 'Implement OAuth 2.0 Google SSO Flow',
    description: 'Setup authentication middleware, callback redirect handling, and user token verification.',
    dueDate: formatDate(2),
    priority: 'High',
    status: 'In Progress',
    createdBy: 'usr-1',
    assigneeIds: ['usr-2', 'usr-4'],
    tags: ['Security', 'Auth', 'Backend'],
    progress: 65,
    activities: [
      {
        id: 'act-1',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        userId: 'usr-1',
        userName: 'Alex Morgan',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        action: 'Created task and assigned to Sarah Chen and Elena Rostova',
      },
      {
        id: 'act-2',
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        userId: 'usr-2',
        userName: 'Sarah Chen',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        action: 'Updated progress to 65% after implementing frontend postMessage receiver',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'task-102',
    title: 'Design Kanban Board & Responsive Layout',
    description: 'Create high-contrast light design system with drag-and-drop task columns, task cards, and list view.',
    dueDate: formatDate(-1), // Overdue for demo
    priority: 'High',
    status: 'To Do',
    createdBy: 'usr-1',
    assigneeIds: ['usr-3'],
    tags: ['UI/UX', 'Tailwind', 'Design System'],
    progress: 20,
    activities: [
      {
        id: 'act-3',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        userId: 'usr-1',
        userName: 'Alex Morgan',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        action: 'Created task for UI refresh',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'task-103',
    title: 'PostgreSQL Database Schema Migration',
    description: 'Define relational models for Users, Tasks, and Assignee join table with proper foreign keys.',
    dueDate: formatDate(5),
    priority: 'Medium',
    status: 'To Do',
    createdBy: 'usr-2',
    assigneeIds: ['usr-4'],
    tags: ['Database', 'PostgreSQL', 'ORM'],
    progress: 0,
    activities: [],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'task-104',
    title: 'Setup RESTful API Endpoints for Task Operations',
    description: 'Build backend routes for GET, POST, PUT, DELETE tasks with filtering and search support.',
    dueDate: formatDate(0), // Today
    priority: 'High',
    status: 'In Progress',
    createdBy: 'usr-1',
    assigneeIds: ['usr-2', 'usr-4'],
    tags: ['Express', 'API', 'Node.js'],
    progress: 80,
    activities: [
      {
        id: 'act-4',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        userId: 'usr-4',
        userName: 'Elena Rostova',
        userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        action: 'Implemented task filtering by assignee and status',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'task-105',
    title: 'User Role & Permissions Audit',
    description: 'Verify that only Admin users can modify member roles and delete shared project tasks.',
    dueDate: formatDate(7),
    priority: 'Low',
    status: 'Done',
    createdBy: 'usr-1',
    assigneeIds: ['usr-1', 'usr-2'],
    tags: ['RBAC', 'Security'],
    progress: 100,
    activities: [
      {
        id: 'act-5',
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        userId: 'usr-1',
        userName: 'Alex Morgan',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        action: 'Marked as Done after security review',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];
