/**
 * decision.js — 탭3: Step 1·2·3 의사결정 모델
 */

// Espoo/Aalto 기준
const ESPOO_CRITERIA = [
  { rank: 1, text: '<strong>전력망 연결 가용성</strong> — 전용 변전소 직결 여부가 첫 번째 관문' },
  { rank: 2, text: '<strong>냉각수 안정 공급원</strong> — 지하수·해수·강수 접근성' },
  { rank: 3, text: '<strong>지역 폐열 수요처</strong> — 지역난방망 연결 여부 (핀란드 필수 조건)' },
  { rank: 4, text: '<strong>통신 인프라</strong> — 다중 경로 광케이블' },
  { rank: 5, text: '<strong>자연재해 리스크</strong> — 홍수·지진·폭풍 이력' },
  { rank: 6, text: '<strong>부지 비용·접근성</strong> — 물류·인력 접근 편의성' },
];

// 한국 조건에 맞게 수정된 기준
const KOREA_CRITERIA = [
  { rank: 1, text: '<strong>전력 계통 여유 용량</strong> — 한전 공급가능 MW 확인 (수도권 포화 심각)' },
  { rank: 2, text: '<strong>재생에너지 계통 접속</strong> — 재생에너지 연계 잠재력 (새만금·제주 우수)' },
  { rank: 3, text: '<strong>인구밀도 및 님비 리스크</strong> — 한국 특유의 주거지 인접 갈등 위험' },
  { rank: 4, text: '<strong>냉각수 접근성</strong> — 해수·댐·지하수 (동해·남해안 유리)' },
  { rank: 5, text: '<strong>폐열 수요처</strong> — 지역난방망·농업시설 연계 (도시 근교 유리)' },
  { rank: 6, text: '<strong>통신·도로 인프라</strong> — 광케이블 + 물류 접근성' },
];

// 지역별 탈락 조건 체크
const ELIMINATION_CHECK = {
  jeonnam: [
    { ok: true,  text: '✅ 전력망 여유: 한전 호남본부 공급 가능 — 통과' },
    { ok: true,  text: '✅ 재생에너지: 국내 최고 수준 태양광·해상풍력 — 통과' },
    { ok: true,  text: '✅ 인구밀도: 낮음, 님비 리스크 낮음 — 통과' },
    { ok: false, text: '⚠️ 폐열 수요처: 열 수요처 거리 있음 — 인프라 투자 필요' },
    { ok: true,  text: '✅ 냉각수: 다도해 해수 활용 가능 — 통과' },
  ],
  seoul_metro: [
    { ok: false, text: '❌ 전력망: 수도권 계통 포화 상태 — 탈락 위험' },
    { ok: false, text: '❌ 인구밀도: 극도로 높음, 님비 리스크 매우 높음 — 탈락' },
    { ok: true,  text: '✅ 폐열 수요처: 지역난방망 완비 — 통과' },
    { ok: true,  text: '✅ 통신 인프라: 최고 수준 — 통과' },
    { ok: false, text: '⚠️ 부지 비용: 극히 높음 — 경제성 재검토 필요' },
  ],
  ulsan: [
    { ok: true,  text: '✅ 전력망: 산업단지 전력 인프라 우수 — 통과' },
    { ok: true,  text: '✅ 냉각수: 동해 해수 접근 가능 — 통과' },
    { ok: true,  text: '✅ 폐열 수요처: 산업 폐열 연계 기반 있음 — 통과' },
    { ok: true,  text: '✅ 인구밀도: 중간, 산업단지 인접 — 통과' },
    { ok: false, text: '⚠️ 재생에너지: 중간 수준 — 탄소중립 목표 추가 확보 필요' },
  ],
  gangwon: [
    { ok: true,  text: '✅ 인구밀도: 낮음, 님비 리스크 낮음 — 통과' },
    { ok: true,  text: '✅ 냉각수: 계곡수·댐 풍부 — 통과' },
    { ok: true,  text: '✅ 재생에너지: 풍력·수력 풍부 — 통과' },
    { ok: false, text: '⚠️ 전력 계통: 원거리 송전 손실 — 계통 보강 필요' },
    { ok: false, text: '⚠️ 폐열 수요처: 인근 열수요 부족 — 연계 어려움' },
  ],
};

