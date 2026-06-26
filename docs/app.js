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

const dropzone = document.getElementById("dropzone");

// モーダル
const modal = document.getElementById("edit-modal");
const modalTitle = document.getElementById("modal-title");
const modalTextarea = document.getElementById("modal-textarea");
const modalSave = document.getElementById("modal-save");
const modalCancel = document.getElementById("modal-cancel");

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
// ハッシュURLでページ切替
// ===============================
function showView(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.remove("hidden");
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
      <img class="work-image" src="${item.image}" alt="">
      <div class="work-body">
        <p class="work-title">${item.title}</p>
        <p class="work-tags">${item.tags.join(" ")}</p>
        <p class="work-description">${item.description}</p>

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
}

// ===============================
// ビューアを開く
// ===============================
function openViewer(index) {
  currentIndex = index;
  const item = works[index];

  viewerImage.src = item.image;
  viewerTitle.textContent = item.title;
  viewerTags.textContent = item.tags.join(" ");
  viewerDescription.textContent = item.description;

  viewer.classList.add("open");
}

// ===============================
// ビューアを閉じる
// ===============================
function closeViewer() {
  viewer.classList.remove("open");
}

// ===============================
// 暗い部分クリックで閉じる
// ===============================
viewer.addEventListener("click", (e) => {
  const clickedInsideImage =
    e.target === viewerImage ||
    e.target.closest(".viewer-right") ||
    e.target.closest(".viewer-arrow");

  if (!clickedInsideImage) {
    closeViewer();
  }
});

// ESC で閉じる
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeViewer();
});

// 左右キーで画像切り替え
document.addEventListener("keydown", (e) => {
  if (!viewer.classList.contains("open")) return;

  if (e.key === "ArrowLeft") {
    currentIndex = (currentIndex - 1 + works.length) % works.length;
    openViewer(currentIndex);
  }

  if (e.key === "ArrowRight") {
    currentIndex = (currentIndex + 1) % works.length;
    openViewer(currentIndex);
  }
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
// 削除
// ===============================
async function deleteWork(id) {
  if (!confirm("削除しますか？")) return;

  const res = await fetch(`${API_BASE}/works/${id}`, {
    method: "DELETE"
  });

  if (res.ok) {
    await loadWorks();
  } else {
    alert("削除に失敗しました");
  }
}

// ===============================
// 編集
// ===============================
async function editWork(item) {
  const title = prompt("タイトル", item.title);
  if (title === null) return;

  const tags = prompt("タグ（スペース区切り）", item.tags.join(" "));
  if (tags === null) return;

  const description = prompt("説明", item.description);
  if (description === null) return;

  await fetch(`${API_BASE}/works/${item.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      tags: tags.split(" "),
      description
    })
  });

  await loadWorks();
}

// ===============================
// アップロード（ドラッグ＆ドロップ）
// ===============================
if (dropzone) {
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("hover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("hover");
  });

  dropzone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropzone.classList.remove("hover");

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const title = prompt("タイトル");
    if (title === null) return;

    const tags = prompt("タグ（スペース区切り）", "");
    if (tags === null) return;

    const description = prompt("説明", "");
    if (description === null) return;

    const form = new FormData();
    form.append("file", file);
    form.append("meta", JSON.stringify({
      title,
      tags,
      description
    }));

    await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: form
    });

    await loadWorks();
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
// ABOUT / INFO 編集（モーダル版）
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

const btnEditAbout = document.getElementById("edit-about");
if (btnEditAbout) {
  btnEditAbout.addEventListener("click", () => {
    const current = document.getElementById("about-content").innerHTML;
    openModal("about", current);
  });
}

const btnEditInfo = document.getElementById("edit-info");
if (btnEditInfo) {
  btnEditInfo.addEventListener("click", () => {
    const current = document.getElementById("info-content").innerHTML;
    openModal("info", current);
  });
}

// ===============================
// 初期ロード
// ===============================
loadWorks();
loadAbout();
loadInfo();
