import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Edit3,
  Trash2,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { Task, User, TaskStatus, TaskPriority } from '../types';

interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAddActivity: (taskId: string, comment: string) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  users,
  currentUser,
  onEdit,
  onDelete,
  onUpdateStatus,
  onAddActivity,
}) => {
  const [commentInput, setCommentInput] = useState('');

  if (!isOpen || !task) return null;

  const getUser = (id: string) => users.find((u) => u.id === id);
  const creator = getUser(task.createdBy);
  const assignees = task.assigneeIds.map(getUser).filter(Boolean) as User[];

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddActivity(task.id, `Added note: "${commentInput.trim()}"`);
    setCommentInput('');
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate < todayStr && task.status !== 'Done';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-lg glass-modal h-full shadow-2xl flex flex-col border-l border-white/15 animate-in slide-in-from-right duration-200 text-slate-100">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between glass">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                task.status === 'Done'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : task.status === 'In Progress'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
              }`}
            >
              {task.status}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-md border ${
                task.priority === 'High'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : task.priority === 'Medium'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
              }`}
            >
              {task.priority} Priority
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-white/10 rounded-xl transition-all"
              title="Edit Task"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this task?')) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Title & Description */}
          <div>
            <h2 className="text-xl font-bold text-white mb-2 leading-snug">
              {task.title}
            </h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {task.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 glass-card rounded-xl border border-white/10 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Due Date</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  isOverdue ? 'text-rose-300' : 'text-slate-100'
                }`}
              >
                {isOverdue ? <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> : <Calendar className="w-3.5 h-3.5 text-slate-400" />}
                {task.dueDate} {isOverdue && '(Overdue)'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Created By</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                {creator ? (
                  <>
                    <img src={creator.avatar} alt={creator.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{creator.name}</span>
                  </>
                ) : (
                  <span>Unknown</span>
                )}
              </div>
            </div>
          </div>

          {/* Completion Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>Task Completion Progress</span>
              <span className="text-indigo-400 font-bold">{task.progress}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  task.status === 'Done' ? 'bg-emerald-500' : task.progress > 60 ? 'bg-indigo-500' : 'bg-amber-500'
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          {/* Assignees Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Assigned Team Members ({assignees.length})
            </h3>
            <div className="space-y-2">
              {assignees.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 glass-card border border-white/10 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-100">{member.name}</div>
                      <div className="text-[10px] text-slate-400">{member.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-white/10 border border-white/10 text-slate-300 px-2 py-0.5 rounded">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Tags & Categories
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-md font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activity Log & Comments */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Activity History & Comments
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} className="flex gap-2 mb-4">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment or update note..."
                className="flex-1 px-3 py-1.5 text-xs glass-input rounded-xl focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-md transition-all flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Activity Stream */}
            <div className="space-y-3">
              {task.activities && task.activities.length > 0 ? (
                task.activities.map((act) => (
                  <div key={act.id} className="p-3 glass-card rounded-xl border border-white/10 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                        <img
                          src={act.userAvatar}
                          alt={act.userName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{act.userName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{act.action}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
