/**
 * Created by WX on 2018/5/28.
 *
 */


const mysql = require("mysql");
require("../utils/config_init");
const DPA = require("./dpa");
const uuid = require("uuid");
const cluster = require("cluster");
const ENUM = require("../domain/enum");
const timeutil = require("silly-datetime");

const instance_ = {};
module.exports = MysqlDPA;


MysqlDPA.prototype = new DPA();
function MysqlDPA(){
    //单例模式
    if(!instance_.db){
        instance_.db = new DB();
    }

    /**
     * 返回是否可以添加任务
     * @returns {boolean}
     */
    this.allocate_job_space = async function(type){
        while(true){
            //也就是采用一个乐观锁来对数据进行++。
            //由于node是单进程单线程，因此，只有在__config__.json配置了multi_process_count的时候，乐观锁才会真正起作用
            //multi_process_count决定了是否启用多进程模式
            let sql = "select cur_count,total_count,init from fetch_max_count where pid=? and type=?";
            let r = await instance_.db.query(sql,[__config__.appname,type]);
            r = r.results[0];
            let curcount = r.cur_count+1;
            if(curcount>r.total_count){
                //如果当前job已经满额，则直接退出
                return false;
            }
            //做数据库判定
            let init = r.init+1;
            sql = "update fetch_max_count set cur_count=?,init=? where pid=? and init=? and type=?";
            r = await instance_.db.query(sql, [curcount,init,__config__.appname,r.init,type]);
            if(r.results.affectedRows===1){
                return true;
            }
        }
    };

    /**
     * 释放占用的任务空间
     * @returns {Promise<void>}
     */
    this.release_job_space = async function(type){
        //由于allocate_job_space是乐观锁控制的。因此，这里一定会更新成功
        while(true){
            //但是为了避免竞争问题，还是使用乐观锁来避免并发
            let sql = "select init from fetch_max_count where pid=? and type=?";
            let r = await instance_.db.query(sql,[__config__.appname,type]);
            r = r.results[0];
            //做数据库判定
            let init = r.init+1;
            sql = "update fetch_max_count set cur_count=cur_count-1,init=? where pid=? and init=? and type=?";
            r = await instance_.db.query(sql, [init,__config__.appname,r.init, type]);
            if(r.results.affectedRows===1){
                return;
            }
        }
    };

    /**
     * 添加一个抓取任务
     * @param job //{url:xxx, status:0|2|-1, client:xxx.xx.xx.xx, callback:http://xxx.xxx.x/xx, createtime:date, updatetime:date}
     * @returns {Promise<string>}
     */
    this.add_job = async function(job){
        let sql = "select UUID() as uid";
        let r = await instance_.db.query(sql);
        if(r&&r.results){
            let uuid = r.results[0].uid;
            sql = "insert into fetch_job (jobid,url,status,client,callback,createtime,type) values (?,?,?,?,?,?,?)";
            await instance_.db.query(sql, [uuid,job.url,job.status,job.client,job.callback,job.createtime,job.type]);
            return uuid;
        }else{
            throw new Error("插入错误，无法获取到UUID");
        }
    };

    /**
     * 结束一个抓取任务，包含状态
     * @param job
     *        {
     *          jobid:xxx,
     *          status:ENUM.FETCH_JOB_STATUS.SUCCESS|ENUM.FETCH_JOB_STATUS.FAILD,
     *          updatetime:date,
     *          message:xxxxxx,
     *          result:{
     *             标签:{
     *                  m3u8:void 0,
     *                  videos:[],
     *                  audios:[],
     *                  mixed:[]
     *              }
     *          }
     *       }
     * @returns {Promise<void>}
     */
    this.end_job = async function(job){
        let sql = "update fetch_job set status=?,updatetime=?,message=?,result=? where jobid=?";
        await instance_.db.query(sql,
            [
                job.status, job.updatetime, job.message,
                job.result?JSON.stringify(job.result):void 0,
                job.jobid
            ]
        );
    };

    /**
     * 修改通知状态
     * @param notify
     *      {
     *          jobid:jobid,
     *          notifystatus:ENUM.NOTIFY_STATUS,
     *          notifydesc:"sended",
     *          notifytime:new Date()
     *          }
     * @returns {Promise<void>}
     */
    this.update_job_notify = async function(notify){
        let sql = "update fetch_job set notifystatus=?,notifydesc=?,notifytime=? where jobid=?";
        await instance_.db.query(sql,
            [
                notify.notifystatus, notify.notifydesc, notify.notifytime,
                notify.jobid
            ]
        );
    };

    /**
     * 查询抓取任务
     * @param query_con
     *        {
     *           cur_page: 2 //当前查询的页,
     *           jobid: xxxx, //任务id
     *           status:ENUM.JOB_STATUS.SUCCESS|ENUM.JOB_STATUS.FAILD,//任务状态
     *           createtime_from:date,//创建时间
     *           createtime_to:date//创建时间
     *        }
     * @returns query_result
     *
     * QueryResult:{
     *    page_info:{
     *       cur_count: 5, //当前数量
     *       total_count: 100, //总数量
     *       cur_page: 1, //当前页
     *       total_page: 20//总页数
     *    },
     *
     *    results:[
     *        {
     *           jobid:xxx,
     *           status:ENUM.JOB_STATUS.SUCCESS|ENUM.JOB_STATUS.FAILD,
     *           url:xxxxxxxxx,
     *           createtime:date,
     *           updatetime:date,
     *           message:xxxxxx,
     *           callback:xxxxxxx,
     *           notifystatus:ENUM.NOTIFY_STATUS,
     *           notifydesc:"sended",
     *           notifytime:date,
     *           client: xxx.xxx.xx.xx
     *        }
     *    ]
     * }
     */
    this.query_fetch_jobs = async function(query_con){
        query_con.type = ENUM.JOBTYPE.CAPTURE;
        return await query_jobs(query_con);
    };

    /**
     * @param jobid
     * @returns fetch_result
     *
     * fetch_result:{
     *             标签:{
     *                  m3u8:void 0,
     *                  videos:[],
     *                  audios:[],
     *                  mixed:[]
     *              }
     *          }
     */
    this.get_fetch_job_result = async function(jobid){
        return get_result_json(jobid, ENUM.JOBTYPE.CAPTURE);
    };

    /**
     * 查询下载任务
     * @param query_con
     *        {
     *           cur_page: 2 //当前查询的页,
     *           jobid: xxxx, //任务id
     *           status:ENUM.JOB_STATUS.SUCCESS|ENUM.JOB_STATUS.FAILD,//任务状态
     *           createtime_from:date,//创建时间
     *           createtime_to:date//创建时间
     *        }
     * @returns query_result
     *
     * QueryResult:{
     *    page_info:{
     *       cur_count: 5, //当前数量
     *       total_count: 100, //总数量
     *       cur_page: 1, //当前页
     *       total_page: 20//总页数
     *    },
     *
     *    results:[
     *        {
     *           jobid:xxx,
     *           status:ENUM.JOB_STATUS.SUCCESS|ENUM.JOB_STATUS.FAILD,
     *           url:xxxxxxxxx,
     *           createtime:date,
     *           updatetime:date,
     *           message:xxxxxx,
     *           callback:xxxxxxx,
     *           notifystatus:ENUM.NOTIFY_STATUS,
     *           notifydesc:"sended",
     *           notifytime:date,
     *           client: xxx.xxx.xx.xx
     *        }
     *    ]
     * }
     */
    this.query_download_jobs = async function(query_con){
        query_con.type = ENUM.JOBTYPE.DOWNLOAD;
        return await query_jobs(query_con);
    };

    /**
     * @param jobid
     * @returns download_result
     *
     * download_result:{localpath:xxxxxxx}
     */
    this.get_download_job_result = async function(jobid){
        return get_result_json(jobid, ENUM.JOBTYPE.DOWNLOAD);
    };

    async function query_jobs(query_con){
        if(!query_con.cur_page){
            query_con.cur_page = 1;
        }
        if(query_con.cur_page<1){
            let error = new Error("分页不得小于第一页");
            error.status = 400;
            throw error;
        }

        let count_per_page = 10; //当前页
        let limit_start = (query_con.cur_page-1)*count_per_page;

        let page_info = {
            cur_count:0,
            total_count:0,
            cur_page:query_con.cur_page,
            total_page:0
        };

        delete query_con.cur_page;

        let sql = "select jobid,status,url,createtime,updatetime,message,callback,notifystatus,notifydesc,notifytime,client ";
        let count_sql = "select count(*) as cnt ";
        let sql_con = "from fetch_job where type=? ";
        let pre_val = [query_con.type];
        for(let i in query_con){
            if(!query_con[i]) continue;

            if(i.endsWith("_from")||i.endsWith("_to")){
                sql_con += "and "+i+(i.endsWith("_from")?">=":"<=")+"? ";
            }else{
                sql_con += "and "+i+"=? ";
            }
            pre_val.push(query_con[i]);
        }
        sql_con += "limit "+limit_start+","+count_per_page;

        let r = await instance_.db.query(count_sql+sql_con, pre_val);
        if(r.results&&r.results[0]&&r.results[0].cnt>=0){
            page_info.total_count = r.results[0].cnt;
            page_info.cur_count = (page_info.total_count >=page_info.cur_page*count_per_page)
                ?page_info.cur_page*count_per_page
                :page_info.total_count;
            page_info.total_page = page_info.total_count%count_per_page>0
                ?(parseInt(page_info.total_count/count_per_page)+1)
                :parseInt(page_info.total_count/count_per_page);

            r = await instance_.db.query(sql+sql_con, pre_val);
            return {
                page_info:page_info,
                results:r.results.map((result)=>{
                    if(result.createtime){
                        result.createtime = timeutil.format(result.createtime, "YYYY-MM-DD HH:mm:ss");
                    }
                    if(result.updatetime){
                        result.updatetime = timeutil.format(result.updatetime, "YYYY-MM-DD HH:mm:ss");
                    }
                    return result;
                })
            };
        }else{
            return {page_info:page_info, results:[]};
        }
    }

    async function get_result_json(jobid, type){
        let sql = "select result from fetch_job where jobid=? and type=? and status=2";
        let r  = await instance_.db.query(sql, [jobid, type]);
        return r.results&&r.results[0]&&r.results[0].result?JSON.parse(r.results[0].result):void 0;
    }
}



