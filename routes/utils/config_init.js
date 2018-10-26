/**
 * Created by WX on 2018/5/28.
 *
 */
const path = require("path");
const fs = require("fs");
const fileutil = require("./fileutil");
const log4js = require('log4js');

var config;

module.exports=(()=>{
    if(config){
        return;
    }
    initconfig();
    config = true;
})();


function initconfig(){
    try{
        let configfile = void 0;
        let argv =  process.argv.find((arg)=>arg.startsWith("--config"));
        if(argv){
            configfile = argv.substr(9);
        }
        if(!fs.existsSync(configfile)){
            configfile = path.join(fileutil.projectRoot(), "./__config__.json");
        }
        let config = fs.readFileSync(configfile);
        config = config.toString();
        global.__config__ = JSON.parse(config.replace(/\/\*.*\*\//g, ""));
        if(!__config__.appname){
            throw new Error("必须配置appname");
        }

        initlogger();
        console.log("——init_logger -----ok");
    }catch(err){
        console.error(err);
        process.exit(1);
    }
}

function initlogger(){
    let level = process.argv.find((arg)=>arg.startsWith("--debug"))?"debug":"info";
    let uselog = global.__config__&&__config__.usefilelog||false;

    let loggerConf = {
        appenders: {
            //控制台输出
            consoleappender:{
                type: 'console',
                layout: {
                    type: 'pattern',
                    pattern: "[%d{ISO8601}] [%z] - %m"
                }
            }
        },
        categories: {
            default:{appenders: ['consoleappender'], level: level},
            console: { appenders: ['consoleappender'], level: level }
        }
    };
    if(uselog){
        //文件输出
        loggerConf.appenders["fileappender"] = {
            type: "file",
            filename: path.join(process.cwd(), './logs/log'),
            pattern: "_yyyy-MM-dd",
            layout: {
                type: 'pattern',
                pattern: "[%d{ISO8601}] [%z] - %m"
            },
            maxLogSize: 20480,
            backups: 3
        };//日期文件格式
        loggerConf.categories["dateFileLog"] = { appenders: ['fileappender'], level: level };
    }

    log4js.configure(loggerConf);

    global.logger = {
        fileLogger: uselog?log4js.getLogger('dateFileLog'):void 0,
        consoleLogger: log4js.getLogger('console'),

        //一个异步的同时debug
        debug : function(msg){
            if(this.fileLogger){
                setTimeout(()=>{this.fileLogger.debug(msg)}, 0);
            }
            if(this.consoleLogger){
                setTimeout(()=>{this.consoleLogger.debug(msg)}, 0);
            }
        },

        info : function(msg){
            if(this.fileLogger){
                setTimeout(()=>{this.fileLogger.info(msg)}, 0);
            }
            if(this.consoleLogger){
                setTimeout(()=>{this.consoleLogger.info(msg)}, 0);
            }
        },

        warn : function(msg){
            if(this.fileLogger){
                setTimeout(()=>{this.fileLogger.warn(msg)}, 0);
            }
            if(this.consoleLogger){
                setTimeout(()=>{this.consoleLogger.warn(msg)}, 0);
            }
        },

        error : function(msg){
            if(this.fileLogger){
                setTimeout(()=>{this.fileLogger.error(msg)}, 0);
            }
            if(this.consoleLogger){
                setTimeout(()=>{this.consoleLogger.error(msg)}, 0);
            }
        }
    };
}