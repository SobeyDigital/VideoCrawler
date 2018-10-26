/**
 * Created by WX on 2018/2/2.
 *
 */

function Fetcher(){
    this.ChromeRuntime = void 0;
    this.setChromeRuntime = function(runtime){
        this.ChromeRuntime = runtime;
    }
}
/**
 * Object
 * 表示当前抓取器所抓取的视频是否可以直接从video标签获取
 */
Fetcher.prototype.video_src = {
    availible: false, //是否可用
    video_query : "video"//video标签的css查询脚本
};

/**
 * 从chrome给出的network请求参数监控数据中获取视频地址
 * 如果该站点抓取的是音视频合一的文件，则将地址写入｛mixed｝
 * 否则，按照｛video｝和｛audio｝分别写入
 *
 * media的结构，是一个标签对象列表
 * 其中标签指的是一组媒体的索引，比如高清、标清，或者1080、720等等
 *
 * ｛ok｝必须显示指定为true或false，表示抓取成功与否
 * @param params Chrome给出的Network监控请求对象
 *      {
 *         url:"url",
 *         response:{
 *              body:"string",
 *              base64Encoded:true:false
 *         }
 *      }
 * @param callback 【异步】回调函数
 * @return {} Promise.resolve();
 *
 * ！！！注意！！！
 * fectch方法一定必须是一个异步方法。它必须采用callback回调，或返回一个具有最终结果的Promise
 */
//或者，可以使用
//Fetcher.prototype.fetch = function(params, callback){
//    return Promise.resolve(result);
//};
//来声明
Fetcher.prototype.fetch = async function(params, callback){
    let result = {
        medias:{
            标签:{
                m3u8:void 0,
                videos:[],
                audios:[],
                mixed:[]
            }
        },
        ok: false
    };
    if(callback){
        callback(result);
    }
    return result;
};

/**
 * Function
 *
 * 因为有些网站是音视频分离的，也许只有视频
 * 这个方法用于表达在解析超时之后，是否返回一个正确的结果
 *
 * @returns {{mixed: null, video: null, audio: null, ok: boolean}}
 */
Fetcher.prototype.timeout_giving = void 0;

module.exports = Fetcher;