//代理一个db，使得可以使用await
//其实，用mysql2这个库就可以了，但是不想换了
function DB(){
    //构造一个DB对象
    if(!__config__.MYSQL){
         throw new Error("没有配置Mysql数据库配置");
    }

    __config__.MYSQL.multipleStatements = "true";
    let pool = mysql.createPool(__config__.MYSQL);
    //初始化数据库，相当于验证连接
    if(cluster.isMaster){
        let maxnum = __config__.fetch_max_num;
        if(__config__.multi_process_count&&__config__.multi_process_count>1){
            maxnum = __config__.fetch_max_num*__config__.multi_process_mode.process_count;
        }
        pool.query(
            "delete from fetch_max_count where pid=?;"+
            "insert into fetch_max_count (pid,cur_count,total_count,init,type) value (?, 0, "+maxnum+", 0, ?),(?, 0, 3, 0, ?);",
            [__config__.appname,__config__.appname, ENUM.JOBTYPE.CAPTURE, __config__.appname, ENUM.JOBTYPE.DOWNLOAD],
            (e,r,f)=>{
                if(e) {
                    if(global.logger) logger.error(e);
                    process.exit(1);
                }
            }
        );
    }else{
        pool.query("select 1" , (e,r,f)=>{
            if(e) throw e;
        });
    }


    if(process.argv.find((arg)=>arg==="--debug")){
        pool.on('connection', function(connection) {
            connection.on('enqueue', function(sequence) {
                // if (sequence instanceof mysql.Sequence.Query) {
                if ('Query' === sequence.constructor.name) {
                    if(global.logger) logger.debug(sequence.sql);
                    else console.log(sequence.sql);
                }
            });
        });
    }

    //包装一个查询，通过resolve返回results
    this.query = function(sql, params, callback){
        if(callback){
            return params&&params.length>0?pool.query(sql, params, callback):pool.query(sql, callback);
        }else{
            return new Promise((rs,rj)=>{
                let callback_ = function(e, r, f){
                    e?rj(e):rs({results:r, fields:f});
                };
                params&&params.length>0?pool.query(sql, params, callback_):pool.query(sql, callback_);
            });
        }
    };

    this.beginTransaction = function(callback){
        if(callback){
            pool.getConnection((err, connection)=>{
                if(err) callback(err, null);
                else{
                    connection.beginTransaction(function(error){
                        if(error) callback(error, null);
                        else{
                            let transaction = new Trasaction(connection);
                            callback(null, transaction);
                        }
                    });
                }
            });
            return void 0;
        }else{
            return new Promise((rs, rj)=>{
                pool.getConnection((err, connection)=>{
                    if(err) rj(err);
                    else{
                        connection.beginTransaction(function(error){
                            if(error) rj(error);
                            else{
                                let transaction = new Trasaction(connection);
                                rs(transaction);
                            }
                        });
                    }
                })
            });
        }
    };

    this.getConnection = function(callback){
        if(callback){
            pool.getConnection(callback);
        }else{
            return new Promise((rs,rj)=>{
                pool.getConnection((err, connection)=>{
                    if(err) rj(err);
                    else rs(connection);
                })
            });
        }
    };

    this.close = function(){
        pool.end();
    }
}

function Trasaction(connection){
    this.connection = connection;

    this.commit = function(){
        try{
            this.connection.commit();
        }catch(E){
        }finally{
            this.connection.release();
        }
    };

    this.rollback = function(){
        try{
            this.connection.rollback();
        }catch(E){
        }finally{
            this.connection.release();
        }
    };

    this.query = function(sql, params, callback){
        if(callback){
            return params&&params.length>0?this.connection.query(sql, params, callback):this.connection.query(sql, callback);
        }else{
            return new Promise((rs,rj)=>{
                let callback_ = function(e, r, f){
                    e?rj(e):rs({results:r, fields:f});
                };
                params&&params.length>0?this.connection.query(sql, params, callback_):this.connection.query(sql, callback_);
            });
        }
    };
}