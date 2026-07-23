import React from 'react';
import {
  LayoutGrid,
  List,
  Plus,
  BookOpen,
  UserCheck,
  Search,
  Filter,
  ShieldCheck,
  User as UserIcon,
  LogIn,
} from 'lucide-react';
import { User, FilterState, TaskStatus, TaskPriority } from '../types';

interface NavbarProps {
  currentView: 'kanban' | 'list';
  onViewChange: (view: 'kanban' | 'list') => void;
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  currentUser: User;
  users: User[];
  onOpenCreateTask: () => void;
  onOpenSetupGuide: () => void;
  onOpenUserManagement: () => void;
  onOpenAuthModal: () => void;
  onSwitchUser: (userId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  filter,
  onFilterChange,
  currentUser,
  users,
  onOpenCreateTask,
  onOpenSetupGuide,
  onOpenUserManagement,
  onOpenAuthModal,
  onSwitchUser,
}) => {
  return (
    <header className="glass sticky top-0 z-30 shadow-2xl border-b border-white/10">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30 tracking-tight border border-indigo-400/30">
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                  Task Manager
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Google SSO & Multi-Assignee Task Operations
              </p>
            </div>
          </div>

          {/* Center Action Group: View Toggle & Search */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filter.search}
                onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
                placeholder="Search tasks, descriptions, tags..."
                className="w-full pl-9 pr-8 py-1.5 text-sm glass-input rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all"
              />
              {filter.search && (
                <button
                  onClick={() => onFilterChange({ ...filter, search: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* View switcher */}
            <div className="flex items-center glass p-1 rounded-xl border border-white/10">
              <button
                onClick={() => onViewChange('kanban')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  currentView === 'kanban'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                onClick={() => onViewChange('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  currentView === 'list'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="List Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {/* Setup Guide Button */}
            <button
              onClick={onOpenSetupGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 glass hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              title="View Setup Guide & API Documentation"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Docs & Setup</span>
            </button>

            {/* Create Task Button */}
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-400/30 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>

            {/* Active User Avatar & Profile Switcher */}
            <div className="relative group flex items-center pl-2 border-l border-white/10">
              <button
                onClick={onOpenUserManagement}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/10 transition-all text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-sm"
                />
                <div className="hidden xl:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-100 leading-none">
                      {currentUser.name}
                    </span>
                    {currentUser.role === 'Admin' ? (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded font-medium">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-500/20 text-slate-300 border border-slate-500/30 px-1 rounded font-medium">
                        Member
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal truncate max-w-[120px] block">
                    {currentUser.email}
                  </span>
                </div>
              </button>

              {/* Quick Sign-In / Switch Account Button */}
              <button
                onClick={onOpenAuthModal}
                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 rounded-xl ml-1 transition-all"
                title="Google SSO / Switch User Context"
              >
                <LogIn className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Filter Toolbar Sub-header */}
      <div className="glass border-t border-white/10 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-300">
            <span className="flex items-center gap-1 font-semibold text-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Filters:
            </span>

            {/* Status Selector */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Status:</span>
              <select
                value={filter.status}
                onChange={(e) => onFilterChange({ ...filter, status: e.target.value as TaskStatus | 'All' })}
                className="glass-input rounded-lg px-2 py-1 font-medium text-slate-200 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Priority:</span>
              <select
                value={filter.priority}
                onChange={(e) => onFilterChange({ ...filter, priority: e.target.value as TaskPriority | 'All' })}
                className="glass-input rounded-lg px-2 py-1 font-medium text-slate-200 focus:outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Assignee:</span>
              <select
                value={filter.assigneeId}
                onChange={(e) => onFilterChange({ ...filter, assigneeId: e.target.value })}
                className="glass-input rounded-lg px-2 py-1 font-medium text-slate-200 focus:outline-none max-w-[140px]"
              >
                <option value="All">All Members</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Due Date:</span>
              <select
                value={filter.dueDateFilter}
                onChange={(e) =>
                  onFilterChange({ ...filter, dueDateFilter: e.target.value as any })
                }
                className="glass-input rounded-lg px-2 py-1 font-medium text-slate-200 focus:outline-none"
              >
                <option value="All">Any Time</option>
                <option value="Today">Due Today</option>
                <option value="This Week">Due This Week</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Reset */}
          {(filter.status !== 'All' ||
            filter.priority !== 'All' ||
            filter.assigneeId !== 'All' ||
            filter.dueDateFilter !== 'All' ||
            filter.search !== '') && (
            <button
              onClick={() =>
                onFilterChange({
                  search: '',
                  status: 'All',
                  priority: 'All',
                  assigneeId: 'All',
                  dueDateFilter: 'All',
                })
              }
              className="text-indigo-400 hover:text-indigo-300 font-medium text-xs underline"
            >
              Reset Filters
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
