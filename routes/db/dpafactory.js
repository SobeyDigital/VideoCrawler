/**
 * Created by WX on 2018/5/28.
 *
 */


require("../utils/config_init");
const dpa = require("./dpa");

const dpas = {default:new dpa()};

module.exports = (function(){
    if(global.__config__&&__config__.datasource){
        let ds = __config__.datasource;
        if(!dpas[ds]){
            let constructor = require("./"+ds.toLowerCase()+"_dpa");
            dpas[ds] = new constructor();
        }

        return dpas[ds]||dpas["default"];
    }
})();