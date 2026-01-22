const http = require("http");

const AUTO_BURN_MS = 700; // 250 ms background CPU load per request

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
  if (req.url === "/") {

    // background CPU load
    burnInBackground();

    // immediate response
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello from OC3 V1\n");
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(3000, () => {
  console.log("CPU stress background server running on port 3000");
});
