启动方式：--debug --config=.\__config__.json



注意

一、目录问题

在开发的时候，如果需要使用一些自定义的目录，比如 "项目当前目录下的logs目录"
一定要使用 path.join(procsss.cwd(), "./logs/")这种方式。
重点是要使用procsss.cwd()。
因为了用pkg打包，https://github.com/zeit/pkg中有对目录的要求说明
