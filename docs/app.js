/* ============================================
   Config
============================================ */
const API_BASE = "https://delicate-sunset-ea8a.d08084222816.workers.dev/";

/* ============================================
   Routing（About / 制作について だけハッシュ）
============================================ */
window.addEventListener("hashchange", renderPage);
window.addEventListener("load", renderPage);

function renderPage() {
  const hash = location.hash.replace("#", "") || "gallery";

  document.querySelectorAll(".page").forEach(p => p.style.display = "none");

  const page = document.getElementById(hash);
  if (page) page.style.display = "block";

  if (hash === "gallery") loadGallery();
  if (hash === "about") loadAbout();
  if (hash === "works-info") loadWorksInfo();
}

/* ============================================
   Gallery（6列タイル）
============================================ */
async function loadGallery() {
  const container = document.getElementById("gallery-container");
  container.innerHTML = "";

  const res = await fetch(`${API_BASE}works`);
  const works = await res.json();

  works.forEach(work => {
    const item = document.createElement("div");
    item.className = "masonry-item";
    item.innerHTML = `<img src="${work.image}" alt="">`;
    item.addEventListener("click", () => openDetail(work));
    container.appendChild(item);
  });
}

/* ============================================
   詳細ビュー（暗転＋左3/5＋右2/5）
============================================ */
let currentWork = null;

function openDetail(work) {
  currentWork = work;

  // 画像セット
  document.getElementById("overlay-image").src = work.image;

  // タイトル
  document.getElementById("detail-title").textContent = work.title || "";

  // タグ（Lightroom風 pill）
  const tagList = document.getElementById("detail-tags");
  tagList.innerHTML = "";
  (work.tags || []).forEach(tag => {
    const t = document.createElement("span");
    t.className = "tag";
    t.textContent = tag;
    tagList.appendChild(t);
  });

  // 説明
  document.getElementById("detail-description").innerHTML = work.description || "";

  // 編集モードOFF
  document.getElementById("detail-edit-mode").style.display = "none";

  // オーバーレイ表示
  const overlay = document.getElementById("overlay");
  overlay.style.display = "block";

  // アニメーション開始
  requestAnimationFrame(() => {
    overlay.classList.add("show");
    overlay.classList.add("show-right");
  });
}

/* 暗転背景クリックで閉じる */
document.getElementById("overlay-bg").addEventListener("click", closeOverlay);

function closeOverlay() {
  const overlay = document.getElementById("overlay");
  overlay.classList.remove("show");
  overlay.classList.remove("show-right");

  setTimeout(() => {
    overlay.style.display = "none";
  }, 200);
}

/* ============================================
   トリプルクリックで編集モード
============================================ */
document.getElementById("overlay-right").addEventListener("click", (e) => {
  if (e.detail === 3) enterDetailEditMode();
});

function enterDetailEditMode() {
  if (!currentWork) return;

  document.getElementById("edit-tags").value = (currentWork.tags || []).join(", ");
  document.getElementById("edit-description").value = currentWork.description || "";

  document.getElementById("detail-edit-mode").style.display = "block";
}

/* 保存 */
document.getElementById("save-detail").addEventListener("click", async () => {
  const tags = document.getElementById("edit-tags").value.split(",").map(t => t.trim());
  const description = document.getElementById("edit-description").value;

  const body = {
    ...currentWork,
    tags,
    description
  };

  await fetch(`${API_BASE}works/${currentWork.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  openDetail(body);
});

/* ============================================
   ABOUT
============================================ */
async function loadAbout() {
  const res = await fetch(`${API_BASE}about`);
  if (res.status === 200) {
    const html = await res.text();
    document.getElementById("about-content").innerHTML = html;
  }
}

document.getElementById("about-content").addEventListener("click", (e) => {
  if (e.detail === 3) enterAboutEdit();
});

function enterAboutEdit() {
  document.getElementById("about-editor").value =
    document.getElementById("about-content").innerHTML;

  document.getElementById("about-view").style.display = "none";
  document.getElementById("about-edit").style.display = "block";
}

document.getElementById("save-about").addEventListener("click", async () => {
  const html = document.getElementById("about-editor").value;

  await fetch(`${API_BASE}about`, {
    method: "PUT",
    headers: { "Content-Type": "text/html" },
    body: html
  });

  loadAbout();
  document.getElementById("about-view").style.display = "block";
  document.getElementById("about-edit").style.display = "none";
});

/* ============================================
   制作について
============================================ */
async function loadWorksInfo() {
  const res = await fetch(`${API_BASE}works-info`);
  if (res.status === 200) {
    const html = await res.text();
    document.getElementById("works-info-content").innerHTML = html;
  }
}

document.getElementById("works-info-content").addEventListener("click", (e) => {
  if (e.detail === 3) enterWorksInfoEdit();
});

function enterWorksInfoEdit() {
  document.getElementById("works-info-editor").value =
    document.getElementById("works-info-content").innerHTML;

  document.getElementById("works-info-view").style.display = "none";
  document.getElementById("works-info-edit").style.display = "block";
}

document.getElementById("save-works-info").addEventListener("click", async () => {
  const html = document.getElementById("works-info-editor").value;

  await fetch(`${API_BASE}works-info`, {
    method: "PUT",
    headers: { "Content-Type": "text/html" },
    body: html
  });

  loadWorksInfo();
  document.getElementById("works-info-view").style.display = "block";
  document.getElementById("works-info-edit").style.display = "none";
});
