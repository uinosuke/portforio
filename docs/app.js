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

const btnPrev = document.getElementById("viewer-prev");
const btnNext = document.getElementById("viewer-next");
const viewerCloseBtn = document.getElementById("viewer-close-btn");

// PC検索
const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");

// スマホ検索
const mobileSearchInput = document.getElementById("mobile-search-input");
const mobileSearchBtn = document.getElementById("mobile-search-btn");

// モーダル
const modal = document.getElementById("edit-modal");
const modalTitle = document.getElementById("modal-title");
const modalTextarea = document.getElementById("modal-textarea");
const modalSave = document.getElementById("modal-save");
const modalCancel = document.getElementById("modal-cancel");

// スマホ viewer（ボトムシート）
const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
const mobileMenuPanel = document.querySelector(".mobile-menu-panel");
const viewerRight = document.querySelector(".viewer-right");
const viewerLeft = document.querySelector(".viewer-left");
const dragHandle = document.querySelector(".viewer-drag-handle");

let adminMode = false;
let works = [];
let currentIndex = 0;
let currentEditType = ""; // "about" or "info"

// ===============================
// 管理者モード（ダブルクリック）
// ===============================
document.addEventListener("dblclick", () => {
  adminMode = !adminMode;
  document.body.classList.toggle("admin-mode", adminMode);
});

// ===============================
// スマホ：ハンバーガー開閉
// ===============================
mobileMenuBtn.addEventListener("click", () => {
  mobileMenuPanel.classList.toggle("open");
});

// ===============================
// ハッシュURLでページ切替
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

window.addEventListener("hashchange", () => {
  const view = location.hash.replace("#", "") || "gallery";
  showView(view);
});

