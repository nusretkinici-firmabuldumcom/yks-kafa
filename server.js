const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
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

http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
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
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0');
