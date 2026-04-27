// SUBAGENT 4: QC/Safety — quality control checks, validation, error detection
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
          { role: "system", content: "You are the QC/Safety subagent for DESKTOP-T1SM420. You validate data, check for errors, inconsistencies, and safety issues. You are precise, critical, and flag problems clearly. Original role: Safety & QC Sentry at Clarivista Glass." },
          { role: "user", content: message }
        ],
        max_tokens: 400,
        temperature: 0.3
      })
    });
    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content ?? "no response";
    return new Response(JSON.stringify({ agent: "qc", reply }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
