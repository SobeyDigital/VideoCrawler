/**
 * Created by WX on 2018/4/16.
 *
 */
let su = require("superagent");

module.exports = function (m3u8url_with_label){
    let promise = Promise.resolve(m3u8url_with_label);

    this.load = function(){
        promise = promise.then((m3u8url_with_label)=>new Promise(async (rs, rj)=>{
            let m3u8_with_label = [];
            for(let i in m3u8url_with_label) {
                //使用for循环，避免闭包，因为要在当前闭包await
                try {
                    let su_resp = await su.get(m3u8url_with_label[i].url).buffer();//通过buffer将stream读取到内存
                    if (su_resp.text) {
                        let obj = {url:m3u8url_with_label[i].url, label:m3u8url_with_label[i].label};
                        //读取m3u8
                        let info_array = su_resp.text.split("\n");
                        let result = [];
                        info_array.forEach((address)=>{
                            address = address.trim();
                            if(address.indexOf("#")<0&&address!==""){
                                result.push(address);
                            }
                        });

                        if(result.length>0){
                            obj.m3u8 = result;
                            m3u8_with_label.push(obj);
                        }
                    }
                }catch(err){
                    console.log("【可以忽略】fecther获取"+m3u8url_with_label[i].url+"中的数据出现错误："+err.toString());
                }
            }
            rs(m3u8_with_label);
        }));
        return new Reducer(promise);
    };

    //将m3u8描述的分段地址，按照多个独立的整段ts地址。
    function Reducer(promise){
        let promise_ = promise;
        this.reduce = function(reducer){
            promise_ = promise_.then((m3u8_with_label)=>new Promise((rs, rj)=>{
                try{
                    let reducer_ = reducer?reducer:function(m3u8_ts_list){
                        let map = {}; //用于存放整段ts地址
                        m3u8_ts_list.forEach((ts)=>{
                            let key = ts.substring(0, ts.indexOf("?"));
                            if(!map[key]){
                                map[key] = ts;
                            }
                        });
                        let result = [];
                        for(let i in map){
                            result.push(map[i]);
                        }
                        return result;
                    };
                    //reduce返回的是label+整段地址集合
                    let temp = m3u8_with_label.map((obj)=>{
                        let streamurls = reducer_(obj.m3u8);
                        if(streamurls&&!Array.isArray(streamurls)){
                            rj("load之后的reduce方法，其回调函数必须返回数组");
                            return void 0;
                        }
                        return {url:obj.url, label:obj.label, streamurls:streamurls};
                    });
                    rs(temp);
                }catch(err){
                    rj(err);
                }
            }));
            return new Collect(promise_);
        }
    }

    function Collect(promise){
        let promise_ = promise;
        this.collect = function(callback){
            if(callback){
                promise_.then((streams_with_label)=>{
                    callback(null, streams_with_label);
                }).catch((err)=>{
                    callback(err, null);
                })
            }else{
                return promise_;
            }
        }
    }
};

// {
//     buildResultWithM3U8 : async function(m3u8_with_label, handleAddress){
//         let result = {medias:{}, ok:false};
//         let atleast_one = false;
//         for(let i in m3u8_with_label){
//             //使用for循环，避免闭包，因为要在当前闭包await
//             try{
//                 let su_resp = await su.get(m3u8_with_label[i].url).buffer();//通过buffer将stream读取到内存
//                 if(su_resp.text){
//                     //构造当前标签的对象
//                     result.medias[m3u8_with_label[i].label] = {};
//                     //读取m3u8
//                     let info_array = su_resp.text.split("\n");
//                     let map = {};
//                     //reduce
//                     info_array.forEach((address)=>{
//                         address = address.trim();
//                         let key = address.substring(0, address.indexOf("?"));
//                         if(!map[key]){
//                             map[key] = address;
//                         }
//                     });
//
//                     //将结果写入mixed数组
//                     for(let x in map){
//                         let address = map[x];
//                         if(!result.medias[m3u8_with_label[i].label].mixed){
//                             result.medias[m3u8_with_label[i].label].mixed = [];
//                         }
//                         if(handleAddress){
//                             address = handleAddress(address);
//                         }
//                         result.medias[m3u8_with_label[i].label].mixed.push(address);
//                     }
//                     //表示找到了
//                     atleast_one = true;
//                 }else{
//                     result.medias[m3u8_with_label[i].label] = [];
//                 }
//             }catch(err){
//                 console.log("【可以忽略】fecther获取"+m3u8_with_label[i].url+"中的数据出现错误："+err.toString());
//             }
//         }
//
//         if(atleast_one){
//             result.ok = true;
//         }
//         return result;
//     }
// };