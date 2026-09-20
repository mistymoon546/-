/**
 * data.js — 한국 지역 데이터 및 계절별 파라미터
 */

// 한국 17개 광역시도 데이터
const REGIONS = [
  {
    id: 'seoul',
    name: '서울특별시',
    short: '서울',
    // SVG 경로 좌표 (viewBox 0 0 600 700 기준 한국 지도)
    pathD: 'M 252 175 L 268 168 L 278 172 L 285 180 L 280 192 L 268 196 L 255 190 L 248 182 Z',
    labelX: 266, labelY: 184,
    // 지역 특성 (0~100 척도, 높을수록 유리)
    baseData: {
      powerGrid:    25,  // 전력망 여유 (낮음: 이미 포화)
      coolingWater: 45,  // 냉각수 가용성
      landCost:     5,   // 부지 비용 적합도 (낮음: 비쌈)
      popDensity:   0,   // 인구 회피 점수 (낮음: 초밀집)
      renewPotential: 10,// 재생에너지 잠재력
      nimbyRisk:    0,   // 님비 저항 (낮을수록 저항 큼)
      heatUseScore: 60,  // 폐열 활용 가능성 (지역난방 인프라)
    },
    description: '인구 밀집 최고, 님비 리스크 극단적. 전력망 포화 상태.',
    population: 9.7, // 백만명
    area: 605,       // km²
  },
  {
    id: 'busan',
    name: '부산광역시',
    short: '부산',
    pathD: 'M 358 430 L 378 418 L 392 425 L 398 442 L 388 458 L 370 462 L 355 450 L 350 438 Z',
    labelX: 374, labelY: 440,
    baseData: {
      powerGrid:    55,
      coolingWater: 80, // 해수 냉각 가능
      landCost:     30,
      popDensity:   15,
      renewPotential: 40,
      nimbyRisk:    20,
      heatUseScore: 55,
    },
    description: '해수 냉각 활용 가능. 동남권 전력망 비교적 양호.',
    population: 3.4,
    area: 770,
  },
  {
    id: 'daegu',
    name: '대구광역시',
    short: '대구',
    pathD: 'M 320 360 L 338 352 L 350 360 L 352 376 L 342 388 L 326 388 L 314 378 L 312 366 Z',
    labelX: 333, labelY: 372,
    baseData: {
      powerGrid:    50,
      coolingWater: 40,
      landCost:     45,
      popDensity:   25,
      renewPotential: 35,
      nimbyRisk:    30,
      heatUseScore: 50,
    },
    description: '내륙 분지 특성으로 여름 폭염 심각. 냉각 부하 높음.',
    population: 2.4,
    area: 883,
  },
  {
    id: 'incheon',
    name: '인천광역시',
    short: '인천',
    pathD: 'M 218 188 L 235 180 L 248 185 L 252 200 L 242 212 L 226 212 L 214 204 L 212 194 Z',
    labelX: 232, labelY: 197,
    baseData: {
      powerGrid:    45,
      coolingWater: 75, // 서해 냉각 가능
      landCost:     35,
      popDensity:   20,
      renewPotential: 55, // 해상풍력
      nimbyRisk:    25,
      heatUseScore: 45,
    },
    description: '해상풍력 잠재력 우수. 서해 냉각수 활용 가능. 경제자유구역 인프라.',
    population: 2.9,
    area: 1063,
  },
  {
    id: 'gwangju',
    name: '광주광역시',
    short: '광주',
    pathD: 'M 238 410 L 254 402 L 266 410 L 268 426 L 258 436 L 242 436 L 230 426 L 228 414 Z',
    labelX: 249, labelY: 420,
    baseData: {
      powerGrid:    60,
      coolingWater: 55,
      landCost:     60,
      popDensity:   40,
      renewPotential: 60,
      nimbyRisk:    45,
      heatUseScore: 55,
    },
    description: '호남 전력망 여유 있음. 태양광 잠재력 높음.',
    population: 1.5,
    area: 501,
  },
  {
    id: 'daejeon',
    name: '대전광역시',
    short: '대전',
    pathD: 'M 258 295 L 274 287 L 286 295 L 288 311 L 278 321 L 262 320 L 250 312 L 248 298 Z',
    labelX: 270, labelY: 306,
    baseData: {
      powerGrid:    62,
      coolingWater: 58,
      landCost:     55,
      popDensity:   38,
      renewPotential: 45,
      nimbyRisk:    40,
      heatUseScore: 52,
    },
    description: '중부권 교통·인프라 요충지. IT 클러스터 기반 있음.',
    population: 1.5,
    area: 539,
  },
  {
    id: 'ulsan',
    name: '울산광역시',
    short: '울산',
    pathD: 'M 378 388 L 395 380 L 406 390 L 406 408 L 396 418 L 380 416 L 370 408 L 370 394 Z',
    labelX: 388, labelY: 400,
    baseData: {
      powerGrid:    70, // 산업단지 전력 인프라
      coolingWater: 82, // 동해 해수
      landCost:     50,
      popDensity:   48,
      renewPotential: 50,
      nimbyRisk:    55,
      heatUseScore: 65, // 산업 폐열 연계
    },
    description: '산업단지 전력 인프라 우수. 동해 냉각수 접근 가능. 폐열 활용 기반.',
    population: 1.1,
    area: 1062,
  },
  {
    id: 'sejong',
    name: '세종특별자치시',
    short: '세종',
    pathD: 'M 265 272 L 278 265 L 288 272 L 290 284 L 281 292 L 268 291 L 259 284 L 259 274 Z',
    labelX: 275, labelY: 280,
    baseData: {
      powerGrid:    65,
      coolingWater: 60,
      landCost:     50,
      popDensity:   55,
      renewPotential: 50,
      nimbyRisk:    52,
      heatUseScore: 58,
    },
    description: '행정도시로 신규 인프라 구비. 스마트시티 연계 가능.',
    population: 0.4,
    area: 465,
  },
  {
    id: 'gyeonggi',
    name: '경기도',
    short: '경기',
    pathD: 'M 228 148 L 260 132 L 300 140 L 315 160 L 310 195 L 292 210 L 275 215 L 258 210 L 244 200 L 230 188 L 218 175 L 215 162 Z',
    labelX: 267, labelY: 172,
    baseData: {
      powerGrid:    35,
      coolingWater: 55,
      landCost:     20,
      popDensity:   10,
      renewPotential: 30,
      nimbyRisk:    15,
      heatUseScore: 48,
    },
    description: '수도권 전력 포화. 다양한 개발압력으로 부지 확보 어려움.',
    population: 13.5,
    area: 10183,
  },
  {
    id: 'gangwon',
    name: '강원특별자치도',
    short: '강원',
    pathD: 'M 310 110 L 360 95 L 410 100 L 430 130 L 415 170 L 390 185 L 360 180 L 330 175 L 310 160 L 305 140 Z',
    labelX: 368, labelY: 143,
    baseData: {
      powerGrid:    72,
      coolingWater: 85, // 동해, 계곡수
      landCost:     80,
      popDensity:   85,
      renewPotential: 80, // 풍력, 수력
      nimbyRisk:    75,
      heatUseScore: 60,
    },
    description: '낮은 인구밀도, 냉각수 풍부, 재생에너지 잠재력 높음. 겨울 혹한 대비 필요.',
    population: 1.5,
    area: 16828,
  },
  {
    id: 'chungbuk',
    name: '충청북도',
    short: '충북',
    pathD: 'M 280 215 L 320 205 L 345 220 L 348 250 L 335 270 L 310 275 L 285 268 L 270 252 L 272 232 Z',
    labelX: 312, labelY: 243,
    baseData: {
      powerGrid:    68,
      coolingWater: 65,
      landCost:     70,
      popDensity:   70,
      renewPotential: 55,
      nimbyRisk:    65,
      heatUseScore: 52,
    },
    description: '내륙 중심부. 바이오·IT 클러스터 오송·청주 연계 가능.',
    population: 1.6,
    area: 7407,
  },
  {
    id: 'chungnam',
    name: '충청남도',
    short: '충남',
    pathD: 'M 200 222 L 240 210 L 268 225 L 275 255 L 265 280 L 240 290 L 210 282 L 188 262 L 185 242 Z',
    labelX: 232, labelY: 252,
    baseData: {
      powerGrid:    65,
      coolingWater: 70, // 서해안
      landCost:     65,
      popDensity:   60,
      renewPotential: 70, // 서해 풍력, 태양광
      nimbyRisk:    62,
      heatUseScore: 58,
    },
    description: '서해안 해상풍력 잠재력 우수. 당진 전력 허브 인접.',
    population: 2.1,
    area: 8226,
  },
  {
    id: 'jeonbuk',
    name: '전북특별자치도',
    short: '전북',
    pathD: 'M 210 308 L 255 295 L 280 308 L 285 340 L 272 362 L 245 368 L 218 358 L 200 338 L 198 320 Z',
    labelX: 244, labelY: 334,
    baseData: {
      powerGrid:    72,
      coolingWater: 65,
      landCost:     75,
      popDensity:   72,
      renewPotential: 75,
      nimbyRisk:    70,
      heatUseScore: 55,
    },
    description: '새만금 재생에너지 단지 연계 가능성 높음. 전력망 여유.',
    population: 1.8,
    area: 8069,
  },
  {
    id: 'jeonnam',
    name: '전라남도',
    short: '전남',
    pathD: 'M 195 368 L 238 358 L 268 372 L 275 405 L 265 435 L 240 445 L 208 438 L 182 418 L 175 395 L 180 376 Z',
    labelX: 228, labelY: 402,
    baseData: {
      powerGrid:    78,
      coolingWater: 85, // 다도해
      landCost:     82,
      popDensity:   80,
      renewPotential: 88, // 최고 태양광·해상풍력
      nimbyRisk:    78,
      heatUseScore: 62,
    },
    description: '국내 최고 태양광·해상풍력 잠재력. 다도해 냉각수 접근 우수.',
    population: 1.9,
    area: 12324,
  },
  {
    id: 'gyeongbuk',
    name: '경상북도',
    short: '경북',
    pathD: 'M 330 175 L 380 165 L 415 180 L 420 215 L 410 255 L 385 275 L 355 272 L 330 258 L 318 235 L 318 205 Z',
    labelX: 372, labelY: 220,
    baseData: {
      powerGrid:    68,
      coolingWater: 72,
      landCost:     75,
      popDensity:   75,
      renewPotential: 65,
      nimbyRisk:    70,
      heatUseScore: 58,
    },
    description: '포항·구미 산업 인프라. 동해 냉각수 접근. 원전 전력 인프라 우수.',
    population: 2.6,
    area: 19033,
  },
  {
    id: 'gyeongnam',
    name: '경상남도',
    short: '경남',
    pathD: 'M 298 350 L 340 338 L 370 348 L 385 378 L 375 408 L 350 420 L 318 415 L 294 400 L 285 378 L 288 360 Z',
    labelX: 336, labelY: 382,
    baseData: {
      powerGrid:    65,
      coolingWater: 78,
      landCost:     68,
      popDensity:   58,
      renewPotential: 60,
      nimbyRisk:    58,
      heatUseScore: 60,
    },
    description: '남해안 냉각수 접근. 창원 제조업 전력 인프라. 폐열 활용 기반 있음.',
    population: 3.3,
    area: 10541,
  },
  {
    id: 'jeju',
    name: '제주특별자치도',
    short: '제주',
    pathD: 'M 195 545 L 225 535 L 258 540 L 270 558 L 260 572 L 232 578 L 200 572 L 188 558 Z',
    labelX: 230, labelY: 557,
    baseData: {
      powerGrid:    50, // 독립 전력망
      coolingWater: 88, // 해수
      landCost:     40,
      popDensity:   78,
      renewPotential: 90, // 풍력 세계적 수준
      nimbyRisk:    60,
      heatUseScore: 45,
    },
    description: '세계적 수준의 풍력 에너지. 해수 냉각 최적. 독립 계통 안정성 검토 필요.',
    population: 0.7,
    area: 1849,
  },
];

