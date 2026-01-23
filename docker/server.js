const http = require("http");
const os = require("os");

let requestCount = 0;

const server = http.createServer((req, res) => {
  if (req.url === "/app" || req.url === "/app/") {
    requestCount++;

    res.writeHead(200, { "Content-Type": "application/json" });

    res.end(
      JSON.stringify(
        {
          message: "Session Affinity Test",
          hostname: os.hostname(), // POD name
          pid: process.pid,
          requestCountOnThisPod: requestCount,
          time: new Date().toISOString(),
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
  console.log("Running on port 3000, path /app");
});
