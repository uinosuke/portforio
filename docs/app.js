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
const modalBack = document.getElementById("modal-back"); // ★追加

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
const uploadStepBack = document.getElementById("upload-step-back"); // ★追加

let adminMode = false;
let works = [];
let currentIndex = 0;

let uploadStep = 0;
let uploadData = {
  files: [],
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
// 作品一覧を取得（最新順）
// ===============================
async function loadWorks() {
  const res = await fetch(`${API_BASE}/works`);
  works = await res.json();

  works.reverse(); // ★最新順

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

    card.addEventListener("click", (e) => {
      if (e.target.closest(".edit-button") || e.target.closest(".delete-button")) return;
      openViewer(index);
    });

    card.querySelector(".edit-button").addEventListener("click", (e) => {
      e.stopPropagation();
      editWork(item);
    });

    card.querySelector(".delete-button").addEventListener("click", (e) => {
      e.stopPropagation();
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

  viewerTags.innerHTML = tagsArray.map(tag => `<span class="tag">${tag}</span>`).join("");

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
// キーボード左右で画像切り替え
// ===============================
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

// ===============================
// ★ ステップ式アップロードモーダルを開く
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

    uploadAllFiles();
  }
}

// ===============================
// ★ ステップ式アップロード：OK ボタンで進める
// ===============================
uploadStepOk.addEventListener("click", () => {

  if (uploadStep === 0) {
    uploadData.title = uploadStepInput.value.trim();
    uploadStep++;
    openUploadStepModal();
    return;
  }

  if (uploadStep === 1) {
    uploadData.tags = uploadStepInput.value.trim();
    uploadStep++;
    openUploadStepModal();
    return;
  }

  if (uploadStep === 2) {
    uploadData.date = uploadStepMonth.value;
    uploadStep++;
    openUploadStepModal();
    return;
  }

  if (uploadStep === 3) {
    uploadData.description = uploadStepTextarea.value.trim();
    uploadStep++;
    openUploadStepModal();
    return;
  }

  if (uploadStep === 4) {
    openUploadStepModal();
  }
});

// ===============================
// ★ ステップ式アップロード：戻るボタン（追加）
// ===============================
uploadStepBack.addEventListener("click", () => {
  if (uploadStep === 0) {
    uploadStepModal.classList.remove("open");
    return;
  }

  uploadStep--;
  openUploadStepModal();
});

// ===============================
// ★ ドロップゾーン：複数ファイル取得
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

  const files = Array.from(e.dataTransfer.files);
  if (files.length === 0) return;

  uploadData.files = files;
  uploadStep = 0;
  openUploadStepModal();
});

// ===============================
// ★ 複数ファイルアップロード処理
// ===============================
async function uploadAllFiles() {

  for (const file of uploadData.files) {

    if (file.size > 10 * 1024 * 1024) {
      alert("10MBを超える画像はアップロードできません: " + file.name);
      break;
    }

    const formData = new FormData();
    formData.append("file", file);

    formData.append("meta", JSON.stringify({
      title: uploadData.title,
      tags: uploadData.tags,
      date: uploadData.date,
      description: uploadData.description
    }));

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        console.error("アップロード失敗:", res.status);
        alert("アップロードに失敗しました（" + res.status + "）");
        break;
      }

    } catch (err) {
      console.error("通信エラー:", err);
      alert("通信エラーが発生しました");
      break;
    }
  }

  uploadStepModal.classList.remove("open");
  uploadStepOk.style.display = "block";

  uploadData = { files: [], title: "", tags: "", date: "", description: "" };
  uploadStep = 0;

  loadWorks();
}

// ===============================
// 編集処理
// ===============================
function editWork(item) {
  modal.classList.add("open");
  modalTitle.textContent = "説明文を編集";
  modalTextarea.value = item.description;

  modalSave.onclick = () => {
    const newDesc = modalTextarea.value.trim();

    fetch(`${API_BASE}/works/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        tags: Array.isArray(item.tags) ? item.tags : item.tags.split(" "),
        date: item.date,
        description: newDesc
      })
    }).then(() => {
      modal.classList.remove("open");
      loadWorks();
    });
  };
}

// 編集モーダル：戻る（追加）
modalBack.addEventListener("click", () => {
  modal.classList.remove("open");
});

// 編集モーダル：キャンセル（既存）
modalCancel.addEventListener("click
