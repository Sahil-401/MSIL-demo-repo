const http = require("http");
const os = require("os");
const url = require("url");
const { createClient } = require("redis");

let requestCount = 0;
const CLUSTER_NAME = os.hostname();

const AUTO_BURN_MS = 600;

// --------------------
// Redis setup
// --------------------
const redisClient = createClient({
  url: "redis://redis:6379"   // Kubernetes service name
});

redisClient.connect();

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

// Initialize counter if not exists
(async () => {
  await redisClient.setNX("active_sessions", 0);
})();

// --------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);

  // -------------------
  // Normal endpoint
  // -------------------
  if (parsed.pathname === "/app" || parsed.pathname === "/app/") {
    requestCount++;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "Session connected",
      hostname: os.hostname(),
      requestCountOnThisPod: requestCount
    }, null, 2));
    return;
  }

  // -------------------
  // Load endpoint
  // -------------------
  if (parsed.pathname === "/app/load") {
    requestCount++;
    burnInBackground();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "Load request",
      hostname: os.hostname(),
      requestCountOnThisPod: requestCount
    }, null, 2));
    return;
  }

  // -------------------
  // Hold endpoint (Redis based)
  // -------------------
  if (parsed.pathname === "/app/hold") {
    const seconds = parseInt(parsed.query.seconds || "300", 10);

    await redisClient.incr("active_sessions");

    const total = await redisClient.get("active_sessions");

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Connection": "keep-alive",
      "Cache-Control": "no-cache"
    });

    res.write(JSON.stringify({
      message: "Session started",
      cluster: CLUSTER_NAME,
      pod: os.hostname(),
      totalActiveSessions: Number(total),
      holdSeconds: seconds
    }, null, 2));

    const timer = setTimeout(async () => {
      await redisClient.decr("active_sessions");
      const after = await redisClient.get("active_sessions");

      res.end("\n" + JSON.stringify({
        message: "Session ended",
        pod: os.hostname(),
        totalActiveSessions: Number(after)
      }, null, 2));
    }, seconds * 1000);

    // Handle client disconnect
    req.on("close", async () => {
      clearTimeout(timer);
      await redisClient.decr("active_sessions");
    });

    return;
  }

  // -------------------
  // Sessions endpoint (ALL pods)
  // -------------------
  if (parsed.pathname === "/app/sessions") {
    const total = await redisClient.get("active_sessions") || 0;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      cluster: CLUSTER_NAME,
      totalActiveSessions: Number(total)
    }, null, 2));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(3000, () => {
  console.log(`App running on port 3000 | Normal: /app | Load: /app/load`);
});
