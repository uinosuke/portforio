// ===============================
// 設定
// ===============================
const API_BASE =
  "https://delicate-sunset-ea8a.d08084222816.workers.dev";

const APP_VERSION =
  "2026-07-13-search-ime-v6";

console.info(
  `[portfolio] ${APP_VERSION}`
);

// ===============================
// DOM取得
// ===============================
const worksList =
  document.getElementById("works-list");

const viewer =
  document.getElementById("image-viewer");

const viewerImage =
  document.getElementById("viewer-image");

const viewerTitle =
  document.getElementById("viewer-title");

const viewerTags =
  document.getElementById("viewer-tags");

const viewerDate =
  document.getElementById("viewer-date");

const viewerDescription =
  document.getElementById(
    "viewer-description"
  );

const btnPrev =
  document.getElementById("viewer-prev");

const btnNext =
  document.getElementById("viewer-next");

const viewerCloseBtn =
  document.getElementById(
    "viewer-close-btn"
  );

const searchInput =
  document.getElementById("search-input");

const searchClear =
  document.getElementById("search-clear");

const mobileSearchInput =
  document.getElementById(
    "mobile-search-input"
  );

const mobileSearchBtn =
  document.getElementById(
    "mobile-search-btn"
  );

const modal =
  document.getElementById("edit-modal");

const modalTitle =
  document.getElementById("modal-title");

const modalTextarea =
  document.getElementById(
    "modal-textarea"
  );

const modalSave =
  document.getElementById("modal-save");

const modalCancel =
  document.getElementById(
    "modal-cancel"
  );

const mobileMenuBtn =
  document.querySelector(
    ".mobile-menu-btn"
  );

const mobileMenuPanel =
  document.querySelector(
    ".mobile-menu-panel"
  );

const viewerRight =
  document.querySelector(
    ".viewer-right"
  );

const viewerLeft =
  document.querySelector(
    ".viewer-left"
  );

const dragHandle =
  document.querySelector(
    ".viewer-drag-handle"
  );

const uploadStepBack =
  document.getElementById(
    "upload-step-back"
  );

const viewerEditWork =
  document.getElementById(
    "viewer-edit-work"
  );

const viewerDeleteWork =
  document.getElementById(
    "viewer-delete-work"
  );

const viewerEditForm =
  document.getElementById(
    "viewer-edit-form"
  );

const viewerEditTitle =
  document.getElementById(
    "viewer-edit-title"
  );

const viewerEditTags =
  document.getElementById(
    "viewer-edit-tags"
  );

const viewerEditDate =
  document.getElementById(
    "viewer-edit-date"
  );

const viewerEditDescription =
  document.getElementById(
    "viewer-edit-description"
  );

const viewerSaveWork =
  document.getElementById(
    "viewer-save-work"
  );

const viewerCancelEdit =
  document.getElementById(
    "viewer-cancel-edit"
  );

const uploadDropzone =
  document.getElementById(
    "upload-dropzone"
  );

const uploadStepModal =
  document.getElementById(
    "upload-step-modal"
  );

const uploadStepTitle =
  document.getElementById(
    "upload-step-title"
  );

const uploadStepInput =
  document.getElementById(
    "upload-step-input"
  );

const uploadStepMonth =
  document.getElementById(
    "upload-step-month"
  );

const uploadStepTextarea =
  document.getElementById(
    "upload-step-textarea"
  );

const uploadStepOk =
  document.getElementById(
    "upload-step-ok"
  );

const siteTitle =
  document.getElementById("site-title");

const editAboutBtn =
  document.getElementById("edit-about");

const editInfoBtn =
  document.getElementById("edit-info");

// ===============================
// 状態
// ===============================
let adminMode = false;

let adminToken =
  localStorage.getItem("adminToken") ||
  "";

let works = [];
let displayedWorks = [];

let currentIndex = 0;
let currentPage = 0;

const PAGE_SIZE = 30;

let isLoading = false;
let allLoaded = false;

let uploadStep = 0;

let uploadData = {
  files: [],
  title: "",
  tags: "",
  date: "",
  description: ""
};

let editingPage = null;

let isPcComposing = false;
let isMobileComposing = false;

// ===============================
// 共通処理
// ===============================
function authHeaders(
  extraHeaders = {}
) {
  return {
    ...extraHeaders,
    Authorization:
      `Bearer ${adminToken}`
  };
}

