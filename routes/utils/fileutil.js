/**
 * Created by WX on 2017/9/27.
 */

const fs = require("fs");
const path = require("path");
var root_ = '';

module.exports={
    //递归创建目录 异步方法
    mkdirs: async function (dirname, callback, onErr) {
        let this_ = this;
        return new Promise((rs,rj)=>{
            fs.exists(dirname, (exists)=>{
                //如果目录存在，则执行后续处理
                if (exists) {
                    if(callback) callback(dirname);
                    else rs(dirname);
                } else {
                    //否则，创建该目录
                    let parent = path.dirname(dirname);
                    //如果父目录存在，则创建该目录，否则创建父目录
                    fs.exists(parent, (exists)=>{
                        if(exists){
                            fs.mkdir(dirname, (err)=>{
                                if(err&&err.code!=="EEXIST"){
                                    if(onErr) onErr(err);
                                    else rj(err);
                                    return;
                                }
                                if(callback) callback(dirname);
                                else rs(dirname);
                            });
                        }else{
                            this_.mkdirs(parent,
                                //父目录创建成功之后，创建本目录，然后执行callback
                                ()=>{
                                    fs.mkdir(dirname, (err)=>{
                                        if(err&&err.code!=="EEXIST"){
                                            if(onErr) onErr(err);
                                            else rj(err);
                                            return;
                                        }
                                        if(callback) callback(dirname);
                                        else rs(dirname);
                                    });
                                },
                                (err)=>{
                                    //如果父目录存在，则执行本目录创建，然后callback
                                    if(onErr) onErr(err);
                                    else rj(err);
                                }
                            );
                        }
                    });
                }
            });
        });
    },
    //获取项目根路径
    projectRoot: function(){
        if(root_!==''){
            return root_;
        }
        let dir = path.resolve(process.cwd(), "./");
        while(!fs.existsSync(dir+"/package.json")){
            dir = path.resolve(dir, "../");
        }
        root_ = dir;
        return root_;
    }
};