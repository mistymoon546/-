/**
 * app.js — 메인 앱 로직 및 UI 업데이트
 */

let currentSeason = 'spring';
let isRunning = false;

// ==================== 초기화 ====================
document.addEventListener('DOMContentLoaded', () => {
  initBackground();
  initMap();
  initSliders();
  initSeasonTabs();
  updateFooterTime();
  setInterval(updateFooterTime, 1000);
  // 첫 시뮬레이션 자동 실행
  setTimeout(runSimulation, 600);
});

// ==================== 슬라이더 바인딩 ====================
function initSliders() {
  bindSlider('tempSlider',    'tempLabel',    v => `${v}°C`);
  bindSlider('coolingSlider', 'coolingLabel', v => COOLING_LABELS[v]);
  bindSlider('noiseSlider',   'noiseLabel',   v => {
    updateNoiseImpact(parseInt(v));
    return `${v} dB`;
  });
  bindSlider('powerSlider',   'powerLabel',   v => {
    updateFooterSize(parseInt(v));
    return `${v} MW`;
  });
  bindSlider('renewSlider',   'renewLabel',   v => `${v}%`);
  bindSlider('popSlider',     'popLabel',     v => POP_LABELS[v]);
  bindSlider('heatSlider',    'heatLabel',    v => HEAT_LABELS[v]);

  // 슬라이더 실시간 점수 반영
  document.querySelectorAll('.ctrl-slider').forEach(slider => {
    slider.addEventListener('input', () => {
      updateSliderGradient(slider);
      debounceSimulation();
    });
    updateSliderGradient(slider);
  });
}

function bindSlider(sliderId, labelId, formatter) {
  const slider = document.getElementById(sliderId);
  const label  = document.getElementById(labelId);
  if (!slider || !label) return;
  const update = () => { label.textContent = formatter(slider.value); };
  slider.addEventListener('input', update);
  update();
}

function updateSliderGradient(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, #00e5ff 0%, #3d8eff ${pct}%, rgba(61,96,128,0.4) ${pct}%)`;
}

let _debounceTimer = null;
function debounceSimulation() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(runSimulation, 300);
}

// ==================== 계절 탭 ====================
function initSeasonTabs() {
  document.querySelectorAll('.season-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSeason = btn.dataset.season;
      document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateSeasonStats();
      runSimulation();
    });
  });
  updateSeasonStats();
}

function updateSeasonStats() {
  const s = SEASON_DATA[currentSeason];
  document.getElementById('statTemp').textContent  = `${s.avgTemp}°C`;
  document.getElementById('statGrid').textContent  = `${s.gridLoad}%`;
  document.getElementById('statWater').textContent = s.waterAvail;
  document.getElementById('statRenew').textContent = `${s.renewOutput}%`;
  document.getElementById('seasonInfo').className  = `season-info-bar season-${currentSeason}`;
  document.getElementById('footerSeason').textContent = s.label;
}

// ==================== 시뮬레이션 실행 ====================
function runSimulation() {
  if (isRunning) return;
  isRunning = true;

  const btn = document.getElementById('runBtn');
  btn.classList.add('running');
  btn.innerHTML = '<span class="run-icon">⏳</span> 분석 중...';

  const params = getParams();

  // 시뮬레이션 (약간의 딜레이로 UX 개선)
  setTimeout(() => {
    const scores = calculateScores(params, currentSeason);
    window._lastScores = scores;

    const checkResults = evaluateChecklist(params, currentSeason);
    const warnings     = generateWarnings(params, currentSeason);
    const ranking      = getRanking(scores);

    // UI 업데이트
    updateMapColors(scores);
    updateChecklist(checkResults);
    updateWarnings(warnings);
    updateRanking(ranking);
    updateNoiseImpact(params.noiseDB);

    // 선택된 지역 상세 업데이트
    if (selectedRegion) showRegionDetail(selectedRegion);

    btn.classList.remove('running');
    btn.innerHTML = '<span class="run-icon">✓</span> 시뮬레이션 완료';
    setTimeout(() => {
      btn.innerHTML = '<span class="run-icon">▶</span> 시뮬레이션 실행';
      isRunning = false;
    }, 1500);
  }, 400);
}

