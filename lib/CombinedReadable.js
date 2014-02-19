// Copyright 2014 A Medium Corporation.

var util = require('util')
var Readable = require('stream').Readable

/**
 * Combines an array of readable streams and exposes them as a single
 * readable stream. Order is preserved.
 *
 * @constructor
 * @param {Array.<stream.Readable>} sources Readable streams to combine
 * @param {Object=} opts Stream options
 */
function CombinedReadable(sources, opts) {
  Readable.call(this, opts)

  this._sources = sources
  this._sources.forEach(function (stream) {
    stream.on('error', this.emit.bind(this, 'error'))
    stream.on('end', this._nextSource.bind(this))
  }.bind(this))

  this._nextSource()
}
util.inherits(CombinedReadable, Readable)
module.exports = CombinedReadable

/**
 * Begin sending data to consumers
 */
CombinedReadable.prototype._read = function () {
  this._currentSource.resume()
}

/**
 * Use the next source and pass its data to the consumer. If all
 * sources are ended, finish the stream.
 */
CombinedReadable.prototype._nextSource = function () {
  this._currentSource = this._sources.shift()
  if (! this._currentSource) {
    return this.push(null)
  }

  this._currentSource.on('data', function (chunk) {
    if (! this.push(chunk)) {
      this._currentSource.pause()
    }
  }.bind(this))
}
