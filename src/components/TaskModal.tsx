import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus, Tag, Calendar, AlertCircle } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, User } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => void;
  users: User[];
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users,
  taskToEdit,
  defaultStatus = 'To Do',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setDueDate(taskToEdit.dueDate);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setAssigneeIds(taskToEdit.assigneeIds || []);
      setTags(taskToEdit.tags || []);
      setProgress(taskToEdit.progress || 0);
    } else {
      setTitle('');
      setDescription('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setPriority('Medium');
      setStatus(defaultStatus);
      setAssigneeIds(users.length > 0 ? [users[0].id] : []);
      setTags(['Feature']);
      setProgress(defaultStatus === 'Done' ? 100 : 0);
    }
  }, [taskToEdit, defaultStatus, isOpen, users]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const toggleAssignee = (userId: string) => {
    if (assigneeIds.includes(userId)) {
      if (assigneeIds.length > 1) {
        setAssigneeIds(assigneeIds.filter((id) => id !== userId));
      }
    } else {
      setAssigneeIds([...assigneeIds, userId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
      status,
      assigneeIds,
      tags,
      progress,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="glass-modal rounded-2xl border border-white/15 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">
              {taskToEdit ? 'Edit Task Details' : 'Create New Task'}
            </h2>
            <p className="text-xs text-slate-400">
              {taskToEdit ? 'Update fields, assignees, or task progress.' : 'Add a new task and assign team members.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Integrate Google OAuth 2.0 SSO"
              className="w-full px-3.5 py-2 text-sm glass-input rounded-xl focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, acceptance criteria, or technical details..."
              className="w-full px-3.5 py-2 text-sm glass-input rounded-xl focus:outline-none"
            />
          </div>

          {/* Status, Priority & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as TaskStatus;
                  setStatus(newStatus);
                  if (newStatus === 'Done') setProgress(100);
                  else if (newStatus === 'To Do' && progress === 100) setProgress(0);
                }}
                className="w-full px-3 py-2 text-sm glass-input rounded-xl focus:outline-none"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm glass-input rounded-xl focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm glass-input rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* Task Progress Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
              <span>Task Completion Progress</span>
              <span className="text-indigo-400 font-bold">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => {
                const val = Number(e.target.value);
                setProgress(val);
                if (val === 100) setStatus('Done');
                else if (val > 0 && status === 'To Do') setStatus('In Progress');
              }}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Multi-Assignees Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Assign Team Members (Multi-Assignee)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {users.map((user) => {
                const isAssigned = assigneeIds.includes(user.id);

                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => toggleAssignee(user.id)}
                    className={`flex items-center gap-3 p-2 rounded-xl border text-left transition-all ${
                      isAssigned
                        ? 'border-indigo-500 bg-indigo-500/20 text-white ring-1 ring-indigo-500/40'
                        : 'border-white/10 glass hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate text-slate-100">{user.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{user.role}</div>
                    </div>
                    {isAssigned && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tags & Labels
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press enter..."
                className="flex-1 px-3 py-1.5 text-xs glass-input rounded-xl focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs font-medium glass hover:bg-white/10 border border-white/10 rounded-xl text-slate-200"
              >
                Add Tag
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30 border border-indigo-400/30 transition-all active:scale-98"
            >
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
