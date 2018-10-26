/**
 * Created by WX on 2017/12/28.
 *
 */

const express = require('express');
const router = express.Router();
const await_handler = require("./utils/await_handler");
const cluster = require("cluster");
const zlib = require("zlib");
const m3u8stream = require('m3u8stream');

/* GET home page. */
router.get('/demo', function(req, res, next) {
    res.render('index');
});


router.post("/test_callback", (req, res, next)=>{
   console.log("接收到反馈:"+ JSON.stringify(req.body));
   res.send("ok");
});

router.get("/fetch_video_jobs", await_handler(async (req, res, next)=>{
    let query_con = {
        cur_page: req.query.cur_page, //当前查询的页,
        jobid: req.query.jobid, //任务id
        status:req.query.status,//任务状态
        createtime_from:req.query.createtime_from,//创建时间
        createtime_to:req.query.createtime_to//创建时间
    };

    let result = await dpa.query_fetch_jobs(query_con);
    res.send(result);
}));

router.get("/download_jobs", await_handler(async (req, res, next)=>{
    let query_con = {
        cur_page: req.query.cur_page, //当前查询的页,
        jobid: req.query.jobid, //任务id
        status:req.query.status,//任务状态
        createtime_from:req.query.createtime_from,//创建时间
        createtime_to:req.query.createtime_to//创建时间
    };

    let result = await dpa.query_download_jobs(query_con);
    res.send(result);
}));

router.get("/fetch_job_result", await_handler(async (req, res, next)=>{
    if(!req.query.jobid){
        next({message:"必须传入jobid", status:400});
        return;
    }
    let result = await dpa.get_fetch_job_result(req.query.jobid);
    res.send(result);
}));

router.get("/download_job_result", await_handler(async (req, res, next)=>{
    if(!req.query.jobid){
        next({message:"必须传入jobid", status:400});
        return;
    }
    let result = await dpa.get_download_job_result(req.query.jobid);
    res.send(result);
}));

module.exports = router;