// 지역별 운영 레벨 추천
const LEVEL_RECOMMENDATION = {
  jeonnam: {
    level: 4,
    reason: '전남은 재생에너지 변동성이 크고 특정 시간대 계통혼잡이 발생합니다. <strong>시간 조정 가능한 AI Training 중심 DC (L4)</strong>가 적합합니다. 잉여 태양광·풍력을 AI 훈련 워크로드로 흡수하고, 혼잡 시 자동 감축하는 Grid-Interactive 운영이 최적입니다.',
    apps: ['AI 모델 훈련', '배치 데이터 처리', '재생에너지 직접 전력구매계약(PPA)'],
  },
  seoul_metro: {
    level: 3,
    reason: '수도권은 금융·의료 등 고가용성 서비스가 집중되어 L4 워크로드 이동이 제한됩니다. <strong>Thermal Flexibility (L3)</strong>를 통해 냉각 전력을 유연하게 조정하고, BESS와 결합한 피크 감축이 현실적입니다.',
    apps: ['클라우드 추론 서비스', '금융 거래 처리', '실시간 콘텐츠 서빙'],
  },
  ulsan: {
    level: 3,
    reason: '울산 산업단지는 산업 폐열 연계와 BESS 활용이 가능합니다. <strong>L3 Thermal Flexibility</strong>로 냉각 전력과 폐열 공급을 계통 상황에 맞게 조정하는 것이 적합합니다.',
    apps: ['제조업 디지털트윈', '산업 IoT 데이터 처리', '엣지 컴퓨팅'],
  },
  gangwon: {
    level: 4,
    reason: '강원은 낮은 인구밀도와 풍부한 자연 냉각원으로 L4 최대 유연성이 가능합니다. <strong>Workload Shifting (L4)</strong>으로 풍력 발전 패턴에 맞춰 워크로드를 조정하고, 동계 관광 성수기 전력 수요와 조율하는 운영이 효과적입니다.',
    apps: ['AI 연구 훈련 클러스터', '미디어 렌더링', '글로벌 CDN 노드'],
  },
};

// 지역별 편익
const REGIONAL_BENEFITS = {
  jeonnam: {
    type: 'renew',
    title: '전라남도 — 재생에너지 계통 안정화 편익',
    benefits: [
      { tag: '재생에너지 흡수', desc: 'AI 훈련 워크로드로 잉여 태양광·풍력 실시간 흡수' },
      { tag: '출력제한 감소', desc: '재생에너지 출력제한(Curtailment) 비용 절감' },
      { tag: '농업 폐열 연계', desc: '온실 농업시설에 서버 폐열 저온 공급 (50~60°C)' },
      { tag: '지역 일자리', desc: 'DC 운영·유지보수 고급 기술직 창출' },
    ],
    case: '예시: 해남·영암 태양광단지 인근 입지 → 낮 시간 AI 훈련 집중, 야간 풍력으로 BESS 충전',
  },
  seoul_metro: {
    type: 'heat',
    title: '수도권(경기 북부) — 지역난방 연계형 도시형 편익',
    benefits: [
      { tag: '지역난방 공급', desc: '서버 폐열 40~60°C를 지역난방망 공급 (Espoo 모델)' },
      { tag: '난방비 절감', desc: '인근 주민 난방 비용 절감 효과 — 님비 완화 수단' },
      { tag: '탄소중립 기여', desc: '가스 보일러 대체로 CO₂ 절감 가시화' },
      { tag: '스마트시티 연계', desc: '도시 에너지 관리 시스템 데이터 공유' },
    ],
    case: '예시: 파주·고양 지역난방 인프라 연계 → 겨울 폐열 100% 지역난방 공급, 여름 피크 BESS 방전',
  },
  ulsan: {
    type: 'industry',
    title: '울산 — 산업단지 연계형 편익',
    benefits: [
      { tag: '산업 폐열 연계', desc: '정유·화학 공정과 온도 맞교환 가능성' },
      { tag: '수소경제 연계', desc: '그린수소 생산 전력 수요와 연계 가능성' },
      { tag: '제조업 DX 지원', desc: '현대차·현대중공업 디지털 트랜스포메이션 인프라 제공' },
      { tag: '에너지 자급', desc: '동해 해상풍력 + DC 조합으로 지역 에너지 자급 기여' },
    ],
    case: '예시: 울산 미포국가산업단지 인접 입지 → 산업 열수요 연계 + 동해 해수 냉각 + 해상풍력 PPA',
  },
  gangwon: {
    type: 'research',
    title: '강원 — 청정 환경 연구·관광 연계형 편익',
    benefits: [
      { tag: '풍력 에너지 흡수', desc: '양양·평창 풍력발전 잉여 전력 실시간 흡수' },
      { tag: '연구단지 연계', desc: '강원대·한림대 등 산학협력 AI 연구 지원' },
      { tag: '탄소중립 선도', desc: '100% 재생에너지 운영으로 ESG 벤치마크' },
      { tag: '지역 난방 공급', desc: '스키 리조트·펜션단지에 서버 폐열 공급 가능성' },
    ],
    case: '예시: 평창·횡성 풍력단지 인근 → 풍력 직접 연결, AI 연구 훈련 특화, 동계 리조트 난방 연계',
  },
};

