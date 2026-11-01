// Edge Function "api" : remplace l'ancien backend Flask.
// Mêmes routes, mêmes formats JSON, donc le frontend n'a besoin que d'une nouvelle URL de base.
//
// Secrets requis (supabase secrets set ...) :
//   ADMIN_TOKEN_SECRET : longue chaîne aléatoire qui signe les jetons de session admin
//   ALLOWED_ORIGINS    : (optionnel) origines autorisées, séparées par des virgules
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.
import { createClient } from "npm:@supabase/supabase-js@2";
import { scrypt } from "npm:@noble/hashes@1.5.0/scrypt";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const TOKEN_SECRET = Deno.env.get("ADMIN_TOKEN_SECRET") ?? "";
const TOKEN_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 jours
const MAX_HISTORY_DAYS = 400;
const enc = new TextEncoder();

// --- Utilitaires HTTP --------------------------------------------------------

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "*").split(",").map((s) => s.trim());

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allow = allowedOrigins.includes("*")
    ? "*"
    : allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "content-type, x-admin-key, authorization, apikey",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Vary": "Origin",
  };
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

async function readBody(req: Request): Promise<Record<string, any>> {
  try {
    return (await req.json()) ?? {};
  } catch {
    return {};
  }
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new HttpError(500, res.error.message);
  return res.data;
}

// --- Mots de passe -----------------------------------------------------------
// Nouveau format : pbkdf2$<itérations>$<sel base64>$<hash base64>
// Les hashes Werkzeug (scrypt:... / pbkdf2:...) créés par l'ancien backend restent lisibles.

const PBKDF2_ITERATIONS = 210_000;

const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number, hash: string, bytes: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash, salt, iterations }, key, bytes * 8);
  return new Uint8Array(bits);
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await pbkdf2(password, salt, PBKDF2_ITERATIONS, "SHA-256", 32);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(derived)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (stored.startsWith("pbkdf2$")) {
      const [, iter, salt, hash] = stored.split("$");
      const expected = fromB64(hash);
      const derived = await pbkdf2(password, fromB64(salt), Number(iter), "SHA-256", expected.length);
      return timingSafeEqual(derived, expected);
    }
    // Hashes Werkzeug : "<méthode>$<sel>$<hash hex>"
    const [method, salt, hashHex] = stored.split("$");
    const expected = Uint8Array.from(hashHex.match(/../g) ?? [], (h) => parseInt(h, 16));
    if (method.startsWith("scrypt:")) {
      const [, n, r, p] = method.split(":").map(Number);
      const derived = scrypt(enc.encode(password), enc.encode(salt), {
        N: n, r, p, dkLen: expected.length, maxmem: 256 * 1024 * 1024,
      });
      return timingSafeEqual(derived, expected);
    }
    if (method.startsWith("pbkdf2:")) {
      const [, algo, iter] = method.split(":");
      const hash = algo.toUpperCase().replace("SHA", "SHA-");
      const derived = await pbkdf2(password, enc.encode(salt), Number(iter), hash, expected.length);
      return timingSafeEqual(derived, expected);
    }
  } catch (err) {
    console.error("verifyPassword", err);
  }
  return false;
}

// --- Jetons de session admin (HMAC-SHA256) -----------------------------------

const b64url = (b: Uint8Array) => toB64(b).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
const fromB64url = (s: string) => fromB64(s.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(s.length / 4) * 4, "="));

async function hmacKey() {
  if (!TOKEN_SECRET) throw new HttpError(500, "ADMIN_TOKEN_SECRET non configuré côté serveur");
  return crypto.subtle.importKey("raw", enc.encode(TOKEN_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function makeToken(username: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ u: username, exp: Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE_S })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(payload)));
  return `${payload}.${b64url(sig)}`;
}

async function verifyToken(token: string | null): Promise<string | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64url(sig), enc.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return data.exp > Date.now() / 1000 ? data.u : null;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    return null;
  }
}

async function requireAdmin(req: Request): Promise<string> {
  const username = await verifyToken(req.headers.get("X-Admin-Key"));
  if (!username) throw new HttpError(401, "Non autorisé");
  return username;
}

// --- Sérialisation (snake_case DB -> camelCase JSON) -------------------------