function requireAdminToken() {
  if (!adminToken) {
    alert(
      "管理者ログインが必要です"
    );

    return false;
  }

  return true;
}

function normalizeSearchText(value) {
  if (value === null ||
      value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map(normalizeSearchText)
      .join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value)
      .map(normalizeSearchText)
      .join(" ");
  }

  return String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[＃#]/g, "")
    .replace(
      /[、,，。．・／/|｜]+/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function getTagsArray(tags) {
  if (tags === null ||
      tags === undefined) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags
      .flatMap(getTagsArray)
      .filter(Boolean);
  }

  if (typeof tags === "object") {
    return Object.values(tags)
      .flatMap(getTagsArray)
      .filter(Boolean);
  }

  const text =
    String(tags).trim();

  if (!text) {
    return [];
  }

  if (
    text.startsWith("[") &&
    text.endsWith("]")
  ) {
    try {
      const parsed =
        JSON.parse(text);

      if (Array.isArray(parsed)) {
        return parsed
          .flatMap(getTagsArray)
          .filter(Boolean);
      }
    } catch (error) {
      console.warn(
        "タグのJSON変換を省略",
        error
      );
    }
  }

  return text
    .split(/[\s、,，]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getDescriptionText(item) {
  return [
    item?.description,
    item?.desc,
    item?.summary,
    item?.overview,
    item?.caption,
    item?.meta?.description,
    item?.metadata?.description
  ]
    .filter(
      (value) =>
        value !== null &&
        value !== undefined
    )
    .map((value) =>
      String(value)
    )
    .join(" ");
}

function getSearchTarget(item) {
  const tags = [
    item?.tags,
    item?.tag,
    item?.meta?.tags,
    item?.metadata?.tags
  ];

  const descriptions = [
    item?.description,
    item?.desc,
    item?.summary,
    item?.overview,
    item?.caption,
    item?.meta?.description,
    item?.metadata?.description
  ];

  return normalizeSearchText([
    tags,
    descriptions
  ]);
}

function getCurrentKeyword() {
  return (
    searchInput.value ||
    mobileSearchInput.value ||
    ""
  );
}

// ===============================
// 管理者ログイン
// ===============================
async function adminLogin() {
  const password =
    prompt(
      "管理者パスワードを入力してください"
    );

  if (!password) {
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          password
        })
      }
    );

    if (!res.ok) {
      alert(
        "パスワードが違います"
      );

      return;
    }

    const data =
      await res.json();

    adminToken =
      data.token || "";

    localStorage.setItem(
      "adminToken",
      adminToken
    );

    adminMode = true;

    document.body.classList.add(
      "admin-mode"
    );

    alert(
      "管理者モードに入りました"
    );
  } catch (error) {
    console.error(error);

    alert(
      "ログインに失敗しました"
    );
  }
}

function adminLogout() {
  adminToken = "";

  localStorage.removeItem(
    "adminToken"
  );

  adminMode = false;

  document.body.classList.remove(
    "admin-mode"
  );

  alert(
    "管理者モードを終了しました"
  );
}

siteTitle.addEventListener(
  "dblclick",
  () => {
    if (adminMode) {
      adminLogout();
    } else {
      adminLogin();
    }
  }
);

// ===============================
// スマホメニュー
// ===============================
mobileMenuBtn.addEventListener(
  "click",
  () => {
    mobileMenuPanel.classList.toggle(
      "open"
    );
  }
);

// ===============================
// ページ切り替え
// ===============================
function showView(view) {
  document
    .querySelectorAll(".view")
    .forEach((element) => {
      element.classList.add(
        "hidden"
      );
    });

  const target =
    document.getElementById(
      `view-${view}`
    );

  if (target) {
    target.classList.remove(
      "hidden"
    );
  }

  mobileMenuPanel.classList.remove(
    "open"
  );
}

window.addEventListener(
  "hashchange",
  () => {
    const view =
      location.hash.replace(
        "#",
        ""
      ) || "gallery";

    showView(view);
  }
);

