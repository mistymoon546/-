/**
 * comparison.js — 탭4: 탐방 전후 비교
 */

const COMPARISON_DATA = {
  before: [
    {
      category: '1순위 입지 조건',
      content: '<strong>전력망 용량</strong>을 가장 중요하게 봄. 한전 공급 가능 MW 수치 위주로 판단.',
      changed: false,
    },
    {
      category: '냉각 방식',
      content: '기계 냉각(Chiller) 위주의 설계 가정. 외기냉각은 기후 조건이 좋을 때만 보조 활용.',
      changed: false,
    },
    {
      category: '폐열 활용',
      content: '지역난방 연계는 "있으면 좋은 것" 수준. 실제 설계에서 필수 요소로 보지 않음.',
      changed: true,
    },
    {
      category: '님비 대응 전략',
      content: '설명회·보상 위주. 주민 수용성을 비용으로만 인식.',
      changed: true,
    },
    {
      category: '워크로드 유연성',
      content: 'AI Training 시간 이동 개념 인지. 그러나 실제 계통 신호 연동 사례 없다고 판단.',
      changed: true,
    },
    {
      category: '최적 입지 후보',
      content: '수도권 인근(경기 북부) — 고객 접근성·인력 조달 유리.',
      changed: true,
    },
  ],
  after: [
    {
      category: '1순위 입지 조건',
      content: '<strong>폐열 수요처(지역난방망) 존재</strong>가 Espoo에서는 필수 조건. 전력망 용량은 2순위.',
      changed: false,
    },
    {
      category: '냉각 방식',
      content: '핀란드 기후(연평균 5°C)에서는 외기냉각 100% 가능. 한국은 여름 고온 대비 하이브리드 필수.',
      changed: false,
    },
    {
      category: '폐열 활용',
      content: '<strong>지역난방 연계는 필수 설계 요소</strong>. Espoo DC의 90% 이상 폐열이 지역난방으로 공급됨. 없으면 허가 불가 수준.',
      changed: true,
    },
    {
      category: '님비 대응 전략',
      content: '<strong>편익 공유 모델</strong>로 전환. 난방비 절감·지역 일자리·공공 데이터 인프라 제공으로 주민이 DC 유치를 원하게 만듦.',
      changed: true,
    },
    {
      category: '워크로드 유연성',
      content: '<strong>계통 신호 연동 자동화가 실현 중</strong>. 핀란드 전력시장(Fingrid)에서 DC가 실시간 주파수 조정에 참여. 한국 적용 검토 필요.',
      changed: true,
    },
    {
      category: '최적 입지 후보',
      content: '<strong>재생에너지 + 지역난방 인프라 동시 충족 지역</strong> 우선. 전남·강원 등 비수도권 재평가 필요.',
      changed: true,
    },
  ],
};

const FINDINGS = [
  {
    icon: '♨️',
    title: '폐열: 보조 → 핵심',
    before: '탐방 전: "있으면 좋은 옵션"으로 인식',
    after: '탐방 후: Espoo에서 허가 조건 수준의 필수 설계 요소',
  },
  {
    icon: '🤝',
    title: '님비 → 공동체 편익',
    before: '탐방 전: 보상·설명회로 주민 저항 관리',
    after: '탐방 후: 편익 공유로 주민이 DC 유치를 원하는 구조 설계',
  },
  {
    icon: '⚡',
    title: '계통 연동의 현실화',
    before: '탐방 전: 워크로드 유연성은 이론적 개념',
    after: '탐방 후: Fingrid에서 DC가 실시간 주파수 조정 시장 참여 중',
  },
  {
    icon: '📍',
    title: '입지 우선순위 역전',
    before: '탐방 전: 수도권 근접성 최우선',
    after: '탐방 후: 재생에너지 + 폐열 수요처 동시 충족 지역으로 재평가',
  },
  {
    icon: '❄️',
    title: '냉각 전략의 현지화',
    before: '탐방 전: 기계 냉각 기본 설계 가정',
    after: '탐방 후: 한국 여름 기후 고려한 하이브리드(외기+기계) 필수',
  },
  {
    icon: '🌏',
    title: '한국 적용 가능성',
    before: '탐방 전: 핀란드 모델은 기후 달라 직접 적용 어렵다고 판단',
    after: '탐방 후: 겨울 폐열 연계·계통 참여 개념은 한국에서도 충분히 적용 가능',
  },
];

let compareMode = 'side';

function initComparison() {
  renderCompareItems();
  renderFindings();
}

function renderCompareItems() {
  const beforeEl = document.getElementById('beforeItems');
  const afterEl  = document.getElementById('afterItems');
  if (!beforeEl || !afterEl) return;

  beforeEl.innerHTML = COMPARISON_DATA.before.map(item => `
    <div class="compare-item ${item.changed ? 'ci-changed' : ''}">
      <div class="ci-category">${item.category}</div>
      <div class="ci-content">${item.content}</div>
    </div>`).join('');

  afterEl.innerHTML = COMPARISON_DATA.after.map(item => `
    <div class="compare-item ${item.changed ? 'ci-changed' : ''}">
      <div class="ci-category">${item.category}</div>
      <div class="ci-content">${item.content}</div>
    </div>`).join('');
}

function renderFindings() {
  const el = document.getElementById('findingsGrid');
  if (!el) return;
  el.innerHTML = FINDINGS.map(f => `
    <div class="finding-card">
      <div class="finding-icon">${f.icon}</div>
      <div class="finding-title">${f.title}</div>
      <div class="finding-before">탐방 전: ${f.before.replace('탐방 전: ', '')}</div>
      <div class="finding-after">탐방 후: ${f.after.replace('탐방 후: ', '')}</div>
    </div>`).join('');
}

function setCompareMode(mode) {
  compareMode = mode;
  document.getElementById('ctSide')  .classList.toggle('active', mode === 'side');
  document.getElementById('ctSlider').classList.toggle('active', mode === 'slider');
  // 현재는 side 모드만 구현 (sliders는 확장 가능)
}
