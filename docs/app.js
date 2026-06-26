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
function setupDropzone()
