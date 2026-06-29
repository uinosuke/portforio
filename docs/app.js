// ===============================
// 設定
// ===============================
const API_BASE = "https://delicate-sunset-ea8a.d08084222816.workers.dev";

// ===============================
// DOM取得
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

const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");

const mobileSearchInput = document.getElementById("mobile-search-input");
const mobileSearchBtn = document.getElementById("mobile-search-btn");

const modal = document.getElementById("edit-modal");
const modalTitle = document.getElementById("modal-title");
const modalTextarea = document.getElementById("modal-textarea");
const modalSave = document.getElementById("modal-save");
const modalCancel = document.getElementById("modal-cancel");

const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
const mobileMenuPanel = document.querySelector(".mobile-menu-panel");
const viewerRight = document.querySelector(".viewer-right");
const viewerLeft = document.querySelector(".viewer-left");
const dragHandle = document.querySelector(".viewer-drag-handle");

const uploadStepBack = document.getElementById("upload-step-back");
const viewerEditWork = document.getElementById("viewer-edit-work");
const viewerDeleteWork = document.getElementById("viewer-delete-work");

const viewerEditForm = document.getElementById("viewer-edit-form");
const viewerEditTitle = document.getElementById("viewer-edit-title");
const viewerEditTags = document.getElementById("viewer-edit-tags");
const viewerEditDate = document.getElementById("viewer-edit-date");
const viewerEditDescription = document.getElementById("viewer-edit-description");
const viewerSaveWork = document.getElementById("viewer-save-work");
const viewerCancelEdit = document.getElementById("viewer-cancel-edit");

const uploadDropzone = document.getElementById("upload-dropzone");
const uploadStepModal = document.getElementById("upload-step-modal");
const uploadStepTitle = document.getElementById("upload-step-title");
const uploadStepInput = document.getElementById("upload-step-input");
const uploadStepMonth = document.getElementById("upload-step-month");
const uploadStepTextarea = document.getElementById("upload-step-textarea");
const uploadStepOk = document.getElementById("upload-step-ok");

const siteTitle = document.getElementById("site-title");
const editAboutBtn = document.getElementById("edit-about");
const editInfoBtn = document.getElementById("edit-info");

let adminMode = false;
let adminToken = localStorage.getItem("adminToken") || "";

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

let editingPage = null;

// ===============================
// 管理者ログイン
// ===============================
async function adminLogin() {
const password = prompt("管理者パスワードを入力してください");
if (!password) return;

try {
const res = await fetch(`${API_BASE}/login`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ password })
});

if (!res.ok) {
alert("パスワードが違います");
return;
}

const data = await res.json();

adminToken = data.token;
localStorage.setItem("adminToken", adminToken);

adminMode = true;
document.body.classList.add("admin-mode");
alert("管理者モードに入りました");
} catch (err) {
console.error(err);
alert("ログインに失敗しました");
}
}

function adminLogout() {
adminToken = "";
localStorage.removeItem("adminToken");

adminMode = false;
document.body.classList.remove("admin-mode");
alert("管理者モードを終了しました");
}

function authHeaders(extraHeaders = {}) {
return {
...extraHeaders,
Authorization: `Bearer ${adminToken}`
};
}

function requireAdminToken() {
if (!adminToken) {
alert("管理者ログインが必要です");
return false;
}
return true;
}

siteTitle.addEventListener("dblclick", () => {
if (adminMode) {
adminLogout();
} else {
adminLogin();
}
});

// ===============================
// スマホメニュー
// ===============================
mobileMenuBtn.addEventListener("click", () => {
mobileMenuPanel.classList.toggle("open");
});

// ===============================
// ページ切り替え
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
// 画像一覧へ戻ったら検索解除
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
// 作品一覧取得
// ===============================
async function loadWorks() {
const res = await fetch(`${API_BASE}/works`);
works = await res.json();

works.reverse();
worksList.innerHTML = "";

works.forEach((item, index) => {
const card = document.createElement("div");
card.className = "work-card";

card.innerHTML = `
     <img class="work-image" src="${item.image}" alt="">
     <div class="work-body">
       <p class="work-title">${item.title}</p>
     </div>
   `;

card.addEventListener("click", () => {
openViewer(index);
});

worksList.appendChild(card);
});

filterWorks(searchInput.value.trim());
}

