// ===============================
// 設定
// ===============================
const API_BASE = "https://delicate-sunset-ea8a.d08084222816.workers.dev";

// ===============================
// DOM 取得
// ===============================
const worksList = document.getElementById("works-list");
const overlay = document.getElementById("overlay");
const viewer = document.getElementById("image-viewer");

const viewerImage = document.getElementById("viewer-image");
const viewerTitle = document.getElementById("viewer-title");
const viewerTags = document.getElementById("viewer-tags");
const viewerDescription = document.getElementById("viewer-description");

const btnPrev = document.getElementById("viewer-prev");
const btnNext = document.getElementById("viewer-next");

const dropzone = document.getElementById("dropzone");

let adminMode = false;
let works = [];
let currentIndex = 0;

// ===============================
// 管理者モード（ダブルクリック）
// ===============================
document.addEventListener("dblclick", () => {
  adminMode = !adminMode;
  document.body.classList.toggle("admin-mode", adminMode);
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

    // 画像クリック → ビューア表示
    card.querySelector(".work-image").addEventListener("click", () => {
      openViewer(index);
    });

    // 編集
    card.querySelector(".edit-button").addEventListener("click", () => {
      editWork(item);
    });

    // 削除
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

  overlay.classList.add("open");
  viewer.classList.add("open");
}

// ===============================
// ビューアを閉じる
// ===============================
function closeViewer() {
  overlay.classList.remove("open");
  viewer.classList.remove("open");
}

overlay.addEventListener("click", closeViewer);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeViewer();
});

// ===============================
// 前後の画像へ
// ===============================
btnPrev.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + works.length) % works.length;
  openViewer(currentIndex);
});

btnNext.addEventListener("click", () => {
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
    loadWorks();
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

  loadWorks();
}

// ===============================
// アップロード（ドラッグ＆ドロップ）
// ===============================
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

  loadWorks();
});

// ===============================
// ABOUT / INFO 読み込み
// ===============================
async function loadAbout() {
  const res = await fetch(`${API_BASE}/about`);
  document.getElementById("about-content").innerHTML = await res.text();
}

async function loadInfo() {
  const res = await fetch(`${API_BASE}/works-info`);
  document.getElementById("info-content").innerHTML = await res.text();
}

//
