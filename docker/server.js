const http = require("http");
const os = require("os");
const url = require("url");

let activeSessions = 0;
let requestCount = 0;

const CLUSTER_NAME = process.env.CLUSTER_NAME || "unknown-cluster";

// ===== CPU LOAD CONFIG =====
const AUTO_BURN_MS = parseInt(process.env.CPU_BURN_MS || "600", 10);
const CONTINUOUS_BURN_MS = parseInt(process.env.CONTINUOUS_BURN_MS || "800", 10);
// ===========================

let continuousLoadEnabled = false;
let continuousLoadTimer = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- CPU BURN ----------
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

// Continuous CPU load
function startContinuousLoad() {
  if (continuousLoadEnabled) return;

  continuousLoadEnabled = true;

  const loop = () => {
    if (!continuousLoadEnabled) return;

    burnCPU(CONTINUOUS_BURN_MS);
    continuousLoadTimer = setImmediate(loop);
  };

  loop();
}

function stopContinuousLoad() {
  continuousLoadEnabled = false;
  if (continuousLoadTimer) {
    clearImmediate(continuousLoadTimer);
    continuousLoadTimer = null;
  }
}

// ---------- SERVER ----------
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);

  // 🔥 CPU burn on every request
  burnInBackground();

  // ---------- MAIN APP ----------
  if (parsed.pathname === "/app" || parsed.pathname === "/app/") {
    requestCount++;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          message: "Session connected with Cluster-1",
          hostname: os.hostname(),
          pid: process.pid,
          requestCountOnThisPod: requestCount,
        },
        null,
        2
      )
    );
    return;
  }

  // ---------- LOAD CONTROL ----------
  if (parsed.pathname === "/load/start") {
    startContinuousLoad();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          status: "started",
          continuousLoad: true,
          burnMs: CONTINUOUS_BURN_MS,
        },
        null,
        2
      )
    );
    return;
  }

  if (parsed.pathname === "/load/stop") {
    stopContinuousLoad();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          status: "stopped",
          continuousLoad: false,
        },
        null,
        2
      )
    );
    return;
  }

  // ---------- HOLD SESSION ----------
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

  // ---------- SESSION COUNT ----------
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
    `App running on port 3000 (cluster=${CLUSTER_NAME}, requestBurn=${AUTO_BURN_MS}ms, continuousBurn=${CONTINUOUS_BURN_MS}ms)`
  );
});
