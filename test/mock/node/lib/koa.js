const http = require('http');
const Koa = require('koa');
const app = new Koa();

app.use((ctx) => {
    console.log('koa path', ctx.path);
    if (ctx.path === '/test') {
        console.log('test');
    }

    ctx.body = 'Hello World';
});

const server = http.createServer(app.callback());

server.on('error', (err) => {
    console.log(err);
});

server.listen(3000, function() {
    console.log('server listening on http://localhost:3000');
});
