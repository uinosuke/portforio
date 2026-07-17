// ===============================
// 設定
// ===============================
const API_BASE = "https://delicate-sunset-ea8a.d08084222816.workers.dev";
const APP_VERSION = "2026-07-17-home-design-v2";
console.info(`[portfolio] ${APP_VERSION}`);

// ===============================
// DOM取得
// ===============================
const worksList = document.getElementById("works-list");
const recentWorksList = document.getElementById("recent-works-list");
const homeRecentList = document.getElementById("home-recent-list");
const homeDesignCount = document.getElementById("home-design-count");
const homeRecentCount = document.getElementById("home-recent-count");
const homeRecentRange = document.getElementById("home-recent-range");
const homeFeatureImages = [
  document.getElementById("home-feature-image-1"),
  document.getElementById("home-feature-image-2"),
  document.getElementById("home-feature-image-3"),
];
const galleryCount = document.getElementById("gallery-count");
const recentCount = document.getElementById("recent-count");
const mobileGalleryCount = document.getElementById("mobile-gallery-count");
const mobileRecentCount = document.getElementById("mobile-recent-count");
const galleryTotalLabel = document.getElementById("gallery-total-label");
const recentTotalLabel = document.getElementById("recent-total-label");
const recentRange = document.getElementById("recent-range");
const recentSummaryRange = document.getElementById("recent-summary-range");
const filterChips = document.querySelectorAll(".filter-chip");
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

// ===============================
// 状態
// ===============================
let adminMode = false;
let adminToken = localStorage.getItem("adminToken") || "";
let works = [];
let displayedWorks = [];
let currentIndex = 0;
let currentPage = 0;
let currentView = "home";
let activeCategory = "all";
let resizeTimer = null;

const PAGE_SIZE = 30;

let isLoading = false;
let allLoaded = false;
let uploadStep = 0;

let uploadData = {
  files: [],
  title: "",
  tags: "",
  date: "",
  description: "",
};

let editingPage = null;
let isPcComposing = false;
let isMobileComposing = false;

// ===============================
// 共通処理
// ===============================
function authHeaders(extraHeaders = {}) {
  return {
    ...extraHeaders,
    Authorization: `Bearer ${adminToken}`,
  };
}

function requireAdminToken() {
  if (!adminToken) {
    alert("管理者ログインが必要です");
    return false;
  }

  return true;
}

function normalizeSearchText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(normalizeSearchText).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value).map(normalizeSearchText).join(" ");
  }

  return String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[＃#]/g, "")
    .replace(/[、,，。．・／/|｜]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTagsArray(tags) {
  if (tags === null || tags === undefined) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.flatMap(getTagsArray).filter(Boolean);
  }

  if (typeof tags === "object") {
    return Object.values(tags).flatMap(getTagsArray).filter(Boolean);
  }

  const text = String(tags).trim();

  if (!text) {
    return [];
  }

  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) {
        return parsed.flatMap(getTagsArray).filter(Boolean);
      }
    } catch (error) {
      console.warn("タグのJSON変換を省略", error);
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
    item?.metadata?.description,
  ]
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value))
    .join(" ");
}

function getSearchTarget(item) {
  const titles = [
    item?.title,
    item?.name,
    item?.meta?.title,
    item?.metadata?.title,
  ];

  const tags = [
    item?.tags,
    item?.tag,
    item?.meta?.tags,
    item?.metadata?.tags,
  ];

  const descriptions = [
    item?.description,
    item?.desc,
    item?.summary,
    item?.overview,
    item?.caption,
    item?.meta?.description,
    item?.metadata?.description,
  ];

  return normalizeSearchText([
    titles,
    tags,
    descriptions,
  ]);
}

function getCurrentKeyword() {
  return searchInput.value || mobileSearchInput.value || "";
}

