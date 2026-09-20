/**
 * app.js v2.0 — 탭 전환 + 모든 모듈 통합 오케스트레이터
 */

let currentSeason = 'spring';
let isRunning = false;
let selectedRegion = null; // map.js와 공유

// ==================== 앱 초기화 ====================
document.addEventListener('DOMContentLoaded', () => {
  initBackground();
  initMap();
  initSliders();
  initSeasonTabs();
  initTabNavigation();
  initMatrix();
  initDecision();
  initComparison();
  updateFooterTime();
  setInterval(updateFooterTime, 1000);
  // 첫 시뮬레이션 자동 실행
  setTimeout(runSimulation, 500);
});

// ==================== 탭 내비게이션 ====================
function initTabNavigation() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tabId));
  // 탭 전환 시 차트 리사이즈
  if (tabId === 'tab-matrix' && powerChartInstance) {
    setTimeout(() => powerChartInstance.resize(), 100);
  }
}

// ==================== 슬라이더 바인딩 ====================
function initSliders() {
  bindSlider('tempSlider',    'tempLabel',    v => `${v}°C`);
  bindSlider('coolingSlider', 'coolingLabel', v => COOLING_LABELS[v]);
  bindSlider('noiseSlider',   'noiseLabel',   v => {
    updateNoiseImpact(parseInt(v));
    return `${v} dB`;
  });
  bindSlider('powerSlider',   'powerLabel',   v => `${v} MW`);
  bindSlider('renewSlider',   'renewLabel',   v => `${v}%`);
  bindSlider('popSlider',     'popLabel',     v => POP_LABELS[v]);
  bindSlider('heatSlider',    'heatLabel',    v => HEAT_LABELS[v]);

  document.querySelectorAll('#tab-site .ctrl-slider').forEach(slider => {
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
  const min = parseFloat(slider.min), max = parseFloat(slider.max), val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right,#00e5ff 0%,#3d8eff ${pct}%,rgba(61,96,128,0.4) ${pct}%)`;
}

let _debounceTimer = null;
function debounceSimulation() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(runSimulation, 350);
}

// ==================== 계절 탭 (탭1) ====================
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
  document.getElementById('statTemp') .textContent = `${s.avgTemp}°C`;
  document.getElementById('statGrid') .textContent = `${s.gridLoad}%`;
  document.getElementById('statWater').textContent = s.waterAvail;
  document.getElementById('statRenew').textContent = `${s.renewOutput}%`;
}

