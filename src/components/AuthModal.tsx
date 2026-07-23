import React, { useState } from 'react';
import { X, LogIn, Shield, Check, Info } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  users: User[];
  onSwitchUser: (userId: string) => void;
  onOAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onSwitchUser,
  onOAuthSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setStatusMessage('Initiating Google OAuth 2.0 authorization...');

    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();

      if (!data.url) {
        throw new Error('Failed to retrieve Google Auth URL');
      }

      // Open Google OAuth authorization directly in popup window
      const popup = window.open(
        data.url,
        'google_oauth_popup',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        alert('Popup blocker detected. Please allow popups for this app to sign in with Google.');
        setLoading(false);
        setStatusMessage(null);
        return;
      }

      setStatusMessage(
        data.configured
          ? 'Google Sign-In popup opened. Completing authentication...'
          : 'Simulating Google SSO popup auth (GOOGLE_CLIENT_ID not set)...'
      );

      // Listen for message from popup callback window
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          setLoading(false);
          setStatusMessage('Signed in successfully!');
          if (event.data.user) {
            onOAuthSuccess(event.data.user);
          }
          setTimeout(() => {
            setStatusMessage(null);
            onClose();
          }, 800);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setStatusMessage('Authentication error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="glass-modal rounded-2xl border border-white/15 shadow-2xl w-full max-w-md overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-500/30">
              G
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Google Authentication</h2>
              <p className="text-xs text-slate-400">SSO Sign-In & Workspace Authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Main Google Sign In Button */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 border border-white/15 rounded-xl glass hover:bg-white/10 text-white font-semibold text-sm flex items-center justify-center gap-3 shadow-lg transition-all active:scale-98 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.25 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.28C.46 8.21 0 10.05 0 12s.46 3.79 1.28 5.42l4-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{loading ? 'Opening Google SSO...' : 'Sign in with Google'}</span>
            </button>

            {statusMessage && (
              <p className="mt-2 text-xs text-center text-indigo-300 font-medium">
                {statusMessage}
              </p>
            )}
          </div>

          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-xs font-medium uppercase">
              Or Switch Workspace Account
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Quick Account Switcher */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {users.map((u) => {
              const isCurrent = currentUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    onSwitchUser(u.id);
                    onClose();
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-500/30'
                      : 'border-white/10 glass-card hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-100">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      u.role === 'Admin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {u.role}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Security Note */}
          <div className="p-3 glass-card rounded-xl border border-white/10 text-[11px] text-slate-300 flex items-start gap-2">
            <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>
              Google OAuth 2.0 authorization redirects securely back to your workspace callback URI.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
