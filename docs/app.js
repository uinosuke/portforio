// ===============================
// viewer を dropzone の「下」に移動
// ===============================
dropzone.insertAdjacentElement("afterend", viewer);

// viewer を開く
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

  viewerDescription.textContent = item.description;

  viewer.classList.add("open");
}

// viewer を閉じる
function closeViewer() {
  viewer.classList.remove("open");
}