// ===============================
// 管理者ログイン
// ===============================
async function adminLogin() {
  const password = prompt("管理者パスワードを入力してください");

  if (!password) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password,
      }),
    });

    if (!res.ok) {
      alert("パスワードが違います");
      return;
    }

    const data = await res.json();

    adminToken = data.token || "";

    localStorage.setItem("adminToken", adminToken);

    adminMode = true;

    document.body.classList.add("admin-mode");

    alert("管理者モードに入りました");
  } catch (error) {
    console.error(error);
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

siteTitle.addEventListener("dblclick", () => {
  if (adminMode) {
    adminLogout();
  } else {
    adminLogin();
  }
});

siteTitle.addEventListener("click", () => {
  if (location.hash !== "#home") {
    location.hash = "#home";
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
function isWorksView(view) {
  return view === "gallery" || view === "recent";
}

function showView(view) {
  const requestedTarget = document.getElementById(`view-${view}`);
  const safeView = requestedTarget ? view : "gallery";

  currentView = safeView;

  document.querySelectorAll(".view").forEach((element) => {
    element.classList.add("hidden");
  });

  const target = document.getElementById(`view-${safeView}`);

  if (target) {
    target.classList.remove("hidden");
  }

  document
    .querySelectorAll(".nav-item[data-view]")
    .forEach((item) => {
      item.classList.toggle(
        "active",
        item.dataset.view === safeView,
      );
    });

  mobileMenuPanel.classList.remove("open");

  if (isWorksView(safeView)) {
    filterWorks(getCurrentKeyword());
  } else {
    closeViewer();

    if (safeView === "home") {
      renderHome();
    }
  }
}

document
  .querySelectorAll(".nav-item[data-view]")
  .forEach((item) => {
    item.addEventListener("click", () => {
      if (
        location.hash === `#${item.dataset.view}`
      ) {
        showView(item.dataset.view);
      }
    });
  });

window.addEventListener("hashchange", () => {
  const view =
    location.hash.replace("#", "") ||
    "home";

  showView(view);
});

// ===============================
// 最近の制作
// 今月＋先月の2か月分
// ===============================
function getMonthKey(value) {
  const text = String(value || "").trim();

  const match = text.match(
    /^(\d{4})[-\/.年](\d{1,2})/,
  );

  if (!match) {
    return "";
  }

  return `${match[1]}-${String(
    Number(match[2]),
  ).padStart(2, "0")}`;
}

function getRecentMonthKeys() {
  const now = new Date();

  const currentMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );

  const previousMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  );

  return [currentMonth, previousMonth].map(
    (date) =>
      `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`,
  );
}

function getRecentWorks() {
  const monthKeys = new Set(
    getRecentMonthKeys(),
  );

  return works.filter((item) =>
    monthKeys.has(getMonthKey(item.date)),
  );
}

function getRecentRangeLabel() {
  const keys = getRecentMonthKeys();
  const older = keys[1].split("-");
  const newer = keys[0].split("-");

  if (older[0] === newer[0]) {
    return `${newer[0]}年${Number(
      older[1],
    )}月〜${Number(newer[1])}月`;
  }

  return `${older[0]}年${Number(
    older[1],
  )}月〜${newer[0]}年${Number(
    newer[1],
  )}月`;
}

function updatePortfolioStats() {
  const recentWorks = getRecentWorks();
  const rangeLabel = getRecentRangeLabel();

  [
    galleryCount,
    mobileGalleryCount,
  ].forEach((element) => {
    if (element) {
      element.textContent = works.length;
    }
  });

  [
    recentCount,
    mobileRecentCount,
  ].forEach((element) => {
    if (element) {
      element.textContent =
        recentWorks.length;
    }
  });

  if (galleryTotalLabel) {
    galleryTotalLabel.textContent =
      `${works.length} works`;
  }

  if (recentTotalLabel) {
    recentTotalLabel.textContent =
      recentWorks.length;
  }

  if (recentRange) {
    recentRange.textContent = rangeLabel;
  }

  if (recentSummaryRange) {
    recentSummaryRange.textContent =
      rangeLabel;
  }

  if (homeDesignCount) {
    homeDesignCount.textContent = works.length;
  }

  if (homeRecentCount) {
    homeRecentCount.textContent =
      recentWorks.length;
  }

  if (homeRecentRange) {
    homeRecentRange.textContent =
      rangeLabel.replace("年", ".").replace("月〜", "–").replace("月", "");
  }
}


function createHomeWorkCard(
  item,
  index,
  homeWorks,
) {
  const card =
    document.createElement("article");

  card.className =
    "work-card home-work-card";

  const image =
    document.createElement("img");

  image.className = "work-image";
  image.src = item.image || "";
  image.alt = item.title || "";
  image.loading = "lazy";

  const body =
    document.createElement("div");

  body.className = "work-body";

  const tags =
    document.createElement("div");

  tags.className = "work-tag-list";

  getTagsArray(item.tags)
    .slice(0, 2)
    .forEach((tag) => {
      const tagElement =
        document.createElement("span");

      tagElement.className = "work-tag";
      tagElement.textContent = tag;
      tags.appendChild(tagElement);
    });

  const title =
    document.createElement("p");

  title.className = "work-title";
  title.textContent =
    item.title || "無題";

  const meta =
    document.createElement("div");

  meta.className = "work-meta";

  const date =
    document.createElement("span");

  date.className = "work-date";
  date.textContent = item.date || "";

  meta.appendChild(date);

  if (tags.children.length > 0) {
    body.appendChild(tags);
  }

  body.appendChild(title);
  body.appendChild(meta);
  card.appendChild(image);
  card.appendChild(body);

  card.addEventListener("click", () => {
    displayedWorks = [...homeWorks];
    openViewer(index);
  });

  return card;
}

function renderHome() {
  if (!homeRecentList) {
    return;
  }

  const recentWorks =
    getRecentWorks().slice(0, 6);

  homeRecentList.innerHTML = "";

  if (recentWorks.length === 0) {
    const empty =
      document.createElement("div");

    empty.className =
      "empty-state home-empty-state";

    empty.innerHTML =
      "<strong>最近2か月の制作物はまだありません</strong><span>作品に今月または先月のDATEを設定すると、ここに自動表示されます。</span>";

    homeRecentList.appendChild(empty);
  } else {
    recentWorks.forEach((item, index) => {
      homeRecentList.appendChild(
        createHomeWorkCard(
          item,
          index,
          recentWorks,
        ),
      );
    });
  }

  const visualWorks = [
    ...recentWorks,
    ...works.filter(
      (item) =>
        !recentWorks.some(
          (recentItem) =>
            recentItem.id === item.id,
        ),
    ),
  ].slice(0, 3);

  homeFeatureImages.forEach(
    (image, index) => {
      if (!image) {
        return;
      }

      const item = visualWorks[index];
      const card = image.closest(
        ".home-visual-card",
      );

      if (!item?.image) {
        image.removeAttribute("src");
        image.alt = "";

        if (card) {
          card.classList.add("is-empty");
        }

        return;
      }

      image.src = item.image;
      image.alt = item.title ||
        "最近の制作物";

      if (card) {
        card.classList.remove("is-empty");
      }
    },
  );
}

function getSourceWorks() {
  if (currentView === "recent") {
    return getRecentWorks();
  }

  return works;
}

function getActiveWorksList() {
  if (currentView === "recent") {
    return recentWorksList;
  }

  return worksList;
}

function ensureWorksViewForSearch() {
  if (isWorksView(currentView)) {
    return;
  }

  currentView = "gallery";
  location.hash = "#gallery";
  showView("gallery");
}

// ===============================
// 作品一覧取得
// ===============================
async function loadWorks() {
  try {
    const res = await fetch(`${API_BASE}/works`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`作品一覧の取得失敗: ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("作品一覧が配列ではありません");
    }

    works = [...data].reverse();

    updatePortfolioStats();

    console.info("[portfolio] 作品数", works.length);

    if (works.length > 0) {
      console.info("[portfolio] 作品データ例", works[0]);
    }

    renderHome();

    if (isWorksView(currentView)) {
      filterWorks(getCurrentKeyword());
    }
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
function getColumnCount() {
  const width = window.innerWidth;

  if (width <= 768) {
    return 2;
  }

  if (width <= 1100) {
    return 3;
  }

  if (width <= 1500) {
    return 4;
  }

  return 5;
}

function resetGallery() {
  if (worksList) {
    worksList.innerHTML = "";
  }

  if (recentWorksList) {
    recentWorksList.innerHTML = "";
  }

  currentPage = 0;
  isLoading = false;
  allLoaded = false;

  renderPage();
}

function createColumns(
  columnCount,
  targetList,
) {
  return Array.from(
    {
      length: columnCount,
    },
    () => {
      const column =
        document.createElement("div");

      column.className = "works-column";

      targetList.appendChild(column);

      return column;
    },
  );
}

function createEmptyState(targetList) {
  const empty =
    document.createElement("div");

  empty.className = "empty-state";

  empty.innerHTML =
    currentView === "recent"
      ? "<strong>最近2か月の制作物はまだありません</strong><span>作品のDATEが今月または先月になると、自動でここにも表示されます。</span>"
      : "<strong>該当する制作物がありません</strong><span>検索語やカテゴリを変えてみてください。</span>";

  targetList.appendChild(empty);
}

function renderPage() {
  if (
    isLoading ||
    allLoaded ||
    !isWorksView(currentView)
  ) {
    return;
  }

  const targetList =
    getActiveWorksList();

  if (!targetList) {
    return;
  }

  isLoading = true;

  if (
    displayedWorks.length === 0 &&
    currentPage === 0
  ) {
    createEmptyState(targetList);

    allLoaded = true;
    isLoading = false;

    return;
  }

  const columnCount = getColumnCount();

  let columns =
    Array.from(targetList.children).filter(
      (element) =>
        element.classList.contains(
          "works-column",
        ),
    );

  if (columns.length === 0) {
    columns = createColumns(
      columnCount,
      targetList,
    );
  }

  const start = currentPage * PAGE_SIZE;

  const end = Math.min(
    start + PAGE_SIZE,
    displayedWorks.length,
  );

  for (
    let index = start;
    index < end;
    index++
  ) {
    const item = displayedWorks[index];

    const card =
      document.createElement("article");

    card.className = "work-card";

    const image =
      document.createElement("img");

    image.className = "work-image";
    image.src = item.image || "";
    image.alt = item.title || "";
    image.loading = "lazy";

    const body =
      document.createElement("div");

    body.className = "work-body";

    const tags =
      document.createElement("div");

    tags.className = "work-tag-list";

    getTagsArray(item.tags)
      .slice(0, 2)
      .forEach((tag) => {
        const tagElement =
          document.createElement("span");

        tagElement.className =
          "work-tag";

        tagElement.textContent = tag;

        tags.appendChild(tagElement);
      });

    const title =
      document.createElement("p");

    title.className = "work-title";
    title.textContent =
      item.title || "無題";

    const meta =
      document.createElement("div");

    meta.className = "work-meta";

    const date =
      document.createElement("span");

    date.className = "work-date";
    date.textContent = item.date || "";

    meta.appendChild(date);

    if (tags.children.length > 0) {
      body.appendChild(tags);
    }

    body.appendChild(title);
    body.appendChild(meta);

    card.appendChild(image);
    card.appendChild(body);

    card.addEventListener("click", () => {
      openViewer(index);
    });

    columns[
      index % columnCount
    ].appendChild(card);
  }

  if (end >= displayedWorks.length) {
    allLoaded = true;
  }

  currentPage++;
  isLoading = false;
}

window.addEventListener("scroll", () => {
  const nearBottom =
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 300;

  if (nearBottom) {
    renderPage();
  }
});

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    if (isWorksView(currentView)) {
      filterWorks(getCurrentKeyword());
    }
  }, 180);
});

// ===============================
// 検索
//
// タイトル＋タグ＋概要
// 部分一致
// 全作品対象
// 複数語はOR検索
// 漢字変換中は検索しない
// ===============================
function filterWorks(keyword) {
  const normalizedKeyword =
    normalizeSearchText(keyword);

  const words = normalizedKeyword
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);

  // カテゴリごとに検索対象となる文字列を設定
  const categoryKeywords = {
    高齢者: ["高齢者", "GH", "YH"],
  };

  const categories =
    activeCategory === "all"
      ? []
      : categoryKeywords[activeCategory] ||
        [activeCategory];

  const normalizedCategories =
    categories.map((category) =>
      normalizeSearchText(category),
    );

  const sourceWorks = getSourceWorks();

  displayedWorks = sourceWorks.filter(
    (item) => {
      const searchTarget =
        getSearchTarget(item);

      const matchesKeyword =
        words.length === 0 ||
        words.some((word) =>
          searchTarget.includes(word),
        );

      const matchesCategory =
        normalizedCategories.length === 0 ||
        normalizedCategories.some(
          (category) =>
            searchTarget.includes(category),
        );

      return (
        matchesKeyword &&
        matchesCategory
      );
    },
  );

  console.info("[portfolio] 検索", {
    view: currentView,
    keyword,
    normalizedKeyword,
    category: activeCategory,
    total: sourceWorks.length,
    matched: displayedWorks.length,
  });

  viewer.classList.remove("open");

  resetGallery();
}

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeCategory =
      chip.dataset.filter || "all";

    filterChips.forEach((item) => {
      item.classList.toggle(
        "active",
        item.dataset.filter ===
          activeCategory,
      );
    });

    filterWorks(getCurrentKeyword());
  });
});

function runPcSearch() {
  ensureWorksViewForSearch();

  const keyword = searchInput.value;

  mobileSearchInput.value = keyword;

  searchClear.style.display =
    keyword.trim() ? "block" : "none";

  filterWorks(keyword);
}

searchInput.addEventListener("compositionstart", () => {
  isPcComposing = true;
});

searchInput.addEventListener("compositionend", () => {
  isPcComposing = false;

  runPcSearch();
});

searchInput.addEventListener("input", (event) => {
  if (isPcComposing || event.isComposing) {
    return;
  }

  runPcSearch();
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  mobileSearchInput.value = "";

  searchClear.style.display = "none";

  filterWorks("");

  searchInput.focus();
});

mobileSearchInput.addEventListener("compositionstart", () => {
  isMobileComposing = true;
});

mobileSearchInput.addEventListener("compositionend", () => {
  isMobileComposing = false;
});

mobileSearchBtn.addEventListener("click", () => {
  ensureWorksViewForSearch();

  const keyword = mobileSearchInput.value;

  searchInput.value = keyword;

  searchClear.style.display =
    keyword.trim() ? "block" : "none";

  filterWorks(keyword);

  mobileMenuPanel.classList.remove("open");

  showView("gallery");
});

mobileSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
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
});

// ===============================
// 画像一覧・最近の制作へ移動したら
// 検索とカテゴリを初期化
// ===============================
document
  .querySelectorAll(
    ".nav-item[data-view='gallery'], .nav-item[data-view='recent']",
  )
  .forEach((button) => {
    button.addEventListener("click", () => {
      searchInput.value = "";
      mobileSearchInput.value = "";

      searchClear.style.display = "none";
      activeCategory = "all";

      filterChips.forEach((chip) => {
        chip.classList.toggle(
          "active",
          chip.dataset.filter === "all",
        );
      });
    });
  });

// ===============================
// Viewer
// ===============================
function openViewer(index) {
  const item = displayedWorks[index];

  if (!item) {
    return;
  }

  currentIndex = index;

  viewerImage.src = item.image || "";
  viewerImage.alt = item.title || "";

  viewerTitle.textContent = item.title || "";
  viewerDate.textContent = item.date || "";

  viewerDescription.textContent =
    getDescriptionText(item);

  viewerTags.innerHTML = "";

  getTagsArray(item.tags).forEach((tag) => {
    const tagElement =
      document.createElement("span");

    tagElement.className = "tag";
    tagElement.textContent = tag;

    viewerTags.appendChild(tagElement);
  });

  closeViewerEditForm();

  viewer.classList.add("open");

  if (window.innerWidth <= 768) {
    viewerLeft.style.display = "flex";
    viewerRight.classList.remove("active");
  }
}

function closeViewer() {
  viewer.classList.remove("open");

  closeViewerEditForm();
}

viewerCloseBtn.addEventListener(
  "click",
  closeViewer,
);

viewer.addEventListener("click", (event) => {
  const clickedInside =
    event.target === viewerImage ||
    event.target.closest(".viewer-right") ||
    event.target.closest(".viewer-arrow") ||
    event.target === viewerCloseBtn;

  if (!clickedInside) {
    closeViewer();
  }
});

btnPrev.addEventListener("click", (event) => {
  event.stopPropagation();

  if (displayedWorks.length === 0) {
    return;
  }

  currentIndex =
    (currentIndex - 1 + displayedWorks.length) %
    displayedWorks.length;

  openViewer(currentIndex);
});

btnNext.addEventListener("click", (event) => {
  event.stopPropagation();

  if (displayedWorks.length === 0) {
    return;
  }

  currentIndex =
    (currentIndex + 1) %
    displayedWorks.length;

  openViewer(currentIndex);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeViewer();
    return;
  }

  if (!viewer.classList.contains("open")) {
    return;
  }

  if (displayedWorks.length === 0) {
    return;
  }

  if (event.key === "ArrowLeft") {
    currentIndex =
      (currentIndex - 1 + displayedWorks.length) %
      displayedWorks.length;

    openViewer(currentIndex);
  }

  if (event.key === "ArrowRight") {
    currentIndex =
      (currentIndex + 1) %
      displayedWorks.length;

    openViewer(currentIndex);
  }
});

// ===============================
// Viewer編集
// ===============================
function openViewerEditForm() {
  const item = displayedWorks[currentIndex];

  if (!adminMode || !item) {
    return;
  }

  viewerEditTitle.value = item.title || "";

  viewerEditTags.value =
    getTagsArray(item.tags).join(" ");

  viewerEditDate.value = item.date || "";

  viewerEditDescription.value =
    getDescriptionText(item);

  viewerEditForm.classList.remove("hidden");
}

function closeViewerEditForm() {
  viewerEditForm.classList.add("hidden");
}

viewerEditWork.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();

    openViewerEditForm();
  },
);

viewerCancelEdit.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();

    closeViewerEditForm();
  },
);

viewerSaveWork.addEventListener(
  "click",
  async (event) => {
    event.stopPropagation();

    const item = displayedWorks[currentIndex];

    if (!requireAdminToken() || !item) {
      return;
    }

    const tags = viewerEditTags.value
      .split(/[\s、,，]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const res = await fetch(
        `${API_BASE}/works/${item.id}`,
        {
          method: "PUT",

          headers: authHeaders({
            "Content-Type":
              "application/json",
          }),

          body: JSON.stringify({
            title:
              viewerEditTitle.value.trim(),

            tags,

            date:
              viewerEditDate.value,

            description:
              viewerEditDescription.value.trim(),
          }),
        },
      );

      if (!res.ok) {
        alert("保存に失敗しました");
        return;
      }

      closeViewer();

      await loadWorks();
    } catch (error) {
      console.error(error);

      alert("保存に失敗しました");
    }
  },
);

// ===============================
// 削除
// ===============================
viewerDeleteWork.addEventListener(
  "click",
  async (event) => {
    event.stopPropagation();

    const item = displayedWorks[currentIndex];

    if (!adminMode || !item) {
      return;
    }

    await deleteWork(item.id);
  },
);

async function deleteWork(id) {
  if (!requireAdminToken()) {
    return;
  }

  const confirmed =
    confirm("本当に削除しますか？");

  if (!confirmed) {
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/works/${id}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );

    if (!res.ok) {
      alert("削除に失敗しました");
      return;
    }

    closeViewer();

    await loadWorks();
  } catch (error) {
    console.error(error);

    alert("削除に失敗しました");
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
        event.touches[0].clientY;

      const rect =
        viewerRight.getBoundingClientRect();

      const offsetY =
        touchY - rect.top;

      if (offsetY <= 60) {
        startY = touchY;
        isDragging = true;
      }
    },
  );

  viewerRight.addEventListener(
    "touchmove",
    (event) => {
      if (!isDragging) {
        return;
      }

      const currentY =
        event.touches[0].clientY;

      const diff =
        startY - currentY;

      if (diff > 20) {
        viewerRight.classList.add("active");
      }

      if (diff < -20) {
        viewerRight.classList.remove("active");
      }
    },
  );

  viewerRight.addEventListener(
    "touchend",
    () => {
      isDragging = false;
    },
  );

  if (dragHandle) {
    dragHandle.addEventListener(
      "click",
      () => {
        viewerRight.classList.toggle("active");
      },
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
        event.touches[0].clientX;
    },
  );

  viewerLeft.addEventListener(
    "touchend",
    (event) => {
      if (displayedWorks.length === 0) {
        return;
      }

      const endX =
        event.changedTouches[0].clientX;

      const diff =
        endX - startX;

      if (diff < -50) {
        currentIndex =
          (currentIndex + 1) %
          displayedWorks.length;

        openViewer(currentIndex);
      }

      if (diff > 50) {
        currentIndex =
          (currentIndex - 1 +
            displayedWorks.length) %
          displayedWorks.length;

        openViewer(currentIndex);
      }
    },
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
        cache: "no-store",
      },
    );

    if (!res.ok) {
      throw new Error(
        `ABOUT取得失敗: ${res.status}`,
      );
    }

    const html = await res.text();

    const element =
      document.getElementById(
        "about-content",
      );

    if (element) {
      element.innerHTML = html;
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
        cache: "no-store",
      },
    );

    if (!res.ok) {
      throw new Error(
        `制作情報取得失敗: ${res.status}`,
      );
    }

    const html = await res.text();

    const element =
      document.getElementById(
        "info-content",
      );

    if (element) {
      element.innerHTML = html;
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
          "about-content",
        )
      : document.getElementById(
          "info-content",
        );

  modalTitle.textContent =
    type === "about"
      ? "ABOUTを編集"
      : "制作についてを編集";

  modalTextarea.value =
    contentElement
      ? contentElement.innerHTML.trim()
      : "";

  modal.classList.add("open");
}

editAboutBtn.addEventListener(
  "click",
  () => {
    openTextEditor("about");
  },
);

editInfoBtn.addEventListener(
  "click",
  () => {
    openTextEditor("info");
  },
);

modalCancel.addEventListener(
  "click",
  () => {
    modal.classList.remove("open");

    editingPage = null;
  },
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
              "text/html",
          }),

          body: modalTextarea.value,
        },
      );

      if (!res.ok) {
        alert("保存に失敗しました");
        return;
      }

      modal.classList.remove("open");

      editingPage = null;

      await loadAbout();
      await loadInfo();

      alert("保存しました");
    } catch (error) {
      console.error(error);

      alert("保存に失敗しました");
    }
  },
);

// ===============================
// アップロード
// ===============================
function saveCurrentUploadStepValue() {
  if (uploadStep === 0) {
    uploadData.title =
      uploadStepInput.value.trim();
  }

  if (uploadStep === 1) {
    uploadData.tags =
      uploadStepInput.value.trim();
  }

  if (uploadStep === 2) {
    uploadData.date =
      uploadStepMonth.value;
  }

  if (uploadStep === 3) {
    uploadData.description =
      uploadStepTextarea.value.trim();
  }
}

function openUploadStepModal() {
  if (!requireAdminToken()) {
    return;
  }

  uploadStepModal.classList.add("open");

  uploadStepInput.style.display = "none";
  uploadStepMonth.style.display = "none";
  uploadStepTextarea.style.display = "none";
  uploadStepOk.style.display = "block";

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
  },
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
  },
);

uploadDropzone.addEventListener(
  "dragover",
  (event) => {
    event.preventDefault();

    uploadDropzone.classList.add("dragover");
  },
);

uploadDropzone.addEventListener(
  "dragleave",
  () => {
    uploadDropzone.classList.remove("dragover");
  },
);

uploadDropzone.addEventListener(
  "drop",
  (event) => {
    event.preventDefault();

    uploadDropzone.classList.remove("dragover");

    if (!requireAdminToken()) {
      return;
    }

    const files =
      Array.from(event.dataTransfer.files);

    if (files.length === 0) {
      return;
    }

    uploadData.files = files;
    uploadStep = 0;

    openUploadStepModal();
  },
);

async function uploadAllFiles() {
  if (!requireAdminToken()) {
    return;
  }

  for (const file of uploadData.files) {
    if (
      file.size >
      10 * 1024 * 1024
    ) {
      alert(
        `10MBを超える画像はアップロードできません: ${file.name}`,
      );

      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
      "meta",
      JSON.stringify({
        title: uploadData.title,
        tags: uploadData.tags,
        date: uploadData.date,
        description:
          uploadData.description,
      }),
    );

    try {
      const res = await fetch(
        `${API_BASE}/upload`,
        {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        },
      );

      if (!res.ok) {
        alert(
          `アップロード失敗: ${res.status}`,
        );

        return;
      }
    } catch (error) {
      console.error(error);

      alert("通信エラー");

      return;
    }
  }

  uploadStepModal.classList.remove("open");

  uploadData = {
    files: [],
    title: "",
    tags: "",
    date: "",
    description: "",
  };

  uploadStep = 0;

  await loadWorks();
}

// ===============================
// 初期処理
// ===============================
window.addEventListener("load", () => {
  const overlay =
    document.getElementById(
      "loading-overlay",
    );

  setTimeout(() => {
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }, 500);

  const view =
    location.hash.replace("#", "") ||
    "gallery";

  showView(view);

  if (adminToken) {
    adminMode = true;

    document.body.classList.add(
      "admin-mode",
    );
  }

  if (window.innerWidth <= 768) {
    enableDragSheet();
    enableSwipeNavigation();
  }

  loadWorks();
  loadAbout();
  loadInfo();
});
