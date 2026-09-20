/**
 * matrix.js — 탭2: 매트릭스 섹션 초기화 (현재 HTML에 정적으로 렌더링됨)
 * 추후 확장을 위한 보조 유틸리티
 */

function initMatrix() {
  // 탭2의 정적 카드들은 HTML에 이미 렌더링됨
  // 계절 버튼과 차트는 chart-power.js에서 처리
  initMatrixSeasonBtns();
  updatePowerChart('summer', 3);
}
