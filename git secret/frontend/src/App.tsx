import { useState } from 'react';
import { PredictionForm } from './components/PredictionForm';
import { ResultCard } from './components/ResultCard';
import { predictScore, StudentFeatures } from './api';

function App() {
  const [score, setScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handlePredict = async (features: StudentFeatures) => {
    setIsLoading(true);
    setApiError('');
    try {
      // Small simulated delay for premium feel
      await new Promise(resolve => setTimeout(resolve, 800));
      const predictedGrade = await predictScore(features);
      setScore(predictedGrade);
    } catch (err: any) {
      setApiError(err?.message || "Failed to connect to the prediction API. Ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-200 selection:bg-indigo-500/30 selection:text-white">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none transform -translate-y-1/2"></div>
      
      <main className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-1.5 mb-4 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 rounded-full">
              AI Powered Forecast
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            Student Performance <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 animate-gradient-x">
              Predictive Intelligence
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Enter the academic and lifestyle metrics to instantly forecast the final G3 grade using our custom-trained Random Forest model.
          </p>
        </header>

        {apiError && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center backdrop-blur-md">
            {apiError}
          </div>
        )}

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          
          {/* Main Form Area */}
          <div className="w-full lg:w-2/3">
            <PredictionForm onSubmit={handlePredict} isLoading={isLoading} />
          </div>

          {/* Sticky Results Area */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-8">
            <ResultCard score={score} isLoading={isLoading} />
            
            <div className="mt-8 bg-slate-900/30 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
              <h4 className="text-indigo-400 font-semibold mb-2">How it works</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our model utilizes 32 distinct features ranging from personal demographics to lifestyle choices and previous academic history (G1, G2). The Random Forest Regressor evaluates these non-linear relationships to predict the final outcome with high confidence.
              </p>
            </div>
          </div>
          
        </div>
      </main>
      
      <footer className="py-8 text-center text-slate-600 text-sm">
        <p>© 2026 Student Performance AI System. Powered by FastAPI & React.</p>
      </footer>
    </div>
  );
}

export default App;
