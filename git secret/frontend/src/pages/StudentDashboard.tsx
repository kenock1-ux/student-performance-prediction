import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PredictionForm } from '../components/PredictionForm';
import { ResultCard } from '../components/ResultCard';
import { predictScore, getAdvice, StudentFeatures } from '../api';
import { useNavigate } from 'react-router-dom';

export function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [score, setScore] = useState<number | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePredict = async (features: StudentFeatures) => {
    setIsLoading(true);
    setApiError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const predictedGrade = await predictScore(features);
      if (predictedGrade !== null && user) {
        setScore(predictedGrade);
        const adviceText = await getAdvice(predictedGrade, user.role);
        setAdvice(adviceText);
      }
    } catch (err: any) {
      setApiError(err?.message || "Prediction failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-200 selection:bg-indigo-500/30 selection:text-white">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none transform -translate-y-1/2"></div>
      
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <header className="flex justify-between items-center mb-8 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-slate-400">Welcome, <span className="text-indigo-400 font-semibold">{user?.name}</span></p>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors border border-slate-700">
            Sign Out
          </button>
        </header>

        {apiError && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center backdrop-blur-md">
            {apiError}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          <div className="w-full lg:w-2/3">
            <PredictionForm onSubmit={handlePredict} isLoading={isLoading} />
          </div>

          <div className="w-full lg:w-1/3 lg:sticky lg:top-8 flex flex-col gap-6">
            <ResultCard score={score} isLoading={isLoading} />
            
            {advice && (
              <div className="bg-gradient-to-br from-indigo-900/50 to-violet-900/50 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm shadow-xl animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="text-indigo-300 font-bold text-lg">AI Career Advice</h4>
                </div>
                <p className="text-slate-200 leading-relaxed text-sm">
                  {advice}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
