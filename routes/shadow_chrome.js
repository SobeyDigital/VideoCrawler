/**
 * Created by WX on 2017/12/29.
 *
 */

var path = require("path");
var CDI = require('chrome-remote-interface');

module.exports = {
    login : async function(loginer, callback) {
        if (!loginer.login_script) {
            if (callback) callback(null, true);
            return {err: null, result: true};
        }
        //打开一个新的标签
        //host: HTTP frontend host. Defaults to localhost;
        //port: HTTP frontend port. Defaults to 9222;
        //可以使用CDI.New({host:xxx,port:xx})来指定
        let target = await CDI.New({port: global.__config__.chrome.port});

        //使用CDI连接到该标签，然后使用当前client连接来操作
        let client;
        try{
            client = await CDI({target:target});
        }catch(err){
            console.error('Cannot connect to remote endpoint:', err);
            if(callback) callback(err, null);
            else throw err;
        }

        try{
            await client.Page.enable();
            await client.Runtime.enable();
            await client.Page.navigate({url: loginer.login_page});
        }catch(err){
            console.error(err);
            closeCDI(target);
            if(callback) callback(err, null);
            else throw err;
        }

        let time = 0;

        //判断当前网站是否已经登陆
        let login_r = false;
        let err = null;
        while(!login_r&&time<11) {
            if (loginer.login_check_script) {
                try {
                    let r = await client.Runtime.evaluate({
                        expression: "(()=>{"+loginer.login_check_script+"})()",
                        awaitPromise : true
                    });
                    if(r&&r.exceptionDetails){
                        err = {message:"登陆验证失败："+r.exceptionDetails.exception.description};
                        break;
                    }
                    if(r&&r.result&&r.result.type=='boolean'){
                        login_r = r.result.value;
                    }
                } catch (err) {
                    throw {message: loginer.login_page + "登陆验证出现错误:" + err};
                }
            }
            if (!login_r) {
                let script = await client.Runtime.compileScript({
                    expression: "(()=>{" + loginer.login_script + "})()",
                    sourceURL: "",
                    persistScript: true
                });
                if (script.exceptionDetails) {
                    let e = script.exceptionDetails.exception;
                    throw new Error("登陆脚本编译失败：" + e.description?e.description:e.message);
                }
                let r = await client.Runtime.runScript({scriptId: script.scriptId, awaitPromise: true});
                if(r.exceptionDetails){
                    let e = r.exceptionDetails.exception;
                    err = {message:"自动登陆失败("+(time+1)+"次),最后一次原因："+e.description?e.description:e.message};
                }
            }
            time++;
        }

        closeCDI(target);
        if(login_r){
            if(callback) callback(null, true);
            return {err:null, result:true};
        }else{
            if(callback) callback(null, false);
            return {err:err, result:false};
        }
    },

    capture : async function(url, fetcher, callback) {
        let time = new Date();
        if (!fetcher) {
            if (callback){
                callback({message: "没有传入fetcher", status: 500}, null);
                return;
            }
            else throw  {message: "没有传入fetcher", status: 500};
        }

        let closed = false;
        let target = await CDI.New({port: global.__config__.chrome.port});
        //使用CDI连接到该标签，然后使用当前client连接来操作
        let client;
        try {
            client = await CDI({target: target});
        } catch (err) {
            console.error('Cannot connect to remote endpoint:', err);
            if (callback){
                callback(err, null);
                return;
            }
            else throw err;
        }

        let deferred = new Deferred();
        try {
            await client.Page.enable();
            await client.Runtime.enable();
            fetcher.setChromeRuntime(client.Runtime);
            let reload_timestep = 30000;//30秒未加载出来，重新加载
            //如果不能直接获取，则通过Network监控获取。这里开启Network监控
            if (!fetcher.video_src || !fetcher.video_src.availible) {
                await client.Network.enable();
                let t = setInterval(()=>{
                    let waittime = new Date() - time;
                    if (waittime > 120000) {
                        //如果超过2分钟没有解析出结果，则看抓取是否是一个可用结果
                        //如果是可用结果，则返回
                        clearInterval(t);
                        let result = fetcher.timeout_giving();
                        if(!closed){
                            closed = true;
                            closeCDI(target);
                            if (callback) callback(null, result);
                            else deferred.resolve(result);
                            return;
                        }
                    }
                    if(waittime>reload_timestep){
                        try{
                            client.Page.reload().then(()=>{
                                reload_timestep+=reload_timestep;
                            }).catch((err)=>{
                                clearInterval(t);
                                if(!closed){
                                    closed = true;
                                    closeCDI(target);
                                }
                                if (callback) callback(err, null);
                                else deferred.reject(err);
                            });
                        }catch(err){
                            clearInterval(t);
                        }
                    }
                }, 1000);

                let mem_cachce = target.mem_cachce = {};
                client.Network.requestWillBeSent(async (req) => {
                    let requestUrl = req.request.url;
                    let requestId = req.requestId;
                    mem_cachce[requestId] = {};
                    mem_cachce[requestId].url = requestUrl;
                    // mem_cachce[requestId].requestId = requestId;
                });
                client.Network.loadingFinished(async (resp)=>{
                    try {
                        //抓取网页的视频地址特征
                        mem_cachce[resp.requestId].response = await client.Network.getResponseBody({requestId:resp.requestId});
                        let result = await fetcher.fetch(mem_cachce[resp.requestId]);
                        delete mem_cachce[resp.requestId];
                        if (result.ok === true) {
                            clearInterval(t);
                            //关闭标签。API中描述的是标准json参数，因此id加了引号。如果用bson，可能出错
                            if(!closed){
                                closed = true;
                                closeCDI(target);
                                if (callback) callback(null, result);
                                else deferred.resolve(result);
                            }
                        }
                    } catch (err) {
                        if(err.toString().indexOf("with given identifier")>0){
                            logger.debug("【可忽略】"+err);
                        }else{
                            clearInterval(t);
                            if(!closed){
                                closed = true;
                                closeCDI(target);
                                if (callback) callback(err, null);
                                else deferred.reject(err);
                            }
                        }
                    }
                });
                //导航到页面
                await client.Page.navigate({url: url});
            } else {
                reload_timestep = 10000; //这种情况改为10秒重新刷新
                await client.Page.navigate({url: url});
                //解析计时器
                let t2 = setInterval(async ()=>{
                    let waittime = new Date() - time;
                    if (waittime > 120000) {
                        clearInterval(t2);
                        if(!closed){
                            closed = true;
                            closeCDI(target);
                            if (callback)  callback({message: "分析video标签超时"}, null);
                            else deferred.reject({message: "分析video标签超时"});
                        }
                        return;
                    }
                    if(waittime>reload_timestep){
                        try{
                            client.Page.reload().then(()=>{
                                reload_timestep+=reload_timestep;
                            }).catch((err)=>{
                                clearInterval(t2);
                                if(!closed){
                                    closed = true;
                                    closeCDI(target);
                                    if (callback) callback(err, null);
                                    else deferred.reject(err);
                                }
                            });
                        }catch(err){
                            if(!closed){
                                closed = true;
                                closeCDI(target);
                                if (callback) callback(err, null);
                                else deferred.reject(err);
                            }
                            clearInterval(t2);
                        }
                    }

                    let r = await client.Runtime.evaluate({
                        expression: "(()=>{let s = document.querySelector('"+fetcher.video_src.video_query+"'); return s.attributes.getNamedItem('src').value;})();",
                        awaitPromise : true
                    });
                    if(r&&r.result&&!r.exceptionDetails){
                        let src =  r.result.value;
                        if(src.indexOf&&src.indexOf("http://")<0){
                            src = path.join("http://", src);
                            src = src.replace(/\\/g, "/");
                            src = src.replace(/http:\//g, "http://");
                        }
                        setImmediate(()=> {
                            clearInterval(t2);
                            if(!closed){
                                closed = true;
                                closeCDI(target);
                            }
                        }, 100);
                        logger.debug("!!!!!!!!!find:" + src);
                        let result = {
                            medias:{
                                Video:{
                                    mixed:[src]
                                }
                            }
                        };
                        if (callback) callback(null, result);
                        else deferred.resolve(result);
                    }
                }, 1000);
            }
        } catch (err) {
            console.error(err);
            if(!closed){
                closed = true;
                closeCDI(target);
            }
            if (callback) callback(err, null);
            else deferred.reject(err);
        }
        return deferred.promise;
    }
};

function closeCDI(target){
    target.mem_cachce = void 0;
    delete target.mem_cachce;
    CDI.Close({"port": global.__config__.chrome.port,"id": target.id}, function (err) {
        if (err) {
            logger.debug('err closing..'+err);
        }
    });
}