function getParams() {
  return {
    temperature:    parseInt(document.getElementById('tempSlider').value),
    coolingLevel:   parseInt(document.getElementById('coolingSlider').value),
    noiseDB:        parseInt(document.getElementById('noiseSlider').value),
    powerDemand:    parseInt(document.getElementById('powerSlider').value),
    renewRatio:     parseInt(document.getElementById('renewSlider').value),
    popAvoidance:   parseInt(document.getElementById('popSlider').value),
    heatIntegration:parseInt(document.getElementById('heatSlider').value),
  };
}

// ==================== UI 업데이트 함수들 ====================
function updateChecklist(results) {
  const map = {
    temp:  'chkTemp',  noise: 'chkNoise',
    power: 'chkPower', pop:   'chkPop',
    renew: 'chkRenew', heat:  'chkHeat',
  };
  const icons = { checked: '✅', failed: '❌', warning: '⚠️' };
  Object.entries(map).forEach(([key, id]) => {
    const item = document.getElementById(id);
    const res  = results[key];
    if (!item || !res) return;
    item.className = `check-item ${res.status}`;
    item.querySelector('.check-icon').textContent = icons[res.status] || '⬜';
    const desc = item.querySelector('.check-desc');
    if (desc) desc.textContent = res.msg;
  });
}

function updateWarnings(warnings) {
  const container = document.getElementById('warningsContainer');
  if (warnings.length === 0) {
    container.innerHTML = '<div class="no-warnings">⚡ 현재 주요 경고 없음</div>';
    return;
  }
  container.innerHTML = warnings.map((w, i) => `
    <div class="warning-item ${w.level === 'critical' ? 'critical' : 'moderate'}"
         style="animation-delay:${i * 0.08}s">
      ${w.msg}
    </div>
  `).join('');
}

function updateRanking(ranking) {
  const list = document.getElementById('resultsList');
  list.innerHTML = ranking.map((item, idx) => {
    const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
    const color = item.score >= 75 ? '#00ff8c' : item.score >= 55 ? '#00e5ff' : item.score >= 35 ? '#ff9d00' : '#ff3d3d';
    return `
      <div class="result-item" onclick="selectRegion(REGIONS.find(r=>r.id==='${item.region.id}'))"
           style="animation-delay:${idx * 0.07}s">
        <div class="result-rank ${rankClass}">${idx + 1}</div>
        <div class="result-info">
          <div class="result-name">${item.region.name}</div>
          <div class="result-score-bar">
            <div class="result-score-fill" style="width:${item.score}%;background:linear-gradient(90deg,${color}80,${color})"></div>
          </div>
        </div>
        <span class="result-score-num" style="color:${color}">${item.score}</span>
      </div>
    `;
  }).join('');
}

function updateNoiseImpact(db) {
  const radii = calcNoiseRadius(db);
  const impactEl = document.getElementById('noiseImpactText');
  if (!impactEl) return;

  let msg, color;
  if (db >= 85) {
    msg = `반경 ${radii.inhabitable}m 내 거주 불가`;
    color = '#ff3d3d';
  } else if (db >= 75) {
    msg = `반경 ${radii.sleep}m 내 수면 영향`;
    color = '#ff9d00';
  } else if (db >= 65) {
    msg = `반경 ${radii.annoyance}m 내 민원 우려`;
    color = '#ffcc00';
  } else {
    msg = '주거환경 영향 미미';
    color = '#00ff8c';
  }
  impactEl.textContent = msg;
  impactEl.style.color = color;
}

// ==================== 소음 모달 ====================
function openNoiseModal() {
  document.getElementById('noiseModal').style.display = 'flex';
  drawNoiseCanvas();
}

function closeNoiseModal() {
  document.getElementById('noiseModal').style.display = 'none';
}