// 계절별 파라미터 조정값
const SEASON_DATA = {
  spring: {
    label: '봄 (3~5월)',
    avgTemp: 13,
    gridLoad: 62,      // 전력망 부하율 %
    waterAvail: '양호',
    renewOutput: 42,   // 재생에너지 출력 %
    coolingMultiplier: 0.7,  // 냉각 부하 배수
    gridMultiplier: 0.85,    // 전력 여유 배수 (높을수록 여유)
    icon: '🌸',
    color: '#ff9dbf',
    // 계절별 지역 보정값 (id: 보정 점수)
    regionBonus: {
      gangwon: 5, jeonnam: 8, chungnam: 5,
    },
    seasonNote: '황사·미세먼지로 외기냉각 효율 저하 주의',
  },
  summer: {
    label: '여름 (6~8월)',
    avgTemp: 28,
    gridLoad: 95,
    waterAvail: '보통',
    renewOutput: 55,
    coolingMultiplier: 1.6,
    gridMultiplier: 0.4,
    icon: '☀️',
    color: '#ff8c00',
    regionBonus: {
      daegu: -20, // 폭염 취약
      gangwon: 10,
      jeonnam: 5,
      jeju: 8,
    },
    seasonNote: '폭염 시 전력망 포화. 냉각 부하 최대치. 수도권 특히 위험.',
  },
  autumn: {
    label: '가을 (9~11월)',
    avgTemp: 16,
    gridLoad: 65,
    waterAvail: '양호',
    renewOutput: 38,
    coolingMultiplier: 0.75,
    gridMultiplier: 0.9,
    icon: '🍂',
    color: '#ff6b35',
    regionBonus: {
      gyeongnam: 5, gyeongbuk: 5,
    },
    seasonNote: '최적 운영 계절. 외기냉각 적극 활용 가능.',
  },
  winter: {
    label: '겨울 (12~2월)',
    avgTemp: -2,
    gridLoad: 85,
    waterAvail: '제한',
    renewOutput: 25,
    coolingMultiplier: 0.4,
    gridMultiplier: 0.5,
    icon: '❄️',
    color: '#87ceeb',
    regionBonus: {
      gangwon: -15, // 혹한
      jeju: 10,
      jeonnam: 8,
      gyeongnam: 8,
    },
    seasonNote: '한파 시 난방 수요로 전력망 부하 급증. 냉각수 동결 주의.',
  },
};

