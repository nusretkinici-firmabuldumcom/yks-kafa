const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');

const root = __dirname;
const dataDirectory = process.env.DATA_DIR || path.join(root, 'data');
const dataFile = path.join(dataDirectory, 'accounts.json');
const scrypt = promisify(crypto.scrypt);
const trialDurationMs = 14 * 24 * 60 * 60 * 1000;
const sessionDurationMs = 30 * 24 * 60 * 60 * 1000;
let database = { users: [], sessions: [] };
let writeQueue = Promise.resolve();
const authAttempts = new Map();
const allowedFiles = new Set([
  'index.html',
  'app.js',
  'styles.css',
  'planner.css',
  'assets/logo-ykskafa-light-background.png',
]);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
};

function json(response, status, body, extraHeaders = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  response.end(JSON.stringify(body));
}

function cookieValue(request, name) {
  const prefix = `${name}=`;
  const item = (request.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : '';
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function publicUser(user) {
  const trialEndsAt = new Date(user.trialEndsAt);
  const remaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000));
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    accountType: user.accountType,
    createdAt: user.createdAt,
    trialEndsAt: user.trialEndsAt,
    trialDaysRemaining: remaining,
    trialActive: Date.now() < trialEndsAt.getTime(),
  };
}

function saveDatabase() {
  writeQueue = writeQueue.then(async () => {
    await fs.promises.mkdir(dataDirectory, { recursive: true });
    const temporaryFile = `${dataFile}.tmp`;
    await fs.promises.writeFile(temporaryFile, JSON.stringify(database), { mode: 0o600 });
    await fs.promises.rename(temporaryFile, dataFile);
  });
  return writeQueue;
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384) throw Object.assign(new Error('İstek çok büyük.'), { status: 413 });
  }
  try { return JSON.parse(body || '{}'); }
  catch { throw Object.assign(new Error('Geçersiz istek.'), { status: 400 }); }
}

function rateLimitKey(request, email) {
  return `${request.socket.remoteAddress || 'unknown'}:${email}`;
}

function checkRateLimit(request, email) {
  const key = rateLimitKey(request, email);
  const now = Date.now();
  const recent = (authAttempts.get(key) || []).filter(time => now - time < 15 * 60 * 1000);
  if (recent.length >= 10) return false;
  recent.push(now);
  authAttempts.set(key, recent);
  return true;
}

function sessionCookie(token, maxAge) {
  const secure = process.env.RAILWAY_ENVIRONMENT ? '; Secure' : '';
  return `ykskafa_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

async function handleAuth(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/auth/session') {
    const token = cookieValue(request, 'ykskafa_session');
    const sessionHash = token && hashToken(token);
    const session = database.sessions.find(item => item.tokenHash === sessionHash && Date.parse(item.expiresAt) > Date.now());
    const user = session && database.users.find(item => item.id === session.userId);
    json(response, 200, { user: user ? publicUser(user) : null });
    return;
  }

  if (request.method === 'POST' && pathname === '/api/auth/logout') {
    const token = cookieValue(request, 'ykskafa_session');
    if (token) {
      const tokenHash = hashToken(token);
      database.sessions = database.sessions.filter(item => item.tokenHash !== tokenHash);
      await saveDatabase();
    }
    json(response, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
    return;
  }

  if (request.method !== 'POST' || !['/api/auth/register', '/api/auth/login'].includes(pathname)) {
    json(response, 404, { error: 'Bulunamadı.' });
    return;
  }

  const input = await readJson(request);
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 256) {
    json(response, 400, { error: 'Geçerli e-posta ve en az 8 karakterli şifre gerekli.' });
    return;
  }
  if (!checkRateLimit(request, email)) {
    json(response, 429, { error: 'Çok fazla deneme yapıldı. 15 dakika sonra tekrar dene.' });
    return;
  }

  let user;
  if (pathname === '/api/auth/register') {
    const name = String(input.name || '').trim().replace(/\s+/g, ' ');
    const accountType = input.accountType === 'parent' ? 'parent' : 'student';
    if (name.length < 2 || name.length > 80) {
      json(response, 400, { error: 'Ad soyad 2 ile 80 karakter arasında olmalı.' });
      return;
    }
    if (database.users.some(item => item.email === email)) {
      json(response, 409, { error: 'Bu e-posta ile bir hesap zaten var. Giriş yapmayı dene.' });
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = (await scrypt(password, salt, 64)).toString('hex');
    const now = new Date();
    user = {
      id: crypto.randomUUID(), name, email, accountType,
      passwordSalt: salt,
      passwordHash,
      createdAt: now.toISOString(),
      trialEndsAt: new Date(now.getTime() + trialDurationMs).toISOString(),
    };
    database.users.push(user);
  } else {
    user = database.users.find(item => item.email === email);
    const salt = user?.passwordSalt || '00'.repeat(16);
    const candidate = await scrypt(password, salt, 64);
    const savedHash = user?.passwordHash || '00'.repeat(64);
    const passwordMatches = crypto.timingSafeEqual(candidate, Buffer.from(savedHash, 'hex'));
    if (!user || !passwordMatches) {
      json(response, 401, { error: 'E-posta veya şifre hatalı.' });
      return;
    }
  }

  authAttempts.delete(rateLimitKey(request, email));
  const token = crypto.randomBytes(32).toString('base64url');
  database.sessions = database.sessions.filter(item => Date.parse(item.expiresAt) > Date.now());
  database.sessions.push({
    tokenHash: hashToken(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + sessionDurationMs).toISOString(),
  });
  await saveDatabase();
  json(response, 200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(token, sessionDurationMs / 1000) });
}

const server = http.createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  if (pathname.startsWith('/api/')) {
    try { await handleAuth(request, response, pathname); }
    catch (error) {
      if (!response.headersSent) json(response, error.status || 500, { error: error.status ? error.message : 'İşlem tamamlanamadı. Tekrar dene.' });
      else response.destroy();
    }
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  if (!allowedFiles.has(relativePath)) {
    response.writeHead(404).end('Not found');
    return;
  }

  fs.readFile(path.join(root, relativePath), (error, content) => {
    if (error) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(relativePath)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') response.end();
    else response.end(content);
  });
});

async function start() {
  await fs.promises.mkdir(dataDirectory, { recursive: true });
  try {
    database = JSON.parse(await fs.promises.readFile(dataFile, 'utf8'));
    if (!Array.isArray(database.users) || !Array.isArray(database.sessions)) throw new Error('Invalid account data');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await saveDatabase();
  }
  server.listen(Number(process.env.PORT) || 3000, '0.0.0.0');
}

start().catch(error => {
  console.error('YKS Kafa sunucusu başlatılamadı:', error);
  process.exit(1);
});
