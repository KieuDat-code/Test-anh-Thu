import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  LayoutGrid,
  List,
  Filter,
  Plus,
  BarChart2,
} from 'lucide-react';
import { Task, User, FilterState, TaskStatus } from './types';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { TaskModal } from './components/TaskModal';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { UserManagementModal } from './components/UserManagementModal';
import { AuthModal } from './components/AuthModal';
import { SetupGuideModal } from './components/SetupGuideModal';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-1',
    name: 'Alex Morgan',
    email: 'alex.morgan@workspace.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Admin',
  });

  const [currentView, setCurrentView] = useState<'kanban' | 'list'>('kanban');
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    status: 'All',
    priority: 'All',
    assigneeId: 'All',
    dueDateFilter: 'All',
  });

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultStatusForNewTask, setDefaultStatusForNewTask] = useState<TaskStatus>('To Do');

  const [isTaskDetailDrawerOpen, setIsTaskDetailDrawerOpen] = useState(false);
  const [taskForDetail, setTaskForDetail] = useState<Task | null>(null);

  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSetupGuideModalOpen, setIsSetupGuideModalOpen] = useState(false);

  // --------------------------------------------------
  // Data Fetching
  // --------------------------------------------------

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filter.search) queryParams.set('search', filter.search);
      if (filter.status !== 'All') queryParams.set('status', filter.status);
      if (filter.priority !== 'All') queryParams.set('priority', filter.priority);
      if (filter.assigneeId !== 'All') queryParams.set('assigneeId', filter.assigneeId);
      if (filter.dueDateFilter !== 'All') queryParams.set('dueDateFilter', filter.dueDateFilter);

      const res = await fetch(`/api/tasks?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, [fetchUsers, fetchCurrentUser]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Keep detail drawer synchronized if task is updated
  useEffect(() => {
    if (taskForDetail) {
      const updated = tasks.find((t) => t.id === taskForDetail.id);
      if (updated) setTaskForDetail(updated);
    }
  }, [tasks, taskForDetail]);

  // --------------------------------------------------
  // Task Handlers
  // --------------------------------------------------

  const handleCreateOrUpdateTask = async (taskData: Partial<Task>) => {
    try {
      if (taskToEdit) {
        // Update existing task
        const res = await fetch(`/api/tasks/${taskToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        if (res.ok) {
          await fetchTasks();
        }
      } else {
        // Create new task
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        if (res.ok) {
          await fetchTasks();
        }
      }
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      setTaskToEdit(null);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const currentTask = tasks.find((t) => t.id === taskId);
      if (!currentTask) return;

      const progress = newStatus === 'Done' ? 100 : newStatus === 'To Do' && currentTask.progress === 100 ? 0 : currentTask.progress;

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, progress }),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (taskForDetail?.id === taskId) {
          setIsTaskDetailDrawerOpen(false);
          setTaskForDetail(null);
        }
        await fetchTasks();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleAddActivity = async (taskId: string, action: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error('Error adding activity:', err);
    }
  };

  // --------------------------------------------------
  // User Handlers
  // --------------------------------------------------

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Error switching user:', err);
    }
  };

  const handleAddUser = async (userData: Partial<User>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (err) {
      console.error('Error adding user:', err);
    }
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchUsers();
        if (currentUser.id === userId) {
          await fetchCurrentUser();
        }
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  // --------------------------------------------------
  // Calculated Statistics
  // --------------------------------------------------

  const totalTasks = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = tasks.filter((t) => t.dueDate < todayStr && t.status !== 'Done').length;

  return (
    <div className="mesh-gradient min-h-screen font-sans text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        filter={filter}
        onFilterChange={setFilter}
        currentUser={currentUser}
        users={users}
        onOpenCreateTask={() => {
          setTaskToEdit(null);
          setDefaultStatusForNewTask('To Do');
          setIsTaskModalOpen(true);
        }}
        onOpenSetupGuide={() => setIsSetupGuideModalOpen(true)}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Workspace Summary Metric Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Total Tasks</span>
              <BarChart2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalTasks}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Across all workspace boards</p>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>In Progress</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-400">{inProgressCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active development tasks</p>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{doneCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0}% completion rate
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Overdue</span>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400">{overdueCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Requires immediate attention</p>
          </div>
        </div>

        {/* View Component Render */}
        {currentView === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            users={users}
            onSelectTask={(task) => {
              setTaskForDetail(task);
              setIsTaskDetailDrawerOpen(true);
            }}
            onUpdateStatus={handleUpdateStatus}
            onOpenCreateTaskWithStatus={(status) => {
              setTaskToEdit(null);
              setDefaultStatusForNewTask(status);
              setIsTaskModalOpen(true);
            }}
          />
        ) : (
          <ListView
            tasks={tasks}
            users={users}
            onSelectTask={(task) => {
              setTaskForDetail(task);
              setIsTaskDetailDrawerOpen(true);
            }}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

      </main>

      {/* Modals & Drawers */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        users={users}
        taskToEdit={taskToEdit}
        defaultStatus={defaultStatusForNewTask}
      />

      <TaskDetailDrawer
        task={taskForDetail}
        isOpen={isTaskDetailDrawerOpen}
        onClose={() => {
          setIsTaskDetailDrawerOpen(false);
          setTaskForDetail(null);
        }}
        users={users}
        currentUser={currentUser}
        onEdit={(task) => {
          setIsTaskDetailDrawerOpen(false);
          setTaskToEdit(task);
          setIsTaskModalOpen(true);
        }}
        onDelete={handleDeleteTask}
        onUpdateStatus={handleUpdateStatus}
        onAddActivity={handleAddActivity}
      />

      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onSwitchUser={handleSwitchUser}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onOAuthSuccess={(user) => {
          setCurrentUser(user);
          fetchUsers();
        }}
      />

      <SetupGuideModal
        isOpen={isSetupGuideModalOpen}
        onClose={() => setIsSetupGuideModalOpen(false)}
      />
    </div>
  );
}
