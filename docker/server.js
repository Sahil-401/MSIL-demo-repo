const http = require("http");

// ===== CONFIG =====
const STATIC_BURN_MS = 900;     // background constant CPU burn
const STATIC_INTERVAL_MS = 1000;

const REQUEST_BURN_MS = 600;   // extra CPU per request
// ==================

function burnCPU(ms) {
  const end = Date.now() + ms;
  let x = 0;
  while (Date.now() < end) {
    x += Math.sqrt(Math.random() * 1000);
  }
}

// 🔁 Static background load (always running)
function startStaticBurn() {
  function loop() {
    burnCPU(STATIC_BURN_MS);
    setTimeout(loop, STATIC_INTERVAL_MS);
  }
  loop();
}

// ⚡ Extra burst per request
function burnOnRequest() {
  setImmediate(() => {
    burnCPU(REQUEST_BURN_MS);
  });
}

startStaticBurn();

const server = http.createServer((req, res) => {
  if (req.url === "/app") {
    burnOnRequest();

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hi From APP-1\n");
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(3000, () => {
  console.log("Hybrid CPU stress server running on port 3000 (path: /app)");
});
