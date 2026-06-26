import { spawn } from "node:child_process";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const POST_URL =
  process.env.POST_URL ??
  "http://127.0.0.1:4321/posts/python/python-%E5%9F%BA%E7%A1%80/16-python-%E6%96%87%E6%9C%AC%E5%A4%84%E7%90%86%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%88%87%E5%89%B2resubstrip";

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

class CdpClient {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();

    ws.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (!message.id) return;

      const pending = this.pending.get(message.id);
      if (!pending) return;

      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    });
  }

  static connect(wsUrl) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.addEventListener("open", () => resolve(new CdpClient(ws)), {
        once: true,
      });
      ws.addEventListener("error", reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });

    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text);
    }

    return result.result.value;
  }

  close() {
    this.ws.close();
  }
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findChrome() {
  for (const candidate of chromeCandidates) {
    if (await exists(candidate)) return candidate;
  }

  throw new Error(
    "Chrome or Edge was not found. Set CHROME_PATH to run this verification."
  );
}

function waitForDevTools(chrome) {
  let output = "";

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for DevTools. Output:\n${output}`));
    }, 15_000);

    chrome.stderr.on("data", chunk => {
      output += chunk.toString();
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;

      clearTimeout(timeout);
      resolve(match[1]);
    });

    chrome.once("exit", code => {
      clearTimeout(timeout);
      reject(new Error(`Chrome exited early with code ${code}.\n${output}`));
    });
  });
}

async function waitUntil(client, expression, timeoutMs = 8_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await client.evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Timed out waiting for: ${expression}`);
}

function decodeHash(hash) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return hash.replace(/^#/, "");
  }
}

async function main() {
  const chromePath = await findChrome();
  const userDataDir = await mkdtemp(path.join(tmpdir(), "astro-paper-chrome-"));
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-port=0",
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  let client;

  try {
    const browserWsUrl = await waitForDevTools(chrome);
    const { port } = new URL(browserWsUrl);
    const response = await fetch(
      `http://127.0.0.1:${port}/json/new?${encodeURIComponent(POST_URL)}`,
      { method: "PUT" }
    );
    const target = await response.json();

    client = await CdpClient.connect(target.webSocketDebuggerUrl);
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await waitUntil(client, 'document.readyState === "complete"');
    await waitUntil(client, 'document.querySelector("aside.app-toc a") !== null');

    const failures = [];

    const hasEditPageLink = await client.evaluate(`Array.from(
      document.querySelectorAll("a")
    ).some(link => link.textContent.trim() === "Edit page")`);

    if (hasEditPageLink) {
      failures.push("Edit page link should not render on post detail pages.");
    }

    const scrollTarget = await client.evaluate(`(() => {
      const headings = Array.from(
        document.querySelectorAll("#article h2[id], #article h3[id], #article h4[id]")
      );
      if (headings.length < 2) {
        return { error: "Expected at least two article headings." };
      }

      const heading = headings[Math.min(2, headings.length - 1)];
      window.scrollTo(0, heading.getBoundingClientRect().top + window.scrollY - 90);
      return { id: heading.id, text: heading.textContent.trim() };
    })()`);

    if (scrollTarget.error) {
      failures.push(scrollTarget.error);
    } else {
      await new Promise(resolve => setTimeout(resolve, 700));

      const activeTocLink = await client.evaluate(`(() => {
        const link = document.querySelector('aside.app-toc a[aria-current="location"]');
        return link
          ? { hash: link.hash, text: link.textContent.trim() }
          : null;
      })()`);

      if (!activeTocLink) {
        failures.push("TOC should mark the current heading with aria-current.");
      } else if (decodeHash(activeTocLink.hash) !== scrollTarget.id) {
        failures.push(
          `TOC active link should target "${scrollTarget.text}", got "${activeTocLink.text}".`
        );
      }
    }

    if (failures.length > 0) {
      process.stderr.write(
        `${failures.map(failure => `FAIL: ${failure}`).join("\n")}\n`
      );
      process.exitCode = 1;
      return;
    }

    process.stdout.write("PASS: post page comments are satisfied.\n");
  } finally {
    client?.close();
    const chromeExited = new Promise(resolve => chrome.once("exit", resolve));
    chrome.kill();
    await Promise.race([
      chromeExited,
      new Promise(resolve => setTimeout(resolve, 1_000)),
    ]);
    await rm(userDataDir, { recursive: true, force: true, maxRetries: 3 }).catch(
      () => {}
    );
  }
}

await main();
