import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, User as UserIcon, Check, Edit2 } from 'lucide-react';
import { User, UserRole } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onAddUser: (user: Partial<User>) => void;
  onUpdateUser: (userId: string, data: Partial<User>) => void;
  onSwitchUser: (userId: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onSwitchUser,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Member');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('Member');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    onAddUser({
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    });

    setNewName('');
    setNewEmail('');
    setIsAdding(false);
  };

  const handleSaveEdit = (userId: string) => {
    onUpdateUser(userId, { role: editRole });
    setEditingUserId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="glass-modal rounded-2xl border border-white/15 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Workspace Team Directory</h2>
            <p className="text-xs text-slate-400">
              Manage user profiles, team roles (Admin/Member), and active account context.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Add New Member Toggle */}
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-4 border border-dashed border-white/20 rounded-xl text-xs font-semibold text-indigo-300 hover:bg-white/10 flex items-center justify-center gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4" /> Add New Team Member
            </button>
          ) : (
            <form onSubmit={handleCreate} className="p-4 glass-card border border-white/10 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-200">Register New Member</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-1.5 text-xs glass-input rounded-xl focus:outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="px-3 py-1.5 text-xs glass-input rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Role:</span>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="px-2 py-1 glass-input rounded text-slate-200"
                  >
                    <option value="Member" className="bg-slate-900 text-white">Member</option>
                    <option value="Admin" className="bg-slate-900 text-white">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1 text-xs text-slate-300 hover:bg-white/10 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded font-bold hover:bg-indigo-500"
                  >
                    Add Member
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* User List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Registered Users ({users.length})
            </h3>

            {users.map((u) => {
              const isActive = currentUser.id === u.id;
              const isEditingThis = editingUserId === u.id;

              return (
                <div
                  key={u.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-500/30'
                      : 'border-white/10 glass-card hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-100">{u.name}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded-full">
                            Active Session
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block">{u.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditingThis ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="text-xs glass-input rounded px-2 py-1"
                        >
                          <option value="Member" className="bg-slate-900 text-white">Member</option>
                          <option value="Admin" className="bg-slate-900 text-white">Admin</option>
                        </select>
                        <button
                          onClick={() => handleSaveEdit(u.id)}
                          className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-xs font-semibold px-2"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            u.role === 'Admin'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                          }`}
                        >
                          {u.role}
                        </span>

                        {currentUser.role === 'Admin' && (
                          <button
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditRole(u.role);
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Edit Role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {!isActive && (
                      <button
                        onClick={() => {
                          onSwitchUser(u.id);
                        }}
                        className="text-xs font-semibold px-3 py-1 rounded-lg bg-white/10 text-slate-200 hover:bg-indigo-600 hover:text-white transition-all ml-1 border border-white/10"
                        title="Switch active user session"
                      >
                        Switch To
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
