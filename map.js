/**
 * map.js — SVG 한국 지도 렌더링 및 인터랙션
 */

let selectedRegion = null;
let tooltipEl = null;

function initMap() {
  const svg = document.getElementById('koreaMap');

  // 배경 그리드
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,100,180,0.05)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  `;
  svg.appendChild(defs);

  // 바다 배경
  const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  ocean.setAttribute('width', '600');
  ocean.setAttribute('height', '700');
  ocean.setAttribute('fill', 'url(#bgGrad)');
  svg.appendChild(ocean);

  // 그리드 라인
  const grid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  grid.setAttribute('opacity', '0.07');
  for (let x = 0; x <= 600; x += 50) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', 0);
    line.setAttribute('x2', x); line.setAttribute('y2', 700);
    line.setAttribute('stroke', '#00e5ff'); line.setAttribute('stroke-width', '0.5');
    grid.appendChild(line);
  }
  for (let y = 0; y <= 700; y += 50) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0); line.setAttribute('y1', y);
    line.setAttribute('x2', 600); line.setAttribute('y2', y);
    line.setAttribute('stroke', '#00e5ff'); line.setAttribute('stroke-width', '0.5');
    grid.appendChild(line);
  }
  svg.appendChild(grid);

  // 지역 그룹
  const regionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  regionsGroup.setAttribute('id', 'regionsGroup');
  svg.appendChild(regionsGroup);

  // 레이블 그룹 (항상 위에)
  const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  labelsGroup.setAttribute('id', 'labelsGroup');
  svg.appendChild(labelsGroup);

  // 각 지역 렌더링
  REGIONS.forEach(region => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'region-group');
    g.setAttribute('id', `group-${region.id}`);

    // 폴리곤 경로
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', region.pathD);
    path.setAttribute('class', 'region-path');
    path.setAttribute('id', `path-${region.id}`);
    path.setAttribute('filter', 'url(#glow)');

    // 이벤트
    path.addEventListener('mouseenter', (e) => showTooltip(e, region));
    path.addEventListener('mousemove',  (e) => moveTooltip(e));
    path.addEventListener('mouseleave', () => hideTooltip());
    path.addEventListener('click',      () => selectRegion(region));

    g.appendChild(path);
    regionsGroup.appendChild(g);

    // 지역명 레이블
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', region.labelX);
    label.setAttribute('y', region.labelY - 2);
    label.setAttribute('class', 'region-label');
    label.textContent = region.short;

    // 점수 레이블
    const scoreLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    scoreLabel.setAttribute('x', region.labelX);
    scoreLabel.setAttribute('y', region.labelY + 11);
    scoreLabel.setAttribute('class', 'region-score');
    scoreLabel.setAttribute('id', `score-${region.id}`);
    scoreLabel.textContent = '–';

    labelsGroup.appendChild(label);
    labelsGroup.appendChild(scoreLabel);
  });

  // 툴팁 엘리먼트
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'map-tooltip';
  tooltipEl.style.opacity = '0';
  tooltipEl.style.position = 'absolute';
  document.querySelector('.map-container').appendChild(tooltipEl);
}

function updateMapColors(scores) {
  REGIONS.forEach(region => {
    const path = document.getElementById(`path-${region.id}`);
    const scoreLbl = document.getElementById(`score-${region.id}`);
    const score = scores[region.id];
    if (!path || score === undefined) return;

    // 등급 결정
    path.className.baseVal = 'region-path';
    if (score >= 75)      path.classList.add('excellent');
    else if (score >= 55) path.classList.add('good');
    else if (score >= 35) path.classList.add('fair');
    else                  path.classList.add('poor');

    if (region.id === selectedRegion?.id) path.classList.add('selected');

    // 점수 표시
    if (scoreLbl) scoreLbl.textContent = Math.round(score);

    // 애니메이션
    path.style.transition = `all ${0.3 + Math.random() * 0.4}s ease`;
  });
}

function showTooltip(e, region) {
  if (!tooltipEl) return;
  const score = window._lastScores ? window._lastScores[region.id] : null;
  const grade = score === null ? '–' : getGradeLabel(score);

  tooltipEl.innerHTML = `
    <div class="tooltip-name">${region.name}</div>
    <div class="tooltip-row"><span>인구</span><span class="tooltip-val">${region.population}백만명</span></div>
    <div class="tooltip-row"><span>면적</span><span class="tooltip-val">${region.area.toLocaleString()}km²</span></div>
    <div class="tooltip-row"><span>종합 점수</span><span class="tooltip-val">${score !== null ? Math.round(score) + '점' : '–'}</span></div>
    <div class="tooltip-row"><span>입지 등급</span><span class="tooltip-val">${grade}</span></div>
    <div style="margin-top:6px;font-size:9px;color:#7fa8cc;line-height:1.5;">${region.description}</div>
  `;
  tooltipEl.style.opacity = '1';
  moveTooltip(e);
}

function moveTooltip(e) {
  if (!tooltipEl) return;
  const rect = document.querySelector('.map-container').getBoundingClientRect();
  let x = e.clientX - rect.left + 12;
  let y = e.clientY - rect.top - 10;
  // 화면 밖 방지
  if (x + 200 > rect.width) x -= 220;
  if (y + 160 > rect.height) y -= 160;
  tooltipEl.style.left = x + 'px';
  tooltipEl.style.top  = y + 'px';
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.opacity = '0';
}

function selectRegion(region) {
  selectedRegion = region;
  // 이전 선택 초기화
  document.querySelectorAll('.region-path').forEach(p => p.classList.remove('selected'));
  const path = document.getElementById(`path-${region.id}`);
  if (path) path.classList.add('selected');
  // 상세 패널 업데이트
  showRegionDetail(region);
}

function showRegionDetail(region) {
  const section = document.getElementById('regionDetailSection');
  const nameEl  = document.getElementById('regionDetailName');
  const detailEl = document.getElementById('regionDetail');
  const score = window._lastScores ? window._lastScores[region.id] : null;

  section.style.display = 'block';
  nameEl.textContent = region.name;

  const d = region.baseData;
  const items = [
    { label: '전력망 여유', value: d.powerGrid, suffix: '점', bar: true },
    { label: '냉각수 가용성', value: d.coolingWater, suffix: '점', bar: true },
    { label: '부지 비용 적합도', value: d.landCost, suffix: '점', bar: true },
    { label: '인구 회피 점수', value: d.popDensity, suffix: '점', bar: true },
    { label: '재생에너지 잠재력', value: d.renewPotential, suffix: '점', bar: true },
    { label: '님비 저항도', value: d.nimbyRisk, suffix: '점', bar: true },
    { label: '폐열 활용 가능성', value: d.heatUseScore, suffix: '점', bar: true },
    { label: '종합 입지 점수', value: score !== null ? Math.round(score) : '–', suffix: '점', highlight: true },
  ];

  detailEl.innerHTML = items.map(item => `
    <div class="detail-row" style="${item.highlight ? 'border-color:rgba(0,229,255,0.5);background:rgba(0,229,255,0.05)' : ''}">
      <span class="detail-label">${item.label}</span>
      <span class="detail-value" style="${item.highlight ? 'font-size:18px;color:#00ff8c' : ''}">${item.value}${item.suffix}</span>
    </div>
    ${item.bar && typeof item.value === 'number' ? `
    <div style="height:3px;border-radius:2px;background:rgba(255,255,255,0.08);margin:-6px 0 2px;overflow:hidden">
      <div style="height:100%;width:${item.value}%;background:linear-gradient(90deg,#00e5ff,#3d8eff);border-radius:2px;transition:width 0.6s ease"></div>
    </div>` : ''}
  `).join('');
}

function getGradeLabel(score) {
  if (score >= 75) return '🟢 최적';
  if (score >= 55) return '🔵 적합';
  if (score >= 35) return '🟡 조건부';
  return '🔴 부적합';
}

// 배경 파티클 애니메이션
function initBackground() {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    opacity: Math.random() * 0.5 + 0.1,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${p.opacity})`;
      ctx.fill();
    });
    // 연결선
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0,229,255,${0.05 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}
