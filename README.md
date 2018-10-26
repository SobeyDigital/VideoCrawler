# VideoCrawler
A web video crawler framework powered by Chrome and Nodejs

# What's this

This is a framework that allows you to "Crawl" videos from WebSites, ex. Youku, Youtube, iQiyi or any you want.

# How it works

It use Chrome(Chromium)'s CDI (chrome-debug-interface) as an engine, control Chrome 
1. open a page that contains the video stream (or audio)
2. load the website
3. capture callback infomations from CDI
4. resolve the video (may be a MPD or HLS) url
5. get the real stream
6. as you wish

# Try it 

1、 you must have a Chrome
2、 copy this project
3、edit the "\_\_config\_\_.json" (see [Config](#config))
```
"port":3000, //app's web port
"chrome":{
    "home":"/Chrome"   //your chrome home
}
```
4、 run as node
```
node bin\app.js
```
or
```
npm start
```

now it works

you can access http://localhost:3000/demo or http://localhost:3000/api

have fun

if you want to extend or write your own crawler, see [Extend](#extend) 

# App Parameters

When you run as node , there are two optional args

1. `--debug` : show sql's (if use db to manage task), and more logs
2. `--config=`**&lt;filename&gt;** : custom "\_\_config\_\_.json" path

# <span id='config'>Config</span>

```
{
    /* 支持行级注释。必须用星号注释 */
    /*ProcessName                                      [Required]*/
    "appname":"videocrawl",
    /*App's port                                       [Optional, default 3000]*/
    "port":3000,
    /*Chrome's Config                                  [Required]*/
    "chrome":{
        /*Chrome's home                                [Required]*/
        "home":"/Chrome",
        /*use Chrome's headless mode                   [Optional]*/
        "headless":false
        /*Chrome's CDI port                            [Optional, default 3000]*/
        /*port:9222*/
        /*Chrome's data dir                            [Optional]*/
        /*"data_dir":""*/
    },
    /*use file to log infomation                       [Optional, default false]*/
    "usefilelog": false,
    /*if present,use a datasource to manage tasks      [Optional, default 3000]*/
    /*"datasource":"MYSQL",*/
    /*if use datasource, use this to control task's concurrency      [Optional]*/
    "fetch_max_num":1,
    /*multi_process_mode                                             [Optional]*/
    /*"multi_process_count": 8 */
    /*if use multi_process_mode, high-available with zk              [Optional]*/
    "cluster":{
        "zk":"127.0.0.1:2181"
    },
    /*if use datasource, the mysql datasource's config               [Optional]*/
    "MYSQL":{
        "host":"127.0.0.1",
        "user":"admin",
        "password":"root",
        "connectionLimit":100,
        "database" : "sobey_videocrawl"
    }
}
```

## Use Mysql As Task Manager

if you config mysql as task manager, you should first execute the sql in
```{project}/bin/mysql_db.sql```


# <span id='extend'>Extend</span>

## Extend Crawler

**1、 File Path Criterion**

your must have your crawler's code file named 
`fetcher.js` that is your crawler's code 
and
`loginer.js` that is your loginer's code if you need to sign in 

all these files must in the path:
`{project}/routes/crawler/{domain}/`

the **domain** is the domain that the target url's domain.
for example: 
if the url is "http://v.youku.com/v_show/id_XMzg4NzMyMzU1Ng==.html?spm=a2hww.11359951.m_41944.5~5!2~5~5~5!2~5~1!2~3~A"
the **domain** should be "**youku.com**".
and the path looks like:

project
&nbsp;&nbsp;|___routes
&nbsp;&nbsp;&nbsp;&nbsp;|___crawler
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|___youku.com
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|___loginer.js
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|___fecther.js

**2、 Fetcher & Loginer**

**Fetcher** is the code to crawl video's real url

A Fecther must extends `const Fetcher = require("../prototype/fetcher");`

**Loginer** is the code to sign in if you wish to

A Loginer must extends `const Loginer = require("../prototype/loginer")`;

the details of these code you could see those implementations.

# About login

login simulation is very difficult now. So you should use any tech that you could use.
