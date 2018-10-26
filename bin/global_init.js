/**
 * Created by WX on 2018/2/7.
 *
 * 加载环境变量。
 *
 * 将变量注入全局对象
 */
const util = require('../routes/utils/commons');

const spawn = require('child_process').spawn;
const path = require("path");


//加载配置
require("../routes/utils/config_init");

module.exports = (()=>{
    if(!global.__config__){
        global.__config__ = {
            chrome:{},
            fetch_max_num:10
        };
    }

    if_start_chrome();
    logger.info("——chrome_port      ---"+__config__.chrome.port);
    logger.info("——if_start_chrome  -----ok");

    initDB();
    logger.info("——init_db ----ok");

    global.Deferred  = function(){
        this.promise = new Promise((rs, rj)=>{
            this.rs = rs;
            this.rj = rj;
        });
        this.resolve = function (value) {
            this.rs.call(this.promise, value);
        };
        this.reject = function (reason) {
            this.rj.call(this.promise, reason);
        };
    };
    return {};
})();

function if_start_chrome(){
    if(!__config__.chrome.port){
        __config__.chrome.port = RandomNum(10000, 11000);
    }
    __config__.chrome.home = __config__.chrome.home?__config__.chrome.home:path.join(process.cwd(), "./Chrome");
    let bin;
    if (util.isWindows()) {
        // windows路径
        bin = path.join(__config__.chrome.home, "/Application/chrome.exe");
    }else {
        bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    }

    __config__.chrome.headless = (__config__.chrome.headless===void 0)?true:(__config__.chrome.headless);
    __config__.chrome.data_dir = __config__.chrome.data_dir?__config__.chrome.data_dir:path.join(__config__.chrome.home, "/temp_user_data");
    //host: HTTP frontend host. Defaults to localhost;
    //port: HTTP frontend port. Defaults to 9222;
    let args = ["--remote-debugging-port="+__config__.chrome.port, "--user-data-dir="+__config__.chrome.data_dir];// "--disable-gpu"];
    if(__config__.chrome.headless) args.push("--headless");
    let chrome = spawn(bin, args);
    // Receive output of the child process
    chrome.stdout.on('data', function(data) {
        logger.info("[data]"+data.toString());
    });
    // Receive error output of the child process
    chrome.stderr.on('data', function(err) {
        logger.error("[error]"+err.toString());
    });
    // Triggered when the process closes
    chrome.on('close', function(code) {
        logger.info('Process closed with status code: ' + code);
        if(code===0){
            //自动重启
            if_start_chrome();
        }
    });
}

function RandomNum(Min,Max){
    let Range = Max - Min;
    let Rand = Math.random();
    return Min + Math.round(Rand * Range); //四舍五入
}

function initDB(){
    global.dpa = require("../routes/db/dpafactory");
}


