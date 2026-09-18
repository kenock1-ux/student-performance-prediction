import React, { useState } from 'react';
import { StudentFeatures } from '../api';

interface PredictionFormProps {
  onSubmit: (features: StudentFeatures) => void;
  isLoading: boolean;
}

export function PredictionForm({ onSubmit, isLoading }: PredictionFormProps) {
  const [formData, setFormData] = useState<StudentFeatures>({
    school: 'GP', sex: 'F', age: 15, address: 'U', famsize: 'GT3', Pstatus: 'T',
    Medu: 4, Fedu: 4, Mjob: 'teacher', Fjob: 'other', reason: 'course', guardian: 'mother',
    traveltime: 1, studytime: 2, failures: 0, schoolsup: 'yes', famsup: 'no', paid: 'no',
    activities: 'no', nursery: 'yes', higher: 'yes', internet: 'yes', romantic: 'no',
    famrel: 4, freetime: 3, goout: 4, Dalc: 1, Walc: 1, health: 3, absences: 6, G1: 5, G2: 6
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderSelect = (name: keyof StudentFeatures, label: string, options: {value: string | number, label: string}[]) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      <select 
        name={name} 
        value={formData[name] as string | number} 
        onChange={handleChange}
        className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );

  const renderInput = (name: keyof StudentFeatures, label: string, min: number, max: number) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      <input 
        type="number" 
        name={name} 
        min={min} 
        max={max} 
        value={formData[name] as string | number} 
        onChange={handleChange}
        className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-10 bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl relative z-10">
      
      {/* Section 1: Personal */}
      <div>
        <h3 className="text-xl font-bold text-slate-100 mb-5 flex items-center gap-2">
          <span className="w-8 h-1 bg-indigo-500 rounded-full inline-block"></span>
          Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {renderSelect('school', 'School', [{value:'GP', label:'Gabriel Pereira'}, {value:'MS', label:'Mousinho da Silveira'}])}
          {renderSelect('sex', 'Sex', [{value:'F', label:'Female'}, {value:'M', label:'Male'}])}
          {renderInput('age', 'Age (15-22)', 15, 22)}
          {renderSelect('address', 'Address Type', [{value:'U', label:'Urban'}, {value:'R', label:'Rural'}])}
          {renderSelect('famsize', 'Family Size', [{value:'LE3', label:'Less/Equal 3'}, {value:'GT3', label:'Greater than 3'}])}
          {renderSelect('Pstatus', 'Parents Status', [{value:'T', label:'Living together'}, {value:'A', label:'Apart'}])}
        </div>
      </div>

      {/* Section 2: Family Background */}
      <div>
         <h3 className="text-xl font-bold text-slate-100 mb-5 flex items-center gap-2">
          <span className="w-8 h-1 bg-indigo-500 rounded-full inline-block"></span>
          Family Background
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {renderInput('Medu', 'Mother Ed (0-4)', 0, 4)}
          {renderInput('Fedu', 'Father Ed (0-4)', 0, 4)}
          {renderSelect('Mjob', 'Mother Job', [{value:'teacher',label:'Teacher'}, {value:'health',label:'Healthcare'}, {value:'services',label:'Services'}, {value:'at_home',label:'At home'}, {value:'other',label:'Other'}])}
          {renderSelect('Fjob', 'Father Job', [{value:'teacher',label:'Teacher'}, {value:'health',label:'Healthcare'}, {value:'services',label:'Services'}, {value:'at_home',label:'At home'}, {value:'other',label:'Other'}])}
          {renderSelect('guardian', 'Guardian', [{value:'mother',label:'Mother'}, {value:'father',label:'Father'}, {value:'other',label:'Other'}])}
          {renderInput('famrel', 'Family Rel. (1-5)', 1, 5)}
        </div>
      </div>

      {/* Section 3: Academic */}
      <div>
         <h3 className="text-xl font-bold text-slate-100 mb-5 flex items-center gap-2">
          <span className="w-8 h-1 bg-indigo-500 rounded-full inline-block"></span>
          Academic Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {renderSelect('reason', 'Reason for School', [{value:'home',label:'Close to home'}, {value:'reputation',label:'Reputation'}, {value:'course',label:'Course pref'}, {value:'other',label:'Other'}])}
          {renderInput('traveltime', 'Travel Time (1-4)', 1, 4)}
          {renderInput('studytime', 'Study Time (1-4)', 1, 4)}
          {renderInput('failures', 'Past Failures (0-4)', 0, 4)}
          {renderSelect('schoolsup', 'Extra Ed Support', [{value:'yes',label:'Yes'}, {value:'no',label:'No'}])}
          {renderSelect('famsup', 'Family Ed Support', [{value:'yes',label:'Yes'}, {value:'no',label:'No'}])}
          {renderSelect('paid', 'Extra Paid Classes', [{value:'yes',label:'Yes'}, {value:'no',label:'No'}])}
          {renderSelect('nursery', 'Attended Nursery', [{value:'yes',label:'Yes'}, {value:'no',label:'No'}])}
          {renderSelect('higher', 'Wants Higher Ed', [{value:'yes',label:'Yes'}, {value:'no',label:'No'}])}
          {renderInput('absences', 'Absences (0-93)', 0, 93)}
          {renderInput('G1', 'Grade 1 (0-20)', 0, 20)}
          {renderInput('G2', 'Grade 2 (0-20)', 0, 20)}
        </div>
      </div>

      {/* Section 4: Social & Lifestyle */}
      <div>
         <h3 className="text-xl font-bold text-slate-100 mb-5 flex items-center gap-2">
          <span className="w-8 h-1 bg-indigo-500 rounded-full inline-block"></span>
          Social & Lifestyle
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {renderSelect('activities', 'Extra-curricular', [{value:'yes',label:'Yes'}, {value:'no',label:'No'}])}
          {renderSelect('internet', 'Home Internet', [{value:'yes',label:'Yes'}, {value:'no',label:'No'}])}
          {renderSelect('romantic', 'Romantic Rel.', [{value:'yes',label:'Yes'}, {value:'no',label:'No'}])}
          {renderInput('freetime', 'Free Time (1-5)', 1, 5)}
          {renderInput('goout', 'Going Out (1-5)', 1, 5)}
          {renderInput('health', 'Health Status (1-5)', 1, 5)}
          {renderInput('Dalc', 'Workday Alcoh. (1-5)', 1, 5)}
          {renderInput('Walc', 'Weekend Alcoh. (1-5)', 1, 5)}
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-4 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing Prediction...
            </>
          ) : (
            'Generate AI Prediction'
          )}
        </button>
      </div>

    </form>
  );
}