// ===============================
// 作品一覧取得
// ===============================
async function loadWorks() {
  try {
    const res = await fetch(
      `${API_BASE}/works`,
      {
        cache: "no-store"
      }
    );

    if (!res.ok) {
      throw new Error(
        `作品一覧の取得失敗: ${res.status}`
      );
    }

    const data =
      await res.json();

    if (!Array.isArray(data)) {
      throw new Error(
        "作品一覧が配列ではありません"
      );
    }

    works = [...data].reverse();

    console.info(
      "[portfolio] 作品数",
      works.length
    );

    if (works.length > 0) {
      console.info(
        "[portfolio] 作品データ例",
        works[0]
      );
    }

    filterWorks(
      getCurrentKeyword()
    );
  } catch (error) {
    console.error(error);

    works = [];
    displayedWorks = [];

    resetGallery();
  }
}

// ===============================
// ギャラリー
// ===============================
function resetGallery() {
  worksList.innerHTML = "";

  currentPage = 0;
  isLoading = false;
  allLoaded = false;

  renderPage();
}

function createColumns(
  columnCount
) {
  return Array.from(
    {
      length: columnCount
    },
    () => {
      const column =
        document.createElement(
          "div"
        );

      column.style.display =
        "flex";

      column.style.flexDirection =
        "column";

      column.style.gap =
        "16px";

      column.style.flex =
        "1";

      worksList.appendChild(
        column
      );

      return column;
    }
  );
}

function renderPage() {
  if (isLoading ||
      allLoaded) {
    return;
  }

  isLoading = true;

  const columnCount =
    window.innerWidth <= 768
      ? 2
      : 6;

  let columns =
    Array.from(
      worksList.children
    );

  if (columns.length === 0) {
    columns =
      createColumns(
        columnCount
      );
  }

  const start =
    currentPage * PAGE_SIZE;

  const end =
    Math.min(
      start + PAGE_SIZE,
      displayedWorks.length
    );

  for (
    let index = start;
    index < end;
    index++
  ) {
    const item =
      displayedWorks[index];

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "work-card";

    const image =
      document.createElement(
        "img"
      );

    image.className =
      "work-image";

    image.src =
      item.image || "";

    image.alt =
      item.title || "";

    image.loading =
      "lazy";

    const body =
      document.createElement(
        "div"
      );

    body.className =
      "work-body";

    const title =
      document.createElement(
        "p"
      );

    title.className =
      "work-title";

    title.textContent =
      item.title || "";

    body.appendChild(title);

    card.appendChild(image);
    card.appendChild(body);

    card.addEventListener(
      "click",
      () => {
        openViewer(index);
      }
    );

    columns[
      index % columnCount
    ].appendChild(card);
  }

  if (
    end >=
    displayedWorks.length
  ) {
    allLoaded = true;
  }

  currentPage++;
  isLoading = false;
}

window.addEventListener(
  "scroll",
  () => {
    const nearBottom =
      window.innerHeight +
        window.scrollY >=
      document.body.offsetHeight -
        300;

    if (nearBottom) {
      renderPage();
    }
  }
);

// ===============================
// 検索
//
// タグ＋概要
// 部分一致
// 全作品対象
// 複数語はOR検索
// 漢字変換中は検索しない
// ===============================
function filterWorks(keyword) {
  const normalizedKeyword =
    normalizeSearchText(keyword);

  const words =
    normalizedKeyword
      .split(" ")
      .map((word) =>
        word.trim()
      )
      .filter(Boolean);

  if (words.length === 0) {
    displayedWorks =
      [...works];
  } else {
    displayedWorks =
      works.filter((item) => {
        const searchTarget =
          getSearchTarget(item);

        return words.some(
          (word) =>
            searchTarget.includes(
              word
            )
        );
      });
  }

  console.info(
    "[portfolio] 検索",
    {
      keyword,
      normalizedKeyword,
      total:
        works.length,
      matched:
        displayedWorks.length
    }
  );

  viewer.classList.remove(
    "open"
  );

  resetGallery();
}

function runPcSearch() {
  const keyword =
    searchInput.value;

  mobileSearchInput.value =
    keyword;

  searchClear.style.display =
    keyword.trim()
      ? "block"
      : "none";

  filterWorks(keyword);
}

searchInput.addEventListener(
  "compositionstart",
  () => {
    isPcComposing = true;
  }
);

searchInput.addEventListener(
  "compositionend",
  () => {
    isPcComposing = false;

    runPcSearch();
  }
);