function drawNoiseCanvas() {
  const canvas = document.getElementById('noiseCanvas');
  const ctx = canvas.getContext('2d');
  const db = parseInt(document.getElementById('noiseSlider').value);
  const radii = calcNoiseRadius(db);

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const scale = 0.35; // 픽셀/미터

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 배경
  ctx.fillStyle = '#050d1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 그리드
  ctx.strokeStyle = 'rgba(0,229,255,0.06)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < canvas.width; x += 20) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 20) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
  }

  // 영향 반경 그리기 (바깥→안쪽)
  const zones = [
    { r: Math.min(radii.annoyance * scale, 185), color: 'rgba(255,204,0,0.15)', stroke: 'rgba(255,204,0,0.5)', label: `민원 구역 ${radii.annoyance}m` },
    { r: Math.min(radii.sleep * scale, 185),     color: 'rgba(255,157,0,0.2)', stroke: 'rgba(255,157,0,0.6)', label: `수면 영향 ${radii.sleep}m` },
    { r: Math.min(radii.inhabitable * scale, 185),color:'rgba(255,61,61,0.25)', stroke: 'rgba(255,61,61,0.7)', label: `거주 불가 ${radii.inhabitable}m` },
  ];

  zones.forEach(z => {
    ctx.beginPath();
    ctx.arc(cx, cy, z.r, 0, Math.PI * 2);
    ctx.fillStyle = z.color;
    ctx.fill();
    ctx.strokeStyle = z.stroke;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 반경 레이블
    ctx.fillStyle = z.stroke;
    ctx.font = '10px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(z.label, cx, cy - z.r - 4);
  });

  // 데이터센터 아이콘 (중앙)
  ctx.fillStyle = 'rgba(0,229,255,0.2)';
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DC', cx, cy);
  ctx.textBaseline = 'alphabetic';

  // 방위 표시
  ctx.fillStyle = 'rgba(0,229,255,0.3)';
  ctx.font = '12px Rajdhani';
  ctx.fillText('N', cx, 16);
  ctx.fillText('S', cx, canvas.height - 8);
  ctx.fillText('W', 12, cy + 4);
  ctx.fillText('E', canvas.width - 12, cy + 4);

  // dB 표시
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 22px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText(`${db} dB`, cx, canvas.height - 22);

  // 수치 업데이트
  document.getElementById('noiseValues').innerHTML = `
    <div class="noise-val-item">
      <span class="noise-val-label">거주 불가 반경</span>
      <span class="noise-val-num" style="color:#ff3d3d">${radii.inhabitable}m</span>
    </div>
    <div class="noise-val-item">
      <span class="noise-val-label">수면 영향 반경</span>
      <span class="noise-val-num" style="color:#ff9d00">${radii.sleep}m</span>
    </div>
    <div class="noise-val-item">
      <span class="noise-val-label">민원 발생 반경</span>
      <span class="noise-val-num" style="color:#ffcc00">${radii.annoyance}m</span>
    </div>
    <div class="noise-val-item">
      <span class="noise-val-label">소음 수준</span>
      <span class="noise-val-num" style="color:#00e5ff">${db < 65 ? '양호' : db < 75 ? '주의' : db < 85 ? '경고' : '위험'}</span>
    </div>
  `;
}

// 소음 슬라이더 변경 시 모달 캔버스도 업데이트
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('noiseSlider').addEventListener('input', () => {
    if (document.getElementById('noiseModal').style.display !== 'none') {
      drawNoiseCanvas();
    }
  });
});

