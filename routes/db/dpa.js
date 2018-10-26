/**
 * Created by WX on 2018/5/28.
 *
 * mysql数据库操作
 */


module.exports = function(){
    /**
     * 返回是否可以添加任务
     * @param type  //任务类型：string
     * @returns {boolean}
     */
    this.allocate_job_space = async function(type){
        return true;
    };

    /**
     * 释放占用的任务空间
     * @param type  //任务类型：string
     * @returns {Promise<void>}
     */
    this.release_job_space = async function(type){
        if(global.logger) logger.info("release_job_space");
        else console.log("release_job_space");

    };

    /**
     * 添加一个任务
     * @param job
     *       {
     *          url:xxx,
     *          status:ENUM.FETCH_JOB_STATUS.INIT,
     *          client:xxx.xx.xx.xx,
     *          callback:http://xxx.xxx.x/xx,
     *          createtime:date
     *          type:ENUM.JOBTYPE
     *       }
     * @returns {Promise<string>}
     */
    this.add_job = async function(job){
        if(global.logger) logger.info("task add");
        else console.log("task add");

        return "jobid";
    };

    /**
     * 结束一个任务，包含状态
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
        if(global.logger) logger.info("task end. jobid="+job.jobid);
        else console.log("task end. jobid="+job.jobid);
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
        if(global.logger) logger.info("notify end. jobid="+notify.jobid);
        else console.log("notify end. jobid="+notify.jobid);
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
        return {page_info:{}, results:[]};
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
        return {标签: {m3u8:void 0,videos:[],audios:[],mixed:[]}};
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
    this.query_download_jobs = async function(query_con){
        return {page_info:{}, results:[]};
    };

    /**
     * @param jobid
     * @returns download_result
     *
     * download_result:{localpath:xxxxxxx}
     */
    this.get_download_job_result = async function(jobid){
        return {localpath:"/nofile.mp4"};
    };
};