searchInput.addEventListener(
  "input",
  (event) => {
    if (
      isPcComposing ||
      event.isComposing
    ) {
      return;
    }

    runPcSearch();
  }
);

searchClear.addEventListener(
  "click",
  () => {
    searchInput.value = "";
    mobileSearchInput.value = "";

    searchClear.style.display =
      "none";

    filterWorks("");

    searchInput.focus();
  }
);

mobileSearchInput.addEventListener(
  "compositionstart",
  () => {
    isMobileComposing = true;
  }
);

mobileSearchInput.addEventListener(
  "compositionend",
  () => {
    isMobileComposing = false;
  }
);

mobileSearchBtn.addEventListener(
  "click",
  () => {
    const keyword =
      mobileSearchInput.value;

    searchInput.value =
      keyword;

    searchClear.style.display =
      keyword.trim()
        ? "block"
        : "none";

    filterWorks(keyword);

    mobileMenuPanel.classList.remove(
      "open"
    );

    showView("gallery");
  }
);

mobileSearchInput.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key !== "Enter"
    ) {
      return;
    }

    if (
      event.isComposing ||
      isMobileComposing ||
      event.keyCode === 229
    ) {
      return;
    }

    event.preventDefault();

    mobileSearchBtn.click();
  }
);

// ===============================
// 画像一覧へ戻ったら検索解除
// ===============================
document
  .querySelectorAll(
    ".nav-item[data-view='gallery']"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        searchInput.value = "";

        mobileSearchInput.value =
          "";

        searchClear.style.display =
          "none";

        filterWorks("");
      }
    );
  });

// ===============================
// Viewer
// ===============================
function openViewer(index) {
  const item =
    displayedWorks[index];

  if (!item) {
    return;
  }

  currentIndex = index;

  viewerImage.src =
    item.image || "";

  viewerImage.alt =
    item.title || "";

  viewerTitle.textContent =
    item.title || "";

  viewerDate.textContent =
    item.date || "";

  viewerDescription.textContent =
    getDescriptionText(item);

  viewerTags.innerHTML = "";

  getTagsArray(
    item.tags
  ).forEach((tag) => {
    const tagElement =
      document.createElement(
        "span"
      );

    tagElement.className =
      "tag";

    tagElement.textContent =
      tag;

    viewerTags.appendChild(
      tagElement
    );
  });

  closeViewerEditForm();

  viewer.classList.add(
    "open"
  );

  if (
    window.innerWidth <= 768
  ) {
    viewerLeft.style.display =
      "flex";

    viewerRight.classList.remove(
      "active"
    );
  }
}

function closeViewer() {
  viewer.classList.remove(
    "open"
  );

  closeViewerEditForm();
}

viewerCloseBtn.addEventListener(
  "click",
  closeViewer
);

viewer.addEventListener(
  "click",
  (event) => {
    const clickedInside =
      event.target ===
        viewerImage ||
      event.target.closest(
        ".viewer-right"
      ) ||
      event.target.closest(
        ".viewer-arrow"
      ) ||
      event.target ===
        viewerCloseBtn;

    if (!clickedInside) {
      closeViewer();
    }
  }
);

btnPrev.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();

    if (
      displayedWorks.length === 0
    ) {
      return;
    }

    currentIndex =
      (
        currentIndex -
        1 +
        displayedWorks.length
      ) %
      displayedWorks.length;

    openViewer(currentIndex);
  }
);

btnNext.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();

    if (
      displayedWorks.length === 0
    ) {
      return;
    }

    currentIndex =
      (currentIndex + 1) %
      displayedWorks.length;

    openViewer(currentIndex);
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      closeViewer();

      return;
    }

    if (
      !viewer.classList.contains(
        "open"
      )
    ) {
      return;
    }

    if (
      displayedWorks.length === 0
    ) {
      return;
    }

    if (
      event.key === "ArrowLeft"
    ) {
      currentIndex =
        (
          currentIndex -
          1 +
          displayedWorks.length
        ) %
        displayedWorks.length;

      openViewer(currentIndex);
    }

    if (
      event.key === "ArrowRight"
    ) {
      currentIndex =
        (currentIndex + 1) %
        displayedWorks.length;

      openViewer(currentIndex);
    }
  }
);

