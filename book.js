(function () {
  const cfg = window.BOOK_CONFIG;
  const TOTAL = cfg.totalPages;
  const MOBILE_MQ = window.matchMedia("(max-width: 760px)");

  const root = document.documentElement;
  const stage = document.getElementById("stage");
  const holder = document.getElementById("book-holder");
  const tocEl = document.getElementById("toc");
  const range = document.getElementById("progress-range");
  const label = document.getElementById("page-label");
  const edgeL = document.getElementById("edge-left");
  const edgeR = document.getElementById("edge-right");

  document.title = cfg.title || "Book";
  root.style.setProperty("--ratio", cfg.pageRatio);
  root.style.setProperty("--bg", cfg.background || "#131313");
  root.style.setProperty("--cover", cfg.coverColor || "#2180f5");

  let pageFlip = null;
  let current = 0; // 0부터 시작하는 페이지 인덱스

  // ---------- 페이지 DOM 만들기 ----------
  function buildPages() {
    const book = document.createElement("div");
    book.id = "book";
    for (let n = 1; n <= TOTAL; n++) {
      const isFront = n === 1;
      const isBack = n === TOTAL;
      const page = document.createElement("div");
      page.className = "page" + (isFront || isBack ? " cover" : "") + (isFront ? " front-cover" : "") + (isBack ? " back-cover" : "");
      page.dataset.density = isFront || isBack ? "hard" : "soft";

      const ph = document.createElement("div");
      ph.className = "placeholder";
      ph.textContent = isFront ? "FRONT COVER" : isBack ? "BACK COVER" : String(n);
      page.appendChild(ph);

      const img = document.createElement("img");
      img.alt = `Page ${n}`;
      img.draggable = false;
      img.decoding = "async";
      img.loading = n <= 3 || isBack ? "eager" : "lazy";
      img.onload = () => page.classList.add("img-ok");
      img.onerror = () => img.remove();
      img.src = cfg.imagePath(n);
      page.appendChild(img);

      book.appendChild(page);
    }
    holder.appendChild(book);
    return book;
  }

  // ---------- page-flip 초기화 ----------
  function init(startIndex) {
    const portrait = MOBILE_MQ.matches;
    stage.classList.toggle("portrait", portrait);

    const book = buildPages();
    pageFlip = new St.PageFlip(book, {
      width: Math.round(1000 * cfg.pageRatio),
      height: 1000,
      size: "stretch",
      // 모바일이면 minWidth를 크게 줘서 항상 한 페이지 모드로
      minWidth: portrait ? 100000 : 1,
      maxWidth: 200000,
      minHeight: 1,
      maxHeight: 200000,
      usePortrait: portrait,
      showCover: true,
      autoSize: false,
      maxShadowOpacity: 0.35,
      flippingTime: 700,
      showPageCorners: true,
      disableFlipByClick: false,
      useMouseEvents: true,
      mobileScrollSupport: false,
      startPage: startIndex || 0,
    });
    pageFlip.loadFromHTML(book.querySelectorAll(".page"));

    pageFlip.on("flip", (e) => update(e.data));
    pageFlip.on("changeState", (e) => {
      // 표지에서 넘기기 시작하면 바로 책을 가운데로 이동
      if (e.data === "flipping" || e.data === "user_fold") {
        if (current === 0) stage.classList.remove("front-closed");
        if (current >= TOTAL - 1) stage.classList.remove("back-closed");
      }
      if (e.data === "read") update(pageFlip.getCurrentPageIndex());
    });

    update(startIndex || 0);
  }

  function destroy() {
    if (!pageFlip) return;
    try { pageFlip.destroy(); } catch (_) {}
    holder.innerHTML = "";
    pageFlip = null;
  }

  // ---------- 상태 갱신 ----------
  function visiblePages(idx) {
    const p = idx + 1;
    if (p <= 1) return [1];
    if (p >= TOTAL) return [TOTAL];
    if (MOBILE_MQ.matches) return [p];
    // 펼친 면: 왼쪽은 짝수 페이지
    const left = p % 2 === 0 ? p : p - 1;
    return left + 1 <= TOTAL ? [left, left + 1] : [left];
  }

  function update(idx) {
    current = idx;
    const pages = visiblePages(idx);
    const first = pages[0];

    stage.classList.toggle("front-closed", first === 1);
    stage.classList.toggle("back-closed", first === TOTAL);

    range.value = idx;
    label.textContent = pages.length > 1 ? `${pages[0]}–${pages[1]} / ${TOTAL}` : `${first} / ${TOTAL}`;

    // 목차 하이라이트
    const items = tocEl.querySelectorAll(".toc-item");
    let activeI = -1;
    (cfg.toc || []).forEach((t, i) => { if (pages[pages.length - 1] >= t.page) activeI = i; });
    items.forEach((el, i) => el.classList.toggle("active", i === activeI));

    // 종이 두께 (읽은 만큼 왼쪽이 두꺼워짐)
    const ratio = TOTAL > 1 ? idx / (TOTAL - 1) : 0;
    edgeL.style.setProperty("--ratio-edge", ratio.toFixed(3));
    edgeR.style.setProperty("--ratio-edge", (1 - ratio).toFixed(3));
  }

  // ---------- 목차 ----------
  (cfg.toc || []).forEach((t) => {
    const b = document.createElement("button");
    b.className = "toc-item";
    b.textContent = t.label;
    b.addEventListener("click", () => goTo(t.page - 1, true));
    tocEl.appendChild(b);
  });

  function goTo(idx, animate) {
    if (!pageFlip) return;
    idx = Math.max(0, Math.min(TOTAL - 1, idx));
    if (animate) {
      if (current === 0) stage.classList.remove("front-closed");
      pageFlip.flip(idx);
    } else {
      pageFlip.turnToPage(idx);
      update(idx);
    }
  }

  // ---------- 진행 바 ----------
  range.max = String(TOTAL - 1);
  range.addEventListener("input", () => goTo(Number(range.value), false));

  // ---------- 버튼 / 키보드 ----------
  document.getElementById("btn-prev").addEventListener("click", () => pageFlip && pageFlip.flipPrev());
  document.getElementById("btn-next").addEventListener("click", () => pageFlip && pageFlip.flipNext());
  window.addEventListener("keydown", (e) => {
    if (!pageFlip || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowRight") pageFlip.flipNext();
    if (e.key === "ArrowLeft") pageFlip.flipPrev();
  });

  // ---------- 리사이즈 ----------
  let resizeTimer;
  window.addEventListener("resize", () => {
    root.classList.add("resizing");
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => root.classList.remove("resizing"), 150);
  });

  // 데스크톱 ↔ 모바일 전환 시 다시 만들기
  MOBILE_MQ.addEventListener("change", () => {
    const keep = current;
    destroy();
    init(keep);
  });

  // 주소 뒤에 ?page=5 를 붙이면 그 페이지부터 열림
  const startParam = parseInt(new URLSearchParams(location.search).get("page"), 10);
  init(Number.isFinite(startParam) ? Math.max(0, Math.min(TOTAL - 1, startParam - 1)) : 0);
})();
