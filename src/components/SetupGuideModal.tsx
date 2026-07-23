import React, { useState } from 'react';
import { X, Code, Database, Key, Terminal, Check, Copy, BookOpen } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const envSnippet = `# Environment Variables (.env)
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
APP_URL="${window.location.origin}"
`;

  const schemaSnippet = `-- PostgreSQL Database Schema

-- 1. Users Table
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar TEXT,
  role VARCHAR(32) NOT NULL DEFAULT 'Member', -- 'Admin' | 'Member'
  google_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tasks Table
CREATE TABLE tasks (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  priority VARCHAR(32) NOT NULL DEFAULT 'Medium', -- 'Low' | 'Medium' | 'High'
  status VARCHAR(32) NOT NULL DEFAULT 'To Do',    -- 'To Do' | 'In Progress' | 'Done'
  progress INT NOT NULL DEFAULT 0,
  created_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Task Assignees Join Table (Multi-Assignee Support)
CREATE TABLE task_assignees (
  task_id VARCHAR(64) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);
`;

  const commandsSnippet = `# Install dependencies
npm install

# Start local full-stack server (Express + Vite on Port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="glass-modal rounded-2xl border border-white/15 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 glass-modal z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Developer & Setup Documentation</h2>
              <p className="text-xs text-slate-400">
                Step-by-Step Setup Guide, PostgreSQL Schema, and Google OAuth Configuration.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* Section 1: Google OAuth Config */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" /> 1. Google OAuth 2.0 Configuration
              </h3>
              <button
                onClick={() => copyToClipboard(envSnippet, 'env')}
                className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-medium"
              >
                {copiedSection === 'env' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'env' ? 'Copied' : 'Copy .env'}
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              To enable live Google Sign-In, create OAuth 2.0 Credentials in the{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 underline font-medium"
              >
                Google Cloud Console
              </a>
              . Add the authorized callback URI below:
            </p>

            <div className="p-3 glass-card border border-indigo-500/30 rounded-xl text-xs text-indigo-200 font-mono">
              <strong>Authorized Redirect URI:</strong> {window.location.origin}/auth/callback
            </div>

            <pre className="p-4 bg-slate-950/80 border border-white/10 text-indigo-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
              {envSnippet}
            </pre>
          </div>

          {/* Section 2: Database Schema */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" /> 2. Relational Database Schema (PostgreSQL)
              </h3>
              <button
                onClick={() => copyToClipboard(schemaSnippet, 'schema')}
                className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-medium"
              >
                {copiedSection === 'schema' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'schema' ? 'Copied' : 'Copy SQL'}
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Models include primary key definitions, foreign key constraints for task creator and multiple assignees join table:
            </p>

            <pre className="p-4 bg-slate-950/80 border border-white/10 text-emerald-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-60 overflow-y-auto">
              {schemaSnippet}
            </pre>
          </div>

          {/* Section 3: Core API Endpoints */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-amber-400" /> 3. Express REST API Endpoints
            </h3>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="p-2.5 glass-card border border-white/10 rounded-xl flex items-center justify-between">
                <span className="font-mono font-bold text-indigo-300">GET /api/auth/google/url</span>
                <span className="text-slate-400">Constructs Google OAuth 2.0 authorization URL</span>
              </div>
              <div className="p-2.5 glass-card border border-white/10 rounded-xl flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-300">GET /auth/callback</span>
                <span className="text-slate-400">OAuth callback handler & postMessage event dispatcher</span>
              </div>
              <div className="p-2.5 glass-card border border-white/10 rounded-xl flex items-center justify-between">
                <span className="font-mono font-bold text-indigo-300">GET /api/tasks</span>
                <span className="text-slate-400">Fetch tasks with filtering (status, priority, assignee)</span>
              </div>
              <div className="p-2.5 glass-card border border-white/10 rounded-xl flex items-center justify-between">
                <span className="font-mono font-bold text-amber-300">POST /api/tasks</span>
                <span className="text-slate-400">Create new task with multi-assignee list</span>
              </div>
              <div className="p-2.5 glass-card border border-white/10 rounded-xl flex items-center justify-between">
                <span className="font-mono font-bold text-rose-300">PUT /api/tasks/:id</span>
                <span className="text-slate-400">Update task details, progress, or status</span>
              </div>
            </div>
          </div>

          {/* Section 4: Local Setup Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" /> 4. Local Execution Commands
              </h3>
              <button
                onClick={() => copyToClipboard(commandsSnippet, 'commands')}
                className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-medium"
              >
                {copiedSection === 'commands' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'commands' ? 'Copied' : 'Copy Commands'}
              </button>
            </div>

            <pre className="p-4 bg-slate-950/80 border border-white/10 text-indigo-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
              {commandsSnippet}
            </pre>
          </div>

        </div>

      </div>
    </div>
  );
};
