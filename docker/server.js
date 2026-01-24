const http = require("http");
const os = require("os");

let requestCount = 0;

// ===== LOAD TEST CONFIG =====
const AUTO_BURN_MS = 500;   // CPU burn time per request (increase for more load)
// ============================

function burnCPU(ms) {
  const end = Date.now() + ms;
  let x = 0;
  while (Date.now() < end) {
    x += Math.sqrt(Math.random() * 1000);
  }
}

function burnInBackground() {
  setImmediate(() => {
    burnCPU(AUTO_BURN_MS);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/app" || req.url === "/app/") {
    requestCount++;

    // 🔥 generate CPU load
    burnInBackground();

    res.writeHead(200, { "Content-Type": "application/json" });

    res.end(
      JSON.stringify(
        {
          message: "Session connected with Cluster-2",
          hostname: os.hostname(), // POD name
          requestCountOnThisPod: requestCount,
        },
        null,
        2
      )
    );
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(3000, () => {
  console.log("Running on port 3000, path /app with CPU load enabled");
});
