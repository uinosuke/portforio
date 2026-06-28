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

  viewerDate.textContent = item.date || "";

  viewerDescription.textContent = item.description;

  viewer.classList.add("open");

  if (window.innerWidth <= 768) {
    viewerLeft.style.display = "flex";
    viewerRight.classList.remove("active");
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
// 前後の画像へ（PC）
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
function enableDragSheet() {
  if (!viewerRight) return;

  let startY = 0;
  let isDragging = false;

  viewerRight.addEventListener("touchstart", (e) => {
    const touchY = e.touches[0].clientY;
    const rect = viewerRight.getBoundingClientRect();
    const offsetY = touchY - rect.top;

    if (offsetY <= 60) {
      startY = touchY;
      isDragging = true;
    }
  });

  viewerRight.addEventListener("touchmove", (e) => {
    if (!isDragging) return;

    const diff = startY - e.touches[0].clientY;

    if (diff > 20) viewerRight.classList.add("active");
    if (diff < -20) viewerRight.classList.remove("active");
  });

  viewerRight.addEventListener("touchend", () => {
    isDragging = false;
  });

  if (dragHandle) {
    dragHandle.addEventListener("click", () => {
      viewerRight.classList.toggle("active");
    });
  }
}

// ===============================
// スマホ：左右スワイプで画像切り替え
// ===============================
function enableSwipeNavigation() {
  if (!viewerLeft) return;

  let startX = 0;
  let endX = 0;

  viewerLeft.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  viewerLeft.addEventListener("touchend", (e) => {
    endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    if (diff < -50) {
      currentIndex = (currentIndex + 1) % works.length;
      openViewer(currentIndex);
    }

    if (diff > 50) {
      currentIndex = (currentIndex - 1 + works.length) % works.length;
      openViewer(currentIndex);
    }
  });
}

window.addEventListener("load", () => {
  if (window.innerWidth <= 768) {
    enableDragSheet();
    enableSwipeNavigation();
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
    const date = (item.date || "").toLowerCase();

    const match =
      title.includes(k) ||
      tags.includes(k) ||
      desc.includes(k) ||
      date.includes(k);

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
// 編集モーダル
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
// ★ ステップ式アップロード：ドラッグ＆ドロップ
// ===============================
uploadDropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadDropzone.classList.add("dragover");
});

uploadDropzone.addEventListener("dragleave", () => {
  uploadDropzone.classList.remove("dragover");
});

uploadDropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadDropzone.classList.remove("dragover");

  uploadFile = e.dataTransfer.files[0];
  if (!uploadFile) return;

  uploadData.file = uploadFile;
  uploadStep = 0;
  openUploadStepModal();
});

// ===============================
// ★ ステップ式アップロードモーダル
// ===============================
function openUploadStepModal() {
  uploadStepModal.classList.add("open");

  uploadStepInput.style.display = "none";
  uploadStepMonth.style.display = "none";
  uploadStepTextarea.style.display = "none";

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
// ★ アップロード送信（Workers 仕様に完全対応）
// ===============================
async function uploadWork() {
  const formData = new FormData();

  // Workers が要求しているキー名に合わせる
  formData.append("file", uploadData.file);

  // meta を JSON で送る（Workers の仕様）
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
// 初期ロード
// ===============================
window.addEventListener("load", () => {
  loadWorks();
  loadAbout();
  loadInfo();
});
