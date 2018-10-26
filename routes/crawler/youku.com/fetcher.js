/**
 * Created by WX on 2017/12/28.
 *
 */

/**
 *2018-02-07 19:28:44 sun
 * 在优酷播放视频的过程中 会请求:  http://pl-ali.youku.com/playlist/m3u8?{xxxxxxxxx}的 地址.
 * 这个地址其实是一个标准的m3u8文件. 里面包含了 分片文件的路径信息
 *
 * 把里面每一行路径 解析出来 找到 ?问号前的路径, 做合并过滤. 得到 每一片的地址.  然后取完整的地址去掉 ts_start 和 ts_end ts_seg_no ts_keyframe 得到的就是Mp4地址
 *
 * 2018-04-08 wx
 * 现在是通过m3u8获取地址，并且，清晰度是【猜测的】有3种。这种方式在“某些”情况下无法获取到地址
 * 原因是它有时候不会返回m3u8，这和访问方式有关系。
 * 但是无论什么情况，它会请求一个 ?jsv=xxxx的地址。
 * 这个地址里面，返回了所有【真实的】清晰度列表，每个列表都是一个m3u8
 * 因此，采用这种方式来获取 @see ../youku/jsv样例
 *
 */
let Fetcher = require("../prototype/fetcher");
let m3u8builder = require("../prototype/public/m3u8builder");

YouKuFecther.prototype = new Fetcher(); //继承Fecther
function YouKuFecther(){
    this.result = {
        medias:{
        },
        ok: false
    };

    //使用async声明该函数返回一个Promise的resolve结果。异常会自动被reject
    this.fetch = async function(params){
        let requestUrl = params.url;
        let response = params.response.body;
        logger.debug("[youku_fetch]"+requestUrl);

        if(requestUrl.indexOf("ups.appinfo.get")>0&&requestUrl.indexOf("jsv=")>0&&requestUrl.indexOf("appKey=")>0
            &&requestUrl.indexOf("sign=")>0) {
            logger.debug("!!!!!!!!!find_mtop.youku.play.ups.appinfo.get_jsv:" + requestUrl);
            logger.debug("!!!!!!!!!find_mtop.youku.play.ups.appinfo.get_jsv:获取到返回数据" + response);
            let str = response.substring(response.indexOf("(")+1, response.lastIndexOf(")"));
            let obj = JSON.parse(str);
            if(obj.ret[0]==='SUCCESS::调用成功'){
                let streams = obj.data.data.stream.map((stream)=>{
                    return {url:stream.m3u8_url, label:stream.stream_type+"_"+stream.width};
                });

                let result = await new m3u8builder(streams).load().reduce().collect();
                if(result.length>0){
                    this.result.ok = true;
                    for(let x in result){
                        let label = result[x].label;
                        this.result.medias[label] = {m3u8:result[x].url};
                        this.result.medias[label].mixed = result[x].streamurls.map((stream)=>{
                            if(stream.indexOf("&ts_start=")>0){
                                stream = stream.substr(0, stream.indexOf("&ts_start="));
                            }
                            return stream;
                        });
                    }
                }
            }
        }
        return this.result;
    };

    this.timeout_giving = function(){
        console.error("[youku_fetch]解析超时");
        this.result.message = "[youku_fetch]解析超时";
        return this.result;
    }
}

module.exports = YouKuFecther;


