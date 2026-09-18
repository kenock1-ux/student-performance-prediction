import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../api';

export function Login() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>('student');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    await login({ username, role });
    
    // Redirect based on role
    if (role === 'student') navigate('/student');
    else if (role === 'parent') navigate('/parent');
    else if (role === 'teacher') navigate('/teacher');
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-200 selection:bg-indigo-500/30 selection:text-white flex items-center justify-center p-4">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none transform -translate-y-1/2"></div>
      
      <div className="bg-slate-900/60 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-indigo-500/20 border border-indigo-500/30">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Welcome Back</h2>
          <p className="text-slate-400">Sign in to the Career Guidance System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. John Doe"
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Select Role</label>
             <div className="grid grid-cols-3 gap-3">
               {(['student', 'parent', 'teacher'] as Role[]).map((r) => (
                 <button
                   key={r}
                   type="button"
                   onClick={() => setRole(r)}
                   className={`p-3 rounded-xl border text-sm font-medium transition-all capitalize ${
                     role === r 
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                   }`}
                 >
                   {r}
                 </button>
               ))}
             </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !username}
            className="w-full mt-4 py-3.5 rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
