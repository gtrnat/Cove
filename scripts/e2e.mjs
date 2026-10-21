/**
 * End-to-end smoke test against a production build.
 *
 *   npm run build && npm run test:e2e
 *
 * Starts `next start` on a free port, exercises auth, protected pages, the
 * ingest endpoint, and security headers, then deletes everything it created
 * and stops the server. Uses the database in .env.local, so it runs against
 * real tables with throwaway users (e2e-*@cove.test).
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres from "postgres";

process.loadEnvFile(".env.local");
const PORT = Number(process.env.E2E_PORT ?? 3125);
const BASE = `http://localhost:${PORT}`;
const T = () => AbortSignal.timeout(20_000);
let failures = 0;
const check = (name, ok, extra = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? `  (${extra})` : ""}`);
};

// Sample receipts live in the parser unit test.
const src = readFileSync("tests/bca-parser.test.mjs", "utf8");
const sample = (name) => {
  const m = src.match(new RegExp(`const ${name} = \`([\\s\\S]*?)\`;`));
  return m[1].replace(/\\t/g, "\t");
};

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 10 });
const stamp = Date.now();
const email = `e2e-${stamp}@cove.test`;
const password = "correct-horse-42";
const testIp = `203.0.113.${stamp % 200}`;
let server;

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      if ((await fetch(BASE, { signal: AbortSignal.timeout(3000) })).ok) return true;
    } catch {}
  }
  return false;
}

try {
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(2000) });
    throw new Error(`Port ${PORT} is already in use. Stop that process or set E2E_PORT.`);
  } catch (e) {
    if (e.message?.startsWith("Port")) throw e;
  }

  server = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "start", "-p", String(PORT)], {
    shell: process.platform === "win32",
    env: { ...process.env, BETTER_AUTH_URL: BASE },
    stdio: "ignore",
  });
  check("server starts", await waitForServer());

  let cookie = "";
  const api = async (path, body, headers = {}) => {
    const res = await fetch(`${BASE}/api/auth${path}`, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", origin: BASE, cookie, "x-real-ip": testIp, ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: T(),
    });
    const set = res.headers.getSetCookie?.() ?? [];
    if (set.length) cookie = set.map((c) => c.split(";")[0]).join("; ");
    let json = null;
    try {
      json = await res.json();
    } catch {}
    return { status: res.status, json };
  };
  const page = (path, withCookie = true) =>
    fetch(`${BASE}${path}`, { redirect: "manual", headers: withCookie ? { cookie } : {}, signal: T() });

  // Headers
  const home = await page("/", false);
  check("security headers", home.headers.get("x-frame-options") === "DENY" && home.headers.get("x-content-type-options") === "nosniff" && Boolean(home.headers.get("content-security-policy")));
  check("no x-powered-by", !home.headers.get("x-powered-by"));

  // Auth
  let r = await page("/dashboard", false);
  check("anonymous /dashboard redirects to login", r.status === 307 && r.headers.get("location")?.includes("/login"), `${r.status}`);
  r = await fetch(`${BASE}/dashboard`, { headers: { cookie: "better-auth.session_token=forged" }, signal: T() });
  check("forged cookie doesn't render the app", !(await r.text()).includes("Welcome back,"));

  let a = await api("/sign-up/email", { name: "E2E Tester", email, password });
  if (a.status === 403 && a.json?.code === "REGISTRATION_CLOSED") {
    console.log("SKIP registration is closed (ALLOW_REGISTRATION=false); remaining auth checks skipped");
  } else {
    check("sign-up", a.status === 200, `${a.status} ${a.json?.code ?? ""}`);
    check("role defaults to user", a.json?.user?.role === "user");
    const [u] = await sql`select id from users where email = ${email}`;
    const [{ cats }] = await sql`select count(*)::int as cats from categories where user_id = ${u?.id ?? ""}`;
    check("new account provisioned", cats === 11, `${cats} categories`);

    for (const path of ["/dashboard", "/finance", "/fitness/nutrition", "/finance/budgets"]) {
      r = await page(path);
      check(`${path} renders`, r.status === 200, `${r.status}`);
    }

    const signUpCookie = cookie;
    cookie = "";
    a = await api("/sign-in/email", { email, password: "wrong-password" });
    check("wrong password rejected", a.status === 401, `${a.status}`);
    a = await api("/sign-in/email", { email, password });
    check("sign-in", a.status === 200, `${a.status}`);
    const signInCookie = cookie;
    await api("/sign-out", {});
    cookie = signInCookie;
    r = await page("/dashboard");
    check("signed-out session is revoked immediately", !(await r.text()).includes("Welcome back,"));
    cookie = signUpCookie;

    let limitedAt = 0;
    for (let i = 1; i <= 8 && !limitedAt; i++) {
      const res = await api("/sign-in/email", { email, password: "nope" }, { "x-real-ip": `${testIp}9` });
      if (res.status === 429) limitedAt = i;
    }
    check("sign-in rate limited", limitedAt > 0, limitedAt ? `429 on attempt ${limitedAt}` : "never");

    // Ingest
    const keyId = randomBytes(6).toString("hex");
    const secret = randomBytes(24).toString("base64url");
    await sql`insert into api_keys (user_id, name, key_id, secret_hash)
              values (${u.id}, 'e2e', ${keyId}, ${createHash("sha256").update(secret).digest("hex")})`;
    const ingest = (body, token = `cove_${keyId}_${secret}`, ip = testIp) =>
      fetch(`${BASE}/api/ingest/transactions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}`, "x-real-ip": ip },
        body: JSON.stringify(body),
        signal: T(),
      });
    const emails = [
      { messageId: "e2e-qris", body: sample("QRIS_1") },
      { messageId: "e2e-va", body: sample("VA") },
    ];
    r = await ingest({ emails });
    const first = await r.json();
    check("ingest imports receipts", first.results?.every((x) => x.status === "imported"), JSON.stringify(first.results?.map((x) => x.status)));
    r = await ingest({ emails });
    const second = await r.json();
    check("ingest is idempotent", second.results?.every((x) => x.status === "duplicate"));
    check("ingest response is no-store", r.headers.get("cache-control")?.includes("no-store"));

    const badIp = `198.51.100.${stamp % 200}`;
    let blockedAt = 0;
    for (let i = 1; i <= 22 && !blockedAt; i++) {
      const res = await ingest({ emails: [] }, `cove_${keyId}_${randomBytes(24).toString("base64url")}`, badIp);
      if (res.status === 429) blockedAt = i;
    }
    check("bad keys rate limited per IP", blockedAt === 21, `429 on attempt ${blockedAt}`);
    r = await ingest({ emails: [] }, `cove_${keyId}_${secret}`, `${badIp}1`);
    check("valid key from another IP still works", r.status === 200, `${r.status}`);

    await sql`delete from rate_limits where key like ${`%${badIp}%`}`;
  }
} catch (e) {
  failures++;
  console.log(`ERROR ${e?.stack ?? e}`);
} finally {
  await sql`delete from users where email like 'e2e-%@cove.test'`.catch(() => {});
  await sql`delete from rate_limits where key like ${`%${testIp}%`} or key like 'ingest-key:%' and key not in (select 'ingest-key:' || id from api_keys)`.catch(() => {});
  await sql.end({ timeout: 2 });
  if (server?.pid) {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
    else server.kill();
  }
  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}
