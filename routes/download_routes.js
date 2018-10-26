/**
 * Created by WX on 2017/12/28.
 *
 */

const express = require('express');
const router = express.Router();
const su = require("superagent");
require("superagent-proxy")(su);
const fs = require("fs");

const uuid = require('uuid');
const fileutil = require("./utils/fileutil");
const path  = require("path");
const m3u8stream = require('m3u8stream');
const await_handler = require("./utils/await_handler");
const proxy_server = {host:"127.0.0.1", port:1080};
const ENUM = require("./domain/enum");


router.post("/download", await_handler(async (req, res, next)=>{
    let downloadpath = req.body.folder;
    let need_proxy = req.body.need_proxy&&req.body.need_proxy==="true";
    let url = req.body.url;
    let callback = req.header("callback")||"";

    if(!url){
        next({message:"url为空", status:400, send:true});
        return;
    }

    let jobid = void 0;
    let err = void 0;
    let result = {};
    let space = void 0;
    try {
        space = await dpa.allocate_job_space(ENUM.JOBTYPE.DOWNLOAD);
        if(!space){
            next({message:"下载任务已达最大数("+global.__config__.fetch_max_num+")，需要稍后发起!"});
            return;
        }

        //注册任务
        jobid = await dpa.add_job({url:url, status:ENUM.JOB_STATUS.INIT, client:req.ip, callback:callback, createtime:new Date(), type:ENUM.JOBTYPE.DOWNLOAD});
        if(callback){
            //有异步回调要求，直接返回任务id
            res.send({jobid:jobid, type:ENUM.JOBTYPE.DOWNLOAD, status:0});
        }

        await fileutil.mkdirs(downloadpath);
        logger.debug("获取下载目标信息:"+url);

        let req = su.head(url);
        if(need_proxy){
            req = req.proxy("http://"+proxy_server.host+":"+proxy_server.port);
        }
        let sures = await req;

        let cAt = sures.header["content-type"].split("/");
        let type = cAt[0];
        let ext = cAt[1];
        //获取当前目录下的文件，按照顺序设置index后缀
        let media = await new Promise((rs,rj)=>{
            fs.readdir(downloadpath, (err, files)=>{
                if(files&&files.length>0){
                    files.sort();
                    let filename = files.pop();
                    let idx = parseInt(filename.substring(filename.indexOf("_")+1, filename.indexOf(".")));
                    rs({url:url, type:type+"_"+(idx+1), ext:ext});
                }else{
                    rs({url:url, type:type+"_0", ext:ext});
                }
            });
        });

        let localpath = path.join(downloadpath, media.type+"."+media.ext);
        let stream = fs.createWriteStream(localpath);

        result = await new Promise((rs,rj)=>{
            req = su.get(media.url);
            req.on('end', (err, suresp)=>{
                if(err) rj(err);
                else rs({localpath:localpath});
            });
            if(need_proxy){
                req = req.proxy(proxy_server);
            }
            req.pipe(stream);
        });

        logger.debug("下载完成:"+localpath);
    }catch(e){
        err = e;
        logger.error(e);
        next(e);
    }finally{
        let status = err?ENUM.JOB_STATUS.FAILD:ENUM.JOB_STATUS.SUCCESS;
        if(jobid){
            await dpa.end_job({jobid:jobid, status:status, message:err?err.message:"", updatetime:new Date(), result:result});

            if(!callback){
                //如果不是异步回调，则返回抓取的结果
                if(!err) res.send(result);
            }else{
                //异步回调
                try{
                    await su.post(callback).set("Content-Type", "application/json").send(result);
                    await dpa.update_job_notify({jobid:jobid, notifystatus:ENUM.NOTIFY_STATUS.SENDED, notifydesc:"sended", notifytime:new Date()});
                }catch(err){
                    await dpa.update_job_notify({jobid:jobid, notifystatus:ENUM.NOTIFY_STATUS.FAILD, notifydesc:err.message, notifytime:new Date()});
                }
            }
        }else{
            next(err?err:{message:"未知错误"});
        }
        if(space) await dpa.release_job_space(ENUM.JOBTYPE.DOWNLOAD);
    }
}));

router.post("/download_m3u8", await_handler(async (req, res, next)=>{
    let downloadpath = req.body.folder;
    let need_proxy = req.body.need_proxy&&req.body.need_proxy==="true";
    let url = req.body.url;
    let fname = req.body.filename;
    let callback = req.header("callback")||"";

    if(!url){
        next({message:"url为空", status:400, send:true});
        return;
    }

    let jobid = void 0;
    let err = void 0;
    let result = {};
    let space = void 0;
    try {
        space = await dpa.allocate_job_space(ENUM.JOBTYPE.DOWNLOAD);
        if(!space){
            next({message:"下载任务已达最大数("+global.__config__.fetch_max_num+")，需要稍后发起!"});
            return;
        }

        //注册任务
        jobid = await dpa.add_job({url:url, status:ENUM.JOB_STATUS.INIT, client:req.ip, callback:callback, createtime:new Date(), type:ENUM.JOBTYPE.DOWNLOAD});
        if(callback){
            //有异步回调要求，直接返回任务id
            res.send({jobid:jobid, type:ENUM.JOBTYPE.DOWNLOAD, status:0});
        }
        await fileutil.mkdirs(downloadpath);
        logger.debug("获取下载目标信息:"+url);

        let opt = void 0;
        if(need_proxy){
            opt = {
                requestOptions:{
                    host: proxy_server.host,
                    port: proxy_server.port,
                    method: 'GET'
                }
            }
        }

        result = await new Promise((rs,rj)=>{
            let stream = m3u8stream(url, opt);
            let localpath = path.join(downloadpath, (fname?fname:uuid.v4())+".mp4");
            let outstream = fs.createWriteStream(localpath);
            stream.on('data', (chunk) => {
                logger.debug("/download_m3u8:"+url+" Received "+chunk.length+" bytes of data.");
            });
            stream.on('end', () => {
                rs({localpath:localpath});
            });
            stream.on('error', (error) => {
                rj(error);
            });
            stream.pipe(outstream);
        });
    }catch(e){
        err = e;
        logger.error(e);
        next(e);
    }finally{
        let status = err?ENUM.JOB_STATUS.FAILD:ENUM.JOB_STATUS.SUCCESS;
        if(jobid){
            await dpa.end_job({jobid:jobid, status:status, message:err?err.message:"", updatetime:new Date(), result:result});

            if(!callback){
                //如果不是异步回调，则返回抓取的结果
                if(!err) res.send(result);
                else next(err);
            }else{
                //异步回调
                try{
                    await su.post(callback).set("Content-Type", "application/json").send(err||result);
                    await dpa.update_job_notify({jobid:jobid, notifystatus:ENUM.NOTIFY_STATUS.SENDED, notifydesc:"sended", notifytime:new Date()});
                }catch(err){
                    await dpa.update_job_notify({jobid:jobid, notifystatus:ENUM.NOTIFY_STATUS.FAILD, notifydesc:err.message, notifytime:new Date()});
                }
            }
        }else{
            next(err?err:{message:"未知错误"});
        }
        if(space) await dpa.release_job_space(ENUM.JOBTYPE.DOWNLOAD);
    }
}));



module.exports = router;
