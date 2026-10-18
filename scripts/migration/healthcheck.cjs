const http = require('node:http');
const req = http.get('http://127.0.0.1:3000/', res => {
  res.resume();
  process.exit(res.statusCode === 200 ? 0 : 1);
});
req.setTimeout(8000, () => req.destroy());
req.on('error', () => process.exit(1));
