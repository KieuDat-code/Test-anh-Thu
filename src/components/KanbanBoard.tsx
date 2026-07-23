import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MoreHorizontal,
  Plus,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  User as UserIcon,
  ArrowRight,
  MoveRight,
} from 'lucide-react';
import { Task, TaskStatus, User, TaskPriority } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onOpenCreateTaskWithStatus: (status: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; badge: string }[] = [
  { id: 'To Do', title: 'To Do', color: 'glass-card border-white/10', badge: 'bg-slate-500/20 text-slate-300 border border-slate-500/30' },
  { id: 'In Progress', title: 'In Progress', color: 'glass-card border-indigo-500/30', badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' },
  { id: 'Done', title: 'Done', color: 'glass-card border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  users,
  onSelectTask,
  onUpdateStatus,
  onOpenCreateTaskWithStatus,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Low':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getDueDateBadge = (dueDateStr: string, status: TaskStatus) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isDone = status === 'Done';

    if (isDone) {
      return (
        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    }

    if (dueDateStr < todayStr) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
          <AlertCircle className="w-3 h-3" />
          Overdue ({dueDateStr})
        </span>
      );
    }

    if (dueDateStr === todayStr) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
          <Clock className="w-3 h-3" />
          Due Today
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-[11px] text-slate-400">
        <Calendar className="w-3 h-3" />
        {dueDateStr}
      </span>
    );
  };

  const getUser = (id: string) => users.find(u => u.id === id);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onUpdateStatus(taskId, columnId);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-12">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        const isHovered = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`rounded-2xl border p-4 transition-all duration-200 ${column.color} ${
              isHovered ? 'ring-2 ring-indigo-500 bg-indigo-500/10 shadow-xl' : ''
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-100 text-sm">{column.title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${column.badge}`}>
                  {columnTasks.length}
                </span>
              </div>
              <button
                onClick={() => onOpenCreateTaskWithStatus(column.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                title={`Add Task to ${column.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Column Task List */}
            <div className="space-y-3 min-h-[300px]">
              {columnTasks.length === 0 ? (
                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center bg-white/5">
                  <p className="text-xs text-slate-400 font-medium">No tasks in {column.title}</p>
                  <button
                    onClick={() => onOpenCreateTaskWithStatus(column.id)}
                    className="mt-2 text-xs text-indigo-400 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Task
                  </button>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const assignees = task.assigneeIds.map(getUser).filter(Boolean) as User[];

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onSelectTask(task)}
                      className="glass-card glass-card-hover rounded-xl p-4 border border-white/10 shadow-lg cursor-pointer group relative"
                    >
                      {/* Priority and Tags Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          {task.priority} Priority
                        </span>

                        {/* Quick Status Shift Menu */}
                        <div
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 glass p-0.5 rounded-md border border-white/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {column.id !== 'To Do' && (
                            <button
                              onClick={() => onUpdateStatus(task.id, 'To Do')}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 font-medium"
                              title="Move to To Do"
                            >
                              To Do
                            </button>
                          )}
                          {column.id !== 'In Progress' && (
                            <button
                              onClick={() => onUpdateStatus(task.id, 'In Progress')}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 font-medium"
                              title="Move to In Progress"
                            >
                              In Prog
                            </button>
                          )}
                          {column.id !== 'Done' && (
                            <button
                              onClick={() => onUpdateStatus(task.id, 'Done')}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-medium"
                              title="Move to Done"
                            >
                              Done
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-slate-100 text-sm mb-1 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                        {task.title}
                      </h3>

                      {/* Description preview */}
                      {task.description && (
                        <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Progress Bar if not 0 */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Progress</span>
                          <span className="font-medium text-slate-200">{task.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              task.status === 'Done'
                                ? 'bg-emerald-500'
                                : task.progress > 60
                                ? 'bg-indigo-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-slate-300 font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Due Date & Assignee Avatars */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <div>{getDueDateBadge(task.dueDate, task.status)}</div>

                        <div className="flex items-center justify-end">
                          {/* Assignees stack */}
                          <div className="flex -space-x-1.5 overflow-hidden">
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
                          {task.activities && task.activities.length > 0 && (
                            <span className="ml-2 text-[10px] text-slate-400 flex items-center gap-0.5">
                              <MessageSquare className="w-3 h-3" />
                              {task.activities.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