// ===============================
// viewer
// ===============================
function openViewerEditForm() {
if (!adminMode || !works[currentIndex]) return;

const item = works[currentIndex];

viewerEditTitle.value = item.title || "";
viewerEditTags.value = Array.isArray(item.tags) ? item.tags.join(" ") : item.tags || "";
viewerEditDate.value = item.date || "";
viewerEditDescription.value = item.description || "";

viewerEditForm.classList.remove("hidden");
}

function closeViewerEditForm() {
viewerEditForm.classList.add("hidden");
}


function openViewer(index) {
currentIndex = index;
const item = works[index];

viewerImage.src = item.image;
viewerTitle.textContent = item.title;

const tagsArray = Array.isArray(item.tags)
? item.tags
: String(item.tags || "").split(" ").filter(t => t.trim() !== "");

viewerTags.innerHTML = tagsArray.map(tag => `<span class="tag">${tag}</span>`).join("");

viewerDate.textContent = item.date || "";
viewerDescription.textContent = item.description || "";

viewer.classList.add("open");
closeViewerEditForm();

if (window.innerWidth <= 768) {
viewerLeft.style.display = "flex";
viewerRight.classList.remove("active");
}
}

viewerCloseBtn.addEventListener("click", () => {
viewer.classList.remove("open");
});

viewer.addEventListener("click", (e) => {
const clickedInside =
e.target === viewerImage ||
e.target.closest(".viewer-right") ||
e.target.closest(".viewer-arrow") ||
e.target === viewerCloseBtn;

if (!clickedInside) viewer.classList.remove("open");
});

document.addEventListener("keydown", (e) => {
if (e.key === "Escape") viewer.classList.remove("open");
});

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
viewerEditWork.addEventListener("click", (e) => {
e.stopPropagation();
openViewerEditForm();
});

viewerDeleteWork.addEventListener("click", (e) => {
e.stopPropagation();

if (!adminMode || !works[currentIndex]) return;

deleteWork(works[currentIndex].id);
viewer.classList.remove("open");
});

viewerCancelEdit.addEventListener("click", (e) => {
e.stopPropagation();
closeViewerEditForm();
});

viewerSaveWork.addEventListener("click", async (e) => {
  e.stopPropagation();

  console.log("currentIndex:", currentIndex);
  console.log("works[currentIndex]:", works[currentIndex]);

  if (!requireAdminToken() || !works[currentIndex]) return;

const item = works[currentIndex];

const res = await fetch(`${API_BASE}/works/${item.id}`, {
method: "PUT",
headers: authHeaders({ "Content-Type": "application/json" }),
body: JSON.stringify({
title: viewerEditTitle.value.trim(),
tags: viewerEditTags.value.split(" ").filter(tag => tag.trim() !== ""),
date: viewerEditDate.value,
description: viewerEditDescription.value.trim()
})
});

if (!res.ok) {
alert("保存に失敗しました");
return;
}

const updated = await res.json();
works[currentIndex] = updated;

viewerTitle.textContent = updated.title || "";
const updatedTags = Array.isArray(updated.tags) ? updated.tags : [];
viewerTags.innerHTML = updatedTags.map(tag => `<span class="tag">${tag}</span>`).join("");
viewerDate.textContent = updated.date || "";
viewerDescription.textContent = updated.description || "";

closeViewerEditForm();
loadWorks();
});

// ===============================
// スマホ viewer 操作
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

// ===============================
// 検索
// ===============================
mobileSearchBtn.addEventListener("click", () => {
const keyword = mobileSearchInput.value.trim();
searchInput.value = keyword;
filterWorks(keyword);

mobileMenuPanel.classList.remove("open");
showView("gallery");
});

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

function filterWorks(keyword) {
const cards = document.querySelectorAll(".work-card");
const k = keyword.toLowerCase();

cards.forEach((card, index) => {
const item = works[index];

const title = String(item.title || "").toLowerCase();
const tags = Array.isArray(item.tags)
? item.tags.join(" ").toLowerCase()
: String(item.tags || "").toLowerCase();
const desc = String(item.description || "").toLowerCase();
const date = String(item.date || "").toLowerCase();

const match =
title.includes(k) ||
tags.includes(k) ||
desc.includes(k) ||
date.includes(k);

card.style.display = match ? "block" : "none";
});
}

// ===============================
// ABOUT / 制作について
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

function openTextEditor(type) {
if (!requireAdminToken()) return;

editingPage = type;

const contentEl = type === "about"
? document.getElementById("about-content")
: document.getElementById("info-content");

modalTitle.textContent = type === "about" ? "ABOUTを編集" : "制作についてを編集";
modalTextarea.value = contentEl.innerHTML.trim();

modal.classList.add("open");
}

