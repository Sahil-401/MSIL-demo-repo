const http = require("http");
const os = require("os");
const url = require("url");

let activeSessions = 0;
let requestCount = 0;

const CLUSTER_NAME = process.env.CLUSTER_NAME || "unknown-cluster";

// ===== LOAD TEST CONFIG (EDIT ONLY THIS) =====
const AUTO_BURN_MS = 600; // CPU burn per request
// ============================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===== OLD LOAD TEST LOGIC (UNCHANGED) =====
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
// ===========================================

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);

  // -------------------
  // Normal endpoint
  // -------------------
  if (parsed.pathname === "/app" || parsed.pathname === "/app/") {
    requestCount++;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          message: "Session connected with Cluster-1",
          hostname: os.hostname(), // POD name
          pid: process.pid,
          requestCountOnThisPod: requestCount,
        },
        null,
        2
      )
    );
    return;
  }

  // -------------------
  // Load test endpoint
  // -------------------
  if (parsed.pathname === "/app/load") {
    requestCount++;

    // 🔥 CPU load only here
    burnInBackground();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          message: "Session connected with Cluster-1",
          hostname: os.hostname(),
          requestCountOnThisPod: requestCount,
        },
        null,
        2
      )
    );
    return;
  }

  // -------------------
  // Hold endpoint
  // -------------------
  if (parsed.pathname === "/app/hold") {
    const seconds = parseInt(parsed.query.seconds || "60", 10);
    activeSessions++;

    res.writeHead(200, {
      "Content-Type": "application/json",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    });

    res.write(
      JSON.stringify(
        {
          message: "Session started",
          cluster: CLUSTER_NAME,
          pod: os.hostname(),
          activeSessions,
          holdSeconds: seconds,
        },
        null,
        2
      )
    );

    await sleep(seconds * 1000);

    activeSessions--;
    res.end(
      "\n" +
        JSON.stringify(
          {
            message: "Session ended",
            cluster: CLUSTER_NAME,
            pod: os.hostname(),
            activeSessions,
          },
          null,
          2
        )
    );
    return;
  }

  // -------------------
  // Session count
  // -------------------
  if (parsed.pathname === "/app/sessions") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ cluster: CLUSTER_NAME, activeSessions }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(3000, () => {
  console.log(
    `App running on port 3000 | Normal: /app | Load: /app/load | CPU=${AUTO_BURN_MS}ms`
  );
});
