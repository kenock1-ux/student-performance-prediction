/**
 * charts.js — Chart.js Visualization Helpers
 * All chart instances managed here; call update() to refresh.
 */

const Charts = (() => {
  'use strict';

  // Shared color palette
  const GRADE_COLORS = {
    A: '#10b981',
    B: '#3b82f6',
    C: '#f59e0b',
    D: '#f97316',
    F: '#ef4444',
  };

  const PALETTE = [
    '#6366f1','#8b5cf6','#06b6d4','#10b981',
    '#f59e0b','#ef4444','#ec4899','#14b8a6',
    '#f97316','#84cc16',
  ];

  // Active chart instances
  const instances = {};

  // ── Helpers ────────────────────────────────────────────────
  function destroyIfExists(id) {
    if (instances[id]) {
      instances[id].destroy();
      delete instances[id];
    }
  }

  function baseOptions(overrides = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 11 },
            padding: 16,
            boxWidth: 12,
            boxHeight: 12,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15,22,40,0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(99,102,241,0.3)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
          grid:  { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
          grid:  { color: 'rgba(255,255,255,0.06)' },
        },
      },
      ...overrides,
    };
  }

  // ── 1. GPA Distribution Histogram ──────────────────────────
  function drawGPADistribution(canvasId) {
    const { labels, counts } = DataModule.getGPADistribution(20);
    destroyIfExists(canvasId);

    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const gradientColors = counts.map((_, i) => {
      const t = i / counts.length;
      const r = Math.round(99  + (6  - 99)  * t);
      const g = Math.round(102 + (182 - 102) * t);
      const b = Math.round(241 + (212 - 241) * t);
      return `rgb(${r},${g},${b})`;
    });

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Student Count',
          data: counts,
          backgroundColor: gradientColors,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: baseOptions({
        plugins: {
          ...baseOptions().plugins,
          legend: { display: false },
          title: {
            display: false,
          },
        },
        scales: {
          x: {
            ...baseOptions().scales.x,
            title: {
              display: true,
              text: 'GPA',
              color: '#94a3b8',
              font: { family: 'Inter', size: 11 },
            },
          },
          y: {
            ...baseOptions().scales.y,
            title: {
              display: true,
              text: 'Number of Students',
              color: '#94a3b8',
              font: { family: 'Inter', size: 11 },
            },
          },
        },
      }),
    });
  }

  // ── 2. Grade Distribution Pie ───────────────────────────────
  function drawGradeDistribution(canvasId) {
    const stats = DataModule.computeStats();
    destroyIfExists(canvasId);

    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const grades  = Object.keys(stats.gradeCounts);
    const counts  = Object.values(stats.gradeCounts);
    const colors  = grades.map(g => GRADE_COLORS[g]);
    const borders = colors.map(c => c + '80');

    instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: grades.map(g => `Grade ${g}`),
        datasets: [{
          data: counts,
          backgroundColor: colors.map(c => c + '99'),
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 11 },
              padding: 12,
              boxWidth: 12,
              boxHeight: 12,
            },
          },
          tooltip: baseOptions().plugins.tooltip,
        },
      },
    });
  }

  // ── 3. Training Loss / Accuracy Curve ──────────────────────
  function drawTrainingCurve(canvasId, history, mode = 'classification') {
    destroyIfExists(canvasId);

    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = history.loss.map((_, i) => i + 1);
    const isClass = mode === 'classification';

    const datasets = [
      {
        label: 'Train Loss',
        data: history.loss,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Val Loss',
        data: history.valLoss,
        borderColor: '#06b6d4',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 3],
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ];

    if (isClass && history.accuracy) {
      datasets.push({
        label: 'Train Accuracy',
        data: history.accuracy,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        yAxisID: 'y2',
      });
      datasets.push({
        label: 'Val Accuracy',
        data: history.valAccuracy,
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 3],
        tension: 0.4,
        pointRadius: 0,
        yAxisID: 'y2',
      });
    }

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: baseOptions().plugins,
        scales: {
          x: {
            ...baseOptions().scales.x,
            title: {
              display: true,
              text: 'Epoch',
              color: '#94a3b8',
              font: { family: 'Inter', size: 11 },
            },
          },
          y: {
            ...baseOptions().scales.y,
            title: {
              display: true,
              text: 'Loss',
              color: '#94a3b8',
              font: { family: 'Inter', size: 11 },
            },
          },
          ...(isClass ? {
            y2: {
              position: 'right',
              min: 0, max: 1,
              ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
              grid: { display: false },
              title: {
                display: true,
                text: 'Accuracy',
                color: '#94a3b8',
                font: { family: 'Inter', size: 11 },
              },
            },
          } : {}),
        },
      },
    });
  }

  // Update training curve with live data
  function updateTrainingCurve(canvasId, history, mode = 'classification') {
    if (!instances[canvasId]) {
      drawTrainingCurve(canvasId, history, mode);
      return;
    }
    const chart = instances[canvasId];
    const labels = history.loss.map((_, i) => i + 1);
    const isClass = mode === 'classification';

    chart.data.labels = labels;
    chart.data.datasets[0].data = history.loss;
    chart.data.datasets[1].data = history.valLoss;

    if (isClass && history.accuracy) {
      if (chart.data.datasets[2]) chart.data.datasets[2].data = history.accuracy;
      if (chart.data.datasets[3]) chart.data.datasets[3].data = history.valAccuracy;
    }

    chart.update('none'); // no animation for live updates
  }

  // ── 4. Confusion Matrix Heatmap ─────────────────────────────
  function drawConfusionMatrix(containerId, cm) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const labels = DataModule.GRADE_LABELS;
    const n = labels.length;

    // Find max for color scaling
    const allVals = cm.flat();
    const maxVal  = Math.max(...allVals, 1);

    let html = `
      <div style="overflow-x:auto;">
        <table style="border-collapse:separate; border-spacing:3px; margin:0 auto;">
          <thead>
            <tr>
              <th style="padding:6px 10px; color:#475569; font-size:0.7rem;">True↓ Pred→</th>
              ${labels.map(l => `<th style="padding:6px 12px; color:#818cf8; font-size:0.72rem; font-weight:700;">${l}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    cm.forEach((row, ri) => {
      html += `<tr><td style="padding:6px 10px; color:#818cf8; font-size:0.72rem; font-weight:700;">${labels[ri]}</td>`;
      row.forEach((val, ci) => {
        const intensity = val / maxVal;
        const isDiag    = ri === ci;
        const bg = isDiag
          ? `rgba(99,102,241,${0.15 + intensity * 0.7})`
          : `rgba(239,68,68,${intensity * 0.5})`;
        const textColor = intensity > 0.3 ? '#f1f5f9' : '#94a3b8';
        html += `
          <td style="
            padding:8px 14px;
            background:${bg};
            color:${textColor};
            border-radius:6px;
            font-family:'JetBrains Mono',monospace;
            font-size:0.8rem;
            font-weight:${isDiag ? '700' : '400'};
            text-align:center;
            transition:transform 0.2s;
            cursor:default;
          " title="True: ${labels[ri]}, Pred: ${labels[ci]}, Count: ${val}">${val}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  // ── 5. Feature Importance / Correlation Chart ───────────────
  function drawFeatureImportance(canvasId) {
    const corrs = DataModule.getFeatureCorrelations();
    destroyIfExists(canvasId);

    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = corrs.map(c => c.label);
    const values = corrs.map(c => parseFloat(c.r.toFixed(3)));
    const colors = values.map(v => v >= 0 ? 'rgba(99,102,241,0.8)' : 'rgba(239,68,68,0.8)');
    const borders = values.map(v => v >= 0 ? '#6366f1' : '#ef4444');

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Correlation with GPA',
          data: values,
          backgroundColor: colors,
          borderColor: borders,
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        ...baseOptions(),
        indexAxis: 'y',
        plugins: {
          ...baseOptions().plugins,
          legend: { display: false },
          tooltip: {
            ...baseOptions().plugins.tooltip,
            callbacks: {
              label: ctx => ` Correlation: ${ctx.raw.toFixed(3)}`,
            },
          },
        },
        scales: {
          x: {
            ...baseOptions().scales.x,
            min: -1, max: 1,
            title: {
              display: true,
              text: 'Pearson Correlation Coefficient',
              color: '#94a3b8',
              font: { family: 'Inter', size: 11 },
            },
          },
          y: {
            ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
        },
      },
    });
  }

  // ── 6. Prediction Confidence Bars ──────────────────────────
  function drawConfidenceBars(containerId, probs) {
    const container = document.getElementById(containerId);
    if (!container || !probs) return;

    const labels = DataModule.GRADE_LABELS;
    const colors = labels.map(l => GRADE_COLORS[l]);
    const maxIdx = probs.indexOf(Math.max(...probs));

    let html = '<div class="confidence-list">';
    labels.forEach((g, i) => {
      const pct = (probs[i] * 100).toFixed(1);
      const isTop = i === maxIdx;
      html += `
        <div class="confidence-item">
          <span class="confidence-label" style="color:${colors[i]};${isTop ? 'transform:scale(1.1);' : ''}">${g}</span>
          <div class="confidence-bar-wrap">
            <div class="confidence-bar" style="width:${pct}%; background:${colors[i]}${isTop ? '' : '99'};"></div>
          </div>
          <span class="confidence-pct">${pct}%</span>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // ── 7. Pass/Fail Distribution ───────────────────────────────
  function drawPassFail(canvasId) {
    const stats = DataModule.computeStats();
    destroyIfExists(canvasId);

    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pass', 'Fail'],
        datasets: [{
          data: [stats.passCount, stats.failCount],
          backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'],
          borderColor: ['#10b981', '#ef4444'],
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 11 },
              padding: 12,
            },
          },
          tooltip: baseOptions().plugins.tooltip,
        },
      },
    });
  }

  // ── 8. Per-class Accuracy Bar ───────────────────────────────
  function drawClassAccuracy(canvasId, classAccuracy) {
    destroyIfExists(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = DataModule.GRADE_LABELS;
    const colors = labels.map(l => GRADE_COLORS[l]);

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(g => `Grade ${g}`),
        datasets: [{
          label: 'Per-class Accuracy',
          data: classAccuracy.map(v => parseFloat((v * 100).toFixed(1))),
          backgroundColor: colors.map(c => c + '99'),
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 4,
        }],
      },
      options: {
        ...baseOptions(),
        plugins: {
          ...baseOptions().plugins,
          legend: { display: false },
        },
        scales: {
          ...baseOptions().scales,
          y: {
            ...baseOptions().scales.y,
            min: 0, max: 100,
            title: {
              display: true,
              text: 'Accuracy (%)',
              color: '#94a3b8',
              font: { family: 'Inter', size: 11 },
            },
          },
        },
      },
    });
  }

  return {
    drawGPADistribution,
    drawGradeDistribution,
    drawTrainingCurve,
    updateTrainingCurve,
    drawConfusionMatrix,
    drawFeatureImportance,
    drawConfidenceBars,
    drawPassFail,
    drawClassAccuracy,
    GRADE_COLORS,
  };
})();
