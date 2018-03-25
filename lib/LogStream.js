'use strict';

const split = require('split2');
const JSONparse = require('fast-json-parse')
const chalk = require('chalk')

const levels = {
  [60]: 'Fatal',
  [50]: 'Error',
  [40]: 'Warn',
  [30]: 'Info',
  [20]: 'Debug',
  [10]: 'Trace'
}
const colors = {
  [60]: 'magenta',
  [50]: 'red',
  [40]: 'yellow',
  [30]: 'blue',
  [20]: 'white',
  [10]: 'white'
}
function dateFormat(fmt) {
  var o = {
      "M+": this.getMonth() + 1, //月份 
      "d+": this.getDate(), //日 
      "h+": this.getHours(), //小时 
      "m+": this.getMinutes(), //分 
      "s+": this.getSeconds(), //秒 
      "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
      "S": this.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
  if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

class LogStream {
  constructor(opt) {
    opt = opt || {}
    const format = opt.format
    // const self = this;
    this.trans = split((data) => {
      this.log(data);
    });

    if (typeof format === 'function') {
      this.customFormat = format
    }
  }
  log(data) {
    data = this.jsonParse(data)
    const level = data.level
    data = this.format(data)
    console.log(chalk[colors[level]](data))
  }
  jsonParse(data) {
    return JSONparse(data).value;
  }
  format(data) {
    if (this.customFormat) {
      return this.customFormat(data)
    }
    const Level = levels[data.level];
    const DateTime = dateFormat.call(new Date(data.time), 'yyyy-MM-dd hh:mm:ss,S');
    const logid = data.reqId || '_logid_';
    let reqInfo = '[-]';
    if (data.req){
      reqInfo = `[${data.req.remoteAddress}/${data.req.method}-${data.req.url}]`
    }
    return `${Level} ${DateTime} ${logid} ${reqInfo}${data.msg}`;
    // return data;
  }
}

module.exports = LogStream;
