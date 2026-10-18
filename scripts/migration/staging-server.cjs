// Runtime-only private staging ingress. Production runs server.js directly.
// Port 3000 is loopback-published by Compose; SSH is the access control.
const http = require('node:http');
const { fork } = require('node:child_process');
if (process.env.TURSO_DATABASE_URL !== 'file:/app/output/playwright/staging.db') {
  throw new Error('Staging accepts only the synthetic fixture DB');
}
const upstream = fork('/app/server.js', [], {
  env: { ...process.env, PORT: '3001', HOSTNAME: '127.0.0.1' },
});
upstream.on('exit', code => process.exit(code || 1));
http.createServer((req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  if (req.url.split('?')[0] === '/robots.txt') {
    res.setHeader('Content-Type', 'text/plain');
    res.end('User-agent: *\nDisallow: /\n');
    return;
  }
  const proxy = http.request({ hostname: '127.0.0.1', port: 3001,
    method: req.method, path: req.url, headers: req.headers }, response => {
    res.writeHead(response.statusCode, { ...response.headers,
      'x-robots-tag': 'noindex, nofollow, noarchive' });
    response.pipe(res);
  });
  proxy.on('error', () => { res.statusCode = 503; res.end('Staging is starting'); });
  req.pipe(proxy);
}).listen(3000, '0.0.0.0');
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  upstream.kill(signal);
  process.exit(0);
});