// 냉각 부하 레벨 레이블
const COOLING_LABELS = ['', '낮음', '낮음-중간', '보통', '높음', '매우 높음'];
const POP_LABELS     = ['', '완화', '낮음', '중간', '높음', '엄격'];
const HEAT_LABELS    = ['미연계', '일부 연계', '적극 연계', '완전 연계'];

// 소음 기준
const NOISE_THRESHOLDS = {
  inhabitable: { db: 85, desc: '거주 불가 기준 초과' },
  sleep:       { db: 75, desc: '수면 장애 영향 범위' },
  annoyance:   { db: 65, desc: '민원 발생 우려 범위' },
  safe:        { db: 55, desc: '영향 없음 구역' },
};

// 소음 → 영향 반경 계산 (단순화된 모델)
function calcNoiseRadius(db) {
  // 점 음원 기준: r = r0 * 10^((db - db0) / 20)
  const baseDB = 55, baseRadius = 50; // 50m에서 기준치
  const inhabitableR = baseRadius * Math.pow(10, (db - NOISE_THRESHOLDS.inhabitable.db) / 20);
  const sleepR       = baseRadius * Math.pow(10, (db - NOISE_THRESHOLDS.sleep.db) / 20);
  const annoyanceR   = baseRadius * Math.pow(10, (db - NOISE_THRESHOLDS.annoyance.db) / 20);
  return {
    inhabitable: Math.round(inhabitableR),
    sleep:       Math.round(sleepR),
    annoyance:   Math.round(annoyanceR),
  };
}
