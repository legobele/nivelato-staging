// Base template for all subagent workers
// Each worker has a NAME, ROLE, and SYSTEM_PROMPT
// They all hit the llama-server on the codespace via ngrok

const LLAMA_SERVER = "NGROK_URL_PLACEHOLDER";
const LLAMA_SECRET = "t1sm420secret";

async function runInference(systemPrompt, userMessage, maxTokens = 300) {
  const resp = await fetch(`${LLAMA_SERVER}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Secret": LLAMA_SECRET },
    body: JSON.stringify({
      model: "lfm2-vl",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? "no response";
}

export default { runInference };
