
require("./global_init");//加载全局初始化信息

const http = require('http');
const express = require('express');
//let session = require('express-session');
const path = require('path');
const favicon = require('serve-favicon');
const morganLog = require("morgan");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
//wx 使用文件系统
const fs = require("fs");
//使用ejs
const ejs = require('ejs');

//使用domain来捕获异步错误
const domain = require("domain");

//构造express
let app = express();
// view engine setup
app.set('views', path.resolve(__dirname, '../www'));
//识别html为后缀的文件
app.engine('.html', ejs.__express);
app.set('view engine', 'html');
//app.set('view engine', 'ejs');//这样的话，必须识别ejs为后缀的文件

// uncomment after placing your favicon in /public
app.use(favicon(path.resolve(__dirname, "../www/resources/images/favicon.jpg")));
app.use(morganLog('dev'));
app.use(bodyParser({uploadDir:'./uploads'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("PSS"));
//app.use(session({
//    resave: true, // don't save session if unmodified
//    saveUninitialized: false, // don't create session until something stored
//    secret: 'PSS'
//}));
//to ejs
app.locals.require = require;
app.locals.__dirname = __dirname;

app.use("/rs", express.static(path.resolve(__dirname, "../www/resources")));
app.use('/api', express.static(path.join(__dirname, '../www/swagger')));

/*
 * 2017-06-07 wx
 * 自动加载所有的routes
 * */
try{
    let files = fs.readdirSync(path.join(__dirname, "../routes"));
    if(files){
        console.log("加载routes中的路由中间件");
        files.forEach(
            function(file){
                let stat = fs.statSync(path.resolve(__dirname, "../routes/"+file));
                if(stat.isFile()){
                    let fname = path.basename(file, path.extname(file));
                    if(fname.indexOf("_routes")>0){
                        app.use('/', require("../routes/"+fname));
                        console.log("加载/routes/"+path.basename(file, path.extname(file)));
                    }
                }
            }
        );
    }
}catch(err) {
    throw err;
}


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
//传递error，必须要求为4参数 @see https://cnodejs.org/topic/53c38c69400ca4581bc245ac
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.stack = err.stack;
    if(err.stack){
        console.error(err.stack);
    }
    res.status(err.status || 500);
    if(err.send===void 0){
        err.send = true;
    }
    if(err.send) {
        res.send({err: err.message?err.message:err});
    }else{
        res.render('error', err.message||err);
    }
});


/**
 * Get port from environment and store in Express.
 */

let port = normalizePort(__config__.port||process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

let server = http.createServer(app);
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error',
    /**
     * Event listener for HTTP server "error" event.
     */
    function(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        let bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }
);

server.on('listening',
    /**
     * Event listener for HTTP server "listening" event.
     */

    function() {
        let addr = server.address();
        let bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        console.log('Listening on ' + bind);
    }
);


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}



