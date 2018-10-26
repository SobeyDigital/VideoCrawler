(()=>{
    return new Promise((rs,rj)=>{
        window.$(document.body).off('mousedown');
        window.$('#qheader_login').off('mousedown');
        window.$('#YT-ytaccount').off('mousedown');
        window.$('#YT-ytpassword').off('mousedown');
        window.$(document.body).mousedown((event)=>{
            event.pageX=null;
            event.clientX=50;
            window.tudouClickStat.send(event,{});
        });
        if(window.goldlog){
            window.$('#qheader_login').mousedown((event)=>{
                var t = window.goldlog;
                var spm = t.spm_ab.slice();
                spm.push('qheader_login','IMG');
                var s = spm.join('.');
                var i = '//gm.mmstat.com/yt/preclk.' + s;
                var a = {autosend: 1,pos_co: '#' + spm[2]+ '~' + spm[3],eventtype: event.type};
                t.sendPositionCode(i, a);
            });
            var spm = window.goldlog.spm_ab.slice();
            spm.push('qheader_login','0');
            var s = spm.join('.');
            $('#qheader_login').attr('data-spm-anchor-id', s);
        }
        $('#qheader_login').mousedown();
        $('#qheader_login').click();
        var $submit = $('#YT-nloginSubmit');
        while(!$submit){
            $submit = $('#YT-nloginSubmit');
        }
        setTimeout(()=>{rs(spm);},2000);
    }).then(()=>new Promise((rs,rj)=>{
        if(window.goldlog){
            var spm = window.goldlog.spm_ab.slice();
            spm.push('0','i1');
            var s = spm.join('.');
            $('#YT-ytaccount').attr('data-spm-anchor-id', s);
            window.$('#YT-ytaccount').mousedown((event)=>{
                var t = window.goldlog;
                var spm = t.spm_ab.slice();
                spm.push('YT-ytaccount','0');
                var s = spm.join('.');
                var i = '//gm.mmstat.com/yt/preclk.' + s;
                var a = {autosend: 1,pos_co: '#' + spm[2]+ '~' + spm[3],eventtype: event.type};
                t.sendPositionCode(i, a);
            });
        }
        setTimeout(()=>{
            $('#YT-ytaccount').mousedown();
            $('#YT-ytaccount').click();
            $('#YT-ytaccount').val('wangxishiwo1222@163.com');
            rs();
        },2000);
    })).then(()=>new Promise((rs,rj)=>{
        if(window.goldlog){
            var spm = window.goldlog.spm_ab.slice();
            spm.push('0','i2');
            var s = spm.join('.');
            $('#YT-ytpassword').attr('data-spm-anchor-id', s);
            window.$('#YT-ytpassword').mousedown((event)=>{
                var t = window.goldlog;
                var spm = t.spm_ab.slice();
                spm.push('YT-ytpassword','0');
                var s = spm.join('.');
                var i = '//gm.mmstat.com/yt/preclk.' + s;
                var a = {autosend: 1,pos_co: '#' + spm[2]+ '~' + spm[3],eventtype: event.type};
                t.sendPositionCode(i, a);
            });
        }
        setTimeout(()=>{
            $('#YT-ytpassword').mousedown();
            $('#YT-ytpassword').click();
            $('#YT-ytpassword').val('wx19831222');
            rs();},2000);
    })).then(()=>new Promise((rs,rj)=>{
        setTimeout(()=>{$('#YT-nloginSubmit').click();rs(true);}, 3000);
    }));
})();