// ===============================
// Viewer編集
// ===============================
function openViewerEditForm() {
  const item =
    displayedWorks[currentIndex];

  if (!adminMode ||
      !item) {
    return;
  }

  viewerEditTitle.value =
    item.title || "";

  viewerEditTags.value =
    getTagsArray(
      item.tags
    ).join(" ");

  viewerEditDate.value =
    item.date || "";

  viewerEditDescription.value =
    getDescriptionText(item);

  viewerEditForm.classList.remove(
    "hidden"
  );
}

function closeViewerEditForm() {
  viewerEditForm.classList.add(
    "hidden"
  );
}

viewerEditWork.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();

    openViewerEditForm();
  }
);

viewerCancelEdit.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();

    closeViewerEditForm();
  }
);

viewerSaveWork.addEventListener(
  "click",
  async (event) => {
    event.stopPropagation();

    const item =
      displayedWorks[
        currentIndex
      ];

    if (
      !requireAdminToken() ||
      !item
    ) {
      return;
    }

    const tags =
      viewerEditTags.value
        .split(/[\s、,，]+/)
        .map((tag) =>
          tag.trim()
        )
        .filter(Boolean);

    try {
      const res = await fetch(
        `${API_BASE}/works/${item.id}`,
        {
          method: "PUT",

          headers: authHeaders({
            "Content-Type":
              "application/json"
          }),

          body: JSON.stringify({
            title:
              viewerEditTitle
                .value
                .trim(),

            tags,

            date:
              viewerEditDate.value,

            description:
              viewerEditDescription
                .value
                .trim()
          })
        }
      );

      if (!res.ok) {
        alert(
          "保存に失敗しました"
        );

        return;
      }

      closeViewer();

      await loadWorks();
    } catch (error) {
      console.error(error);

      alert(
        "保存に失敗しました"
      );
    }
  }
);

// ===============================
// 削除
// ===============================
viewerDeleteWork.addEventListener(
  "click",
  async (event) => {
    event.stopPropagation();

    const item =
      displayedWorks[
        currentIndex
      ];

    if (!adminMode ||
        !item) {
      return;
    }

    await deleteWork(
      item.id
    );
  }
);

