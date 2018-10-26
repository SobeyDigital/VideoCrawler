/**
 * Created by WX on 2017/12/28.
 *
 */

/**
 * 2018-02-07 19:28:25 sun
 * 1. 打开网页,在网页源码中找到 tvid
 * 2. 请求 http://mixer.video.iqiyi.com/jp/mixin/videos/{tvid} 获取到 tvid和 vid
 * 3. 根据 tvid  vid   时间t   key=d5fb4bd9d50c4be6948c97edd7254b0e src=76f90cbd92f94a2e925d83e8ccd22cb7
 *    得到 sc = Utils.md5((t+key+vid));
 * 4. 最后 请求: http://cache.m.iqiyi.com/tmts/{tvid}/{vid}/?t={t}&sc={sc}&src={src}  得到 一个JSON数据
 * 5. 这个JSON数据即为 多种码率的 m3u8地址.   m3u8的解析 同 优酷
 */


var su = require("superagent");
var crypto = require('crypto');
var Fetcher = require("../prototype/fetcher");

let key = 'd5fb4bd9d50c4be6948c97edd7254b0e'
let src = '76f90cbd92f94a2e925d83e8ccd22cb7'

AiqiyiFecther.prototype = new Fetcher();
function AiqiyiFecther(){
    this.result = {
        medias:{
        },
        ok: false
    };
    var this_ = this;

    this.fetch = async function(params){
        let requestUrl = params.request.url;
        logger.debug("[爱奇艺_fetch]"+requestUrl);
      let atleast_one = false;

        if(requestUrl.indexOf("tvid=")>0) {
            let tvid = /tvid=[0-9]+/.exec(requestUrl)[0].split('=')[1]
            logger.debug("!!!!!!!!!find tvid:" + tvid);

          // 2. 请求 http://mixer.video.iqiyi.com/jp/mixin/videos/{tvid} 获取到 tvid和 vid
          let su_resp = await su.get('http://mixer.video.iqiyi.com/jp/mixin/videos/'+tvid).parse(customJSONParser)
          //得到了vid
          let vid = su_resp.body.vid

          //根据 tvid  vid   时间t   key=d5fb4bd9d50c4be6948c97edd7254b0e src=76f90cbd92f94a2e925d83e8ccd22cb7 得到 sc = Utils.md5((t+key+vid));
          let t = Date.now()
          let sc = crypto.createHash('md5').update(''+t+key+vid).digest("hex");
          logger.debug(sc)

          //4. 最后 请求: http://cache.m.iqiyi.com/tmts/{tvid}/{vid}/?t={t}&sc={sc}&src={src}  得到 一个JSON数据
          let su_result = await su.get('http://cache.m.iqiyi.com/tmts/'+tvid+'/'+vid+'/?t='+t+'&sc='+sc+'&src='+src).parse(customJSONParser)

          //这个就是结果,不同码率的在 su_result.data.vidl 这个数组里面
          logger.debug(su_result)

          for(let i=0; i<su_result.body.data.vidl.length; i++){
            let data = su_result.body.data.vidl[i]
            let label = data.screenSize+'('+vd_2_id[data.vd]+')'

            try{
              let su_resp = await su.get(data.m3u).buffer();//通过buffer将stream读取到内存
              if(su_resp.text){
                //构造当前标签的对象
                this_.result.medias[label] = {};
                //读取m3u8
                let info_array = su_resp.text.split("\n");
                let map = {};
                //reduce
                info_array.forEach((address)=>{
                  if(address.indexOf("http")==0){
                    let key = address.substring(0, address.indexOf("?"));
                    map[key] = address;
                  }
                });
                //将结果写入mixed数组
                for(let x in map){
                  let address = map[x];
                  let add = map[x];
                  if(!this_.result.medias[label].mixed){
                    this_.result.medias[label].mixed = [];
                  }
                  if(address.indexOf("&start=")>0) {
                    address = address.replace(/&start=[0-9]+/,'&start=0')
                  }
                  if(address.indexOf("&contentlength=")>0) {
                    address = address.replace(/&contentlength=[0-9]+/,'')
                  }
                  if(address.indexOf("&ts_start=")>0){
                    address = address.substr(0, address.indexOf("&ts_start="));
                  }
                  this_.result.medias[label].mixed.push(address);
                  this_.result.medias[label].mixed.push(add);
                }
                //表示找到了
                atleast_one = true;
              }else{
                this_.result.medias[label] = [];
              }
            }catch(err){
              logger.debug("【可以忽略】iqiyi_fecther获取"+data.m3u+"中的数据出现错误："+err.toString());
            }
          }
          if(atleast_one){
            this_.result.ok = true;
          }
        }
        return Promise.resolve(this_.result);
    };

    this.timeout_giving = function(){
        console.error("[爱奇艺_fetch]解析超时");
        return this_.result;
    }
}

/**
 * 自定义jsonparser,因为iqiyi返回的是 var tvInfoJs={xxxxxx} 这样的格式
 * @param res
 * @param callback
 */
function customJSONParser(res, callback) {
  res.data = '';
  res.setEncoding('utf-8');
  res.on('data', function (chunk) {
    if(chunk.startsWith('var tvInfoJs=')) chunk = chunk.substr(13);
    res.data += chunk;
  });
  res.on('end', function () {
    callback(null, JSON.parse(res.data));
  });
}

let vd_2_id = {10: '4k', 19: '4k', 5:'蓝光', 18: '蓝光', 21: '高清_H265', 2: '高清', 4: '超清', 17: '超清_H265', 96: '流畅', 1: '标清', 14: '超清'}

module.exports = AiqiyiFecther;