// ==================== 시뮬레이션 실행 ====================
function runSimulation() {
  if (isRunning) return;
  isRunning = true;
  const btn = document.getElementById('runBtn');
  if (btn) { btn.classList.add('running'); btn.innerHTML = '<span class="run-icon">⏳</span> 분석 중...'; }

  const params = getParams();
  setTimeout(() => {
    const scores      = calculateScores(params, currentSeason);
    window._lastScores = scores;
    const checkResults = evaluateChecklist(params, currentSeason);
    const warnings     = generateWarnings(params, currentSeason);
    const ranking      = getRanking(scores);

    updateMapColors(scores);
    updateChecklist(checkResults);
    updateWarnings(warnings);
    updateRanking(ranking);
    updateNoiseImpact(params.noiseDB);
    if (selectedRegion) showRegionDetail(selectedRegion);

    if (btn) {
      btn.classList.remove('running');
      btn.innerHTML = '<span class="run-icon">✓</span> 완료';
      setTimeout(() => {
        btn.innerHTML = '<span class="run-icon">▶</span> 시뮬레이션 실행';
        isRunning = false;
      }, 1500);
    } else { isRunning = false; }
  }, 350);
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

// ==================== UI 업데이트 ====================
function updateChecklist(results) {
  const map = { temp:'chkTemp', noise:'chkNoise', power:'chkPower', pop:'chkPop', renew:'chkRenew', heat:'chkHeat' };
  const icons = { checked:'✅', failed:'❌', warning:'⚠️' };
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
  if (!container) return;
  if (warnings.length === 0) { container.innerHTML = '<div class="no-warnings">⚡ 경고 없음</div>'; return; }
  container.innerHTML = warnings.map((w, i) => `
    <div class="warning-item ${w.level === 'critical' ? 'critical' : 'moderate'}" style="animation-delay:${i*0.08}s">
      ${w.msg}
    </div>`).join('');
}

function updateRanking(ranking) {
  const list = document.getElementById('resultsList');
  if (!list) return;
  list.innerHTML = ranking.map((item, idx) => {
    const rankClass = idx===0?'rank-1':idx===1?'rank-2':idx===2?'rank-3':'rank-other';
    const color = item.score>=75?'#00ff8c':item.score>=55?'#00e5ff':item.score>=35?'#ff9d00':'#ff3d3d';
    return `
      <div class="result-item" onclick="selectRegion(REGIONS.find(r=>r.id==='${item.region.id}'))" style="animation-delay:${idx*0.07}s">
        <div class="result-rank ${rankClass}">${idx+1}</div>
        <div class="result-info">
          <div class="result-name">${item.region.name}</div>
          <div class="result-score-bar"><div class="result-score-fill" style="width:${item.score}%;background:linear-gradient(90deg,${color}80,${color})"></div></div>
        </div>
        <span class="result-score-num" style="color:${color}">${item.score}</span>
      </div>`;
  }).join('');
}

function updateNoiseImpact(db) {
  const radii = calcNoiseRadius(db);
  const el = document.getElementById('noiseImpactText');
  if (!el) return;
  let msg, color;
  if (db >= 85) { msg = `반경 ${radii.inhabitable}m 내 거주 불가`; color = '#ff3d3d'; }
  else if (db >= 75) { msg = `반경 ${radii.sleep}m 내 수면 영향`; color = '#ff9d00'; }
  else if (db >= 65) { msg = `반경 ${radii.annoyance}m 내 민원 우려`; color = '#ffcc00'; }
  else { msg = '영향 미미'; color = '#00ff8c'; }
  el.textContent = msg; el.style.color = color;
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
  const cx = canvas.width/2, cy = canvas.height/2, scale = 0.32;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#050d1a'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='rgba(0,229,255,0.06)'; ctx.lineWidth=0.5;
  for(let x=0;x<canvas.width;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
  for(let y=0;y<canvas.height;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
  const zones = [
    {r:Math.min(radii.annoyance*scale,175),color:'rgba(255,204,0,0.14)',stroke:'rgba(255,204,0,0.5)',label:`민원 ${radii.annoyance}m`},
    {r:Math.min(radii.sleep*scale,175),    color:'rgba(255,157,0,0.18)',stroke:'rgba(255,157,0,0.6)', label:`수면 ${radii.sleep}m`},
    {r:Math.min(radii.inhabitable*scale,175),color:'rgba(255,61,61,0.22)',stroke:'rgba(255,61,61,0.7)',label:`거주불가 ${radii.inhabitable}m`},
  ];
  zones.forEach(z=>{
    ctx.beginPath(); ctx.arc(cx,cy,z.r,0,Math.PI*2); ctx.fillStyle=z.color; ctx.fill();
    ctx.strokeStyle=z.stroke; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=z.stroke; ctx.font='10px Rajdhani'; ctx.textAlign='center'; ctx.fillText(z.label,cx,cy-z.r-4);
  });
  ctx.fillStyle='rgba(0,229,255,0.18)'; ctx.strokeStyle='#00e5ff'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(cx,cy,13,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#00e5ff'; ctx.font='bold 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('DC',cx,cy); ctx.textBaseline='alphabetic';
  ctx.fillStyle='rgba(0,229,255,0.3)'; ctx.font='11px Rajdhani';
  ctx.fillText('N',cx,14); ctx.fillText('S',cx,canvas.height-6);
  ctx.fillText('W',12,cy+4); ctx.fillText('E',canvas.width-12,cy+4);
  ctx.fillStyle='#00e5ff'; ctx.font='bold 20px Rajdhani'; ctx.textAlign='center';
  ctx.fillText(`${db} dB`,cx,canvas.height-20);
  document.getElementById('noiseValues').innerHTML = `
    <div class="noise-val-item"><span class="noise-val-label">거주 불가</span><span class="noise-val-num" style="color:#ff3d3d">${radii.inhabitable}m</span></div>
    <div class="noise-val-item"><span class="noise-val-label">수면 영향</span><span class="noise-val-num" style="color:#ff9d00">${radii.sleep}m</span></div>
    <div class="noise-val-item"><span class="noise-val-label">민원 발생</span><span class="noise-val-num" style="color:#ffcc00">${radii.annoyance}m</span></div>
    <div class="noise-val-item"><span class="noise-val-label">위험도</span><span class="noise-val-num" style="color:#00e5ff">${db<65?'양호':db<75?'주의':db<85?'경고':'위험'}</span></div>
  `;
}
document.addEventListener('DOMContentLoaded', () => {
  const ns = document.getElementById('noiseSlider');
  if (ns) ns.addEventListener('input', () => {
    if (document.getElementById('noiseModal').style.display !== 'none') drawNoiseCanvas();
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
  const chkIcon = s => s==='checked'?'✅':s==='failed'?'❌':'⚠️';

  const txt = `
══════════════════════════════════════════════════════════
  Korean Grid-Interactive DC Seasonal Operation Matrix
  한국형 계통연계형 데이터센터 계절별 운영 매트릭스
  글로벌 프론티어 연구팀
══════════════════════════════════════════════════════════

📅 분석 계절: ${season.label}
🕐 생성 시각: ${new Date().toLocaleString('ko-KR')}

────────── 입력 조건 ──────────
• 외기 최고 온도:  ${params.temperature}°C
• 냉각 부하 강도: ${COOLING_LABELS[params.coolingLevel]}
• 소음 수준:       ${params.noiseDB} dB
• 전력 수요:       ${params.powerDemand} MW
• 재생에너지:      ${params.renewRatio}%
• 인구 회피:       ${POP_LABELS[params.popAvoidance]}
• 폐열 연계:       ${HEAT_LABELS[params.heatIntegration]}

────────── 체크리스트 ──────────
${chkIcon(checks.temp.status)}  열 환경:    ${checks.temp.msg}
${chkIcon(checks.noise.status)}  소음:       ${checks.noise.msg}
${chkIcon(checks.power.status)}  전력:       ${checks.power.msg}
${chkIcon(checks.pop.status)}  님비:       ${checks.pop.msg}
${chkIcon(checks.renew.status)}  재생에너지: ${checks.renew.msg}
${chkIcon(checks.heat.status)}  폐열:       ${checks.heat.msg}

────────── 지역 적합도 순위 ──────────
${ranking.map((r,i)=>{
  const g=r.score>=75?'최적':r.score>=55?'적합':r.score>=35?'조건부':'부적합';
  return `  ${i+1}위. ${r.region.name.padEnd(10)}  ${r.score}점  [${g}]`;
}).join('\n')}

────────── 계절 주의사항 ──────────
${season.seasonNote}

────────── 경고 ──────────
${warnings.length===0?'현재 경고 없음':warnings.map(w=>`${w.level==='critical'?'🔴':'🟡'}  ${w.msg}`).join('\n')}

────────── 소음 반경 ──────────
${(() => { const r = calcNoiseRadius(params.noiseDB); return `거주 불가: ${r.inhabitable}m  |  수면: ${r.sleep}m  |  민원: ${r.annoyance}m`; })()}

══════════════════════════════════════════════════════════
※ 본 결과는 개념적 시뮬레이션입니다. 실제 입지 결정에는
  법적·기술적 정밀 검토가 반드시 필요합니다.
══════════════════════════════════════════════════════════
`.trim();

  const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `KGDC_Matrix_${currentSeason}_${new Date().toISOString().slice(0,10)}.txt`;
  a.click(); URL.revokeObjectURL(url);
}

// ==================== 초기화 ====================
function resetAll() {
  ['tempSlider','coolingSlider','noiseSlider','powerSlider','renewSlider','popSlider','heatSlider']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = {tempSlider:33,coolingSlider:3,noiseSlider:75,powerSlider:200,renewSlider:30,popSlider:3,heatSlider:0}[id]; updateSliderGradient(el); }
    });
  initSliders();
  currentSeason = 'spring';
  document.querySelectorAll('.season-btn').forEach(b => b.classList.toggle('active', b.dataset.season==='spring'));
  updateSeasonStats(); runSimulation();
}

function updateFooterTime() {
  const el = document.getElementById('footerTime');
  if (el) el.textContent = new Date().toLocaleTimeString('ko-KR');
}

document.addEventListener('keydown', e => {
  if (e.key==='Escape') closeNoiseModal();
  if (e.key===' ' && e.target.tagName!=='INPUT' && e.target.tagName!=='SELECT') { e.preventDefault(); runSimulation(); }
});
