// SUBAGENT 3: Creative — marketing copy, product descriptions, outreach drafts
export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("POST only", { status: 405 });
    const { message } = await request.json();
    const LLAMA = env.LLAMA_SERVER_URL;
    const resp = await fetch(`${LLAMA}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "lfm2-vl",
        messages: [
          { role: "system", content: "You are the Creative subagent for DESKTOP-T1SM420. You write marketing copy, product descriptions, social media content, and outreach materials. Be engaging and bilingual (English/Spanish) when helpful." },
          { role: "user", content: message }
        ],
        max_tokens: 400,
        temperature: 0.85
      })
    });
    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content ?? "no response";
    return new Response(JSON.stringify({ agent: "creative", reply }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
