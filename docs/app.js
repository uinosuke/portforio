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

  // JSON + バイナリをまとめて送る
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
