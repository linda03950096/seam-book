// =====================================================
//  책 설정 — 이 파일만 고치면 됩니다
// =====================================================
window.BOOK_CONFIG = {
  // 브라우저 탭에 보이는 제목
  title: "Seam — UX Process Book",

  // 전체 페이지 수 (앞표지 + 내지 + 뒷표지). 짝수여야 뒷표지가 혼자 닫힌 모습으로 보입니다.
  totalPages: 26,

  // 한 페이지의 가로:세로 비율 (가로 ÷ 세로). 이미지가 1200×800 이므로 3:2
  pageRatio: 1200 / 800,

  // 이미지 경로. pages 폴더의 page-001.png, page-002.png ...
  imagePath: (n) => `pages/page-${String(n).padStart(3, "0")}.png`,

  // 표지 기본 색 (이미지가 로딩되기 전 잠깐 보이는 색)
  coverColor: "#ffffff",

  // 배경색
  background: "#131313",

  // 왼쪽 목차. page는 시작 페이지 번호(1부터).
  toc: [
    { label: "Background", page: 3 },
    { label: "Opportunity", page: 11 },
    { label: "Solution", page: 13 },
    { label: "Branding", page: 23 },
  ],
};
