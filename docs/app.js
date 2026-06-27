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

// ===============================
// 作品一覧を取得
// ===============================
async function loadWorks() {
  const res = await fetch(`${API_BASE}/works`);
  works = await res.json();

  worksList.innerHTML = "";

  works.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "work-card";

    card.innerHTML = `
      <img class="work-image" src="${item.image}">
      <div class="work-body">
        <p class="work-title">${item.title}</p>
      </div>
    `;

    card.querySelector(".work-image").addEventListener("click", () => {
      openViewer(index);
    });

    worksList.appendChild(card);
  });
}

// ===============================
// viewer を dropzone の「下」に固定配置
// ===============================
dropzone.insertAdjacentElement("afterend", viewer);

// ===============================
// viewer 開く
// ===============================
function openViewer(index) {
  currentIndex = index;
  const item = works[index];

  viewerImage.src = item.image;
  viewerTitle.textContent = item.title;

  const tags = Array.isArray(item.tags)
    ? item.tags
    : item.tags.split(" ");

  viewerTags.innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join("");

  viewerDescription.textContent = item.description;

  viewer.classList.add("open");
}

// ===============================
// viewer 閉じる（外側クリック）
// ===============================
viewer.addEventListener("click", (e) => {
  if (!e.target.closest(".viewer-right") && e.target !== viewerImage) {
    viewer.classList.remove("open");
  }
});

// ===============================
// 検索
// ===============================
searchInput.addEventListener("input", () => {
  const k = searchInput.value.toLowerCase();
  searchClear.style.display = k ? "block" : "none";

  document.querySelectorAll(".work-card").forEach((card, i) => {
    const item = works[i];
    const match =
      item.title.toLowerCase().includes(k) ||
      item.description.toLowerCase().includes(k) ||
      item.tags.join(" ").toLowerCase().includes(k);

    card.style.display = match ? "block" : "none";
  });
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  searchClear.style.display = "none";
  loadWorks();
});

// ===============================
// 初期ロード
// ===============================
loadWorks();
