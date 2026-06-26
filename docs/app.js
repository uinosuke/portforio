// ===============================
// 管理者モード（Myportfolio 4回クリック）
// ===============================
let adminClickCount = 0;
let adminMode = false;

document.addEventListener("DOMContentLoaded", () => {
  setupAdminToggle();
  setupNavigation();
  setupDropzone();
  setupSearch();
  loadWorks();
  loadAbout();
  loadInfo();
});

// -------------------------------
// 管理者モード ON/OFF
// -------------------------------
function setupAdminToggle() {
  const title = document.getElementById("site-title");

  title.addEventListener("click", () => {
    adminClickCount++;

    // 0.8秒以内に4回クリック
    setTimeout(() => adminClickCount = 0, 800);

    if (adminClickCount >= 4) {
      adminMode = !adminMode;
      adminClickCount = 0;

      document.body.classList.toggle("admin-mode", adminMode);
      alert(adminMode ? "管理者モード ON" : "管理者モード OFF");
    }
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

  // 初期表示
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
// ドラッグ＆ドロップアップロード
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

    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    form.append("tags", tags);
    form.append("description", description);

    try {
      const res = await fetch("/upload", {
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
    const res = await fetch("/works");
    const list = await res.json();

    container.innerHTML = "";

    list.forEach(item => {
      const card = document.createElement("div");
      card.className = "work-card";

      const img = document.createElement("img");
      img.className = "work-image";
      img.src = item.image;
      img.alt = item.title || "";

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

      actions.appendChild(editBtn);

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
    const res = await fetch(`/works/${item.id}`, {
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
// ABOUT 読み込み・編集
// ===============================
async function loadAbout() {
  const el = document.getElementById("about-content");

  try {
    const res = await fetch("/about");
    el.innerHTML = await res.text();
  } catch {
    el.textContent = "読み込みに失敗しました";
  }

  document.getElementById("edit-about").addEventListener("click", async () => {
    if (!adminMode) return alert("管理者モードのみ編集できます");

    const next = prompt("ABOUT の内容（HTML可）", el.innerHTML) ?? el.innerHTML;

    try {
      const res = await fetch("/about", {
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
    const res = await fetch("/works-info");
    el.innerHTML = await res.text();
  } catch {
    el.textContent = "読み込みに失敗しました";
  }

  document.getElementById("edit-info").addEventListener("click", async () => {
    if (!adminMode) return alert("管理者モードのみ編集できます");

    const next = prompt("制作について（HTML可）", el.innerHTML) ?? el.innerHTML;

    try {
      const res = await fetch("/works-info", {
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
