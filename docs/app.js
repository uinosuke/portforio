/* ============================================
   Config
============================================ */
const API_BASE = "https://your-worker-domain.workers.dev"; 
// 例: https://example.workers.dev

/* ============================================
   Routing
============================================ */
window.addEventListener("hashchange", renderPage);
window.addEventListener("load", renderPage);

function renderPage() {
  const hash = location.hash.replace("#", "") || "gallery";
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  const page = document.getElementById(hash);
  if (page) page.classList.add("active");

  if (hash === "gallery") loadGallery();
  if (hash === "about") loadAbout();
  if (hash === "works-info") loadWorksInfo();
}

/* ============================================
   Gallery
============================================ */
async function loadGallery() {
  const container = document.getElementById("gallery-container");
  container.innerHTML = "";

  const res = await fetch(`${API_BASE}/works`);
  const works = await res.json();

  works.forEach(work => {
    const item = document.createElement("div");
    item.className = "masonry-item";
    item.innerHTML = `<img src="${work.image}" alt="">`;
    item.addEventListener("click", () => openDetail(work));
    container.appendChild(item);
  });
}

/* ============================================
   Detail
============================================ */
let currentWork = null;

function openDetail(work) {
  currentWork = work;
  location.hash = "detail";

  document.getElementById("detail-image").src = work.image;
  document.getElementById("detail-title").textContent = work.title || "";
  document.getElementById("detail-tags").textContent = (work.tags || []).join(", ");
  document.getElementById("detail-description").innerHTML = work.description || "";

  document.getElementById("detail-view-mode").style.display = "block";
  document.getElementById("detail-edit-mode").style.display = "none";
}

/* トリプルクリックで編集モード */
document.getElementById("detail-right").addEventListener("click", (e) => {
  if (e.detail === 3) enterDetailEditMode();
});

function enterDetailEditMode() {
  if (!currentWork) return;

  document.getElementById("edit-tags").value = (currentWork.tags || []).join(", ");
  document.getElementById("edit-description").value = currentWork.description || "";

  document.getElementById("detail-view-mode").style.display = "none";
  document.getElementById("detail-edit-mode").style.display = "block";
}

/* 保存 */
document.getElementById("save-detail").addEventListener("click", async () => {
  const tags = document.getElementById("edit-tags").value.split(",").map(t => t.trim());
  const description = document.getElementById("edit-description").value;

  const body = {
    ...currentWork,
    tags,
    description
  };

  await fetch(`${API_BASE}/works/${currentWork.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  openDetail(body);
});

/* ============================================
   ABOUT
============================================ */
async function loadAbout() {
  const view = document.getElementById("about-view");
  const edit = document.getElementById("about-edit");

  view.style.display = "block";
  edit.style.display = "none";

  const res = await fetch(`${API_BASE}/about`);
  if (res.status === 200) {
    const html = await res.text();
    document.getElementById("about-content").innerHTML = html;
  }
}

/* トリプルクリックで編集 */
document.getElementById("about-content").addEventListener("click", (e) => {
  if (e.detail === 3) enterAboutEdit();
});

function enterAboutEdit() {
  const view = document.getElementById("about-view");
  const edit = document.getElementById("about-edit");

  document.getElementById("about-editor").value =
    document.getElementById("about-content").innerHTML;

  view.style.display = "none";
  edit.style.display = "block";
}

/* 保存 */
document.getElementById("save-about").addEventListener("click", async () => {
  const html = document.getElementById("about-editor").value;

  await fetch(`${API_BASE}/about`, {
    method: "PUT",
    headers: { "Content-Type": "text/html" },
    body: html
  });

  loadAbout();
});

/* ============================================
   制作について
============================================ */
async function loadWorksInfo() {
  const view = document.getElementById("works-info-view");
  const edit = document.getElementById("works-info-edit");

  view.style.display = "block";
  edit.style.display = "none";

  const res = await fetch(`${API_BASE}/works-info`);
  if (res.status === 200) {
    const html = await res.text();
    document.getElementById("works-info-content").innerHTML = html;
  }
}

/* トリプルクリックで編集 */
document.getElementById("works-info-content").addEventListener("click", (e) => {
  if (e.detail === 3) enterWorksInfoEdit();
});

function enterWorksInfoEdit() {
  const view = document.getElementById("works-info-view");
  const edit = document.getElementById("works-info-edit");

  document.getElementById("works-info-editor").value =
    document.getElementById("works-info-content").innerHTML;

  view.style.display = "none";
  edit.style.display = "block";
}

/* 保存 */
document.getElementById("save-works-info").addEventListener("click", async () => {
  const html = document.getElementById("works-info-editor").value;

  await fetch(`${API_BASE}/works-info`, {
    method: "PUT",
    headers: { "Content-Type": "text/html" },
    body: html
  });

  loadWorksInfo();
});
