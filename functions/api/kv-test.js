export default {
  async fetch(request, env) {
    await env.WORKS_KV.put("hello", "world");
    const value = await env.WORKS_KV.get("hello");

    return new Response("KV says: " + value);
  }
};
