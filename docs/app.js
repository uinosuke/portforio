// ===============================
// API ベースURL
// ===============================
const API_BASE = "https://delicate-sunset-ea8a.d08084222816.workers.dev";

// ===============================
// 管理者モード（ダブルクリックで ON/OFF）
// ===============================
let adminMode = false;

document.addEventListener("DOMContentLoaded", () => {
  setupAdminToggle();
  setupNavigation();
  setupDropzone();
  setupSearch();
  setupSidebar();
  setupImageViewer();
  loadWorks();
  loadAbout();
  loadInfo();
});

// -------------------------------
// 管理者モード ON/OFF（ダブルクリック）
// -------------------------------
function setupAdminToggle() {
  const title = document.getElementById("site-title");

  title.addEventListener("dblclick", () => {
    adminMode = !adminMode;
    document.body.classList.toggle("admin-mode", adminMode);
    alert(adminMode ? "管理者モード ON" : "管理者モード OFF");
  });
}

// ===============================
// ナビゲーション
// ===============================
function setupNavigation() {
  const buttons = document.querySelectorAll(".nav-button");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;

      document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));

      if (view === "gallery") {
        document.getElementById("view-gallery").classList.remove("hidden");
      } else if (view === "about") {
        document.getElementById("view-about").classList.remove("hidden");
      } else if (view === "info") {
        document.getElementById("view-info").classList.remove("hidden");
      }
    });
  });

  document.getElementById("view-gallery").classList.remove("hidden");
}

// ===============================
// 🔍 検索
// ===============================
function setupSearch() {
  const input = document.getElementById("search-input");

  input.addEventListener("input", () => {
    const keyword = input.value.trim().toLowerCase();
    filterWorks(keyword);
  });
}

function filterWorks(keyword) {
  const cards = document.querySelectorAll(".work-card");

  cards.forEach(card => {
    const title = card.querySelector(".work-title").textContent.toLowerCase();
    const tags = card.querySelector(".work-tags").textContent.toLowerCase();
    const desc = card.querySelector(".work-description").textContent.toLowerCase();

    const hit =
      title.includes(keyword) ||
      tags.includes(keyword) ||
      desc.includes(keyword);

    card.style.display = hit ? "" : "none";
  });
}

// ===============================
// ドラッグ＆ドロップアップロード（JSON + file）
// ===============================
function setupDropzone() {
  const dropzone = document.getElementById("dropzone");

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

    if (!adminMode) {
      alert("管理者モードのみアップロードできます");
      return;
    }

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const title = prompt("タイトルを入力してください", file.name) || file.name;
    const tags = prompt("タグ（スペース区切り）", "") || "";
    const description = prompt("概要", "") || "";

    const meta = {
      title,
      tags,
      description
    };

    const form = new FormData();
    form.append("meta", JSON.stringify(meta));
    form.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: form
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        alert("アップロードに失敗しました");
        return;
      }

      alert("アップロード完了！");
      loadWorks();
    } catch (err) {
      console.error(err);
      alert("アップロード中にエラーが発生しました");
    }
  });
}

// ===============================
// WORKS 読み込み
// ===============================
async function loadWorks() {
  const container = document.getElementById("works-list");
  container.innerHTML = "読み込み中…";

  try {
    const res = await fetch(`${API_BASE}/works`);
    const list = await res.json();

    container.innerHTML = "";

    list.forEach(item => {
      const card = document.createElement("div");
      card.className = "work-card";

      const img = document.createElement("img");
      img.className = "work-image";
      img.src = item.image;
      img.alt = item.title || "";
      img.addEventListener("click", () => openImageViewer(item));

      const body = document.createElement("div");
      body.className = "work-body";

      const titleEl = document.createElement("p");
      titleEl.className = "work-title";
      titleEl.textContent = item.title || "(無題)";

      const tagsEl = document.createElement("p");
      tagsEl.className = "work-tags";
      tagsEl.textContent = (item.tags || []).join(" ");

      const descEl = document.createElement("p");
      descEl.className = "work-description";
      descEl.textContent = item.description || "";

      const actions = document.createElement("div");
      actions.className = "work-actions admin-only";

      const editBtn = document.createElement("button");
      editBtn.className = "edit-button";
      editBtn.textContent = "編集";
      editBtn.addEventListener("click", () => editWork(item));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-button";
      deleteBtn.textContent = "×";
      deleteBtn.addEventListener("click", () => deleteWork(item));

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      body.appendChild(titleEl);
      body.appendChild(tagsEl);
      body.appendChild(descEl);
      body.appendChild(actions);

      card.appendChild(img);
      card.appendChild(body);

      container.appendChild(card);
    });

    if (adminMode) {
      document.body.classList.add("admin-mode");
    }

  } catch (err) {
    console.error(err);
    container.innerHTML = "読み込みに失敗しました";
  }
}

