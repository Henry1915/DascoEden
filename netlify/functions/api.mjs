// Netlify Function (v2). Routes: /api/*
// Data is stored in Netlify Blobs. Secrets come from environment variables.
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

export const config = { path: "/api/*" };

const store = () => getStore("dasco-eden");
const docsStore = () => getStore("dasco-eden-docs");
const mediaStore = () => getStore("dasco-eden-media");
const SECRET = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "change-me";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const str = (x, n = 300) => String(x ?? "").slice(0, n);

// ---------- tokens ----------
const hmac = (s) => crypto.createHmac("sha256", SECRET()).update(s).digest("base64url");
const sign = (payload) => {
  const b = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return b + "." + hmac(b);
};
const verify = (t) => {
  try {
    const [b, m] = String(t).split(".");
    const e = hmac(b);
    if (!m || m.length !== e.length || !crypto.timingSafeEqual(Buffer.from(m), Buffer.from(e))) return null;
    const p = JSON.parse(Buffer.from(b, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
};
const auth = (req, role) => {
  const t = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  const p = verify(t);
  return p && p.r === role ? p : null;
};
const safeEq = (a, b) => {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};
const norm = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const hashCode = (c) => hmac("code:" + norm(c));
const newCode = () => {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (const b of crypto.randomBytes(10)) s += A[b % A.length];
  return s.slice(0, 4) + "-" + s.slice(4, 8) + "-" + s.slice(8);
};

// ---------- sign-in protection ----------
const ipOf = (req) =>
  req.headers.get("x-nf-client-connection-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
async function lockState(req, scope) {
  const key = `lock-${scope}-${hmac("ip:" + ipOf(req)).slice(0, 24)}`;
  const rec = (await store().get(key, { type: "json" })) || { n: 0, t: 0, until: 0 };
  return { key, rec, locked: rec.until > Date.now() };
}
async function noteFail(s, max) {
  const now = Date.now();
  const r = s.rec;
  if (now - r.t > 15 * 60e3) r.n = 0;
  r.n++;
  r.t = now;
  if (r.n >= max) { r.until = now + 15 * 60e3; r.n = 0; }
  await store().setJSON(s.key, r);
}
const clearFails = (s) => store().setJSON(s.key, { n: 0, t: 0, until: 0 });
const tooMany = () => json({ error: "Too many failed attempts. Please try again in 15 minutes." }, 429);

// Time-based one-time codes (Google Authenticator, Authy, Microsoft Authenticator...). RFC 6238.
const b32 = (s) => {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of String(s).toUpperCase().replace(/[^A-Z2-7]/g, "")) bits += A.indexOf(ch).toString(2).padStart(5, "0");
  const out = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
};
const totp = (secret, step) => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(step));
  const h = crypto.createHmac("sha1", b32(secret)).update(buf).digest();
  const o = h[19] & 15;
  const n = (((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6;
  return String(n).padStart(6, "0");
};
const totpOk = (secret, code) => {
  const s = Math.floor(Date.now() / 30000);
  const c = String(code || "").replace(/\D/g, "");
  let ok = false;
  for (const d of [-1, 0, 1]) if (safeEq(totp(secret, s + d), c)) ok = true;
  return ok;
};

// ---------- campus media (photos and videos uploaded by the admin) ----------
const MEDIA_CHUNK = 3500000; // the browser slices files into 3.5 MB pieces (a function request may not exceed 6 MB)
const MAX_VIDEO = 60 * 1024 * 1024, MAX_IMAGE = 10 * 1024 * 1024, MAX_MEDIA_TOTAL = 500 * 1024 * 1024;
const getMedia = async () => {
  const m = (await store().get("media", { type: "json" })) || {};
  return { files: m.files || {}, pending: m.pending || {}, items: m.items || [] };
};
const saveMedia = (m) => store().setJSON("media", m);
// What a file really is is decided by its first bytes, never by its name.
function sniffMedia(buf) {
  const b = new Uint8Array(buf.slice(0, 16));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return String.fromCharCode(b[8], b[9], b[10], b[11]) === "qt  " ? "video/quicktime" : "video/mp4";
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "video/webm";
  return "";
}
const okMediaSrc = (s, kind) =>
  /^m:[0-9a-f]{12}$/.test(s) ||
  (/^assets\/[\w .\-\/]+\.(jpg|jpeg|png|webp|mp4|webm)$/i.test(s) && !s.includes("..")) ||
  (kind === "video" && /^https:\/\//i.test(s));
async function dropMediaFile(id, f) {
  for (let i = 0; i < (f.chunks || 0); i++) { try { await mediaStore().delete(`${id}/${i}`); } catch {} }
}

// ---------- data ----------
const DEF = { announcements: [], events: [], staff: [], videos: [], settings: { wa: "", pay: "" } };
const okPoster = (u) => /^assets\/videos\/[\w .\-]+\.(jpg|jpeg|png|webp)$/i.test(u);
const okVideoUrl = (u) => /^https:\/\//i.test(u) || /^assets\/videos\/[\w .\-]+\.(mp4|webm)$/i.test(u);
const getPub = async () => ({ ...DEF, ...((await store().get("public", { type: "json" })) || {}) });
const getParents = async () => (await store().get("parents", { type: "json" })) || { list: [] };
const getApps = async () => (await store().get("applications", { type: "json" })) || [];
const getAtt = async () => {
  const a = (await store().get("attendance", { type: "json" })) || {};
  return { days: a.days || {} };
};
const getNotices = async () => {
  const n = (await store().get("notices", { type: "json" })) || {};
  return { list: n.list || [] };
};
const isoDay = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);

function cleanPub(v = {}) {
  const s = v.settings || {};
  return {
    announcements: (v.announcements || []).slice(0, 300).map((a) => ({ id: str(a.id, 40), text: str(a.text, 300), at: +a.at || Date.now() })),
    events: (v.events || []).slice(0, 300).map((e) => ({ id: str(e.id, 40), title: str(e.title, 150), date: str(e.date, 10), where: str(e.where, 150) })),
    staff: (v.staff || []).slice(0, 300).map((x) => ({ id: str(x.id, 40), n: str(x.n, 100), r: str(x.r, 100), d: str(x.d, 40), b: str(x.b, 400) })),
    videos: (Array.isArray(v.videos) ? v.videos : [])
      .map((x) => ({ id: str(x.id, 40), title: str(x.title, 100), url: str(x.url, 300).trim(), poster: okPoster(str(x.poster, 120).trim()) ? str(x.poster, 120).trim() : "" }))
      .filter((x) => x.title && okVideoUrl(x.url))
      .slice(0, 20),
    settings: { wa: str(s.wa, 20).replace(/\D/g, ""), pay: str(s.pay, 500), notifyPresent: !!s.notifyPresent, aiInfo: str(s.aiInfo, 2000) },
  };
}
const DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const DOC_KINDS = ["birth_certificate", "photo", "report", "health", "other"];
const cleanDocMeta = (d) =>
  (Array.isArray(d) ? d : []).slice(0, 12).map((x) => ({
    id: str(x.id, 40), name: str(x.name, 80), type: DOC_TYPES.includes(x.type) ? x.type : "application/octet-stream",
    size: +x.size || 0, kind: DOC_KINDS.includes(x.kind) ? x.kind : "other", at: +x.at || 0,
  })).filter((x) => x.id);
// Fields set by the online application form are never taken from the admin client: they come from what is already stored.
function cleanApps(v, existing = new Map(), keepDocs = false) {
  return (Array.isArray(v) ? v : []).slice(0, 2000).map((a) => {
    const old = existing.get(str(a.id, 40));
    const src = old || a;
    return {
      id: str(a.id, 40), child: str(a.child, 100), parent: str(a.parent, 100), phone: str(a.phone, 30),
      cls: str(a.cls, 50), status: str(a.status, 20), at: +a.at || Date.now(),
      ref: str(src.ref, 20), email: str(src.email, 100), dob: str(src.dob, 10), gender: str(src.gender, 10),
      prevSchool: str(src.prevSchool, 100), notes: str(src.notes, 600), source: str(src.source, 10),
      docs: old ? cleanDocMeta(old.docs) : keepDocs ? cleanDocMeta(a.docs) : [],
    };
  });
}
const sniffType = (b) => {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  return null;
};
const cleanKids = (k) =>
  (Array.isArray(k) ? k : []).slice(0, 20).map((c) => ({
    id: str(c.id, 40), name: str(c.name, 100), cls: str(c.cls, 40),
    att: { present: +(c.att || {}).present || 0, total: +(c.att || {}).total || 0 },
    fees: { total: +(c.fees || {}).total || 0, paid: +(c.fees || {}).paid || 0 },
    grades: (Array.isArray(c.grades) ? c.grades : []).slice(0, 100).map((g) => ({ subject: str(g.subject, 60), score: +g.score || 0, term: str(g.term, 30) })),
    note: str(c.note, 400),
  }));

// simple per-connection rate limit (used to protect the AI key from abuse)
async function rateOk(req, scope, max, windowMs) {
  const key = `rate-${scope}-${hmac("ip:" + ipOf(req)).slice(0, 24)}`;
  const now = Date.now();
  const r = (await store().get(key, { type: "json" })) || { n: 0, t: now };
  if (now - r.t > windowMs) { r.n = 0; r.t = now; }
  r.n++;
  await store().setJSON(key, r);
  return r.n <= max;
}

// ---------- AI assistant (optional) ----------
const SCHOOL_FACTS = `You are Dasco Eden AI, the friendly assistant on the website of Dasco Eden International School, a school at Mamponteng in the Kwabre East District of Kumasi, Ashanti Region, Ghana. The school's motto is "A Holistic School".
Verified facts: the school is about five years old and follows the Oxford curriculum, in partnership with Oxford University Press (this is printed on the school bus). Learners have keyboard music lessons, a computer lab and an early years classroom. Phone: +233 24 255 4403. The campus has modern buildings, a football goal and basketball court, a sick bay with a school nurse, and the school holds cultural celebrations with dance, drumming and a school band; it has also hosted visits such as the fire service. The school has a YouTube channel. Visitors can get directions from the Contact page.
Do NOT invent anything else. You do not know fees, ages admitted, class sizes, results, term dates, opening hours or staff names unless the office information below says so. For those questions, say you are not sure and suggest calling +233 24 255 4403 or using the Admissions page. Keep answers short, friendly and in simple English.`;

async function chat(req) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: "AI is not enabled" }, 503);
  if (!(await rateOk(req, "chat", 20, 10 * 60e3))) return json({ error: "Too many questions. Please try again in a few minutes." }, 429);
  const b = await req.json().catch(() => ({}));
  let msgs = Array.isArray(b.messages) ? b.messages.slice(-8) : [];
  msgs = msgs.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m) => ({ role: m.role, content: m.content.slice(0, 500) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "Bad request" }, 400);
  const pub = await getPub();
  const live = [
    pub.events.length ? "Upcoming events: " + pub.events.map((e) => `${e.title} on ${e.date}`).join("; ") : "",
    pub.announcements.length ? "Recent news: " + pub.announcements.slice(0, 5).map((a) => a.text).join(" | ") : "",
  ].filter(Boolean).join("\n");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", max_tokens: 400, system: SCHOOL_FACTS + "\n" + (pub.settings.aiInfo ? "Extra information from the school office:\n" + pub.settings.aiInfo + "\n" : "") + live, messages: msgs }),
  });
  if (!r.ok) return json({ error: "AI request failed" }, 502);
  const d = await r.json();
  return json({ text: (d.content || []).map((c) => c.text || "").join("").trim() || "Sorry, I have no answer for that." });
}