editAboutBtn.addEventListener("click", () => openTextEditor("about"));
editInfoBtn.addEventListener("click", () => openTextEditor("info"));

modalCancel.addEventListener("click", () => {
modal.classList.remove("open");
editingPage = null;
});

modalSave.addEventListener("click", async () => {
if (!editingPage || !requireAdminToken()) return;

const endpoint = editingPage === "about" ? "/about" : "/works-info";

const res = await fetch(`${API_BASE}${endpoint}`, {
method: "PUT",
headers: authHeaders({ "Content-Type": "text/html" }),
body: modalTextarea.value
});

if (!res.ok) {
alert("保存に失敗しました");
return;
}

modal.classList.remove("open");
editingPage = null;

await loadAbout();
await loadInfo();

alert("保存しました");
});

// ===============================
// アップロード
// ===============================
function saveCurrentUploadStepValue() {
if (uploadStep === 0) uploadData.title = uploadStepInput.value.trim();
if (uploadStep === 1) uploadData.tags = uploadStepInput.value.trim();
if (uploadStep === 2) uploadData.date = uploadStepMonth.value;
if (uploadStep === 3) uploadData.description = uploadStepTextarea.value.trim();
}
function openUploadStepModal() {
if (!requireAdminToken()) return;

uploadStepModal.classList.add("open");

uploadStepInput.style.display = "none";
uploadStepMonth.style.display = "none";
uploadStepTextarea.style.display = "none";
uploadStepOk.style.display = "block";
uploadStepBack.style.display = uploadStep === 0 || uploadStep === 4 ? "none" : "block";

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
uploadStepTitle.textContent = "年月を選択してください";
uploadStepMonth.style.display = "block";
uploadStepMonth.value = uploadData.date;
}

if (uploadStep === 3) {
uploadStepTitle.textContent = "概要を入力してください";
uploadStepTextarea.style.display = "block";
uploadStepTextarea.value = uploadData.description;
}

if (uploadStep === 4) {
uploadStepTitle.textContent = "アップロード中...";
uploadStepOk.style.display = "none";
uploadAllFiles();
}
}
uploadStepBack.addEventListener("click", () => {
if (uploadStep <= 0) return;

saveCurrentUploadStepValue();
uploadStep--;
openUploadStepModal();
});
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
}
});

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

if (!requireAdminToken()) return;

const files = Array.from(e.dataTransfer.files);
if (files.length === 0) return;

uploadData.files = files;
uploadStep = 0;
openUploadStepModal();
});

async function uploadAllFiles() {
  if (!requireAdminToken()) return;

  for (const file of uploadData.files) {
    if (file.size > 10 * 1024 * 1024) {
      alert("10MBを超える画像はアップロードできません: " + file.name);
      return;
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
        headers: authHeaders(),
        body: formData
      });

      if (!res.ok) {
        alert("アップロード失敗: " + res.status);
        return;
      }
    } catch (err) {
      console.error(err);
      alert("通信エラー");
      return;
    }
  }

  uploadStepModal.classList.remove("open");
  uploadData = { files: [], title: "", tags: "", date: "", description: "" };
  uploadStep = 0;

  loadWorks();
}

// ===============================
// 作品編集 / 削除
// ===============================
function editWork(item) {
if (!requireAdminToken()) return;

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
headers: authHeaders({ "Content-Type": "application/json" }),
body: JSON.stringify({
title: newTitle,
tags: newTags.split(" ").filter(tag => tag.trim() !== ""),
date: newDate,
description: newDesc
})
}).then((res) => {
if (!res.ok) {
alert("編集に失敗しました");
return;
}

loadWorks();
});
}

function deleteWork(id) {
if (!requireAdminToken()) return;

if (!confirm("本当に削除しますか？")) return;

fetch(`${API_BASE}/works/${id}`, {
method: "DELETE",
headers: authHeaders()
}).then((res) => {
if (!res.ok) {
alert("削除に失敗しました");
return;
}

loadWorks();
});
}

// ===============================
// 初期ロード
// ===============================
window.addEventListener("load", () => {
if (adminToken) {
adminMode = true;
document.body.classList.add("admin-mode");
}

if (window.innerWidth <= 768) {
enableDragSheet();
enableSwipeNavigation();
}

loadWorks();
loadAbout();
loadInfo();
});