// ==================== 보고서 내보내기 ====================
function exportReport() {
  const params = getParams();
  const scores = window._lastScores || {};
  const ranking = getRanking(scores);
  const season  = SEASON_DATA[currentSeason];
  const checks  = evaluateChecklist(params, currentSeason);
  const warnings = generateWarnings(params, currentSeason);

  const checkIcon = s => s === 'checked' ? '✅' : s === 'failed' ? '❌' : '⚠️';

  let txt = `═══════════════════════════════════════════════════════
   한국형 AI 데이터센터 입지 시뮬레이터 — 결과 보고서
   글로벌 프론티어 · 전력망 유연화 연구
═══════════════════════════════════════════════════════

📅 분석 계절: ${season.label}
🕐 생성 시각: ${new Date().toLocaleString('ko-KR')}

────────────── 입력 조건 ──────────────
• 외기 최고 온도:     ${params.temperature}°C
• 냉각 부하 강도:     ${COOLING_LABELS[params.coolingLevel]}
• 소음 발생 수준:     ${params.noiseDB} dB
• 전력 수요 규모:     ${params.powerDemand} MW
• 재생에너지 비율:    ${params.renewRatio}%
• 인구밀도 회피 강도: ${POP_LABELS[params.popAvoidance]}
• 폐열 활용 연계:     ${HEAT_LABELS[params.heatIntegration]}

────────────── 체크리스트 ──────────────
${checkIcon(checks.temp.status)}  열 환경 관리: ${checks.temp.msg}
${checkIcon(checks.noise.status)}  소음 영향:    ${checks.noise.msg}
${checkIcon(checks.power.status)}  전력 안정성:  ${checks.power.msg}
${checkIcon(checks.pop.status)}  님비 리스크:  ${checks.pop.msg}
${checkIcon(checks.renew.status)}  재생에너지:   ${checks.renew.msg}
${checkIcon(checks.heat.status)}  폐열 활용:    ${checks.heat.msg}

────────────── 지역별 종합 점수 순위 ──────────────
${ranking.map((r, i) => {
  const grade = r.score >= 75 ? '최적' : r.score >= 55 ? '적합' : r.score >= 35 ? '조건부' : '부적합';
  return `  ${i + 1}위. ${r.region.name.padEnd(10)}  ${r.score}점  [${grade}]`;
}).join('\n')}

────────────── 계절별 주의사항 ──────────────
${season.seasonNote}

────────────── 경고 메시지 ──────────────
${warnings.length === 0 ? '현재 주요 경고 없음' : warnings.map(w => `${w.level === 'critical' ? '🔴' : '🟡'}  ${w.msg}`).join('\n')}

────────────── 소음 영향 반경 ──────────────
${(() => { const r = calcNoiseRadius(params.noiseDB); return `거주 불가: ${r.inhabitable}m  |  수면 영향: ${r.sleep}m  |  민원 발생: ${r.annoyance}m`; })()}

═══════════════════════════════════════════════════════
※ 본 결과는 개념적 시뮬레이션으로 실제 입지 결정에는
  법적·기술적 정밀 검토가 반드시 필요합니다.
═══════════════════════════════════════════════════════
`;

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DC_입지분석_${currentSeason}_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== 초기화 ====================
function resetAll() {
  document.getElementById('tempSlider').value    = 33;
  document.getElementById('coolingSlider').value = 3;
  document.getElementById('noiseSlider').value   = 75;
  document.getElementById('powerSlider').value   = 200;
  document.getElementById('renewSlider').value   = 30;
  document.getElementById('popSlider').value     = 3;
  document.getElementById('heatSlider').value    = 0;

  document.querySelectorAll('.ctrl-slider').forEach(s => {
    updateSliderGradient(s);
  });
  initSliders();
  currentSeason = 'spring';
  document.querySelectorAll('.season-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.season === 'spring');
  });
  updateSeasonStats();
  runSimulation();
}

function updateFooterTime() {
  const now = new Date();
  const el = document.getElementById('footerTime');
  if (el) el.textContent = now.toLocaleTimeString('ko-KR');
}

function updateFooterSize(mw) {
  const sizeEl = document.getElementById('footerSize');
  if (!sizeEl) return;
  sizeEl.textContent = mw <= 100 ? '소형' : mw <= 200 ? '중형' : mw <= 350 ? '대형' : '초대형';
}

// 키보드 단축키
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeNoiseModal();
  if (e.key === ' ' && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    runSimulation();
  }
});
