/**
 * data.js — Synthetic Student Dataset Generator & Preprocessing
 * Generates 500 realistic student records and provides preprocessing utilities
 */

const DataModule = (() => {
  'use strict';

  // ── Feature Definitions ─────────────────────────────────────
  const FEATURES = [
    { key: 'studyHours',      label: 'Study Hours/Week',    min: 0,  max: 40,  type: 'number' },
    { key: 'attendance',      label: 'Attendance (%)',       min: 40, max: 100, type: 'number' },
    { key: 'prevGPA',         label: 'Previous GPA',         min: 0,  max: 4,   type: 'number' },
    { key: 'assignmentScore', label: 'Assignment Score (%)', min: 30, max: 100, type: 'number' },
    { key: 'midtermScore',    label: 'Midterm Score (%)',    min: 20, max: 100, type: 'number' },
    { key: 'tutoringSessions',label: 'Tutoring Sessions',    min: 0,  max: 20,  type: 'number' },
    { key: 'sleepHours',      label: 'Sleep Hours/Night',   min: 3,  max: 10,  type: 'number' },
    { key: 'extracurricular', label: 'Extracurriculars',     min: 0,  max: 5,   type: 'number' },
    { key: 'partTimeJob',     label: 'Part-Time Job',        type: 'binary' },
    { key: 'incomeLevel',     label: 'Family Income',        type: 'categorical', values: [0,1,2] }, // Low/Mid/High
  ];

  const FEATURE_KEYS = FEATURES.map(f => f.key);

  // ── RNG Utility ─────────────────────────────────────────────
  const rand  = (min, max) => Math.random() * (max - min) + min;
  const randI = (min, max) => Math.floor(rand(min, max + 1));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ── GPA Computation ──────────────────────────────────────────
  function computeGPA(s) {
    const weights = {
      studyHours:       0.20,
      attendance:       0.15,
      prevGPA:          0.25,
      assignmentScore:  0.15,
      midtermScore:     0.20,
      tutoringSessions: 0.05,
    };

    // Normalize each to 0–1 scale
    const norm = {
      studyHours:       s.studyHours / 40,
      attendance:       (s.attendance - 40) / 60,
      prevGPA:          s.prevGPA / 4,
      assignmentScore:  s.assignmentScore / 100,
      midtermScore:     s.midtermScore / 100,
      tutoringSessions: s.tutoringSessions / 20,
    };

    let score = 0;
    for (const [k, w] of Object.entries(weights)) {
      score += norm[k] * w;
    }

    // Sleep penalty/bonus: optimal ~7–8 hrs
    const sleepFactor = 1 - Math.abs(s.sleepHours - 7.5) * 0.02;
    score *= clamp(sleepFactor, 0.85, 1.05);

    // Part-time job slight negative
    if (s.partTimeJob) score *= 0.97;

    // Income level slight boost
    score += s.incomeLevel * 0.01;

    // Add noise
    score += rand(-0.04, 0.04);

    // Map [0,1] → [0,4]
    return clamp(parseFloat((score * 4).toFixed(2)), 0, 4);
  }

  // ── Grade Classification ─────────────────────────────────────
  function gpaToGrade(gpa) {
    if (gpa >= 3.7) return 'A';
    if (gpa >= 3.0) return 'B';
    if (gpa >= 2.0) return 'C';
    if (gpa >= 1.0) return 'D';
    return 'F';
  }

  function gpaToPassFail(gpa) {
    return gpa >= 2.0 ? 'Pass' : 'Fail';
  }

  // ── Generate Student Record ──────────────────────────────────
  function generateStudent(id) {
    const studyHours       = parseFloat(rand(1, 38).toFixed(1));
    const attendance       = parseFloat(rand(45, 100).toFixed(1));
    const prevGPA          = parseFloat(rand(0.5, 4.0).toFixed(2));
    const assignmentScore  = parseFloat(rand(35, 100).toFixed(1));
    const midtermScore     = parseFloat(rand(25, 100).toFixed(1));
    const tutoringSessions = randI(0, 18);
    const sleepHours       = parseFloat(rand(3.5, 10).toFixed(1));
    const extracurricular  = randI(0, 5);
    const partTimeJob      = Math.random() > 0.6;
    const incomeLevel      = randI(0, 2); // 0=Low, 1=Mid, 2=High

    const s = {
      id, studyHours, attendance, prevGPA, assignmentScore,
      midtermScore, tutoringSessions, sleepHours, extracurricular,
      partTimeJob, incomeLevel,
    };

    s.finalGPA   = computeGPA(s);
    s.grade      = gpaToGrade(s.finalGPA);
    s.passFail   = gpaToPassFail(s.finalGPA);
    return s;
  }

  // ── Dataset ──────────────────────────────────────────────────
  let _dataset = [];

  function generateDataset(n = 500) {
    _dataset = Array.from({ length: n }, (_, i) => generateStudent(i + 1));
    return _dataset;
  }

  function getDataset() {
    if (!_dataset.length) generateDataset();
    return _dataset;
  }

  // ── Statistics ───────────────────────────────────────────────
  function computeStats() {
    const data = getDataset();
    const gpas = data.map(s => s.finalGPA);
    const avg  = gpas.reduce((a, b) => a + b, 0) / gpas.length;
    const passCount = data.filter(s => s.passFail === 'Pass').length;
    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    data.forEach(s => gradeCounts[s.grade]++);

    return {
      total:     data.length,
      avgGPA:    parseFloat(avg.toFixed(3)),
      passRate:  parseFloat(((passCount / data.length) * 100).toFixed(1)),
      passCount,
      failCount: data.length - passCount,
      gradeCounts,
      gpaMin:    Math.min(...gpas),
      gpaMax:    Math.max(...gpas),
    };
  }

  // ── GPA Distribution (histogram buckets) ─────────────────────
  function getGPADistribution(buckets = 20) {
    const data  = getDataset();
    const step  = 4 / buckets;
    const labels = [];
    const counts = new Array(buckets).fill(0);

    for (let i = 0; i < buckets; i++) {
      labels.push((i * step).toFixed(1));
    }

    data.forEach(s => {
      const idx = Math.min(Math.floor(s.finalGPA / step), buckets - 1);
      counts[idx]++;
    });

    return { labels, counts };
  }

  // ── Preprocessing for TF.js ──────────────────────────────────
  // Numeric feature keys (10 features total for model input)
  const NUMERIC_KEYS = [
    'studyHours','attendance','prevGPA','assignmentScore',
    'midtermScore','tutoringSessions','sleepHours','extracurricular',
    'partTimeJob','incomeLevel',
  ];

  // Min-max normalization parameters (computed from dataset)
  let normParams = {};

  function computeNormParams() {
    const data = getDataset();
    normParams = {};
    NUMERIC_KEYS.forEach(key => {
      const vals = data.map(s => typeof s[key] === 'boolean' ? (s[key] ? 1 : 0) : s[key]);
      normParams[key] = {
        min: Math.min(...vals),
        max: Math.max(...vals),
      };
    });
    return normParams;
  }

  function normalize(value, key) {
    const { min, max } = normParams[key] || { min: 0, max: 1 };
    return max === min ? 0 : (value - min) / (max - min);
  }

  function studentToFeatures(s) {
    return NUMERIC_KEYS.map(key => {
      const val = typeof s[key] === 'boolean' ? (s[key] ? 1 : 0) : s[key];
      return normalize(val, key);
    });
  }

  // Grade → index mapping
  const GRADE_LABELS = ['A', 'B', 'C', 'D', 'F'];
  function gradeToIndex(g) { return GRADE_LABELS.indexOf(g); }
  function indexToGrade(i) { return GRADE_LABELS[i]; }

  function prepareClassificationData() {
    computeNormParams();
    const data = getDataset();
    const xs = data.map(studentToFeatures);
    const ys = data.map(s => gradeToIndex(s.grade));
    return { xs, ys, numFeatures: NUMERIC_KEYS.length, numClasses: 5 };
  }

  function prepareRegressionData() {
    computeNormParams();
    const data = getDataset();
    const xs = data.map(studentToFeatures);
    const ys = data.map(s => s.finalGPA / 4); // normalize to 0–1
    return { xs, ys, numFeatures: NUMERIC_KEYS.length };
  }

  // ── Predict single student (raw inputs) ──────────────────────
  function prepareStudentInput(raw) {
    // raw is { studyHours, attendance, prevGPA, ... } already numeric
    computeNormParams();
    return NUMERIC_KEYS.map(key => {
      const val = typeof raw[key] === 'boolean' ? (raw[key] ? 1 : 0) : parseFloat(raw[key]);
      return normalize(isNaN(val) ? 0 : val, key);
    });
  }

  // ── Feature correlations with GPA (Pearson) ──────────────────
  function getFeatureCorrelations() {
    const data = getDataset();
    const gpas = data.map(s => s.finalGPA);
    const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const gpaM = mean(gpas);

    const corrs = [];
    NUMERIC_KEYS.forEach(key => {
      const vals = data.map(s => typeof s[key] === 'boolean' ? (s[key] ? 1 : 0) : s[key]);
      const vM = mean(vals);
      let num = 0, d1 = 0, d2 = 0;
      for (let i = 0; i < data.length; i++) {
        const dv = vals[i] - vM;
        const dg = gpas[i] - gpaM;
        num += dv * dg;
        d1  += dv * dv;
        d2  += dg * dg;
      }
      const r = Math.sqrt(d1 * d2) === 0 ? 0 : num / Math.sqrt(d1 * d2);
      corrs.push({ key, label: FEATURES.find(f => f.key === key)?.label || key, r });
    });

    return corrs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }

  // Public API
  return {
    FEATURES,
    FEATURE_KEYS,
    GRADE_LABELS,
    NUMERIC_KEYS,
    generateDataset,
    getDataset,
    computeStats,
    getGPADistribution,
    computeNormParams,
    studentToFeatures,
    prepareClassificationData,
    prepareRegressionData,
    prepareStudentInput,
    gpaToGrade,
    gpaToPassFail,
    gradeToIndex,
    indexToGrade,
    getFeatureCorrelations,
  };
})();