const serializers = {
  profile: (r: any) => r && ({
    description: r.description, email: r.email, phone: r.phone, photoUrl: r.photo_url,
    github: r.github, linkedin: r.linkedin, facebook: r.facebook,
  }),
  competitions: (r: any) => ({
    id: r.id, title: r.title, project: r.project, result: r.result, description: r.description, image: r.image,
  }),
  creations: (r: any) => ({ id: r.id, title: r.title, category: r.category, color: r.color, image: r.image }),
  projects: (r: any) => ({
    id: r.id, title: r.title, description: r.description, tech: r.tech ?? [], accent: r.accent, bg: r.bg,
    textColor: r.text_color, isDark: r.is_dark, year: r.year, category: r.category, github: r.github,
    link: r.link, image: r.image,
  }),
};

// Ressources en liste : [clé JSON, colonne SQL, valeur par défaut]
type Field = [string, string, unknown];
const LISTS: Record<"competitions" | "creations" | "projects", { prefix: string; fields: Field[] }> = {
  competitions: {
    prefix: "comp",
    fields: [["title", "title", ""], ["project", "project", ""], ["result", "result", ""],
      ["description", "description", ""], ["image", "image", ""]],
  },
  creations: {
    prefix: "creation",
    fields: [["title", "title", ""], ["category", "category", ""], ["color", "color", "#0A66C2"], ["image", "image", ""]],
  },
  projects: {
    prefix: "project",
    fields: [["title", "title", ""], ["description", "description", ""], ["tech", "tech", []],
      ["accent", "accent", "#0A66C2"], ["bg", "bg", "#F5F4F0"], ["textColor", "text_color", "#0A0A0A"],
      ["isDark", "is_dark", false], ["year", "year", ""], ["category", "category", ""],
      ["github", "github", "#"], ["link", "link", "#"], ["image", "image", ""]],
  },
};

function toRow(fields: Field[], data: Record<string, any>) {
  return Object.fromEntries(fields.map(([key, col, def]) => [col, data[key] ?? def]));
}

const listRows = async (table: keyof typeof LISTS) =>
  check(await db.from(table).select("*").order("position").order("created_at"));

// --- Statistiques ------------------------------------------------------------

const METRIC_TO_COLUMN: Record<string, string> = {
  visits: "visits", cvDownloads: "cv_downloads", whatsappClicks: "whatsapp_clicks",
  githubClicks: "github_clicks", linkedinClicks: "linkedin_clicks", facebookClicks: "facebook_clicks",
};

const serializeDay = (r: any) => ({
  date: r.day,
  ...Object.fromEntries(Object.entries(METRIC_TO_COLUMN).map(([key, col]) => [key, r[col] ?? 0])),
});

async function getStats() {
  const rows: any[] = check(await db.from("daily_stats").select("*").order("day", { ascending: false }));
  const totals = Object.fromEntries(
    Object.entries(METRIC_TO_COLUMN).map(([key, col]) => [key, rows.reduce((s, r) => s + (r[col] ?? 0), 0)]),
  );
  const last = rows.find((r) => r.visits > 0);
  return {
    ...totals,
    lastVisit: last ? `${last.day}T00:00:00.000Z` : null,
    history: rows.slice(0, MAX_HISTORY_DAYS).reverse().map(serializeDay),
  };
}

// --- Routeur -----------------------------------------------------------------

