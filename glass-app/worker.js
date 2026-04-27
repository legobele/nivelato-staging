// DESKTOP-T1SM420 Cloudflare Worker Subagent
const CMD_SERVER = "https://vague-nonspeculatively-florida.ngrok-free.dev/";
const SECRET = "t1sm420secret";

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== "POST") {
    return new Response("DESKTOP-T1SM420 subagent online", { status: 200 });
  }

  const auth = request.headers.get("X-Worker-Secret");
  if (auth !== "t1sm420worker") {
    return new Response("Forbidden", { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const cmd = body.cmd;
  if (!cmd) return new Response("No cmd", { status: 400 });

  const resp = await fetch(CMD_SERVER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Secret": SECRET,
    },
    body: JSON.stringify({ cmd }),
  });

  const result = await resp.json();

  const wrapped = {
    machine: "DESKTOP-T1SM420",
    drive: "THE_TISM",
    output: result.output,
    exitCode: resp.status === 200 ? 0 : 1,
  };

  return new Response(JSON.stringify(wrapped, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
