const RESOURCES = [
  {
    id: 1,
    category: "tip",
    title: "발표 시작 3초의 법칙",
    date: "2026.06.12",
    content: (
      <>
        <p>발표의 첫 3초가 청중의 첫인상을 결정합니다.</p>
        <p><strong>자신감 있는 자세</strong>로 청중을 바라보며 시작하세요.</p>
        <p>첫 문장은 짧고 강렬하게, 질문이나 통계로 시작하면 효과적입니다.</p>
      </>
    ),
  },
  {
    id: 2,
    category: "tip",
    title: "필러워드 줄이는 방법",
    date: "2026.06.12",
    content: (
      <>
        <p><strong>'음', '어', '그'</strong> 같은 필러워드는 자신감 부족으로 보일 수 있습니다.</p>
        <p>말하기 전 잠깐 멈추는 습관을 들이고, 침묵을 두려워하지 마세요.</p>
        <p>짧은 침묵은 오히려 신뢰감을 줍니다.</p>
      </>
    ),
  },
  {
    id: 3,
    category: "guide",
    title: "시선 처리 꿀팁",
    date: "2026.06.12",
    content: (
      <>
        <p>청중 전체를 골고루 바라보세요.</p>
        <p>한 사람과 <strong>3~5초</strong> 눈을 맞춘 후 다른 사람으로 이동하는 방식이 효과적입니다.</p>
        <p><strong>화면이나 발표 자료만 보는 건 금물입니다.</strong></p>
      </>
    ),
  },
  {
    id: 4,
    category: "tip",
    title: "발표 잘하는 법 (영상)",
    date: "2026.06.12",
    content: (
      <>
        <iframe
          width="100%"
          height="315"
          src="https://www.youtube.com/embed/eVFzbxmKNUw"
          allowFullScreen
          style={{ borderRadius: "12px", border: "none" }}
        />
      </>
    ),
  },
  {
    id: 5,
    category: "guide",
    title: "발표 유형별 주의사항",
    date: "2026.06.12",
    content: (
      <>
        <p><strong>발표 전 꼭 확인하세요!</strong></p>
        <p><span style={{ color: "red" }}>❌ 절대 하면 안 되는 것</span></p>
        <ul style={{ paddingLeft: "20px", lineHeight: "2" }}>
          <li><span style={{ color: "red" }}>화면만 보며 발표하기</span></li>
          <li><span style={{ color: "red" }}>'음', '어' 과도하게 사용하기</span></li>
          <li><span style={{ color: "red" }}>너무 빠른 말 속도</span></li>
        </ul>

        <p style={{ marginTop: "16px" }}><strong>발표 유형별 핵심 포인트</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", fontSize: "15px" }}>
          <thead>
            <tr style={{ background: "#E5F4EF" }}>
              <th style={{ padding: "10px 14px", textAlign: "left", borderRadius: "8px 0 0 0" }}>유형</th>
              <th style={{ padding: "10px 14px", textAlign: "left" }}>핵심</th>
              <th style={{ padding: "10px 14px", textAlign: "left", borderRadius: "0 8px 0 0" }}>주의</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #E5F0EC" }}>
              <td style={{ padding: "10px 14px" }}>학교 발표</td>
              <td style={{ padding: "10px 14px" }}>논리적 흐름</td>
              <td style={{ padding: "10px 14px", color: "red" }}>근거 부족</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #E5F0EC" }}>
              <td style={{ padding: "10px 14px" }}>면접</td>
              <td style={{ padding: "10px 14px" }}>자신감 있는 태도</td>
              <td style={{ padding: "10px 14px", color: "red" }}>시선 회피</td>
            </tr>
            <tr>
              <td style={{ padding: "10px 14px" }}>PT 발표</td>
              <td style={{ padding: "10px 14px" }}>핵심 메시지 강조</td>
              <td style={{ padding: "10px 14px", color: "red" }}>슬라이드 의존</td>
            </tr>
          </tbody>
        </table>
      </>
    ),
  },
];

export default RESOURCES;
