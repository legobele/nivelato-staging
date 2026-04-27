// SUBAGENT 2: Research — web analysis, market intel, document summarization
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
          { role: "system", content: "You are the Research subagent for DESKTOP-T1SM420. You analyze documents, summarize information, and provide structured research outputs. Be thorough but concise." },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.5
      })
    });
    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content ?? "no response";
    return new Response(JSON.stringify({ agent: "research", reply }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
