'use strict';
const path = require('path');
const fs = require('fs');
const multistream = require('pino-multi-stream').multistream;

const LogStream = require('./LogStream');
const FileStream = require('./FileStream');

function asReqValue(req) {
  if (req.raw) {
    req = req.raw;
  }
  let device_id, tt_webid;
  if (req.headers.cookie) {
    device_id = req.headers.cookie.match(/device_id=([^;&^\s]+)/);
    tt_webid = req.headers.cookie.match(/tt_webid=([^;&^\s]+)/);
  }
  device_id && (device_id = device_id[1]);
  tt_webid && (tt_webid = tt_webid[1]);
  return {
    id: req.id,
    method: req.method,
    url: req.url,
    remoteAddress: req.connection ? req.connection.remoteAddress : '',
    remotePort:  req.connection ? req.connection.remotePort : '',
    device_id,
    tt_webid
  };
};
function reqIdGenFactory () {
  var maxInt = 2147483647
  var nextReqId = 0
  return function genReqId (req) {
    return req.headers['X-TT-LOGID'] || req.headers['x-tt-logid'] || (nextReqId = (nextReqId + 1) & maxInt)
  }
}

module.exports = function(opt) {
  opt = opt || {};
  opt = Object.assign(
    {},
    // default option
    {
      console: !process.env.NODE_ENV || process.env.NODE_ENV === 'development', // 是否开启console.log 。。。
      level: 'debug',
      file: path.join(process.cwd(), 'logs/fastify.log'),
      genReqId: reqIdGenFactory(),
      serializers: {
        req: asReqValue
      },
      formatOpts: {
        lowres: true
      }
    },
    opt
  );

  const streams = [
    {
      stream: new FileStream(opt).trans
    }
  ];
  if (opt.console) {
    streams.push({
      stream: new LogStream().trans
    });
  }
  let allStreams = streams
  if (opt.streams && Object.prototype.toString.call(opt.streams) === '[object Array]') {
    allStreams = [...streams, ...opt.streams]
  }
  opt.stream = multistream(allStreams)
  
  return {
    opt,
    hook
  };
};

/**
 * 对于原有log做一次封装
 * @param {*} fastify 
 */
function hook(fastify) {
  fastify.addHook('preHandler', (request, reply, next) => {
    const oldLog = request.log
    request.log = new Proxy(oldLog, {
      get(target, key) {
        return function() {
          target[key](request.raw, ...arguments)
        }
      }
    })
    next()
  })
}