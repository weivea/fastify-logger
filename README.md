# fastify-logger

## Install

```shell
bnpm install fastify-logger --save
```

## Usage

```javascript
// 
let logOpt = {
  console: process.env.NODE_ENV !== 'production', // 是否开启console.log 。。。
  level: 'debug',
  streams: [], // fastify-logger/lib/LogStream.js 的子类
  format: function(data) {}, // 自定义format
  genReqId: (function(){ // 请求id生成器
    var maxInt = 2147483647
    var nextReqId = 0
    return function(req) {  
      return nextReqId = (nextReqId + 1) & maxInt
    }
  })(),
  serializers: { // 需要的额外数据
    req: function(req) {
      return {
        method: req.xxx
      }
    }
  },
  file: path.join(process.cwd(), 'logs/fastify.log'), // 文件路径  
  maxBufferLength: 4096, // 日志写入缓存队列最大长度
  flushInterval: 1000, // flush间隔
  logrotator: { // 分割配置
    byHour: true,
    byDay: false,    
    hourDelimiter: '_'
  }
}

// 其实只需要配置一下 file字段, 因为线上环境，路径不同，不配置的话使用默认路径
logOpt = {
  file: '/path/to/log/lalala.log'
}

const {opt, hook} = require('fastify-logger')(logOpt);
const fastify = require('fastify')({
  logger: opt
})
hook(fastify);

// Declare a route
fastify.get('/', function(request, reply) {
  request.log.info('123412342234', 'wwwwwwwwwwwww', { as: 23 })
  reply.send({ hello: 'world' })
})
// Run the server!
fastify.listen(3000, '0.0.0.0', function(err) {
  if (err) throw err
  console.log(
    `server listening on http://${fastify.server.address().address}:${
      fastify.server.address().port
    }`
  )
})

```

## 扩展stream

customSteam.js
```javascript
const LogStream = require('fastify-logger/lib/LogStream')

class CustomStream extends LogStream {
  constructor(options) {
    super(options)
    // ...自己的逻辑代码
  }
  // 复写log方法
  log(data) {
    // 想怎么写就怎么写
  }
}

```