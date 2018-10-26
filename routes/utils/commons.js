let util = {
  isWindows () {
    return /^win/.test(process.platform);
  },
    isLinux(){
       return /^linux/.test(process.platform);
    }
};
module.exports = util;