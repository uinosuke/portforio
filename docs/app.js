// ===============================
// 設定
// ===============================
const API_BASE = "https://delicate-sunset-ea8a.d08084222816.workers.dev";

// ===============================
// DOM 取得
// ===============================
const worksList = document.getElementById("works-list");
const viewer = document.getElementById("image-viewer");

const viewerImage = document.getElementById("viewer-image");
const viewerTitle = document.getElementById("viewer-title");
const viewerTags = document.getElementById("viewer-tags");
const viewerDescription = document.getElementById("viewer-description");

const dropzone = document.getElementById("dropzone");

// 検索
const searchBox = document.querySelector(".search-box");
const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");

// スマホメニュー
const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
const mobileMenuPanel = document.querySelector(".mobile-menu-panel");

let works = [];
let currentIndex = 0;

// ===============================
// スマホ：検索バー移動
// ===============================
function moveSearch() {
  if (window.innerWidth <= 768) {
    if (!mobileMenuPanel.contains(searchBox)) {
      mobileMenuPanel.appendChild(searchBox);
    }
  } else {
    const header = document.querySelector(".header");
    if (!header.contains(searchBox)) {
      header.appendChild(searchBox);
    }
  }
}

window.addEventListener("resize", moveSearch);
window.addEventListener("load", moveSearch);

// ===============================
// ハンバーガー開閉
// ===============================
mobileMenuBtn.addEventListener("click", () => {
  mobileMenuPanel.classList.toggle("open");
});

// ===============================
// VIEW 切替
// ===============================
function showView(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.remove("hidden");
  mobileMenuPanel.classList.remove("open");
}

window.addEventListener("load", () => {
  const view = location.hash.replace("#", "") || "gallery";
  showView(view);
});

document.querySelectorAll(".nav-item[data-view]").forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    location.hash = view;
    showView(view);
  });
});