// 편익 유형 카드
const BENEFIT_TYPES = [
  { id: 'heat',     icon: '♨️', name: '폐열 지역난방', sub: '서버 폐열 → 지역난방망·농업 공급' },
  { id: 'renew',    icon: '☀️', name: '재생에너지 연계', sub: '잉여 재생에너지 AI 워크로드 흡수' },
  { id: 'industry', icon: '🏭', name: '산업단지 연계', sub: '제조업 DX + 산업 폐열 교환' },
  { id: 'research', icon: '🔬', name: '연구·교육 연계', sub: '대학·연구원 산학협력 + 공공 Compute' },
];

let currentDecisionRegion = 'jeonnam';
let currentStep = 1;

function initDecision() {
  renderCriteria();
  renderEliminationCheck('jeonnam');
  renderLevelCards('jeonnam');
  renderBenefitTypes();
  renderRegionBenefit('jeonnam');

  document.getElementById('decisionRegion').addEventListener('change', e => {
    currentDecisionRegion = e.target.value;
    renderEliminationCheck(currentDecisionRegion);
    renderLevelCards(currentDecisionRegion);
    renderRegionBenefit(currentDecisionRegion);
  });

  document.querySelectorAll('.step-item').forEach(item => {
    item.addEventListener('click', () => goStep(parseInt(item.dataset.step)));
  });
}

function renderCriteria() {
  document.getElementById('espooCriteria').innerHTML = ESPOO_CRITERIA.map(c => `
    <div class="criteria-item">
      <span class="ci-rank">${c.rank}</span>
      <span class="ci-text">${c.text}</span>
    </div>`).join('');

  document.getElementById('koreaCriteria').innerHTML = KOREA_CRITERIA.map(c => `
    <div class="criteria-item">
      <span class="ci-rank">${c.rank}</span>
      <span class="ci-text">${c.text}</span>
    </div>`).join('');
}

function renderEliminationCheck(regionId) {
  const items = ELIMINATION_CHECK[regionId] || [];
  document.getElementById('elimList').innerHTML = items.map(item => `
    <div class="elim-item ${item.ok ? 'elim-ok' : 'elim-fail'}">
      ${item.text}
    </div>`).join('');
}

function renderLevelCards(regionId) {
  const rec = LEVEL_RECOMMENDATION[regionId];
  document.querySelectorAll('.level-card').forEach(card => {
    const lvl = parseInt(card.dataset.level);
    card.classList.remove('recommended', 'selected');
    if (lvl === rec.level) card.classList.add('recommended', 'selected');
  });

  document.getElementById('regionRec').innerHTML = `
    <strong>추천 레벨: L${rec.level}</strong> — ${rec.reason}
    <br/><br/>
    <strong style="color:#7fa8cc">적합 워크로드:</strong>
    ${rec.apps.map(a => `<span class="benefit-tag">${a}</span>`).join(' ')}
  `;

  document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.level-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
}

function renderBenefitTypes() {
  document.getElementById('benefitTypeGrid').innerHTML = BENEFIT_TYPES.map(t => `
    <div class="bt-card" data-btype="${t.id}" onclick="selectBenefitType('${t.id}')">
      <div class="bt-icon">${t.icon}</div>
      <div class="bt-name">${t.name}</div>
      <div class="bt-sub">${t.sub}</div>
    </div>`).join('');
}

function selectBenefitType(typeId) {
  document.querySelectorAll('.bt-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-btype="${typeId}"]`)?.classList.add('active');
}

function renderRegionBenefit(regionId) {
  const b = REGIONAL_BENEFITS[regionId];
  if (!b) return;

  // 해당 편익 유형 카드 활성화
  document.querySelectorAll('.bt-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-btype="${b.type}"]`)?.classList.add('active');

  document.getElementById('regionBenefitDetail').innerHTML = `
    <h4>${b.title}</h4>
    ${b.benefits.map(ben => `
      <div style="margin-bottom:8px">
        <span class="benefit-tag">${ben.tag}</span>
        <span style="font-size:11px;color:#7fa8cc;margin-left:6px">${ben.desc}</span>
      </div>
    `).join('')}
    <div style="margin-top:12px;padding:10px;background:rgba(0,229,255,0.05);border:1px solid rgba(0,229,255,0.2);border-radius:8px;font-size:11px;color:#7fa8cc;">
      📍 ${b.case}
    </div>
  `;
}

function goStep(n) {
  currentStep = n;
  document.querySelectorAll('.step-panel').forEach((p, i) => {
    p.classList.toggle('active', i + 1 === n);
  });
  document.querySelectorAll('.step-item').forEach((item, i) => {
    item.classList.toggle('active', i + 1 === n);
  });
}
