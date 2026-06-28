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
const viewerDate = document.getElementById("viewer-date");
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

// 編集モーダル
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

// ★ アップロード関連（新ステップ式）
const uploadDropzone = document.getElementById("upload-dropzone");
const uploadStepModal = document.getElementById("upload-step-modal");
const uploadStepTitle = document.getElementById("upload-step-title");
const uploadStepInput = document.getElementById("upload-step-input");
const uploadStepMonth = document.getElementById("upload-step-month");
const uploadStepTextarea = document.getElementById("upload-step-textarea");
const uploadStepOk = document.getElementById("upload-step-ok");

let adminMode = false;
let works = [];
let currentIndex = 0;
let currentEditType = "";

let uploadFile = null;
let uploadStep = 0;
let uploadData = {
  file: null,
  title: "",
  tags: "",
  date: "",
  description: ""
};

// ===============================
// 管理者モード（4回クリック）
// ===============================
let adminClickCount = 0;
let adminClickTimer = null;

document.addEventListener("click", () => {
  adminClickCount++;

  if (adminClickCount === 4) {
    adminMode = !adminMode;
    document.body.classList.toggle("admin-mode", adminMode);
    adminClickCount = 0;
    clearTimeout(adminClickTimer);
    return;
  }

  clearTimeout(adminClickTimer);
  adminClickTimer = setTimeout(() => {
    adminClickCount = 0;
  }, 500);
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

    // ★ カードクリック → viewer を開く（ボタンは除外）
    card.addEventListener("click", (e) => {
      if (e.target.closest(".edit-button") || e.target.closest(".delete-button")) {
        return;
      }
      openViewer(index);
    });

    // ★ 編集ボタン
    card.querySelector(".edit-button").addEventListener("click", (e) => {
      e.stopPropagation();
      editWork(item);
    });

    // ★ 削除ボタン
    card.querySelector(".delete-button").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteWork(item.id);
    });

    worksList.appendChild(card);
  });

  filterWorks(searchInput.value.trim());
}
// ===============================
// ステップ式アップロード：入力確定ボタン
// ===============================
uploadStepOk.addEventListener("click", () => {
  if (uploadStep === 0) {
    uploadData.title = uploadStepInput.value.trim();
  }
  if (uploadStep === 1) {
    uploadData.tags = uploadStepInput.value.trim();
  }
  if (uploadStep === 2) {
    uploadData.date = uploadStepMonth.value;
  }
  if (uploadStep === 3) {
    uploadData.description = uploadStepTextarea.value.trim();
  }

  uploadStep++;
  openUploadStepModal();
});

// 外側クリックで閉じる
uploadStepModal.addEventListener("click", (e) => {
  if (e.target === uploadStepModal) {
    uploadStepModal.classList.remove("open");
    uploadStepOk.style.display = "block";
  }
});

// ===============================
// ★ アップロード送信（Workers 仕様）
// ===============================
async function uploadWork() {
  const formData = new FormData();

  formData.append("file", uploadData.file);

  formData.append("meta", JSON.stringify({
    title: uploadData.title,
    tags: uploadData.tags,
    date: uploadData.date,
    description: uploadData.description
  }));

  await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData
  });

  uploadStepModal.classList.remove("open");
  uploadStepOk.style.display = "block";

  uploadData = { file: null, title: "", tags: "", date: "", description: "" };
  uploadStep = 0;

  loadWorks();
}

// ===============================
// 編集処理
// ===============================
function editWork(item) {
  const newTitle = prompt("タイトルを編集", item.title);
  if (newTitle === null) return;

  const newTags = prompt("タグ（スペース区切り）", Array.isArray(item.tags) ? item.tags.join(" ") : item.tags);
  if (newTags === null) return;

  const newDate = prompt("年月 (YYYY-MM)", item.date || "");
  if (newDate === null) return;

  const newDesc = prompt("説明文", item.description);
  if (newDesc === null) return;

  fetch(`${API_BASE}/works/${item.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: newTitle,
      tags: newTags.split(" "),
      date: newDate,
      description: newDesc
    })
  }).then(() => loadWorks());
}

// ===============================
// 削除処理
// ===============================
function deleteWork(id) {
  if (!confirm("本当に削除しますか？")) return;

  fetch(`${API_BASE}/works/${id}`, {
    method: "DELETE"
  }).then(() => loadWorks());
}

// ===============================
// 初期ロード
// ===============================
window.addEventListener("load", () => {
  loadWorks();
  loadAbout();
  loadInfo();
});
// ===============================
// ステップ式アップロードモーダルを開く
// ===============================
function openUploadStepModal() {
  uploadStepModal.classList.add("open");

  uploadStepInput.style.display = "none";
  uploadStepMonth.style.display = "none";
  uploadStepTextarea.style.display = "none";
  uploadStepOk.style.display = "block";

  if (uploadStep === 0) {
    uploadStepTitle.textContent = "タイトルを入力してください";
    uploadStepInput.style.display = "block";
    uploadStepInput.value = uploadData.title;
  }

  if (uploadStep === 1) {
    uploadStepTitle.textContent = "タグを入力してください（スペース区切り）";
    uploadStepInput.style.display = "block";
    uploadStepInput.value = uploadData.tags;
  }

  if (uploadStep === 2) {
    uploadStepTitle.textContent = "月を選択してください";
    uploadStepMonth.style.display = "block";
    uploadStepMonth.value = uploadData.date;
  }

  if (uploadStep === 3) {
    uploadStepTitle.textContent = "概要を入力してください";
    uploadStepTextarea.style.display = "block";
    uploadStepTextarea.value = uploadData.description;
  }

  if (uploadStep === 4) {
    uploadStepTitle.textContent = "アップロード中…";
    uploadStepInput.style.display = "none";
    uploadStepMonth.style.display = "none";
    uploadStepTextarea.style.display = "none";
    uploadStepOk.style.display = "none";

    uploadWork();
  }
}

// ===============================
// ABOUT 読み込み
// ===============================
async function loadAbout() {
  const res = await fetch(`${API_BASE}/about`);
  const html = await res.text();
  const el = document.getElementById("about-content");
  if (el) el.innerHTML = html;
}

// ===============================
// INFO 読み込み
// ===============================
async function loadInfo() {
  const res = await fetch(`${API_BASE}/works-info`);
  const html = await res.text();
  const el = document.getElementById("info-content");
  if (el) el.innerHTML = html;
}
