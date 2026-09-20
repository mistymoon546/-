/**
 * chart-power.js — 24시간 전력 조정 차트 (탭 2)
 */

let powerChartInstance = null;

// 계절별 시간대(0~23시) 데이터
const HOURLY_DATA = {
  summer: {
    title: '☀️ 여름 — 시간대별 전력 조정 가능 범위',
    note: '전력 피크 시간대(14~17시) DC 유연 조정 최대화 필요',
    gridLoad: [55,52,50,48,47,48,52,60,70,80,87,90,92,93,95,94,92,88,82,76,72,68,63,58],
    dcBase:   [70,70,68,68,68,68,70,72,75,75,75,75,75,75,75,75,75,75,74,73,72,71,71,70],
    flexDown: [15,15,14,14,14,14,15,16,20,25,28,30,32,35,38,38,36,30,22,18,15,14,13,13],
    flexUp:   [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    color: '#ff9d00',
  },
  winter: {
    title: '❄️ 겨울 — 시간대별 전력 조정 가능 범위',
    note: '야간(22~6시) 잉여 재생에너지 흡수 및 폐열 난방 연계 기회',
    gridLoad: [68,65,63,61,60,62,68,78,85,84,83,82,80,79,78,79,80,82,85,86,84,80,76,72],
    dcBase:   [72,72,70,70,70,70,72,74,76,76,76,76,76,76,76,76,76,76,75,74,73,72,72,72],
    flexDown: [ 8, 8, 8, 8, 8, 8, 8,10,12,12,12,12,12,12,12,12,12,12,10, 8, 8, 8, 8, 8],
    flexUp:   [25,28,30,30,30,28,20,10, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,10,18,22,25,25],
    color: '#87ceeb',
  },
  spring: {
    title: '🌸 봄 — 시간대별 전력 조정 가능 범위',
    note: '황사·미세먼지 외기냉각 효율 저하 주의. 유연성 여유 충분',
    gridLoad: [50,48,46,45,44,45,50,58,65,68,70,71,72,72,71,70,69,68,67,65,62,58,55,52],
    dcBase:   [68,68,66,66,66,66,68,70,72,72,72,72,72,72,72,72,72,72,71,70,70,69,68,68],
    flexDown: [12,12,12,12,12,12,12,14,18,20,22,22,22,22,22,22,22,20,18,16,14,12,12,12],
    flexUp:   [15,15,15,15,15,15,12, 8, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 8,10,12,15,15],
    color: '#ff9dbf',
  },
  autumn: {
    title: '🍂 가을 — 시간대별 전력 조정 가능 범위',
    note: '최적 운영 계절. 외기냉각 적극 활용, 전체 유연성 최대화 가능',
    gridLoad: [48,46,44,43,42,43,48,56,62,65,66,67,67,67,66,65,64,63,62,60,58,55,52,50],
    dcBase:   [65,65,63,63,63,63,65,67,69,69,69,69,69,69,69,69,69,69,68,67,67,66,65,65],
    flexDown: [15,15,15,15,15,15,14,16,20,22,24,24,24,24,24,24,24,22,20,18,16,15,15,15],
    flexUp:   [18,20,22,22,22,20,15,10, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6,10,14,16,18,18],
    color: '#ff6b35',
  },
};

function initPowerChart() {
  const ctx = document.getElementById('powerChart');
  if (!ctx) return;
  renderPowerChart('summer', 3);
}

function renderPowerChart(season, flexLevel) {
  const d = HOURLY_DATA[season];
  const labels = Array.from({length:24}, (_,i) => `${i}시`);

  // flexLevel (1~5) → 유연성 배수
  const flexMul = [0.3, 0.6, 1.0, 1.4, 1.8][flexLevel - 1];

  const flexDownData = d.flexDown.map(v => Math.min(v * flexMul, 50));
  const flexUpData   = d.flexUp.map(v => Math.min(v * flexMul, 30));

  // DC 상한선 / 하한선
  const dcMax = d.dcBase.map((v, i) => Math.min(v + flexUpData[i], 100));
  const dcMin = d.dcBase.map((v, i) => Math.max(v - flexDownData[i], 20));

  if (powerChartInstance) { powerChartInstance.destroy(); }

  powerChartInstance = new Chart(document.getElementById('powerChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '계통 전체 부하 (%)',
          data: d.gridLoad,
          borderColor: '#ff4d6d',
          backgroundColor: 'rgba(255,77,109,0.08)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: false,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: 'DC 기본 소비 (%)',
          data: d.dcBase,
          borderColor: '#4cc9f0',
          backgroundColor: 'rgba(76,201,240,0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          borderDash: [6,3],
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: 'DC 조정 상한 (최대 흡수)',
          data: dcMax,
          borderColor: 'rgba(0,255,140,0.5)',
          backgroundColor: 'rgba(0,255,140,0.08)',
          borderWidth: 1,
          tension: 0.4,
          fill: '+1',
          pointRadius: 0,
        },
        {
          label: 'DC 조정 하한 (최대 감축)',
          data: dcMin,
          borderColor: 'rgba(0,255,140,0.5)',
          backgroundColor: 'rgba(0,255,140,0.12)',
          borderWidth: 1,
          tension: 0.4,
          fill: false,
          pointRadius: 0,
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(5,13,26,0.95)',
          borderColor: 'rgba(0,229,255,0.3)',
          borderWidth: 1,
          titleColor: '#00e5ff',
          bodyColor: '#7fa8cc',
          callbacks: {
            label: ctx => {
              const labels = ['계통 부하', 'DC 기본', 'DC 최대', 'DC 최소'];
              return ` ${labels[ctx.datasetIndex]}: ${Math.round(ctx.raw)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,229,255,0.06)' },
          ticks: { color: '#3d6080', font: { size: 9 }, maxRotation: 0, maxTicksLimit: 12 }
        },
        y: {
          min: 20, max: 105,
          grid: { color: 'rgba(0,229,255,0.06)' },
          ticks: { color: '#3d6080', font: { size: 9 }, callback: v => v + '%' }
        }
      }
    }
  });
}

function updatePowerChart(season, flexLevel) {
  renderPowerChart(season, flexLevel);
  const d = HOURLY_DATA[season];
  document.getElementById('chartTitle').textContent = d.title;
  document.getElementById('chartNote').textContent  = d.note;

  const flexLabels = ['최소 (10~15%)', '낮음 (20~30%)', '보통 (35~45%)', '높음 (50~65%)', '최대 (70~80%)'];
  document.getElementById('flexLevelLabel').textContent = flexLabels[flexLevel - 1];
}

// 계절 버튼 이벤트 (탭2)
let currentMSeason = 'summer';
let currentFlex    = 3;

function initMatrixSeasonBtns() {
  document.querySelectorAll('.mseason-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMSeason = btn.dataset.mseason;
      document.querySelectorAll('.mseason-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePowerChart(currentMSeason, currentFlex);
    });
  });

  const flexSlider = document.getElementById('flexSlider');
  if (flexSlider) {
    flexSlider.addEventListener('input', () => {
      currentFlex = parseInt(flexSlider.value);
      updateSliderGradient(flexSlider);
      updatePowerChart(currentMSeason, currentFlex);
    });
    updateSliderGradient(flexSlider);
  }
}
