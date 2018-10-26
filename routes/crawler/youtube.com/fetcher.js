/**
 * Created by WX on 2017/12/28.
 *
 */

var Fetcher = require("../prototype/fetcher");

Youtube.prototype = new Fetcher();
function Youtube(){
    this.result = {
        medias:{
        },
        ok: false,
        need_proxy:true
    };
    var this_ = this;

    this.fetch = function(params){
        let requestUrl = params.url;
        logger.debug("[youtube_fetch]"+requestUrl);
        if(requestUrl.indexOf("&mime=video")>0){
            logger.debug("!!!!!!!!!!![videofetch]"+requestUrl);
            requestUrl = requestUrl.substr(0, requestUrl.indexOf("&range="));

            if(!this_.result.medias.demo){
                this_.result.medias.demo = {};
            }
            this_.result.medias.demo.videos = [requestUrl];
        }
        if(requestUrl.indexOf("&mime=audio")>0){
            logger.debug("!!!!!!!!!!![audiofetch]"+requestUrl);
            requestUrl = requestUrl.substr(0, requestUrl.indexOf("&range="));

            if(!this_.result.medias.demo){
                this_.result.medias.demo = {};
            }
            this_.result.medias.demo.audios = [requestUrl];
        }
        if(this_.result.medias.demo&&this_.result.medias.demo.videos
            &&this_.result.medias.demo.audios){
            this_.result.ok = true;
        }
        return Promise.resolve(this_.result);
    };

    this.timeout_giving = function(){
        console.error("[youtube_fetch]解析超时");
        return this_.result;
    }
}

module.exports = Youtube;