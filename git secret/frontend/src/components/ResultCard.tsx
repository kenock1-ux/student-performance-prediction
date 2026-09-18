import React from 'react';

interface ResultCardProps {
  score: number | null;
  isLoading: boolean;
}

export function ResultCard({ score, isLoading }: ResultCardProps) {
  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/50 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] shadow-2xl shadow-indigo-900/20">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-300 animate-pulse text-lg">Analyzing profile metrics...</p>
      </div>
    );
  }

  if (score === null) {
    return (
      <div className="w-full bg-slate-900/50 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] shadow-2xl shadow-indigo-900/20">
        <p className="text-slate-400 text-lg">Submit the form to see your AI-predicted G3 score.</p>
      </div>
    );
  }

  // Interpret score
  let gradeLetter = 'F';
  let colorClass = 'text-red-500';
  let message = 'Significant improvement needed.';
  
  if (score >= 16) {
    gradeLetter = 'A';
    colorClass = 'text-emerald-400';
    message = 'Excellent performance projected!';
  } else if (score >= 14) {
    gradeLetter = 'B';
    colorClass = 'text-blue-400';
    message = 'Strong performance projected.';
  } else if (score >= 12) {
    gradeLetter = 'C';
    colorClass = 'text-indigo-400';
    message = 'Average performance projected.';
  } else if (score >= 10) {
    gradeLetter = 'D';
    colorClass = 'text-amber-400';
    message = 'Below average performance projected.';
  }

  const percentage = Math.min(Math.max((score / 20) * 100, 0), 100);

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] shadow-2xl shadow-indigo-900/40 relative overflow-hidden transition-all duration-500">
      
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      
      <p className="text-slate-400 font-medium uppercase tracking-widest text-sm mb-2 relative z-10">Predicted Final Grade (G3)</p>
      
      <div className="flex items-end gap-2 mb-2 relative z-10">
        <span className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
          {score.toFixed(1)}
        </span>
        <span className="text-2xl text-slate-500 mb-2 font-medium">/ 20</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md h-3 bg-slate-800 rounded-full mt-6 mb-4 relative z-10 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="flex flex-col items-center mt-4 relative z-10">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-slate-800 border-2 ${colorClass.replace('text', 'border')}`}>
          <span className={`text-3xl font-black ${colorClass}`}>{gradeLetter}</span>
        </div>
        <p className="text-slate-300">{message}</p>
      </div>
    </div>
  );
}