// ---------- teachers, backup helpers ----------
const getTeachers = async () => {
  const n = (await store().get("teachers", { type: "json" })) || {};
  return { list: n.list || [] };
};
const normCls = (s) => String(s || "").trim().toLowerCase();
const cleanClasses = (c) => (Array.isArray(c) ? c : []).slice(0, 30).map((x) => str(x, 40).trim()).filter(Boolean);
const teacherKids = (data, tch) => {
  const cs = new Set(tch.classes.map(normCls));
  const out = [];
  for (const p of data.list) for (const c of p.children) if (cs.has(normCls(c.cls))) out.push(c);
  return out;
};
const cleanGrades = (g) =>
  (Array.isArray(g) ? g : []).slice(0, 100).map((x) => ({ subject: str(x.subject, 60), score: +x.score || 0, term: str(x.term, 30) }));
const cleanParents = (list) =>
  (Array.isArray(list) ? list : []).slice(0, 3000)
    .map((p) => ({ id: str(p.id, 40), name: str(p.name, 100), phone: str(p.phone, 20), codeHash: str(p.codeHash, 100), children: cleanKids(p.children) }))
    .filter((p) => p.id && p.name);
const cleanTeachers = (list) =>
  (Array.isArray(list) ? list : []).slice(0, 300)
    .map((x) => ({ id: str(x.id, 40), name: str(x.name, 100), codeHash: str(x.codeHash, 100), classes: cleanClasses(x.classes) }))
    .filter((x) => x.id && x.name);
