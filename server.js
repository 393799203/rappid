var express = require('express');
var serveStatic = require('serve-static');
var app = express();
var host = 'localhost';
var port = 3000;

app.use('/', serveStatic(__dirname));
app.listen(port, host);