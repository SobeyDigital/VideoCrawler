/**
 * Created by WX on 2017/12/28.
 *
 */

/**
 * 1. 打开网页,在网页源码中找到 vid
 * 2. 请求  http://vv.video.qq.com/getinfo?otype=json&appver=3.2.19.333&platform=11&defnpayver=1&vid={vid}
 * 3. 请求结果中 fl->fi 就是码率   选择一个码率的 得到他的 id.  比如 高清;(480P)  码率id = 10212
 * 4. 请求结果中 vl-> vi -> ci  就是片段  得到他的keyid 比如 g0025r68php.10212.1
 * 5. 请求结果中 ul-> ui 就是播放服务器 hostname, 随便找一个快点的
 * 6. 请求 http://vv.video.qq.com/getkey?otype=json&platform=11&format={码率id}&vid={vid}&filename={keyid}.mp4&appver=3.2.19.333
 * 7. 请求结果中 key 保留下来
 * 6.拼接mp4路径: {hostname}/{keyid}.mp4?vkey={key}  即为MP4路径可直接下载
 *
 * 2018-04-13 wx 新的获取办法：
 * 1、首先监听到当前播放产生的【proxyhttp】请求
 * 2、通过proxyhttp的response，获取到里面的fi数组，就知道有哪些质量(label)
 * 3、通过chrome提供的Runtime，去执行一个js：参考./qq/hacker.js
 * 4、执行js结果就得到了不同的m3u8
 * 5、有了m3u8就ok了
 */
let m3u8builder = require("../prototype/public/m3u8builder");
const Fetcher = require("../prototype/fetcher");

TencentFecther.prototype = new Fetcher();
function TencentFecther(){
    this.result = {
        medias:{
        },
        ok: false
    };

    this.find_proxy_http = false;
    this.m3u8_array = void 0;
    // this.keyid = void 0; //用于匹配当前的TS流播放地址——qq的m3u8文件即使获取到了，它m3u8里面是相对路径。要取得http全路径会非常麻烦。
    // //这里偷个懒，用filename来引用第一次加载的TS文件名，以此来反解http路径。
    // this.cur_ts_url = void 0;
    // this.cur_ts_idx = void 0;

    this.fetch = async function(params){
        let requestUrl = params.url;
        logger.debug("[腾讯_fetch]"+requestUrl);
        //寻找所有的m3u8
        if(!this.find_proxy_http&&requestUrl.indexOf("/proxyhttp")>0) {
            logger.debug("!!!!!!!!!find_proxyhttp:" + requestUrl);
            let response = params.response.body;
            let obj = JSON.parse(response);
            if(obj.vinfo){
                this.find_proxy_http = true;
                obj = JSON.parse(obj.vinfo);
                let fi_array = obj.fl.fi; //fi记录了有哪些格式
                let vi = obj.vl.vi[0]; //vi记录了当前这个proxyhttp返回的对应清晰度的视频信息，包含m3u8,不过这里可以不使用
                //开始构造Runtime中执行的特殊js代码的参数 @see ./qq/hacker.js
                let params = fi_array.map((fi)=>{
                   return {label:fi.cname, queryparam:'{' +
                       '"charge":0,' +
                       '"defn":"'+fi.name+'",' +
                       '"dlver":2,' +
                       '"dtype":3,' +
                       '"fhdswitch":0,' +
                       '"isHLS":1,' +
                       '"show1080p":1,' +
                       '"spgzip":1,' +
                       '"sphls":2,' +
                       '"vid":"'+vi.vid+'"}'};
                });

                let script = this.build_script(params);
                let r = await this.ChromeRuntime.evaluate({
                    expression: script,
                    awaitPromise:true,
                    returnByValue:true
                });
                if(r&&r.exceptionDetails){
                    throw r.exceptionDetails.exception.description;
                }
                if(r&&r.result){
                    this.m3u8_array =  r.result.value;
                }

                let result = await new m3u8builder(this.m3u8_array).load().reduce((list)=>{
                    let temp = {};
                    list.forEach((m3u8item)=>{
                        //将形如 014_m0026q50tfq.321002.1.ts?index=14&start=141640&end=149200&brs=16058396&bre=16552835&ver=4
                        //的地址的前面部分（014_）去掉
                        m3u8item = m3u8item.substring(0, m3u8item.indexOf('?')).replace(/^\d{1,}_/,"");
                        if(!temp[m3u8item]){
                            temp[m3u8item] = m3u8item;
                        }
                    });
                    //将结果合并
                    let result = [];
                    for(let i in temp){
                        result.push(temp[i]);
                    }
                    return result;
                }).collect();
                if(result.length>0){
                    this.result.ok = true;
                    for(let x in result){
                        let label = result[x].label;
                        this.result.medias[label] = {m3u8:result[x].url};
                        this.result.medias[label].mixed = result[x].streamurls.map((streamurl)=>{
                            return result[x].url.substring(0, result[x].url.lastIndexOf("/")+1)+"00_"+streamurl+"?ver=4";
                        });
                    }
                }
            }
        }

        return this.result;
    };

    this.timeout_giving = function(){
        console.error("[腾讯_fetch]解析超时");
        this.result.message = "[腾讯_fetch]解析超时";
        return this.result;
    };

    this.build_script = function(params){
        let script =
            '(()=>{'+
                'let promises = [];'+
                'let instance = void 0;'+
                'for(let i in window.Txplayer.dataset._instance){'+
                    'instance = window.Txplayer.dataset._instance[i];'+
                    'break;'+
                '}';
         params.forEach((param)=>{
             script +=
                 'promises.push('+
                    'new Promise((rs, rj)=>{' +
                        'instance._v4HdPlayerControl.context.getinfo.requestGetinfo('+param.queryparam+')' +
                        '.done((m3u8,urlarray)=>{' +
                            'rs({url:m3u8, label:"'+param.label+'"});' +
                        '})' +
                    '})'+
                 ');'
         });
        script +=
                'return Promise.all(promises)' +
                    '.then((results)=>Promise.resolve(results))' +
                    '.catch((err)=>Promise.reject(err));'+
            '})()';
        return script;
    }
}


module.exports = TencentFecther;
