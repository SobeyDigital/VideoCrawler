/**
 * Created by WX on 2018/2/2.
 *
 */



function Loginer(){
}

/**
 * string
 * 表示登陆所用的页面地址
 */
Loginer.prototype.login_page = void 0;

/**
 * string
 * 一段js脚本，该脚本用于检查当前网站是否登陆
 */
Loginer.prototype.login_check_script = void 0;

/**
 * string
 * 一段js脚本，该脚本用于登陆
 */
Loginer.prototype.login_script = void 0;


module.exports = Loginer;