async function deleteWork(id) {
  if (!requireAdminToken()) {
    return;
  }

  const confirmed =
    confirm(
      "本当に削除しますか？"
    );

  if (!confirmed) {
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/works/${id}`,
      {
        method: "DELETE",
        headers: authHeaders()
      }
    );

    if (!res.ok) {
      alert(
        "削除に失敗しました"
      );

      return;
    }

    closeViewer();

    await loadWorks();
  } catch (error) {
    console.error(error);

    alert(
      "削除に失敗しました"
    );
  }
}

// ===============================
// スマホViewer操作
// ===============================
function enableDragSheet() {
  if (!viewerRight) {
    return;
  }

  let startY = 0;
  let isDragging = false;

  viewerRight.addEventListener(
    "touchstart",
    (event) => {
      const touchY =
        event.touches[0]
          .clientY;

      const rect =
        viewerRight
          .getBoundingClientRect();

      const offsetY =
        touchY - rect.top;

      if (offsetY <= 60) {
        startY = touchY;
        isDragging = true;
      }
    }
  );

  viewerRight.addEventListener(
    "touchmove",
    (event) => {
      if (!isDragging) {
        return;
      }

      const currentY =
        event.touches[0]
          .clientY;

      const diff =
        startY - currentY;

      if (diff > 20) {
        viewerRight.classList.add(
          "active"
        );
      }

      if (diff < -20) {
        viewerRight.classList.remove(
          "active"
        );
      }
    }
  );

  viewerRight.addEventListener(
    "touchend",
    () => {
      isDragging = false;
    }
  );

  if (dragHandle) {
    dragHandle.addEventListener(
      "click",
      () => {
        viewerRight.classList.toggle(
          "active"
        );
      }
    );
  }
}

function enableSwipeNavigation() {
  if (!viewerLeft) {
    return;
  }

  let startX = 0;

  viewerLeft.addEventListener(
    "touchstart",
    (event) => {
      startX =
        event.touches[0]
          .clientX;
    }
  );

  viewerLeft.addEventListener(
    "touchend",
    (event) => {
      if (
        displayedWorks.length === 0
      ) {
        return;
      }

      const endX =
        event.changedTouches[0]
          .clientX;

      const diff =
        endX - startX;

      if (diff < -50) {
        currentIndex =
          (currentIndex + 1) %
          displayedWorks.length;

        openViewer(
          currentIndex
        );
      }

      if (diff > 50) {
        currentIndex =
          (
            currentIndex -
            1 +
            displayedWorks.length
          ) %
          displayedWorks.length;

        openViewer(
          currentIndex
        );
      }
    }
  );
}

// ===============================
// ABOUT
// ===============================
async function loadAbout() {
  try {
    const res = await fetch(
      `${API_BASE}/about`,
      {
        cache: "no-store"
      }
    );

    if (!res.ok) {
      throw new Error(
        `ABOUT取得失敗: ${res.status}`
      );
    }

    const html =
      await res.text();

    const element =
      document.getElementById(
        "about-content"
      );

    if (element) {
      element.innerHTML =
        html;
    }
  } catch (error) {
    console.error(error);
  }
}

// ===============================
// 制作について
// ===============================
async function loadInfo() {
  try {
    const res = await fetch(
      `${API_BASE}/works-info`,
      {
        cache: "no-store"
      }
    );

    if (!res.ok) {
      throw new Error(
        `制作情報取得失敗: ${res.status}`
      );
    }

    const html =
      await res.text();

    const element =
      document.getElementById(
        "info-content"
      );

    if (element) {
      element.innerHTML =
        html;
    }
  } catch (error) {
    console.error(error);
  }
}

// ===============================
// ABOUT・制作について編集
// ===============================
function openTextEditor(type) {
  if (!requireAdminToken()) {
    return;
  }

  editingPage = type;

  const contentElement =
    type === "about"
      ? document.getElementById(
          "about-content"
        )
      : document.getElementById(
          "info-content"
        );

  modalTitle.textContent =
    type === "about"
      ? "ABOUTを編集"
      : "制作についてを編集";

  modalTextarea.value =
    contentElement
      ? contentElement.innerHTML.trim()
      : "";

  modal.classList.add(
    "open"
  );
}

editAboutBtn.addEventListener(
  "click",
  () => {
    openTextEditor(
      "about"
    );
  }
);

editInfoBtn.addEventListener(
  "click",
  () => {
    openTextEditor(
      "info"
    );
  }
);

modalCancel.addEventListener(
  "click",
  () => {
    modal.classList.remove(
      "open"
    );

    editingPage = null;
  }
);

modalSave.addEventListener(
  "click",
  async () => {
    if (
      !editingPage ||
      !requireAdminToken()
    ) {
      return;
    }

    const endpoint =
      editingPage === "about"
        ? "/about"
        : "/works-info";

    try {
      const res = await fetch(
        `${API_BASE}${endpoint}`,
        {
          method: "PUT",

          headers: authHeaders({
            "Content-Type":
              "text/html"
          }),

          body:
            modalTextarea.value
        }
      );

      if (!res.ok) {
        alert(
          "保存に失敗しました"
        );

        return;
      }

      modal.classList.remove(
        "open"
      );

      editingPage = null;

      await loadAbout();
      await loadInfo();

      alert(
        "保存しました"
      );
    } catch (error) {
      console.error(error);

      alert(
        "保存に失敗しました"
      );
    }
  }
);

// ===============================
// アップロード
// ===============================
function saveCurrentUploadStepValue() {
  if (uploadStep === 0) {
    uploadData.title =
      uploadStepInput
        .value
        .trim();
  }

  if (uploadStep === 1) {
    uploadData.tags =
      uploadStepInput
        .value
        .trim();
  }

  if (uploadStep === 2) {
    uploadData.date =
      uploadStepMonth.value;
  }

  if (uploadStep === 3) {
    uploadData.description =
      uploadStepTextarea
        .value
        .trim();
  }
}

function openUploadStepModal() {
  if (!requireAdminToken()) {
    return;
  }

  uploadStepModal.classList.add(
    "open"
  );

  uploadStepInput.style.display =
    "none";

  uploadStepMonth.style.display =
    "none";

  uploadStepTextarea.style.display =
    "none";

  uploadStepOk.style.display =
    "block";

  uploadStepBack.style.display =
    uploadStep === 0 ||
    uploadStep === 4
      ? "none"
      : "block";

  if (uploadStep === 0) {
    uploadStepTitle.textContent =
      "タイトルを入力してください";

    uploadStepInput.style.display =
      "block";

    uploadStepInput.value =
      uploadData.title;
  }

  if (uploadStep === 1) {
    uploadStepTitle.textContent =
      "タグを入力してください（スペース区切り）";

    uploadStepInput.style.display =
      "block";

    uploadStepInput.value =
      uploadData.tags;
  }

  if (uploadStep === 2) {
    uploadStepTitle.textContent =
      "年月を選択してください";

    uploadStepMonth.style.display =
      "block";

    uploadStepMonth.value =
      uploadData.date;
  }

  if (uploadStep === 3) {
    uploadStepTitle.textContent =
      "概要を入力してください";

    uploadStepTextarea.style.display =
      "block";

    uploadStepTextarea.value =
      uploadData.description;
  }

  if (uploadStep === 4) {
    uploadStepTitle.textContent =
      "アップロード中...";

    uploadStepOk.style.display =
      "none";

    uploadAllFiles();
  }
}

uploadStepBack.addEventListener(
  "click",
  () => {
    if (uploadStep <= 0) {
      return;
    }

    saveCurrentUploadStepValue();

    uploadStep--;

    openUploadStepModal();
  }
);

uploadStepOk.addEventListener(
  "click",
  () => {
    saveCurrentUploadStepValue();

    if (uploadStep < 3) {
      uploadStep++;

      openUploadStepModal();

      return;
    }

    if (uploadStep === 3) {
      uploadStep++;

      openUploadStepModal();
    }
  }
);

uploadDropzone.addEventListener(
  "dragover",
  (event) => {
    event.preventDefault();

    uploadDropzone.classList.add(
      "dragover"
    );
  }
);

uploadDropzone.addEventListener(
  "dragleave",
  () => {
    uploadDropzone.classList.remove(
      "dragover"
    );
  }
);

uploadDropzone.addEventListener(
  "drop",
  (event) => {
    event.preventDefault();

    uploadDropzone.classList.remove(
      "dragover"
    );

    if (!requireAdminToken()) {
      return;
    }

    const files =
      Array.from(
        event.dataTransfer.files
      );

    if (files.length === 0) {
      return;
    }

    uploadData.files = files;
    uploadStep = 0;

    openUploadStepModal();
  }
);

async function uploadAllFiles() {
  if (!requireAdminToken()) {
    return;
  }

  for (
    const file of uploadData.files
  ) {
    if (
      file.size >
      10 * 1024 * 1024
    ) {
      alert(
        `10MBを超える画像はアップロードできません: ${file.name}`
      );

      return;
    }

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "meta",
      JSON.stringify({
        title:
          uploadData.title,

        tags:
          uploadData.tags,

        date:
          uploadData.date,

        description:
          uploadData.description
      })
    );

    try {
      const res = await fetch(
        `${API_BASE}/upload`,
        {
          method: "POST",

          headers:
            authHeaders(),

          body:
            formData
        }
      );

      if (!res.ok) {
        alert(
          `アップロード失敗: ${res.status}`
        );

        return;
      }
    } catch (error) {
      console.error(error);

      alert(
        "通信エラー"
      );

      return;
    }
  }

  uploadStepModal.classList.remove(
    "open"
  );

  uploadData = {
    files: [],
    title: "",
    tags: "",
    date: "",
    description: ""
  };

  uploadStep = 0;

  await loadWorks();
}

// ===============================
// 初期処理
// ===============================
window.addEventListener(
  "load",
  () => {
    const overlay =
      document.getElementById(
        "loading-overlay"
      );

    setTimeout(() => {
      if (overlay) {
        overlay.classList.add(
          "hidden"
        );
      }
    }, 500);

    const view =
      location.hash.replace(
        "#",
        ""
      ) || "gallery";

    showView(view);

    if (adminToken) {
      adminMode = true;

      document.body.classList.add(
        "admin-mode"
      );
    }

    if (
      window.innerWidth <= 768
    ) {
      enableDragSheet();
      enableSwipeNavigation();
    }

    loadWorks();
    loadAbout();
    loadInfo();
  }
);