const cleanAtt = (a) => {
  const days = {};
  for (const [d, v] of Object.entries((a && a.days) || {}).slice(0, 500)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !v || typeof v !== "object") continue;
    days[d] = {};
    for (const [id, s] of Object.entries(v).slice(0, 5000)) if (["P", "A", "L"].includes(s)) days[d][str(id, 40)] = s;
  }
  return { days };
};
const cleanNotices = (n) => ({
  list: ((n && n.list) || []).slice(-2000).map((x) => ({
    id: str(x.id, 20), parentId: str(x.parentId, 40), childId: str(x.childId, 40), childName: str(x.childName, 100),
    date: str(x.date, 10), status: ["P", "A", "L"].includes(x.status) ? x.status : "A", at: +x.at || 0, readAt: +x.readAt || 0,
  })),
});

// Shared by admin and teachers. allow = Set of child ids the caller may mark (null = everyone).
async function saveAttendance(dateRaw, marksRaw, allow, maxAgeDays) {
  const date = str(dateRaw, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { err: "Pick a valid date" };
  const dt = new Date(date + "T00:00:00Z").getTime();
  if (isNaN(dt) || dt > Date.now() + 864e5 || dt < Date.now() - maxAgeDays * 864e5) return { err: `The date must be within the last ${maxAgeDays} days` };
  const marks = marksRaw && typeof marksRaw === "object" ? marksRaw : {};
  const data = await getParents();
  const att = await getAtt();
  const notices = await getNotices();
  const pub = await getPub();
  const day = (att.days[date] = att.days[date] || {});
  const now = Date.now();
  const notify = [];
  for (const p of data.list) {
    for (const c of p.children) {
      if (allow && !allow.has(c.id)) continue;
      const s = marks[c.id];
      if (!["P", "A", "L"].includes(s)) continue;
      const prev = day[c.id];
      if (prev === s) continue;
      c.att = c.att || { present: 0, total: 0 };
      if (!prev) {
        c.att.total++;
        if (s !== "A") c.att.present++;
      } else {
        if (prev === "A" && s !== "A") c.att.present++;
        if (prev !== "A" && s === "A") c.att.present = Math.max(0, c.att.present - 1);
      }
      day[c.id] = s;
      const correction = !!prev && s === "P";
      if (s !== "P" || pub.settings.notifyPresent || correction) {
        notices.list.push({ id: crypto.randomBytes(5).toString("hex"), parentId: p.id, childId: c.id, childName: c.name, date, status: s, at: now, readAt: 0 });
        notify.push({ parentName: p.name, phone: p.phone || "", childName: c.name, status: s });
      }
    }
  }
  notices.list = notices.list.filter((n) => now - n.at < 60 * 864e5).slice(-2000);
  const old = isoDay(now - 400 * 864e5);
  for (const d of Object.keys(att.days)) if (d < old) delete att.days[d];
  await store().setJSON("parents", data);
  await store().setJSON("attendance", att);
  await store().setJSON("notices", notices);
  return { notify };
}

// ---------- router ----------
export default async (req) => {
  const route = new URL(req.url).pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const method = req.method;
  const body = async (limit = 300000) => {
    const t = await req.text();
    if (t.length > limit) throw Object.assign(new Error("Too large"), { status: 413 });
    try { return JSON.parse(t || "{}"); } catch { return {}; }
  };
  try {
    if (route === "public" && method === "GET") {
      const p = await getPub();
      const media = (await getMedia()).items;
      return json({ ...p, media, ai: !!process.env.ANTHROPIC_API_KEY, twofa: !!process.env.ADMIN_TOTP_SECRET });
    }

    // Public: serve an uploaded photo or video, with Range support so videos can start and skip around.
    if (route.startsWith("media/") && method === "GET") {
      const id = route.slice(6);
      if (!/^[0-9a-f]{12}$/.test(id)) return json({ error: "Not found" }, 404);
      const f = (await getMedia()).files[id];
      if (!f) return json({ error: "Not found" }, 404);
      const total = f.size, CH = f.chunkSize, CAP = 4500000;
      let start = 0, end = total - 1, partial = false;
      const rg = req.headers.get("range");
      if (rg) {
        const mm = /^bytes=(\d*)-(\d*)$/.exec(rg.trim());
        if (!mm || (mm[1] === "" && mm[2] === "")) return new Response(null, { status: 416, headers: { "content-range": `bytes */${total}` } });
        if (mm[1] === "") start = Math.max(0, total - +mm[2]);
        else { start = +mm[1]; if (mm[2] !== "") end = Math.min(+mm[2], total - 1); }
        if (start >= total || start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${total}` } });
        partial = true;
      }
      if (end - start + 1 > CAP) { end = start + CAP - 1; partial = true; } // a function response may not exceed ~6 MB
      const parts = [];
      for (let i = Math.floor(start / CH); i <= Math.floor(end / CH); i++) {
        const raw = await mediaStore().get(`${id}/${i}`, { type: "arrayBuffer" });
        if (!raw) return json({ error: "File is incomplete" }, 404);
        const buf = Buffer.from(raw), cs = i * CH;
        parts.push(buf.subarray(Math.max(start, cs) - cs, Math.min(end, cs + buf.length - 1) - cs + 1));
      }
      const out = Buffer.concat(parts);
      const headers = { "content-type": f.type, "accept-ranges": "bytes", "content-length": String(out.length), "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" };
      if (partial) headers["content-range"] = `bytes ${start}-${end}/${total}`;
      return new Response(out, { status: partial ? 206 : 200, headers });
    }

    if (route === "admin/login" && method === "POST") {
      if (!process.env.ADMIN_PASSWORD) return json({ error: "ADMIN_PASSWORD is not set on the server" }, 500);
      const lk = await lockState(req, "admin");
      if (lk.locked) return tooMany();
      const b = await body();
      const tf = process.env.ADMIN_TOTP_SECRET;
      const pwOk = safeEq(b.password || "", process.env.ADMIN_PASSWORD);
      const codeOk = tf ? totpOk(tf, b.code) : true;
      if (pwOk && codeOk) {
        await clearFails(lk);
        return json({ token: sign({ r: "admin", exp: Date.now() + 4 * 3600e3 }) });
      }
      await noteFail(lk, 5);
      await sleep(800);
      return json({ error: tf ? "Wrong password or code" : "Wrong password" }, 401);
    }

    if (route.startsWith("admin/")) {
      if (!auth(req, "admin")) return json({ error: "Please sign in" }, 401);

      if (route === "admin/data" && method === "GET") {
        const parents = (await getParents()).list.map(({ codeHash, ...p }) => p);
        const att = await getAtt();
        const cutoff = isoDay(Date.now() - 45 * 864e5);
        const days = Object.fromEntries(Object.entries(att.days).filter(([d]) => d >= cutoff));
        const teachers = (await getTeachers()).list.map(({ codeHash, ...x }) => x);
        return json({ public: await getPub(), parents, applications: await getApps(), attendance: days, teachers, media: (await getMedia()).items });
      }
      if (route === "admin/save" && method === "POST") {
        const b = await body();
        if (b.key === "public") await store().setJSON("public", cleanPub(b.value));
        else if (b.key === "applications") {
          const oldApps = await getApps();
          const next = cleanApps(b.value, new Map(oldApps.map((a) => [a.id, a])));
          const keep = new Set(next.map((a) => a.id));
          for (const a of oldApps) {
            if (keep.has(a.id) || !a.ref) continue;
            const l = await docsStore().list({ prefix: a.ref + "/" });
            for (const x of l.blobs || []) await docsStore().delete(x.key);
          }
          await store().setJSON("applications", next);
        }
        else return json({ error: "Unknown key" }, 400);
        return json({ ok: true });
      }
      // Per-application routes: unlike admin/save they never overwrite the whole list, so an application that
      // arrives while staff are editing cannot be lost.
      if (route === "admin/app-add" && method === "POST") {
        const b = await body();
        const child = str(b.child, 100).trim();
        if (!child) return json({ error: "Child's name required" }, 400);
        const apps = await getApps();
        apps.push({ id: crypto.randomBytes(6).toString("hex"), ref: "", child, parent: str(b.parent, 100), phone: str(b.phone, 30), cls: str(b.cls, 50), status: "New", at: Date.now(), source: "manual", docs: [] });
        await store().setJSON("applications", apps);
        return json({ ok: true });
      }
      if (route === "admin/app-update" && method === "POST") {
        const b = await body();
        const st = str(b.status, 20);
        if (!["New", "Contacted", "Visited", "Offered", "Enrolled", "Declined"].includes(st)) return json({ error: "Unknown status" }, 400);
        const apps = await getApps();
        const a = apps.find((x) => x.id === str(b.id, 40));
        if (!a) return json({ error: "Application not found" }, 404);
        a.status = st;
        await store().setJSON("applications", apps);
        return json({ ok: true });
      }
      if (route === "admin/app-delete" && method === "POST") {
        const b = await body();
        const apps = await getApps();
        const a = apps.find((x) => x.id === str(b.id, 40));
        if (!a) return json({ error: "Application not found" }, 404);
        if (a.ref) {
          const l = await docsStore().list({ prefix: a.ref + "/" });
          for (const x of l.blobs || []) await docsStore().delete(x.key);
        }
        await store().setJSON("applications", apps.filter((x) => x.id !== a.id));
        return json({ ok: true });
      }
      // ----- campus media upload: start -> chunks -> finish, then media-set puts it in the Campus Life list -----
      if (route === "admin/media-start" && method === "POST") {
        const b = await body();
        const kind = ["image", "video", "poster"].includes(b.kind) ? b.kind : "";
        const size = Math.floor(+b.size || 0);
        if (!kind || size < 1) return json({ error: "Bad upload request" }, 400);
        if (kind === "video" ? size > MAX_VIDEO : size > MAX_IMAGE) return json({ error: kind === "video" ? "Videos can be up to 60 MB. Use a shorter or smaller video, or add a YouTube link." : "Photos can be up to 10 MB." }, 413);
        const chunks = Math.ceil(size / MEDIA_CHUNK);
        if (+b.chunks !== chunks) return json({ error: "Bad upload request" }, 400);
        const m = await getMedia();
        const now = Date.now();
        for (const [pid, p] of Object.entries(m.pending)) if (now - p.at > 6 * 3600e3) { await dropMediaFile(pid, p); delete m.pending[pid]; }
        const used = Object.values(m.files).reduce((n, x) => n + x.size, 0);
        if (used + size > MAX_MEDIA_TOTAL || Object.keys(m.files).length >= 400) return json({ error: "The media library is full. Delete something first." }, 413);
        const id = crypto.randomBytes(6).toString("hex");
        m.pending[id] = { kind, size, chunks, got: {}, type: "", at: now };
        await saveMedia(m);
        return json({ id, chunkSize: MEDIA_CHUNK });
      }
      if (route === "admin/media-chunk" && method === "POST") {
        const u = new URL(req.url);
        const id = u.searchParams.get("id") || "", n = Number(u.searchParams.get("n"));
        if (+(req.headers.get("content-length") || 0) > 3900000) return json({ error: "Chunk too large" }, 413);
        const m = await getMedia();
        const p = m.pending[id];
        if (!p || !Number.isInteger(n) || n < 0 || n >= p.chunks) return json({ error: "Unknown upload" }, 400);
        const buf = await req.arrayBuffer();
        const expect = n === p.chunks - 1 ? p.size - (p.chunks - 1) * MEDIA_CHUNK : MEDIA_CHUNK;
        if (buf.byteLength !== expect) return json({ error: "Chunk has the wrong size" }, 400);
        if (n === 0) {
          const type = sniffMedia(buf);
          const ok = p.kind === "video" ? type.startsWith("video/") : type.startsWith("image/");
          if (!ok) return json({ error: p.kind === "video" ? "That isn't a video file (use MP4, WebM or MOV)." : "That isn't a JPG, PNG or WebP photo." }, 400);
          p.type = type;
        }
        await mediaStore().set(`${id}/${n}`, buf);
        p.got[n] = buf.byteLength;
        await saveMedia(m);
        return json({ ok: true });
      }
      if (route === "admin/media-finish" && method === "POST") {
        const b = await body();
        const id = str(b.id, 20);
        const m = await getMedia();
        const p = m.pending[id];
        if (!p) return json({ error: "Unknown upload" }, 400);
        let sum = 0;
        for (let i = 0; i < p.chunks; i++) { if (!p.got[i]) return json({ error: "Some parts did not arrive. Please try again." }, 400); sum += p.got[i]; }
        if (sum !== p.size || !p.type) return json({ error: "The upload is incomplete. Please try again." }, 400);
        m.files[id] = { kind: p.kind, type: p.type, size: p.size, chunks: p.chunks, chunkSize: MEDIA_CHUNK, at: Date.now() };
        delete m.pending[id];
        await saveMedia(m);
        return json({ id, type: p.type });
      }
      if (route === "admin/media-set" && method === "POST") {
        const b = await body();
        const m = await getMedia();
        const items = (Array.isArray(b.items) ? b.items : []).slice(0, 200).map((x) => ({
          id: str(x.id, 40), title: str(x.title, 100), kind: x.kind === "video" ? "video" : "image",
          src: str(x.src, 300).trim(), poster: str(x.poster, 300).trim(), pos: /^\d{1,3}% \d{1,3}%$/.test(x.pos || "") ? x.pos : "",
        })).filter((x) => {
          if (!x.id || !okMediaSrc(x.src, x.kind)) return false;
          if (x.kind === "image" && /^https:/i.test(x.src)) return false;
          if (x.src.startsWith("m:")) { const f = m.files[x.src.slice(2)]; if (!f || f.kind !== x.kind) return false; }
          if (x.poster) { if (!okMediaSrc(x.poster, "image") || /^https:/i.test(x.poster)) return false; if (x.poster.startsWith("m:") && !m.files[x.poster.slice(2)]) return false; }
          return true;
        });
        const used = new Set();
        for (const x of items) { if (x.src.startsWith("m:")) used.add(x.src.slice(2)); if (x.poster.startsWith("m:")) used.add(x.poster.slice(2)); }
        const now = Date.now();
        for (const [fid, f] of Object.entries(m.files)) {
          if (!used.has(fid) && now - f.at > 3600e3) { await dropMediaFile(fid, f); delete m.files[fid]; } // files uploaded in the last hour are kept in case an upload is still in progress
        }
        m.items = items;
        await saveMedia(m);
        return json({ ok: true, items });
      }
      if (route === "admin/doc" && method === "GET") {
        const u = new URL(req.url);
        const ref = str(u.searchParams.get("ref"), 20), id = str(u.searchParams.get("id"), 20);
        const a = (await getApps()).find((x) => x.ref === ref);
        const d = a && (a.docs || []).find((x) => x.id === id);
        if (!d) return json({ error: "Document not found" }, 404);
        const r = await docsStore().getWithMetadata(`${ref}/${id}`, { type: "arrayBuffer" });
        if (!r) return json({ error: "File missing" }, 404);
        return new Response(r.data, {
          headers: { "content-type": d.type, "content-disposition": `attachment; filename="${d.name.replace(/[^\w .\-]/g, "_")}"`, "x-content-type-options": "nosniff", "cache-control": "no-store" },
        });
      }
      if (route === "admin/doc-delete" && method === "POST") {
        const b = await body();
        const apps = await getApps();
        const a = apps.find((x) => x.ref === str(b.ref, 20));
        if (!a) return json({ error: "Application not found" }, 404);
        a.docs = (a.docs || []).filter((x) => x.id !== str(b.id, 20));
        await docsStore().delete(`${a.ref}/${str(b.id, 20)}`);
        await store().setJSON("applications", apps);
        return json({ ok: true });
      }
      if (route === "admin/attendance-save" && method === "POST") {
        const b = await body();
        const r = await saveAttendance(b.date, b.marks, null, 120);
        return r.err ? json({ error: r.err }, 400) : json({ ok: true, notify: r.notify });
      }
      if (route === "admin/backup" && method === "GET") {
        return json({
          version: 1, at: Date.now(), public: await getPub(), parents: await getParents(), teachers: await getTeachers(),
          applications: await getApps(), attendance: await getAtt(), notices: await getNotices(),
        });
      }
      if (route === "admin/restore" && method === "POST") {
        const b = await body(4e6);
        const bk = b.backup;
        if (!bk || bk.version !== 1) return json({ error: "This is not a valid backup file" }, 400);
        await store().setJSON("pre-restore", {
          at: Date.now(), public: await getPub(), parents: await getParents(), teachers: await getTeachers(),
          applications: await getApps(), attendance: await getAtt(), notices: await getNotices(),
        });
        const plist = cleanParents((bk.parents && bk.parents.list) || bk.parents);
        const tlist = cleanTeachers((bk.teachers && bk.teachers.list) || bk.teachers);
        await store().setJSON("public", cleanPub(bk.public));
        await store().setJSON("parents", { list: plist });
        await store().setJSON("teachers", { list: tlist });
        await store().setJSON("applications", cleanApps(bk.applications, new Map(), true));
        await store().setJSON("attendance", cleanAtt(bk.attendance));
        await store().setJSON("notices", cleanNotices(bk.notices));
        return json({ ok: true, parents: plist.length, students: plist.reduce((n, x) => n + x.children.length, 0), teachers: tlist.length });
      }
      if (route === "admin/import" && method === "POST") {
        const b = await body(600000);
        const rows = (Array.isArray(b.rows) ? b.rows : []).slice(0, 500);
        const data = await getParents();
        const nm = (s) => str(s, 100).trim().toLowerCase().replace(/\s+/g, " ");
        const dg = (s) => String(s || "").replace(/\D/g, "").slice(-9);
        let added = 0, duplicates = 0, skipped = 0;
        const newParents = [];
        for (const r of rows) {
          const student = str(r.student, 100).trim();
          if (!student) { skipped++; continue; }
          const pname = str(r.parent, 100).trim() || "Parent of " + student;
          const phone = str(r.phone, 20).trim();
          let p = dg(phone).length >= 7 ? data.list.find((x) => dg(x.phone) === dg(phone)) : data.list.find((x) => nm(x.name) === nm(pname));
          if (!p) {
            let code, h;
            do { code = newCode(); h = hashCode(code); } while (data.list.some((x) => x.codeHash === h));
            p = { id: crypto.randomBytes(6).toString("hex"), name: pname, phone, codeHash: h, children: [] };
            data.list.push(p);
            newParents.push({ parent: pname, phone, code });
          }
          if (p.children.some((c) => nm(c.name) === nm(student))) { duplicates++; continue; }
          if (p.children.length >= 20) { skipped++; continue; }
          p.children.push({
            id: crypto.randomBytes(5).toString("hex"), name: student, cls: str(r.cls, 40).trim(),
            att: { present: 0, total: 0 }, fees: { total: +String(r.fees ?? "").replace(/[^\d.]/g, "") || 0, paid: 0 }, grades: [], note: "",
          });
          added++;
        }
        await store().setJSON("parents", data);
        return json({ added, duplicates, skipped, newParents });
      }
      if (route === "admin/teacher-add" && method === "POST") {
        const b = await body();
        const name = str(b.name, 100).trim();
        if (!name) return json({ error: "Name required" }, 400);
        const data = await getTeachers();
        let code, h;
        do { code = newCode(); h = hashCode(code); } while (data.list.some((x) => x.codeHash === h));
        const id = crypto.randomBytes(6).toString("hex");
        data.list.push({ id, name, codeHash: h, classes: cleanClasses(b.classes) });
        await store().setJSON("teachers", data);
        return json({ id, code });
      }
      if (route === "admin/teacher-reset" && method === "POST") {
        const b = await body();
        const data = await getTeachers();
        const x = data.list.find((y) => y.id === b.id);
        if (!x) return json({ error: "Teacher not found" }, 404);
        let code, h;
        do { code = newCode(); h = hashCode(code); } while (data.list.some((y) => y.codeHash === h));
        x.codeHash = h;
        await store().setJSON("teachers", data);
        return json({ code });
      }
      if (route === "admin/teachers-save" && method === "POST") {
        const b = await body();
        const data = await getTeachers();
        const byId = new Map(data.list.map((x) => [x.id, x]));
        data.list = (Array.isArray(b.teachers) ? b.teachers : [])
          .filter((x) => byId.has(x.id))
          .map((x) => ({ id: x.id, name: str(x.name, 100), codeHash: byId.get(x.id).codeHash, classes: cleanClasses(x.classes) }));
        await store().setJSON("teachers", data);
        return json({ ok: true });
      }
      if (route === "admin/parent-add" && method === "POST") {
        const b = await body();
        const name = str(b.name, 100).trim();
        const phone = str(b.phone, 20).trim();
        if (!name) return json({ error: "Name required" }, 400);
        const data = await getParents();
        let code, h;
        do { code = newCode(); h = hashCode(code); } while (data.list.some((p) => p.codeHash === h));
        const id = crypto.randomBytes(6).toString("hex");
        data.list.push({ id, name, phone, codeHash: h, children: [] });
        await store().setJSON("parents", data);
        return json({ id, code });
      }
      if (route === "admin/parent-reset" && method === "POST") {
        const b = await body();
        const data = await getParents();
        const p = data.list.find((x) => x.id === b.id);
        if (!p) return json({ error: "Parent not found" }, 404);
        let code, h;
        do { code = newCode(); h = hashCode(code); } while (data.list.some((x) => x.codeHash === h));
        p.codeHash = h;
        await store().setJSON("parents", data);
        return json({ code });
      }
      if (route === "admin/parents-save" && method === "POST") {
        const b = await body();
        const data = await getParents();
        const byId = new Map(data.list.map((p) => [p.id, p]));
        data.list = (Array.isArray(b.parents) ? b.parents : [])
          .filter((p) => byId.has(p.id))
          .map((p) => ({ id: p.id, name: str(p.name, 100), phone: str(p.phone, 20), codeHash: byId.get(p.id).codeHash, children: cleanKids(p.children) }));
        await store().setJSON("parents", data);
        return json({ ok: true });
      }
    }

    if (route === "apply" && method === "POST") {
      if (!(await rateOk(req, "apply", 8, 3600e3))) return json({ error: "Too many applications from this connection. Please try again later." }, 429);
      const b = await body();
      const parent = str(b.parent, 100).trim(), phone = str(b.phone, 30).trim(), child = str(b.child, 100).trim(), cls = str(b.cls, 50).trim();
      if (!parent || !phone || !child || !cls) return json({ error: "Please fill in the parent's name, phone number, child's name and class" }, 400);
      if (phone.replace(/\D/g, "").length < 7) return json({ error: "Please enter a valid phone number" }, 400);
      if (!b.consent) return json({ error: "Please tick the confirmation box" }, 400);
      const apps = await getApps();
      const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
      let ref;
      do { ref = "DEIS-"; for (const x of crypto.randomBytes(6)) ref += A[x % A.length]; } while (apps.some((a) => a.ref === ref));
      apps.push({
        id: crypto.randomBytes(6).toString("hex"), ref, child, parent, phone, cls, status: "New", at: Date.now(),
        email: str(b.email, 100).trim(), dob: str(b.dob, 10), gender: str(b.gender, 10), prevSchool: str(b.prevSchool, 100).trim(),
        notes: str(b.notes, 600).trim(), source: "online", docs: [],
      });
      await store().setJSON("applications", apps.slice(-2000));
      return json({ ref, token: sign({ r: "apply", ref, exp: Date.now() + 2 * 3600e3 }) });
    }
    if (route === "apply-doc" && method === "POST") {
      const tk = auth(req, "apply");
      if (!tk) return json({ error: "Your session expired. Please submit the form again." }, 401);
      if (!(await rateOk(req, "applydoc", 40, 3600e3))) return json({ error: "Too many uploads. Please try again later." }, 429);
      if (Number(req.headers.get("content-length") || 0) > 5.2e6) return json({ error: "That file is too large (maximum 4 MB)" }, 413);
      let fd;
      try { fd = await req.formData(); } catch { return json({ error: "The upload could not be read" }, 400); }
      const file = fd.get("file");
      const kind = DOC_KINDS.includes(str(fd.get("kind"), 30)) ? str(fd.get("kind"), 30) : "other";
      if (!file || typeof file === "string" || !file.size) return json({ error: "No file received" }, 400);
      if (file.size > 4.5e6) return json({ error: "That file is too large (maximum 4 MB)" }, 413);
      const buf = new Uint8Array(await file.arrayBuffer());
      const type = sniffType(buf);
      if (!type) return json({ error: "Only JPG, PNG, WebP or PDF files are accepted" }, 400);
      const apps = await getApps();
      const a = apps.find((x) => x.ref === tk.ref);
      if (!a) return json({ error: "Application not found" }, 404);
      a.docs = a.docs || [];
      if (a.docs.length >= 8) return json({ error: "A maximum of 8 documents can be uploaded" }, 400);
      const id = crypto.randomBytes(6).toString("hex");
      await docsStore().set(`${a.ref}/${id}`, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), { metadata: { type, kind } });
      a.docs.push({ id, name: str(String(file.name || "document").replace(/[^\w .\-]/g, "_"), 80), type, size: buf.length, kind, at: Date.now() });
      await store().setJSON("applications", apps);
      return json({ ok: true, id });
    }
    if (route === "teacher/login" && method === "POST") {
      const lk = await lockState(req, "teacher");
      if (lk.locked) return tooMany();
      const b = await body();
      const h = hashCode(b.code);
      const x = norm(b.code).length >= 8 ? (await getTeachers()).list.find((y) => y.codeHash === h) : null;
      if (x) {
        await clearFails(lk);
        return json({ token: sign({ r: "teacher", id: x.id, exp: Date.now() + 8 * 3600e3 }) });
      }
      await noteFail(lk, 10);
      await sleep(800);
      return json({ error: "That code isn't recognised" }, 401);
    }
    if (route.startsWith("teacher/")) {
      const tk = auth(req, "teacher");
      if (!tk) return json({ error: "Please sign in" }, 401);
      const tch = (await getTeachers()).list.find((y) => y.id === tk.id);
      if (!tch) return json({ error: "Account not found" }, 404);
      if (route === "teacher/me" && method === "GET") {
        let date = new URL(req.url).searchParams.get("date") || isoDay();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = isoDay();
        const att = await getAtt();
        const kids = teacherKids(await getParents(), tch);
        const marks = {};
        for (const c of kids) { const s = (att.days[date] || {})[c.id]; if (s) marks[c.id] = s; }
        return json({ name: tch.name, classes: tch.classes, date, marks, students: kids.map((c) => ({ id: c.id, name: c.name, cls: c.cls, note: c.note, grades: c.grades })) });
      }
      if (route === "teacher/attendance-save" && method === "POST") {
        const b = await body();
        const allow = new Set(teacherKids(await getParents(), tch).map((c) => c.id));
        const r = await saveAttendance(b.date, b.marks, allow, 14);
        return r.err ? json({ error: r.err }, 400) : json({ ok: true, notified: r.notify.length });
      }
      if (route === "teacher/student-save" && method === "POST") {
        const b = await body();
        const data = await getParents();
        const allow = new Set(teacherKids(data, tch).map((c) => c.id));
        if (!allow.has(b.childId)) return json({ error: "That student is not in your classes" }, 403);
        for (const p of data.list) for (const c of p.children) if (c.id === b.childId) { c.grades = cleanGrades(b.grades); c.note = str(b.note, 400); }
        await store().setJSON("parents", data);
        return json({ ok: true });
      }
    }

    if (route === "parent/login" && method === "POST") {
      const lk = await lockState(req, "parent");
      if (lk.locked) return tooMany();
      const b = await body();
      const h = hashCode(b.code);
      const p = norm(b.code).length >= 8 ? (await getParents()).list.find((x) => x.codeHash === h) : null;
      if (p) {
        await clearFails(lk);
        return json({ token: sign({ r: "parent", id: p.id, exp: Date.now() + 12 * 3600e3 }) });
      }
      await noteFail(lk, 10);
      await sleep(800);
      return json({ error: "That code isn't recognised" }, 401);
    }
    if (route === "parent/me" && method === "GET") {
      const t = auth(req, "parent");
      if (!t) return json({ error: "Please sign in" }, 401);
      const p = (await getParents()).list.find((x) => x.id === t.id);
      if (!p) return json({ error: "Not found" }, 404);
      const att = await getAtt();
      const today = isoDay();
      const dates = Object.keys(att.days).sort().reverse();
      const children = p.children.map((c) => ({
        ...c,
        today: (att.days[today] || {})[c.id] || "",
        recent: dates.filter((d) => att.days[d][c.id]).slice(0, 10).map((d) => ({ date: d, status: att.days[d][c.id] })),
      }));
      const notices = (await getNotices()).list.filter((n) => n.parentId === t.id).sort((a, b) => b.at - a.at).slice(0, 20);
      return json({ name: p.name, children, notices, unread: notices.filter((n) => !n.readAt).length });
    }
    if (route === "parent/read" && method === "POST") {
      const t = auth(req, "parent");
      if (!t) return json({ error: "Please sign in" }, 401);
      const n = await getNotices();
      const now = Date.now();
      n.list.forEach((x) => { if (x.parentId === t.id && !x.readAt) x.readAt = now; });
      await store().setJSON("notices", n);
      return json({ ok: true });
    }

    if (route === "chat" && method === "POST") return await chat(req);

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: e.status ? e.message : "Server error" }, e.status || 500);
  }
};
