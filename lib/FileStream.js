
'use strict'
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const assert = require('assert')

const LogStream = require('./LogStream')

const defaultOptions = {
  maxBufferLength: 4096, // 日志写入缓存队列最大长度
  flushInterval: 1000, // flush间隔
  logrotator: {
    byHour: true,
    byDay: false,    
    hourDelimiter: '_'
  }
}
class FileStream extends LogStream {
  constructor(options) {
    super(options)
    assert(options.file, 'should pass options.file')
    this.options = Object.assign({}, defaultOptions, options)
    this._stream = null
    this._timer = null
    this._bufSize = 0
    this._buf = []
    this.lastPlusName = this._getPlusName();
    this.reload()
    this._rotatTimer = this._createRotatInterval();
  }
  log(data) {
    data = this.jsonParse(data)
    if (data.msg === 'incoming request' || data.msg === 'request completed') {
      // 这个很烦人哦
      return
    }
    data = this.format(data)
    if (!data) {
      return
    }
    this._write(data + '\n')
  }
  /**
   * 重新载入日志文件
   */
  reload() {
    // 关闭原来的 stream
    this.close()
    // 新创建一个 stream
    this._stream = this._createStream()
    this._timer = this._createInterval()
  }
  reloadStream() {
    this._closeStream()
    this._stream = this._createStream()
  }
  /**
   * 关闭 stream
   */
  close() {
    this._closeInterval() // 关闭定时器
    if (this._buf && this._buf.length > 0) {
      // 写入剩余内容
      this.flush()
    }
    this._closeStream() //关闭流
  }

  /**
   * @deprecated
   */
  end() {
    console.log('transport.end() is deprecated, use transport.close()')
    this.close()
  }

  /**
   * 覆盖父类，写入内存
   * @param {Buffer} buf - 日志内容
   * @private
   */
  _write(buf) {
    this._bufSize += buf.length
    this._buf.push(buf)
    if (this._buf.length > this.options.maxBufferLength) {
      this.flush()
    }
  }

  /**
   * 创建一个 stream
   * @return {Stream} 返回一个 writeStream
   * @private
   */
  _createStream() {
    mkdirp.sync(path.dirname(this.options.file))
    const stream = fs.createWriteStream(this.options.file, { flags: 'a' })
    stream.on('error', onError)
    return stream
  }

  /**
   * 关闭 stream
   * @private
   */
  _closeStream() {
    if (this._stream) {
      this._stream.end()
      this._stream.removeListener('error', onError)
      this._stream = null
    }
  }

  /**
   * 将内存中的字符写入文件中
   */
  flush() {
    if (this._buf.length > 0) {
      this._stream.write(this._buf.join(''))
      this._buf = []
      this._bufSize = 0
    }
  }

  /**
   * 创建定时器，一定时间内写入文件
   * @return {Interval} 定时器
   * @private
   */
  _createInterval() {
    return setInterval(() => {
      this.flush()
    }, this.options.flushInterval)
  }
  /**
   * 关闭定时器
   * @private
   */
  _closeInterval() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  }

  /**
   * 分割定时器
   * @private
   */
  _createRotatInterval() {
    return setInterval(() => {
      this._checkRotat()
    }, 1000)
  }
  /**
   * 检测日志分割
   */
  _checkRotat() {
    let flag = false
    
    const plusName = this._getPlusName()
    if (plusName === this.lastPlusName) {
      return
    }
    this.lastPlusName = plusName;
    this.renameOrDelete(this.options.file, this.options.file + plusName)
      .then(() => {
        this.reloadStream()
      })
      .catch(e => {
        console.log(e)
        this.reloadStream()
      })
  }
  _getPlusName() {
    let plusName
    const date = new Date()
    if (this.options.logrotator.byHour) {
      plusName = `${date.getFullYear()}-${date.getMonth() +
        1}-${date.getDate()}${this.options.logrotator.hourDelimiter}${date.getHours()}`
    } else {
      plusName = `${date.getFullYear()}-${date.getMonth() +
        1}-${date.getDate()}`
    }
    return `.${plusName}`;
  }

  /**
   * 重命名文件
   * @param {*} srcPath 
   * @param {*} targetPath 
   */
  async renameOrDelete(srcPath, targetPath) {
    if (srcPath === targetPath) {
      return
    }
    const srcExists = await fileExists(srcPath);
    if (!srcExists) {
      return
    }
    const targetExists = await fileExists(targetPath)
    // if target file exists, then throw
    // because the target file always be renamed first.
    if (targetExists) {
      console.log(`targetFile ${targetPath} exists!!!`)
      return
    }
    await fileRename(srcPath, targetPath)
  }
}

function onError(err) {
  console.error(
    '%s ERROR %s [chair-logger:buffer_write_stream] %s: %s\n%s',
    new Date().toString(),
    process.pid,
    err.name,
    err.message,
    err.stack
  )
}

async function fileExists(srcPath) {
  return new Promise((resolve, reject) => {
    // 自运行返回Promise
    fs.stat(srcPath, (err, stats) => {
      if(!err && stats.isFile()) {
        resolve(true);
      } else {
        resolve(false);
      }
    })    
  })
}
async function fileRename(oldPath, newPath) { 
  return new Promise((resolve, reject) => {
    // 自运行返回Promise
    fs.rename(oldPath, newPath, (e) => {
      resolve(e ? false : true);
    })   
  })
}
module.exports = FileStream