async function handle(req: Request): Promise<Response> {
  // "/functions/v1/api/content" (ou "/api/content" en local) -> "/content"
  const path = new URL(req.url).pathname.replace(/^.*?\/api(?=\/|$)/, "").replace(/\/+$/, "") || "/";
  const method = req.method;
  const seg = path.split("/").filter(Boolean);
  const [root, id] = seg;

  if (method === "GET" && path === "/health") return json(req, { status: "ok" });

  // Contenu public
  if (method === "GET" && path === "/content") {
    const [profile, competitions, creations, projects] = await Promise.all([
      db.from("profile").select("*").eq("id", 1).maybeSingle().then(check),
      listRows("competitions"), listRows("creations"), listRows("projects"),
    ]);
    return json(req, {
      profile: serializers.profile(profile),
      competitions: competitions.map(serializers.competitions),
      creations: creations.map(serializers.creations),
      projects: projects.map(serializers.projects),
    });
  }

  if (root === "profile" && seg.length === 1) {
    if (method === "GET") {
      return json(req, serializers.profile(check(await db.from("profile").select("*").eq("id", 1).maybeSingle())));
    }
    if (method === "PUT") {
      await requireAdmin(req);
      const d = await readBody(req);
      const row = check(await db.from("profile").upsert({
        id: 1,
        description: d.description ?? "", email: d.email ?? "", phone: d.phone ?? "",
        photo_url: d.photoUrl ?? "", github: d.github ?? "", linkedin: d.linkedin ?? "", facebook: d.facebook ?? "",
      }).select().single());
      return json(req, serializers.profile(row));
    }
  }

  if (root && root in LISTS && seg.length <= 2) {
    const table = root as keyof typeof LISTS;
    const { prefix, fields } = LISTS[table];
    const serialize = serializers[table];

    if (method === "GET" && !id) return json(req, (await listRows(table)).map(serialize));

    if (method === "POST" && !id) {
      await requireAdmin(req);
      const d = await readBody(req);
      const last = check(await db.from(table).select("position").order("position", { ascending: false }).limit(1));
      const position = last.length ? (last[0].position ?? -1) + 1 : 0;
      const row = check(await db.from(table).insert({
        id: d.id || `${prefix}-${Date.now()}`, position, ...toRow(fields, d),
      }).select().single());
      return json(req, serialize(row), 201);
    }

    if (method === "PUT" && id) {
      await requireAdmin(req);
      const row = check(await db.from(table).update(toRow(fields, await readBody(req))).eq("id", id).select().maybeSingle());
      if (!row) throw new HttpError(404, "Introuvable");
      return json(req, serialize(row));
    }

    if (method === "DELETE" && id) {
      await requireAdmin(req);
      const rows = check(await db.from(table).delete().eq("id", id).select("id"));
      if (!rows.length) throw new HttpError(404, "Introuvable");
      return json(req, { ok: true });
    }
  }

  // Statistiques
  if (root === "stats") {
    if (method === "GET" && seg.length === 1) return json(req, await getStats());

    if (method === "POST" && id === "increment") {
      const { metric } = await readBody(req);
      if (!(metric in METRIC_TO_COLUMN)) throw new HttpError(400, `Métrique inconnue : ${metric}`);
      check(await db.rpc("increment_stat", { metric: METRIC_TO_COLUMN[metric] }));
      return json(req, { ok: true });
    }

    if (method === "POST" && id === "reset") {
      await requireAdmin(req);
      check(await db.from("daily_stats").delete().not("day", "is", null));
      return json(req, { ok: true });
    }
  }

  // Authentification admin
  if (root === "admin" && method === "GET" && id === "verify") {
    await requireAdmin(req);
    return json(req, { ok: true });
  }

  if (root === "admin" && method === "POST") {
    const body = await readBody(req);
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    if (id === "login") {
      if (!username || !password) throw new HttpError(400, "Nom d'utilisateur et mot de passe requis");
      const user = check(await db.from("admin_users").select("username, password_hash").eq("username", username).maybeSingle());
      if (!user || !(await verifyPassword(password, user.password_hash))) throw new HttpError(401, "Identifiants invalides");
      // Migre silencieusement les anciens hashes Werkzeug vers le nouveau format.
      if (!user.password_hash.startsWith("pbkdf2$")) {
        await db.from("admin_users").update({ password_hash: await hashPassword(password) }).eq("username", user.username);
      }
      return json(req, { token: await makeToken(user.username), username: user.username });
    }

    if (id === "register") {
      // Amorçage uniquement : refusé dès qu'un compte admin existe.
      const { count } = await db.from("admin_users").select("*", { count: "exact", head: true });
      if ((count ?? 0) > 0) throw new HttpError(403, "Un compte admin existe déjà");
      if (!username || !password) throw new HttpError(400, "Nom d'utilisateur et mot de passe requis");
      if (password.length < 8) throw new HttpError(400, "Le mot de passe doit faire au moins 8 caractères");
      check(await db.from("admin_users").insert({ username, password_hash: await hashPassword(password) }));
      return json(req, { token: await makeToken(username), username }, 201);
    }

    if (id === "change-password") {
      await requireAdmin(req);
      const current = String(body.currentPassword ?? "");
      const next = String(body.newPassword ?? "");
      if (!username || !current || !next) throw new HttpError(400, "Champs manquants");
      if (next.length < 8) throw new HttpError(400, "Le nouveau mot de passe doit faire au moins 8 caractères");
      const user = check(await db.from("admin_users").select("password_hash").eq("username", username).maybeSingle());
      if (!user || !(await verifyPassword(current, user.password_hash))) throw new HttpError(401, "Mot de passe actuel incorrect");
      check(await db.from("admin_users").update({ password_hash: await hashPassword(next) }).eq("username", username));
      return json(req, { ok: true });
    }
  }

  throw new HttpError(404, "Route introuvable");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  try {
    return await handle(req);
  } catch (err) {
    if (err instanceof HttpError) return json(req, { error: err.message }, err.status);
    console.error(err);
    return json(req, { error: "Erreur serveur" }, 500);
  }
});
