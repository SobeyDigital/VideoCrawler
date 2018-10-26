/**
 * Created by WX on 2018/02/02.
 *
 */

var Fetcher = require("../prototype/fetcher");

Weibo.prototype = new Fetcher();
function Weibo(){
    //dom是否可以直接得到地址
    this.video_src = {
        availible: true, //是否可用
        video_query : "video"//video标签的css查询脚本
    };
}

module.exports = Weibo;