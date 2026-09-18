/**
 * app.js — Main Application Controller
 * Handles tab navigation, dataset table, training orchestration,
 * prediction form, and all UI state management.
 */

(function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────
  const state = {
    activeTab:        'dashboard',
    modelMode:        'classification', // 'classification' | 'regression'
    isTraining:       false,
    classResults:     null,
    regResults:       null,
    tablePage:        1,
    tablePageSize:    15,
    tableSearch:      '',
    tableSortKey:     'id',
    tableSortDir:     'asc',
    dataset:          [],
  };

  // ── DOM Refs ─────────────────────────────────────────────────
  const $ = id => document.getElementById(id);

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    // Generate dataset
    state.dataset = DataModule.generateDataset(500);

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Model mode selector
    document.querySelectorAll('.model-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        state.modelMode = btn.dataset.mode;
        document.querySelectorAll('.model-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateTrainingUI();
      });
    });

    // Train button
    $('btn-train').addEventListener('click', startTraining);

    // Prediction form
    $('prediction-form').addEventListener('submit', handlePredict);

    // Search
    $('table-search').addEventListener('input', e => {
      state.tableSearch = e.target.value.toLowerCase();
      state.tablePage = 1;
      renderTable();
    });

    // Grade filter
    $('grade-filter').addEventListener('change', () => {
      state.tablePage = 1;
      renderTable();
    });

    // Range inputs → live value display
    document.querySelectorAll('input[type="range"]').forEach(input => {
      const display = document.getElementById(input.id + '-val');
      if (display) {
        input.addEventListener('input', () => {
          display.textContent = input.value;
        });
      }
    });

    // Pagination
    $('btn-prev-page').addEventListener('click', () => {
      if (state.tablePage > 1) { state.tablePage--; renderTable(); }
    });
    $('btn-next-page').addEventListener('click', () => {
      const filtered = getFilteredData();
      const maxPage  = Math.ceil(filtered.length / state.tablePageSize);
      if (state.tablePage < maxPage) { state.tablePage++; renderTable(); }
    });

    // Column sort
    document.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (state.tableSortKey === key) {
          state.tableSortDir = state.tableSortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.tableSortKey = key;
          state.tableSortDir = 'asc';
        }
        renderTable();
      });
    });

    // Load dashboard
    renderDashboard();
    switchTab('dashboard');
  }

  // ── Tab Navigation ───────────────────────────────────────────
  function switchTab(tabId) {
    state.activeTab = tabId;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });

    // Lazy-render on first visit
    switch (tabId) {
      case 'dashboard':  renderDashboard(); break;
      case 'dataset':    renderDatasetTab(); break;
      case 'training':   renderTrainingTab(); break;
      case 'metrics':    renderMetricsTab(); break;
    }
  }

  // ── Dashboard ────────────────────────────────────────────────
  function renderDashboard() {
    const stats = DataModule.computeStats();

    animateCount('metric-total',    stats.total,    0);
    animateCount('metric-avggpa',   stats.avgGPA,   2);
    animateCount('metric-passrate', stats.passRate, 1, '%');
    animateCount('metric-features', 10,             0);

    // Charts
    setTimeout(() => {
      Charts.drawGPADistribution('chart-gpa-dist');
      Charts.drawGradeDistribution('chart-grade-dist');
      Charts.drawPassFail('chart-pass-fail');
      Charts.drawFeatureImportance('chart-feature-corr');
    }, 100);

    // Grade breakdown table
    renderGradeBreakdown(stats.gradeCounts, stats.total);
  }

  function animateCount(id, target, decimals = 0, suffix = '') {
    const el = $(id);
    if (!el) return;
    const duration = 1200;
    const start    = performance.now();
    const startVal = 0;

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      const val  = startVal + (target - startVal) * ease;
      el.textContent = val.toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function renderGradeBreakdown(gradeCounts, total) {
    const container = $('grade-breakdown');
    if (!container) return;

    const grades = Object.entries(gradeCounts);
    container.innerHTML = grades.map(([g, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      return `
        <div class="metric-row">
          <span class="metric-row-label">
            <span class="badge badge-${g.toLowerCase()}" style="margin-right:8px;">Grade ${g}</span>
          </span>
          <div style="flex:1; margin:0 12px;">
            <div class="progress-bar-wrapper">
              <div class="progress-bar-fill" style="width:${pct}%; background:${Charts.GRADE_COLORS[g]};"></div>
            </div>
          </div>
          <span class="metric-row-value">${count} <span style="color:#475569;font-weight:400;">(${pct}%)</span></span>
        </div>`;
    }).join('');
  }

  // ── Dataset Tab ──────────────────────────────────────────────
  function renderDatasetTab() {
    renderTable();
  }

  function getFilteredData() {
    const gradeFilter = $('grade-filter')?.value || '';
    let data = state.dataset;

    if (state.tableSearch) {
      data = data.filter(s =>
        String(s.id).includes(state.tableSearch) ||
        s.grade.toLowerCase().includes(state.tableSearch) ||
        s.passFail.toLowerCase().includes(state.tableSearch) ||
        String(s.finalGPA).includes(state.tableSearch)
      );
    }

    if (gradeFilter) {
      data = data.filter(s => s.grade === gradeFilter);
    }

    // Sort
    data = [...data].sort((a, b) => {
      const av = a[state.tableSortKey];
      const bv = b[state.tableSortKey];
      let cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return state.tableSortDir === 'asc' ? cmp : -cmp;
    });

    return data;
  }

  function renderTable() {
    const filtered = getFilteredData();
    const maxPage  = Math.ceil(filtered.length / state.tablePageSize) || 1;
    state.tablePage = Math.min(state.tablePage, maxPage);

    const start = (state.tablePage - 1) * state.tablePageSize;
    const page  = filtered.slice(start, start + state.tablePageSize);

    const tbody = $('students-tbody');
    if (!tbody) return;

    tbody.innerHTML = page.map(s => `
      <tr>
        <td>#${s.id}</td>
        <td>${s.studyHours}h</td>
        <td>${s.attendance}%</td>
        <td>${s.prevGPA.toFixed(2)}</td>
        <td>${s.assignmentScore.toFixed(1)}%</td>
        <td>${s.midtermScore.toFixed(1)}%</td>
        <td>${s.tutoringSessions}</td>
        <td>${s.sleepHours}h</td>
        <td>${s.extracurricular}</td>
        <td><span class="badge ${s.partTimeJob ? 'badge-d' : 'badge-pass'}">${s.partTimeJob ? 'Yes' : 'No'}</span></td>
        <td>${['Low','Mid','High'][s.incomeLevel]}</td>
        <td>${s.finalGPA.toFixed(2)}</td>
        <td><span class="badge badge-${s.grade.toLowerCase()}">Grade ${s.grade}</span></td>
        <td><span class="badge badge-${s.passFail.toLowerCase()}">${s.passFail}</span></td>
      </tr>`).join('');

    // Pagination
    const pageInfo = $('page-info');
    if (pageInfo) {
      pageInfo.textContent = `Page ${state.tablePage} of ${maxPage} • ${filtered.length} students`;
    }

    $('btn-prev-page').disabled = state.tablePage <= 1;
    $('btn-next-page').disabled = state.tablePage >= maxPage;

    // Render page numbers
    renderPageNumbers(maxPage);
  }

  function renderPageNumbers(maxPage) {
    const container = $('page-numbers');
    if (!container) return;

    const range = [];
    const cur   = state.tablePage;

    if (maxPage <= 7) {
      for (let i = 1; i <= maxPage; i++) range.push(i);
    } else {
      range.push(1);
      if (cur > 3) range.push('…');
      for (let i = Math.max(2, cur - 1); i <= Math.min(maxPage - 1, cur + 1); i++) range.push(i);
      if (cur < maxPage - 2) range.push('…');
      range.push(maxPage);
    }

    container.innerHTML = range.map(p =>
      p === '…'
        ? `<span style="color:#475569;padding:0 4px;">…</span>`
        : `<button class="page-btn ${p === cur ? 'current' : ''}" onclick="app_goPage(${p})">${p}</button>`
    ).join('');
  }

  window.app_goPage = function (p) {
    state.tablePage = p;
    renderTable();
  };

  // ── Training Tab ─────────────────────────────────────────────
  function renderTrainingTab() {
    updateTrainingUI();
  }

  function updateTrainingUI() {
    const isClass = state.modelMode === 'classification';
    $('train-class-info').classList.toggle('hidden', !isClass);
    $('train-reg-info').classList.toggle('hidden', isClass);

    // Show existing results if available
    if (isClass && state.classResults) {
      showClassificationResults(state.classResults);
    } else if (!isClass && state.regResults) {
      showRegressionResults(state.regResults);
    } else {
      $('training-results').classList.add('hidden');
    }
  }

  async function startTraining() {
    if (state.isTraining) return;
    state.isTraining = true;

    const mode     = state.modelMode;
    const epochs   = parseInt($('epochs-input').value) || 50;
    const lr       = parseFloat($('lr-input').value) || 0.001;
    const batchSz  = parseInt($('batch-input').value) || 32;

    // Show training status
    const statusEl   = $('training-status');
    const epochEl    = $('epoch-status');
    const lossEl     = $('loss-status');
    const accEl      = $('acc-status');
    const btnTrain   = $('btn-train');

    statusEl.style.display = 'flex';
    btnTrain.disabled = true;
    btnTrain.textContent = '⏳ Training...';

    $('training-results').classList.remove('hidden');
    $('training-results').innerHTML = `
      <div class="card mb-lg">
        <div class="flex items-center justify-between mb-md">
          <h3 style="font-size:0.9rem; font-weight:700; color:var(--text-primary);">📈 Training Curve</h3>
          <span id="live-metric" style="font-size:0.75rem; color:var(--text-accent); font-family:var(--font-mono);"></span>
        </div>
        <div class="chart-container" style="height:280px;">
          <canvas id="chart-training-curve"></canvas>
        </div>
      </div>`;

    const onTrainBegin = () => {
      epochEl.textContent = `Epoch 0/${epochs}`;
      lossEl.textContent  = 'Loss: —';
      if (accEl) accEl.textContent = '';
    };

    const onEpochEnd = async (epoch, logs, history) => {
      epochEl.textContent = `Epoch ${epoch}/${epochs}`;
      const isClass = mode === 'classification';
      const acc     = isClass
        ? ((logs.acc || logs.accuracy || 0) * 100).toFixed(1) + '% acc'
        : `MAE: ${(logs.mae || 0).toFixed(4)}`;
      lossEl.textContent = `Loss: ${logs.loss.toFixed(4)}`;

      const liveEl = $('live-metric');
      if (liveEl) liveEl.textContent = `Epoch ${epoch}/${epochs} • ${acc}`;

      Charts.updateTrainingCurve('chart-training-curve', history, mode);
      await tf.nextFrame();
    };

    try {
      if (mode === 'classification') {
        const results = await MLModel.trainClassification({
          epochs, batchSize: batchSz, onTrainBegin, onEpochEnd,
          onTrainEnd: r => {
            state.classResults = r;
            showClassificationResults(r);
          },
        });
      } else {
        const results = await MLModel.trainRegression({
          epochs, batchSize: batchSz, onTrainBegin, onEpochEnd,
          onTrainEnd: r => {
            state.regResults = r;
            showRegressionResults(r);
          },
        });
      }
    } catch (err) {
      console.error('Training error:', err);
      alert('Training failed: ' + err.message);
    }

    statusEl.style.display = 'none';
    btnTrain.disabled = false;
    btnTrain.textContent = '🚀 Train Model';
    state.isTraining = false;

    // Update predict tab trained status
    updatePredictStatus();
  }

  function showClassificationResults(results) {
    const container = $('training-results');
    if (!container) return;

    const acc = (results.finalAcc * 100).toFixed(1);

    // Append results after the training curve card
    let resultsHTML = container.querySelector('.results-metrics');
    if (!resultsHTML) {
      const div = document.createElement('div');
      div.className = 'results-metrics';
      container.appendChild(div);
      resultsHTML = div;
    }

    resultsHTML.innerHTML = `
      <div class="grid-2 mt-lg">
        <div class="card">
          <h3 style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:var(--space-md);">
            🎯 Classification Metrics
          </h3>
          <div class="metric-row">
            <span class="metric-row-label">Validation Accuracy</span>
            <span class="metric-row-value" style="color:#10b981;">${acc}%</span>
          </div>
          <div class="metric-row">
            <span class="metric-row-label">Final Val Loss</span>
            <span class="metric-row-value">${results.history.valLoss.at(-1)?.toFixed(4) ?? '—'}</span>
          </div>
          <div class="metric-row">
            <span class="metric-row-label">Train Accuracy</span>
            <span class="metric-row-value">${((results.history.accuracy.at(-1) || 0) * 100).toFixed(1)}%</span>
          </div>
          <div class="metric-row">
            <span class="metric-row-label">Epochs Trained</span>
            <span class="metric-row-value">${results.history.loss.length}</span>
          </div>
        </div>
        <div class="card">
          <h3 style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:var(--space-md);">
            📊 Per-class Accuracy
          </h3>
          <div class="chart-container" style="height:180px;">
            <canvas id="chart-class-accuracy"></canvas>
          </div>
        </div>
      </div>
      <div class="card mt-lg">
        <h3 style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:var(--space-md);">
          🔢 Confusion Matrix (Test Set)
        </h3>
        <div id="confusion-matrix-container"></div>
        <p style="font-size:0.72rem;color:var(--text-muted);margin-top:var(--space-sm);text-align:center;">
          Rows = True Labels, Columns = Predicted Labels. Blue = correct, Red = misclassification.
        </p>
      </div>`;

    setTimeout(() => {
      Charts.drawClassAccuracy('chart-class-accuracy', results.classAccuracy);
      Charts.drawConfusionMatrix('confusion-matrix-container', results.cm);
    }, 50);
  }

  function showRegressionResults(results) {
    const container = $('training-results');
    if (!container) return;

    let resultsHTML = container.querySelector('.results-metrics');
    if (!resultsHTML) {
      const div = document.createElement('div');
      div.className = 'results-metrics';
      container.appendChild(div);
      resultsHTML = div;
    }

    resultsHTML.innerHTML = `
      <div class="grid-3 mt-lg">
        <div class="card text-center">
          <div class="metric-icon purple" style="margin:0 auto var(--space-sm);">📉</div>
          <div class="metric-value" style="font-size:1.6rem;">${results.mae.toFixed(4)}</div>
          <div class="metric-label">Mean Absolute Error (GPA)</div>
        </div>
        <div class="card text-center">
          <div class="metric-icon cyan" style="margin:0 auto var(--space-sm);">📐</div>
          <div class="metric-value" style="font-size:1.6rem;">${results.rmse.toFixed(4)}</div>
          <div class="metric-label">RMSE</div>
        </div>
        <div class="card text-center">
          <div class="metric-icon green" style="margin:0 auto var(--space-sm);">📈</div>
          <div class="metric-value" style="font-size:1.6rem;">${results.r2.toFixed(4)}</div>
          <div class="metric-label">R² Score</div>
        </div>
      </div>
      <div class="card mt-lg">
        <div class="metric-row">
          <span class="metric-row-label">Final Validation Loss (MSE)</span>
          <span class="metric-row-value">${results.finalLoss?.toFixed(6) ?? '—'}</span>
        </div>
        <div class="metric-row">
          <span class="metric-row-label">Final Val MAE</span>
          <span class="metric-row-value">${results.history.valMae?.at(-1)?.toFixed(4) ?? '—'}</span>
        </div>
        <div class="metric-row">
          <span class="metric-row-label">Interpretation (MAE)</span>
          <span class="metric-row-value" style="color:#10b981;">
            ±${(results.mae).toFixed(3)} GPA points on average
          </span>
        </div>
      </div>`;
  }

  // ── Metrics Tab ──────────────────────────────────────────────
  function renderMetricsTab() {
    // Dataset overview charts (always available)
    setTimeout(() => {
      Charts.drawFeatureImportance('chart-metrics-corr');
    }, 100);

    updateMetricsResults();
  }

  function updateMetricsResults() {
    const hasClass = MLModel.hasClassModel();
    const hasReg   = MLModel.hasRegModel();

    $('metrics-class-section').classList.toggle('hidden', !hasClass);
    $('metrics-reg-section').classList.toggle('hidden', !hasReg);
    $('metrics-untrained').classList.toggle('hidden', hasClass || hasReg);

    if (hasClass && state.classResults) {
      const r   = state.classResults;
      const acc = (r.finalAcc * 100).toFixed(1);
      $('mtr-accuracy').textContent   = acc + '%';
      $('mtr-val-loss').textContent   = r.history.valLoss.at(-1)?.toFixed(4) ?? '—';
      $('mtr-epochs').textContent     = r.history.loss.length;
      $('mtr-train-acc').textContent  = ((r.history.accuracy.at(-1) || 0) * 100).toFixed(1) + '%';
      Charts.drawConfusionMatrix('metrics-cm', r.cm);
      setTimeout(() => Charts.drawClassAccuracy('metrics-class-acc', r.classAccuracy), 80);
    }

    if (hasReg && state.regResults) {
      const r = state.regResults;
      $('mtr-mae').textContent  = r.mae.toFixed(4);
      $('mtr-rmse').textContent = r.rmse.toFixed(4);
      $('mtr-r2').textContent   = r.r2.toFixed(4);
      $('mtr-mse').textContent  = r.finalLoss?.toFixed(6) ?? '—';
    }
  }

  // ── Prediction ───────────────────────────────────────────────
  function updatePredictStatus() {
    const hasClass = MLModel.hasClassModel();
    const hasReg   = MLModel.hasRegModel();
    const badge    = $('predict-model-status');
    if (!badge) return;

    if (hasClass && hasReg) {
      badge.textContent = '✅ Both Models Ready';
      badge.style.color = '#10b981';
    } else if (hasClass) {
      badge.textContent = '⚠️ Classification Only';
      badge.style.color = '#f59e0b';
    } else if (hasReg) {
      badge.textContent = '⚠️ Regression Only';
      badge.style.color = '#f59e0b';
    } else {
      badge.textContent = '❌ No Models Trained';
      badge.style.color = '#ef4444';
    }
  }

  async function handlePredict(e) {
    e.preventDefault();

    if (!MLModel.hasClassModel() && !MLModel.hasRegModel()) {
      alert('Please train at least one model first! Go to the Training tab.');
      return;
    }

    const raw = {
      studyHours:       parseFloat($('p-studyhours').value),
      attendance:       parseFloat($('p-attendance').value),
      prevGPA:          parseFloat($('p-prevgpa').value),
      assignmentScore:  parseFloat($('p-assignment').value),
      midtermScore:     parseFloat($('p-midterm').value),
      tutoringSessions: parseFloat($('p-tutoring').value),
      sleepHours:       parseFloat($('p-sleep').value),
      extracurricular:  parseFloat($('p-extra').value),
      partTimeJob:      $('p-parttime').value === '1',
      incomeLevel:      parseInt($('p-income').value),
    };

    const resultEl = $('prediction-result');
    resultEl.classList.remove('visible');
    resultEl.innerHTML = `
      <div style="padding:var(--space-xl);">
        <div class="training-spinner" style="margin:0 auto;"></div>
        <p style="color:var(--text-secondary);margin-top:var(--space-md);font-size:0.85rem;">Analyzing student profile…</p>
      </div>`;
    resultEl.classList.add('visible');

    try {
      const res = await MLModel.predict(raw);
      renderPredictionResult(res, raw);
    } catch (err) {
      console.error('Prediction error:', err);
      resultEl.innerHTML = `<p style="color:#ef4444;">Prediction failed: ${err.message}</p>`;
    }
  }

  function renderPredictionResult(res, raw) {
    const resultEl = $('prediction-result');
    const gradeColors = Charts.GRADE_COLORS;
    const grade     = res.grade || '?';
    const gpa       = res.gpa  !== undefined ? res.gpa.toFixed(2) : '—';
    const passFail  = res.passFail || '—';
    const color     = gradeColors[grade] || '#6366f1';

    const gpaNum    = parseFloat(gpa);
    const gpaBar    = isNaN(gpaNum) ? 0 : (gpaNum / 4) * 100;

    let confHTML = '';
    if (res.gradeProbs) {
      confHTML = `
        <div style="margin-top:var(--space-lg);text-align:left;">
          <p style="font-size:0.75rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--space-sm);">
            Grade Probability Distribution
          </p>
          <div id="confidence-bars-inner"></div>
        </div>`;
    }

    resultEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-md);">
        <div class="result-grade-badge" style="background:${color}22;color:${color};border:2px solid ${color};">
          ${grade}
        </div>
        <div>
          <div class="result-gpa">${gpa}</div>
          <div class="result-label">Predicted GPA</div>
        </div>
        <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;justify-content:center;">
          <span class="badge badge-${grade.toLowerCase()}" style="font-size:0.8rem;padding:0.4rem 1rem;">
            Grade ${grade}
          </span>
          <span class="badge badge-${passFail.toLowerCase()}" style="font-size:0.8rem;padding:0.4rem 1rem;">
            ${passFail}
          </span>
          ${res.confidence ? `<span class="badge" style="background:rgba(99,102,241,0.15);color:#818cf8;font-size:0.8rem;padding:0.4rem 1rem;">
            ${(res.confidence * 100).toFixed(1)}% Confidence
          </span>` : ''}
        </div>

        <div style="width:100%;max-width:400px;">
          <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:4px;text-align:left;">GPA Gauge</div>
          <div class="progress-bar-wrapper" style="height:12px;">
            <div class="progress-bar-fill" style="width:${gpaBar}%;background:${color};"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:var(--text-muted);margin-top:3px;">
            <span>0.0</span><span>1.0</span><span>2.0</span><span>3.0</span><span>4.0</span>
          </div>
        </div>

        ${confHTML}

        <div style="width:100%;max-width:500px;text-align:left;margin-top:var(--space-md);">
          <p style="font-size:0.75rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--space-sm);">
            Input Summary
          </p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.75rem;">
            ${Object.entries({
              'Study Hours': raw.studyHours + 'h/wk',
              'Attendance': raw.attendance + '%',
              'Prev. GPA': raw.prevGPA.toFixed(2),
              'Assignment': raw.assignmentScore + '%',
              'Midterm': raw.midtermScore + '%',
              'Tutoring': raw.tutoringSessions,
              'Sleep': raw.sleepHours + 'h/night',
              'Extracurricular': raw.extracurricular,
              'Part-time Job': raw.partTimeJob ? 'Yes' : 'No',
              'Income': ['Low','Mid','High'][raw.incomeLevel],
            }).map(([k, v]) => `
              <div style="display:flex;justify-content:space-between;padding:4px 8px;background:rgba(255,255,255,0.03);border-radius:4px;">
                <span style="color:var(--text-secondary);">${k}</span>
                <span style="color:var(--text-primary);font-weight:600;">${v}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>`;

    // Render confidence bars after DOM update
    if (res.gradeProbs) {
      setTimeout(() => Charts.drawConfidenceBars('confidence-bars-inner', res.gradeProbs), 50);
    }

    resultEl.classList.add('visible');
  }

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', init);
})();
