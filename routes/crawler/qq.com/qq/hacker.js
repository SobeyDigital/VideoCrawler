/**
 * 这一段，是从
 * https://vm.gtimg.cn/c/=/tencentvideo/txp/js/plugins/htmlframe.34fe86.js,v4hdplayer.36bc3c.js,uishadow.21e2d3*.js,v4hdadapter.38c893.js,uiposter.2c6723.js,v4h5report.b9dc08.js,v4hdplayerreport.e4c8e1.js,uiloading.d62b4c.js,uiloadingwithad.41b364.js,hdplayerhistory.abf97c.js,hlshelperp2p.5669e2.js,v4hdplayercontrol.3543b9.js,downloadmonitor.ec1208.js,v4uierror.44ffd3.js,uitips.974945.js,uicontrol.5fd215.js,uiprogress.a708cf.js,uinormalpoint.a34bab.js,v4uicontrolplay.a21f29.js,uiloopplay.a96e3c.js?max_age=604800&_ts=20171208
 * 这个地址的js中跟踪的到的。
 * 跟踪的逻辑是：因为发现了它要去获取每种质量的【proxyhttp】数据
 * 根据proxyhttp关键字，找到了它执行的js
 *
 * 进一步分析，它主要是调用了一个request地址的方法
 * 方法中最终使用的是 this.context.getinfo.requestGetinfo(d).done(xxx)
 *
 * 通过分析，得到了下面的核心代码段
 * 该核心代码端在chrome中通过runtime执行，能够发送proxyhttp请求
 *
 * 请求完成之后， e就是m3u8地址
 *
 * 因此，只需要修改defn参数，即可获取不同的m3u8
 */


window.Txplayer.dataset._instance.d44b675ee8208f6b8657e35e5c9c9faf._v4HdPlayerControl.context.getinfo.requestGetinfo({"charge":0,
    "defn":"hd",
    "dlver":2,
    "dtype":3,
    "fhdswitch":0,
    "isHLS":1,
    "show1080p":1,
    "spgzip":1,
    "sphls":2,
    "vid":"h0628oxv99z"}).done((e, g, h, i, j)=>{console.log("e:"+e);console.log("g:"+g);console.log("h:"+h);console.log("i:"+i);console.log("j:"+j);})