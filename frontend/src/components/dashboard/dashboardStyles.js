export const cardStyle = {
  background: "white",
  borderRadius: "28px",
  padding: "34px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  border: "1px solid #E4F0EA",
  marginBottom: "28px",
};

export const sectionTitle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "28px",
  color: "#2D3A3A",
  marginBottom: "30px",
  fontWeight: "900",
};

// 모든 분석 섹션에서 공통으로 사용하는 폰트 크기 기준
export const getFS = (isMobile) => ({
  sectionH:  isMobile ? "17px" : "24px",  // 항목별 점수, 시간 구간별 등 소제목
  label:     isMobile ? "14px" : "18px",  // 항목명, 카드 레이블
  body:      isMobile ? "13px" : "16px",  // 피드백 문장, 설명 텍스트
  small:     isMobile ? "11px" : "13px",  // 뱃지, 힌트
  score:     isMobile ? "36px" : "52px",  // 총점 큰 숫자
  stat:      isMobile ? "22px" : "34px",  // StatCard 수치
});