// ===============================
// WORKS 編集
// ===============================
async function editWork(item) {
  if (!adminMode) {
    alert("管理者モードのみ編集できます");
    return;
  }

  const newTitle = prompt("タイトル", item.title || "") ?? item.title;
  const newTagsStr = prompt("タグ（スペース区切り）", (item.tags || []).join(" ")) ?? (item.tags || []).join(" ");
  const newDesc = prompt("概要", item.description || "") ?? item.description;

  const newTags = newTagsStr.trim() ? newTagsStr.trim().split(/\s+/) : [];

  try {
    const res = await fetch(`${API_BASE}/works/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        tags: newTags,
        description: newDesc
      })
    });

    if (!res.ok) {
      alert("更新に失敗しました");
      return;
    }

    loadWorks();

  } catch (err) {
    console.error(err);
    alert("更新中にエラーが発生しました");
  }
}

// ===============================
// WORKS 削除
// ===============================
async function deleteWork(item) {
  if (!adminMode) {
    alert("管理者モードのみ削除できます");
    return;
  }

  if (!confirm("本当に削除しますか？")) return;

  try {
    const res = await fetch(`${API_BASE}/works/${item.id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      alert("削除に失敗しました");
      return;
    }

    alert("削除しました");
    loadWorks();

  } catch (err) {
    console.error(err);
    alert("削除中にエラーが発生しました");
  }
}

// ===============================
// ABOUT 読み込み・編集
// ===============================
async function loadAbout() {
  const el = document.getElementById("about-content");

  try {
    const res = await fetch(`${API_BASE}/about`);
    el.innerHTML = await res.text();
  } catch {
    el.textContent = "読み込みに失敗しました";
  }

  document.getElementById("edit-about").addEventListener("click", async () => {
    if (!adminMode) return alert("管理者モードのみ編集できます");

    const next = prompt("ABOUT の内容（HTML可）", el.innerHTML) ?? el.innerHTML;

    try {
      const res = await fetch(`${API_BASE}/about`, {
        method: "PUT",
        body: next
      });

      if (!res.ok) return alert("保存に失敗しました");

      el.innerHTML = next;

    } catch {
      alert("保存中にエラーが発生しました");
    }
  });
}

// ===============================
// 制作について 読み込み・編集
// ===============================
async function loadInfo() {
  const el = document.getElementById("info-content");

  try {
    const res = await fetch(`${API_BASE}/works-info`);
    el.innerHTML = await res.text();
  } catch {
    el.textContent = "読み込みに失敗しました";
  }

  document.getElementById("edit-info").addEventListener("click", async () => {
    if (!adminMode) return alert("管理者モードのみ編集できます");

    const next = prompt("制作について（HTML可）", el.innerHTML) ?? el.innerHTML;

    try {
      const res = await fetch(`${API_BASE}/works-info`, {
        method: "PUT",
        body: next
      });

      if (!res.ok) return alert("保存に失敗しました");

      el.innerHTML = next;

    } catch {
      alert("保存中にエラーが発生しました");
    }
  });
}

// ===============================
// サイドバー（1秒後に閉じる & ホバーで展開）
// ===============================
function setupSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  sidebar.classList.add("sidebar-open");

  setTimeout(() => {
    sidebar.classList.remove("sidebar-open");
    sidebar.classList.add("sidebar-collapsed");
  }, 1000);

  sidebar.addEventListener("mouseenter", () => {
    sidebar.classList.add("sidebar-open");
    sidebar.classList.remove("sidebar-collapsed");
  });

  sidebar.addEventListener("mouseleave", () => {
    sidebar.classList.remove("sidebar-open");
    sidebar.classList.add("sidebar-collapsed");
  });
}

// ===============================
// 画像ビューア（Google画像風）
// ===============================
let imageViewerEl = null;
let imageViewerImg = null;
let imageViewerTitle = null;
let imageViewerTags = null;
let imageViewerDesc = null;

function setupImageViewer() {
  imageViewerEl = document.getElementById("image-viewer");
  if (!imageViewerEl) return;

  imageViewerImg = imageViewerEl.querySelector(".viewer-image");
  imageViewerTitle = imageViewerEl.querySelector(".viewer-title");
  imageViewerTags = imageViewerEl.querySelector(".viewer-tags");
  imageViewerDesc = imageViewerEl.querySelector(".viewer-description");

  const closeBtn = imageViewerEl.querySelector(".viewer-close");
  closeBtn.addEventListener("click", () => {
    imageViewerEl.classList.remove("open");
  });

  imageViewerEl.addEventListener("click", (e) => {
    if (e.target === imageViewerEl) {
      imageViewerEl.classList.remove("open");
    }
  });
}

function openImageViewer(item) {
  if (!imageViewerEl) return;

  imageViewerImg.src = item.image;
  imageViewerImg.alt = item.title || "";
  imageViewerTitle.textContent = item.title || "(無題)";
  imageViewerTags.textContent = (item.tags || []).join(" ");
  imageViewerDesc.textContent = item.description || "";

  imageViewerEl.classList.add("open");
}
