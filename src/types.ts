export type UserRole = 'Admin' | 'Member';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  googleId?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface TaskActivity {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy: string; // User ID
  assigneeIds: string[]; // User IDs (one or multiple)
  tags: string[];
  progress: number; // 0 to 100
  activities: TaskActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  search: string;
  status: TaskStatus | 'All';
  priority: TaskPriority | 'All';
  assigneeId: string | 'All';
  dueDateFilter: 'All' | 'Today' | 'This Week' | 'Overdue';
}
