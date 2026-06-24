export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // おにーちゃんの IP（Cloudflare の変数で管理）
    const allowedIp = env.ALLOWED_IP;
    const clientIp =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("x-forwarded-for") ||
      "";

    const isEditor = clientIp === allowedIp;

    // GET /works → KV の内容を返す
    if (url.pathname === "/works" && request.method === "GET") {
      let data = await env.WORKS_KV.get("works", { type: "json" });
      if (!data) data = {};

      return new Response(
        JSON.stringify(
          {
            works: data,
            canEdit: isEditor,
          },
          null,
          2
        ),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // POST /works → 編集内容を保存（IP 制限）
    if (url.pathname === "/works" && request.method === "POST") {
      if (!isEditor) {
        return new Response("Forbidden", { status: 403 });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }

      const { img, title, category, tags, desc } = body;
      if (!img) {
        return new Response("img is required", { status: 400 });
      }

      let data = await env.WORKS_KV.get("works", { type: "json" });
      if (!data) data = {};

      data[img] = {
        title: title || "",
        category: category || "news",
        tags: Array.isArray(tags) ? tags : [],
        desc: desc || "",
      };

      await env.WORKS_KV.put("works", JSON.stringify(data));

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
