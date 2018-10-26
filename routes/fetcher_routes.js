/**
 * Created by WX on 2017/12/28.
 *
 */

const express = require('express');
const router = express.Router();
const urlparse = require("url");
const su = require("superagent");
require("superagent-proxy")(su);
const chromer = require("./shadow_chrome");
const await_handler = require("./utils/await_handler");
const ENUM = require("./domain/enum");

router.post('/fetch_video', await_handler(async function(req, res, next) {
    let url = req.body.url;
    let hostname = urlparse.parse(url).hostname;
    let callback = req.header("callback")||"";

    let crawler = host_require(hostname);
    if(!crawler||!crawler.fetcher){
        console.error("没有找到"+hostname+"对应的抓取实现");
        next({send:true, message:"没有找到"+hostname+"对应的抓取实现"});
        return;
    }

    let space = await dpa.allocate_job_space(ENUM.JOBTYPE.CAPTURE);
    if(!space){
        next({message:"抓取任务已达最大数("+global.__config__.fetch_max_num+")，需要稍后发起!"});
        return;
    }

    let loginresult = null;
    let jobid = void 0;
    let err = void 0;
    let captured = {ok:false};
    try{
        if(crawler.loginer) {
            loginresult = await chromer.login(new crawler.loginer());
        }
        if(loginresult==null||(loginresult.result&&loginresult.result===true)){

            //注册任务
            jobid = await dpa.add_job({url:url, status:ENUM.JOB_STATUS.INIT, client:req.ip, callback:callback, createtime:new Date(), type:ENUM.JOBTYPE.CAPTURE});
            if(callback){
                //有异步回调要求，直接返回任务id
                res.status(202);
                res.send({jobid:jobid, type:ENUM.JOBTYPE.CAPTURE, status:0});
            }
            //抓取执行
            captured = await chromer.capture(url, new crawler.fetcher());
            //结束
            captured.jobid = jobid;
        }else{
            next(loginresult.err);
        }
    }catch(e){
        err = e;
        captured.message = err.toString();
    }

    //完成后的处理
    let status = err||(captured&&captured.ok===false)?ENUM.JOB_STATUS.FAILD:ENUM.JOB_STATUS.SUCCESS;
    if(jobid){
        await dpa.end_job({jobid:jobid, status:status, message:captured.message, updatetime:new Date(), result:captured});

        if(!callback){
            //如果不是异步回调，则返回抓取的结果
            if(err) next(captured);
            else res.send(captured);
        }else{
            //异步回调
            try{
                await su.post(callback).set("Content-Type", "application/json").send(err||captured);
                await dpa.update_job_notify({jobid:jobid, notifystatus:ENUM.NOTIFY_STATUS.SENDED, notifydesc:"sended", notifytime:new Date()});
            }catch(err){
                await dpa.update_job_notify({jobid:jobid, notifystatus:ENUM.NOTIFY_STATUS.FAILD, notifydesc:err.message, notifytime:new Date()});
            }
        }
    }else{
        next(err?err:{message:"未知错误"});
    }
    await dpa.release_job_space(ENUM.JOBTYPE.CAPTURE);
}));


module.exports = router;

const required = {};
function host_require(hostname){
    if(required[hostname]){
        return required[hostname];
    }
    //后续可以采用分析域名，然后动态代码的方式来写
    let domain;
    if(hostname.indexOf("youku.com")>=0){
        domain = "youku.com";
    }else if(hostname.indexOf("qq.com")>=0){
        domain = "qq.com";
    }else if(hostname.indexOf("toutiao.com")>=0||hostname.indexOf("ixigua.com")>=0||hostname.indexOf("365yg.com")>=0){
        domain = "toutiao.com";
    }else if(hostname.indexOf("iqiyi.com")>=0){
        domain = "iqiyi.com";
    }else if(hostname.indexOf("weibo.com")>=0||hostname.indexOf("krcom.cn")>=0){
        domain = "weibo.com";
    }else if(hostname.indexOf("youtube.com")>=0){
        domain = "youtube.com";
    }else{
        return void 0;
    }

    let temp = {};
    try {
        let req = require("./crawler/"+domain+"/fetcher");
        if(req){
            temp.fetcher = req;
        }
    }catch(err){
        console.log("【可忽略】："+err);
    }
    try {
        let req = require("./crawler/"+domain+"/loginer");
        if(req){
            temp.loginer = req;
        }
    }catch(err){
        console.log("【可忽略】："+err);
    }
    if(temp.fetcher){
        required[hostname] = temp;
    }
    return required[hostname];
}