/**
 * Created by WX on 2018/1/22.
 *
 */
var Loginer = require("../prototype/loginer");

YoukuLoginer.prototype = new Loginer();
function YoukuLoginer(){
    this.login_page = "http://www.youku.com";

    this.login_check_script =
        //通过脚本判断是否有登陆之后的几个session
        "return new Promise((rs,rj)=>{" +
        "let cookies = document.cookie;"+
        "cookies = cookies.split(';');"+
        "let P_gck = null, P_j_scl=null;"+
        "cookies.forEach((cookie)=>{" +
        "if(cookie.indexOf('P_gck')>-1){" +
        "P_gck=true;"+
        "}"+
        "if(cookie.indexOf('P_j_scl')>-1){"+
        "P_j_scl=true;"+
        "}"+
        "});"+
        "if(P_gck&&P_j_scl) return rs(true);"+
        "return rs(false);"+
        "});";

    this.login_script =
        "return new Promise((rs,rj)=>{" +
            //经过对页面的分析，优酷使用了大量的重构闭包，把window对象封装了
            //他能达到一个效果：只要不是人去点击按钮，单纯使用js来出发点击事件的话，他会判断此为机器人。
            //在登陆提交的时候，会让你输入验证码
            //原因是：他封装了mousedown这个事件，重写了click事件
            //mousedown事件，会发送两个gm.mmstat.com请求。
            //以此事件作为是否是机器人操作的依据
            //经过人工调试发现了两个请求的发送核心代码
            //因此，这里可以模拟它的mousedown事件

            //补充：在console中执行，由于上下文和页面其实并不是一个上下文，通过js触发的mousedown事件，并不会被优酷的代码包装（除非你自己在console中加载它所有的js文件和代码）
            //因此，这里其实是用了他包装后的window对象的方法来做的.
            //1.发送第一个事件
        "window.$(document.body).off('mousedown');"+
        "window.$('#qheader_login').off('mousedown');"+
        "window.$('#YT-ytaccount').off('mousedown');"+
        "window.$('#YT-ytpassword').off('mousedown');"+
        "window.$(document.body).mousedown((event)=>{"+
        "event.pageX=null;"+
        "event.clientX=50;"+
        "window.tudouClickStat.send(event,{});"+
        "});"+
            //2.发送第二个事件
        "if(window.goldlog){"+
        "window.$('#qheader_login').mousedown((event)=>{"+
        "var t = window.goldlog;"+
        "var spm = t.spm_ab.slice();"+
        "spm.push('qheader_login','IMG');"+
        "var s = spm.join('.');"+
        "var i = '//gm.mmstat.com/yt/preclk.' + s;"+
        "var a = {autosend: 1,pos_co: '#' + spm[2]+ '~' + spm[3],eventtype: event.type};"+
        "t.sendPositionCode(i, a);"+
        "});" +
            //为模拟点击的按钮增加回调id
        "var spm = window.goldlog.spm_ab.slice();"+
        "spm.push('qheader_login','0');"+
        "var s = spm.join('.');"+
        "$('#qheader_login').attr('data-spm-anchor-id', s);"+
        "}"+
            //模拟人去点击登陆按钮
        "$('#qheader_login').mousedown();"+ //这个用于触发mousedown事件
        "$('#qheader_login').click();"+
            //等待弹出登陆框
        "var $submit = $('#YT-nloginSubmit');"+
        "while(!$submit){" +
        "$submit = $('#YT-nloginSubmit');"+
        "}"+
            //等待3秒，等待页面加载
        "setTimeout(()=>{rs(spm);},2000);"+
        "}).then(()=>new Promise((rs,rj)=>{" +
        "if(window.goldlog){"+
            //为模拟点击的按钮增加回调id
        "var spm = window.goldlog.spm_ab.slice();"+
        "spm.push('0','i1');"+
        "var s = spm.join('.');"+
        "$('#YT-ytaccount').attr('data-spm-anchor-id', s);"+
            //添加mousdwdown事件
        "window.$('#YT-ytaccount').mousedown((event)=>{"+
        "var t = window.goldlog;"+
        "var spm = t.spm_ab.slice();"+
        "spm.push('YT-ytaccount','0');"+
        "var s = spm.join('.');"+
        "var i = '//gm.mmstat.com/yt/preclk.' + s;"+
        "var a = {autosend: 1,pos_co: '#' + spm[2]+ '~' + spm[3],eventtype: event.type};"+
        "t.sendPositionCode(i, a);"+
        "});"+
        "}"+
            //使用1.5秒钟输入用户名
        "setTimeout(()=>{" +
        "$('#YT-ytaccount').mousedown();"+
        "$('#YT-ytaccount').click();"+
        "$('#YT-ytaccount').val('wangxishiwo1222@163.com');"+
        "rs();"+
        "},2000);"+
        "})).then(()=>new Promise((rs,rj)=>{" +
        "if(window.goldlog){"+
            //为模拟点击的按钮增加回调id
        "var spm = window.goldlog.spm_ab.slice();"+
        "spm.push('0','i2');"+
        "var s = spm.join('.');"+
        "$('#YT-ytpassword').attr('data-spm-anchor-id', s);"+
            //添加mousdwdown事件
        "window.$('#YT-ytpassword').mousedown((event)=>{"+
        "var t = window.goldlog;"+
        "var spm = t.spm_ab.slice();"+
        "spm.push('YT-ytpassword','0');"+
        "var s = spm.join('.');"+
        "var i = '//gm.mmstat.com/yt/preclk.' + s;"+
        "var a = {autosend: 1,pos_co: '#' + spm[2]+ '~' + spm[3],eventtype: event.type};"+
        "t.sendPositionCode(i, a);"+
        "});"+
        "}"+
            //使用1.5秒钟输入密码
        "setTimeout(()=>{" +
            //模拟人去点击密码框
        "$('#YT-ytpassword').mousedown();"+
        "$('#YT-ytpassword').click();"+
        "$('#YT-ytpassword').val('wx19831222');"+
        "rs();"+
        "},2000);"+
        "})).then(()=>new Promise((rs,rj)=>{" +
        "setTimeout(()=>{" +
            //点击登陆按钮
        "$('#YT-nloginSubmit').click();"+
        "rs(true);"+
        "}, 3000);"+
        "}));";

    //this.login_with_runtime = function(chromeRuntime){
    //
    //};
}

module.exports = YoukuLoginer;