// ===============================
// 画像一覧押したらフィルター解除
// ===============================
document.querySelectorAll(".nav-item[data-view='gallery']").forEach(btn => {
  btn.addEventListener("click", () => {
    searchInput.value = "";
    mobileSearchInput.value = "";
    searchClear.style.display = "none";
    filterWorks("");
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
      <img class="work-image" src="${item.image}" alt="">
      <div class="work-body">
        <p class="work-title">${item.title}</p>

        <div class="work-actions admin-only">
          <button class="edit-button" data-id="${item.id}">編集</button>
          <button class="delete-button" data-id="${item.id}">削除</button>
        </div>
      </div>
    `;

    card.querySelector(".work-image").addEventListener("click", () => {
      openViewer(index);
    });

    card.querySelector(".edit-button").addEventListener("click", () => {
      editWork(item);
    });

    card.querySelector(".delete-button").addEventListener("click", () => {
      deleteWork(item.id);
    });

    worksList.appendChild(card);
  });

  filterWorks(searchInput.value.trim());
}

// ===============================
// viewer を開く
// ===============================
function openViewer(index) {
  currentIndex = index;
  const item = works[index];

  viewerImage.src = item.image;
  viewerTitle.textContent = item.title;

  const tagsArray = Array.isArray(item.tags)
    ? item.tags
    : item.tags.split(" ").filter(t => t.trim() !== "");

  viewerTags.innerHTML = tagsArray
    .map(tag => `<span class="tag">${tag}</span>`)
    .join("");

  viewerDescription.textContent = item.description;

  viewer.classList.add("open");

  if (window.innerWidth <= 768) {
    viewerLeft.style.display = "flex";
    viewerRight.classList.remove("open-full");
  }
}

// ===============================
// viewer × ボタンで閉じる
// ===============================
viewerCloseBtn.addEventListener("click", () => {
  viewer.classList.remove("open");
});

// ===============================
// 暗い部分クリックで閉じる
// ===============================
viewer.addEventListener("click", (e) => {
  const clickedInside =
    e.target === viewerImage ||
    e.target.closest(".viewer-right") ||
    e.target.closest(".viewer-arrow") ||
    e.target === viewerCloseBtn;

  if (!clickedInside) viewer.classList.remove("open");
});

// ESC で閉じる
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") viewer.classList.remove("open");
});

// ===============================
// 前後の画像へ
// ===============================
btnPrev.addEventListener("click", (e) => {
  e.stopPropagation();
  currentIndex = (currentIndex - 1 + works.length) % works.length;
  openViewer(currentIndex);
});

btnNext.addEventListener("click", (e) => {
  e.stopPropagation();
  currentIndex = (currentIndex + 1) % works.length;
  openViewer(currentIndex);
});

// ===============================
// スマホ：viewer-right スワイプで展開/縮小
// ===============================
let startY = 0;
let currentY = 0;
let isDragging = false;

function enableDragSheet() {
  if (!viewerRight) return;

  // 上端付近（drag-handle 付近）からのスワイプだけを有効にする
  viewerRight.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const rect = viewerRight.getBoundingClientRect();
    const offsetY = touch.clientY - rect.top;

    // 上から 60px 以内（ハンドル周辺）で開始したときだけドラッグ扱い
    if (offsetY <= 60) {
      startY = touch.clientY;
      isDragging = true;
    } else {
      isDragging = false;
    }
  });

  viewerRight.addEventListener("touchmove", (e) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    currentY = touch.clientY;
    const diff = startY - currentY;

    // 上方向へ 20px 以上 → 展開
    if (diff > 20) {
      viewerRight.classList.add("open-full");
    }

    // 下方向へ 20px 以上 → 閉じる
    if (diff < -20) {
      viewerRight.classList.remove("open-full");
    }
  });

  viewerRight.addEventListener("touchend", () => {
    isDragging = false;
  });

  // タップでもトグルしたい場合（お好みで）
  if (dragHandle) {
    dragHandle.addEventListener("click", () => {
      viewerRight.classList.toggle("open-full");
    });
  }
}

window.addEventListener("load", () => {
  if (window.innerWidth <= 768) {
    enableDragSheet();
  }
});

// ===============================
// スマホ検索ボタン
// ===============================
mobileSearchBtn.addEventListener("click", () => {
  const keyword = mobileSearchInput.value.trim();
  searchInput.value = keyword;
  filterWorks(keyword);

  mobileMenuPanel.classList.remove("open");
  showView("gallery");
});

// ===============================
// PC検索
// ===============================
searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.trim();
  searchClear.style.display = keyword ? "block" : "none";
  filterWorks(keyword);
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  searchClear.style.display = "none";
  filterWorks("");
});

// ===============================
// フィルタ処理
// ===============================
function filterWorks(keyword) {
  const cards = document.querySelectorAll(".work-card");
  const k = keyword.toLowerCase();

  cards.forEach((card, index) => {
    const item = works[index];

    const title = item.title.toLowerCase();
    const tags = Array.isArray(item.tags)
      ? item.tags.join(" ").toLowerCase()
      : item.tags.toLowerCase();
    const desc = item.description.toLowerCase();

    const match =
      title.includes(k) ||
      tags.includes(k) ||
      desc.includes(k);

    card.style.display = match ? "block" : "none";
  });
}

// ===============================
// ABOUT / INFO 読み込み
// ===============================
async function loadAbout() {
  const res = await fetch(`${API_BASE}/about`);
  const html = await res.text();
  const el = document.getElementById("about-content");
  if (el) el.innerHTML = html;
}

async function loadInfo() {
  const res = await fetch(`${API_BASE}/works-info`);
  const html = await res.text();
  const el = document.getElementById("info-content");
  if (el) el.innerHTML = html;
}

// ===============================
/* 編集モーダル */
// ===============================
function openModal(type, currentHTML) {
  currentEditType = type;
  modalTitle.textContent = type === "about" ? "ABOUT を編集" : "制作について を編集";
  modalTextarea.value = currentHTML;
  modal.classList.add("open");
}

modalCancel.addEventListener("click", () => {
  modal.classList.remove("open");
});

modalSave.addEventListener("click", async () => {
  const newHTML = modalTextarea.value;

  if (currentEditType === "about") {
    await fetch(`${API_BASE}/about`, {
      method: "PUT",
      body: newHTML
    });
    await loadAbout();
  }

  if (currentEditType === "info") {
    await fetch(`${API_BASE}/works-info`, {
      method: "PUT",
      body: newHTML
    });
    await loadInfo();
  }

  modal.classList.remove("open");
});

document.getElementById("edit-about")?.addEventListener("click", () => {
  const current = document.getElementById("about-content").innerHTML;
  openModal("about", current);
});

document.getElementById("edit-info")?.addEventListener("click", () => {
  const current = document.getElementById("info-content").innerHTML;
  openModal("info", current);
});

// ===============================
// 初期ロード
// ===============================
window.addEventListener("load", () => {
  loadWorks();
  loadAbout();
  loadInfo();
});
