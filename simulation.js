/**
 * simulation.js — 핵심 시뮬레이션 엔진
 */

/**
 * 지역별 입지 점수 계산
 * @param {object} params - 슬라이더 파라미터
 * @param {string} season - 계절 키
 * @returns {object} { regionId: score } 맵
 */
function calculateScores(params, season) {
  const seasonData = SEASON_DATA[season];
  const scores = {};

  REGIONS.forEach(region => {
    const d = region.baseData;

    // === 1. 열 환경 점수 ===
    // 외기 온도가 높을수록 냉각 부하 증가 → 취약 지역 감점
    const tempPenalty = Math.max(0, (params.temperature - 30) * 2.5);
    // 냉각 부하 강도가 높을수록 냉각수 충분한 지역 유리
    const coolingScore = d.coolingWater * (1 - (params.coolingLevel - 1) * 0.1)
                         - tempPenalty * seasonData.coolingMultiplier;

    // === 2. 소음 · 인구 점수 ===
    // 소음이 클수록, 인구 회피 강도 높을수록 → 인구 밀집지역 감점 심함
    const noiseImpact = (params.noiseDB - 50) / 50; // 0~1
    const popWeight   = params.popAvoidance / 5;     // 0~1
    const popScore    = d.popDensity * (1 - noiseImpact * popWeight * 0.8)
                       + d.nimbyRisk * (1 - popWeight * 0.6);

    // === 3. 전력망 점수 ===
    // 전력 수요 클수록 전력망 여유 중요도 증가
    const powerDemandFactor = params.powerDemand / 500; // 0~1
    const gridScore = d.powerGrid * (1 - powerDemandFactor * 0.5 * (1 - seasonData.gridMultiplier));
    const renewScore = d.renewPotential * (params.renewRatio / 100) * 0.5;

    // === 4. 지역사회 연계 점수 ===
    const heatBonus = d.heatUseScore * (params.heatIntegration / 3) * 0.3;

    // === 5. 부지 비용 (기본) ===
    const landScore = d.landCost * 0.5;

    // === 계절 보정 ===
    const seasonBonus = (seasonData.regionBonus[region.id] || 0);

    // === 종합 점수 (가중 합산, 0~100) ===
    const raw = (
      coolingScore * 0.25 +
      popScore     * 0.28 +
      gridScore    * 0.22 +
      renewScore   * 0.12 +
      heatBonus    * 0.08 +
      landScore    * 0.05 +
      seasonBonus
    );

    scores[region.id] = Math.max(0, Math.min(100, raw));
  });

  return scores;
}

/**
 * 체크리스트 평가
 */
function evaluateChecklist(params, season) {
  const s = SEASON_DATA[season];
  const results = {};

  // 열 환경
  const tempOK = params.temperature < 38 && params.coolingLevel <= 4;
  results.temp = tempOK
    ? { status: 'checked', msg: `${params.temperature}°C — 냉각 부하 관리 가능 범위` }
    : { status: 'failed', msg: `${params.temperature}°C — 냉각 부하 임계치 초과 위험` };

  // 소음
  const radii = calcNoiseRadius(params.noiseDB);
  const noiseOK = radii.inhabitable < 200;
  results.noise = noiseOK
    ? { status: 'checked', msg: `거주 불가 반경 ${radii.inhabitable}m — 허용 범위` }
    : { status: 'warning', msg: `거주 불가 반경 ${radii.inhabitable}m — 이격거리 확보 필요` };

  // 전력
  const powerOK = params.powerDemand <= 300 || s.gridMultiplier > 0.6;
  results.power = powerOK
    ? { status: 'checked', msg: `${params.powerDemand}MW — ${s.label} 전력망 수용 가능` }
    : { status: 'failed', msg: `${params.powerDemand}MW — 전력망 부하율 ${s.gridLoad}% 상황에서 위험` };

  // 인구
  const popOK = params.popAvoidance >= 3;
  results.pop = popOK
    ? { status: 'checked', msg: '인구밀도 회피 강도 충분' }
    : { status: 'warning', msg: '인구밀도 기준 완화 — 님비 리스크 상존' };

  // 재생에너지
  const renewOK = params.renewRatio >= 30;
  results.renew = renewOK
    ? { status: 'checked', msg: `재생에너지 ${params.renewRatio}% — 탄소중립 기여` }
    : { status: 'warning', msg: `재생에너지 ${params.renewRatio}% — 화력 의존도 높음` };

  // 폐열 활용
  results.heat = params.heatIntegration >= 1
    ? { status: 'checked', msg: `폐열 ${HEAT_LABELS[params.heatIntegration]} — 지역사회 편익 창출` }
    : { status: 'warning', msg: '폐열 미활용 — 지역 수용성 저하 우려' };

  return results;
}

/**
 * 경고 메시지 생성
 */
function generateWarnings(params, season) {
  const warnings = [];
  const s = SEASON_DATA[season];

  if (params.temperature >= 40) {
    warnings.push({ level: 'critical', msg: '🌡️ 극단적 외기온도 — 냉각 시스템 설계 한계 도달 가능' });
  }
  if (s.gridLoad >= 90 && params.powerDemand >= 300) {
    warnings.push({ level: 'critical', msg: `⚡ ${s.label} 전력 피크 시 ${params.powerDemand}MW 수요는 계통 불안정 위험` });
  }
  if (params.noiseDB >= 85) {
    const r = calcNoiseRadius(params.noiseDB);
    warnings.push({ level: 'critical', msg: `🔊 소음 ${params.noiseDB}dB — 반경 ${r.inhabitable}m 거주 불가, 주거지 이격 필수` });
  }
  if (params.popAvoidance <= 2 && params.noiseDB >= 75) {
    warnings.push({ level: 'moderate', msg: '👥 낮은 인구 회피 기준 + 높은 소음 → 님비 갈등 고위험' });
  }
  if (params.renewRatio < 20) {
    warnings.push({ level: 'moderate', msg: '♻️ 재생에너지 비율 미달 — 2030 탄소중립 목표와 상충' });
  }
  if (season === 'summer' && params.coolingLevel >= 4) {
    warnings.push({ level: 'moderate', msg: '☀️ 여름철 최대 냉각 부하 + 전력 피크 시기 중복 — 계획적 수요조정 필요' });
  }
  if (season === 'winter' && params.powerDemand >= 250) {
    warnings.push({ level: 'moderate', msg: '❄️ 겨울 난방 수요 급증 시기 대규모 데이터센터 — 계통 보강 협의 필요' });
  }
  if (params.heatIntegration === 0 && params.coolingLevel >= 3) {
    warnings.push({ level: 'moderate', msg: '🌡️ 냉각 폐열 미활용 — 지역사회 연계로 수용성 향상 권장' });
  }
  if (s.seasonNote) {
    warnings.push({ level: 'info', msg: `📋 계절 주의: ${s.seasonNote}` });
  }

  return warnings;
}

/**
 * 상위 지역 랭킹 반환
 */
function getRanking(scores, n = 7) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, score]) => ({
      region: REGIONS.find(r => r.id === id),
      score: Math.round(score),
    }));
}
