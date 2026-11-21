const { createProxyMiddleware } = require('http-proxy-middleware');
const proxy = createProxyMiddleware({ target: 'http://localhost:3002', ws: true });
console.log(typeof proxy.upgrade);
