import React, { useState } from 'react';
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, User } from '../types';

interface ListViewProps {
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  users,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onUpdateStatus,
}) => {
  const [sortField, setSortField] = useState<'dueDate' | 'priority' | 'title' | 'progress'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const getUser = (id: string) => users.find(u => u.id === id);

  const priorityWeight: Record<TaskPriority, number> = { High: 3, Medium: 2, Low: 1 };

  const sortedTasks = [...tasks].sort((a, b) => {
    let result = 0;
    if (sortField === 'dueDate') {
      result = a.dueDate.localeCompare(b.dueDate);
    } else if (sortField === 'priority') {
      result = priorityWeight[b.priority] - priorityWeight[a.priority];
    } else if (sortField === 'title') {
      result = a.title.localeCompare(b.title);
    } else if (sortField === 'progress') {
      result = b.progress - a.progress;
    }
    return sortOrder === 'asc' ? result : -result;
  });

  const toggleSort = (field: 'dueDate' | 'priority' | 'title' | 'progress') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'High':
        return <span className="text-xs px-2 py-0.5 font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">High</span>;
      case 'Medium':
        return <span className="text-xs px-2 py-0.5 font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">Medium</span>;
      case 'Low':
        return <span className="text-xs px-2 py-0.5 font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded">Low</span>;
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden mb-12">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/60 border-b border-white/10 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <th className="py-3.5 px-4 cursor-pointer hover:bg-white/5" onClick={() => toggleSort('priority')}>
                <div className="flex items-center gap-1">
                  Priority <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:bg-white/5" onClick={() => toggleSort('title')}>
                <div className="flex items-center gap-1">
                  Task Title <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 cursor-pointer hover:bg-white/5" onClick={() => toggleSort('dueDate')}>
                <div className="flex items-center gap-1">
                  Due Date <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:bg-white/5" onClick={() => toggleSort('progress')}>
                <div className="flex items-center gap-1">
                  Progress <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">Assignees</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">
                  No tasks match the active filters.
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => {
                const assignees = task.assigneeIds.map(getUser).filter(Boolean) as User[];
                const todayStr = new Date().toISOString().split('T')[0];
                const isOverdue = task.dueDate < todayStr && task.status !== 'Done';

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPriorityBadge(task.priority)}
                    </td>

                    {/* Title and Tags */}
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => onSelectTask(task)}
                        className="font-semibold text-slate-100 hover:text-indigo-300 cursor-pointer"
                      >
                        {task.title}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-white/10 text-slate-300 border border-white/10 px-1.5 py-0.2 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={task.status}
                        onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                        className={`text-xs font-semibold px-2 py-1 rounded border focus:outline-none transition-all ${
                          task.status === 'Done'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : task.status === 'In Progress'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                        }`}
                      >
                        <option value="To Do" className="bg-slate-900 text-white">To Do</option>
                        <option value="In Progress" className="bg-slate-900 text-white">In Progress</option>
                        <option value="Done" className="bg-slate-900 text-white">Done</option>
                      </select>
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          isOverdue ? 'text-rose-300 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                        {task.dueDate}
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-3.5 px-4 whitespace-nowrap w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              task.status === 'Done'
                                ? 'bg-emerald-500'
                                : task.progress > 60
                                ? 'bg-indigo-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-medium w-8 text-right">
                          {task.progress}%
                        </span>
                      </div>
                    </td>

                    {/* Assignees */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex -space-x-1 overflow-hidden">
                        {assignees.map((assignee) => (
                          <img
                            key={assignee.id}
                            src={assignee.avatar}
                            alt={assignee.name}
                            title={`${assignee.name} (${assignee.role})`}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 object-cover"
                          />
                        ))}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectTask(task)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-lg"
                          title="Edit Task"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
