// Copyright 2014 A Medium Corporation.

var util = require('util')
var PassThrough = require('stream').PassThrough

/**
 * Combines an array of readable streams and exposes them as a single
 * readable stream. Order is preserved.
 *
 * @constructor
 * @param {Array.<stream.Readable>} sources Readable streams to combine
 * @param {Object=} opts Stream options
 */
function CombinedReadable(sources, opts) {
  PassThrough.call(this, opts)

  this._sources = sources
  this._nextSource()
}
util.inherits(CombinedReadable, PassThrough)
module.exports = CombinedReadable

/**
 * Use the next source and pass its data to the consumer. If all
 * sources are ended, finish the stream.
 */
CombinedReadable.prototype._nextSource = function () {
  var nextSource = this._sources.shift()
  if (! nextSource) {
    return this.push(null)
  }

  nextSource
    .on('error', this.emit.bind(this, 'error'))
    .on('end', this._nextSource.bind(this))
    .pipe(this, {end: false})
}
