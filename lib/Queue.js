// Copyright 2014 A Medium Corporation.

var util = require('util')
var EventEmitter = require('events').EventEmitter

/**
 * Buffers multi-part uploads to S3. Used by S3Stream.
 * Inherits from events.EventEmitter.
 *
 * @constructor
 * @param {Number=} threshold Minimum size chunks to send to S3, must be at least 5 mb.
 */
function S3Queue(threshold) {
  EventEmitter.call(this)

  this._threshold = threshold
  this.reset()
}
util.inherits(S3Queue, EventEmitter)
module.exports = S3Queue

/**
 * Reset the queue's internal chunk storage. Emits a 'reset' event.
 */
S3Queue.prototype.reset = function () {
  this.emit('reset')
  this.chunks = []
  this.size = 0
}

/**
 * Get the queue's threshold and enforce a minimum of 5 mb. AWS' minimum
 * size for S3 partial uploads is 5mb, except for the last part, which can
 * be whatever size is remaining.
 *
 * @return {Number} Threshold in bytes.
 */
S3Queue.prototype.threshold = function () {
  return Math.max(this._threshold || 0, 5 * 1024 * 1024)
}

/**
 * Determine whether the queue is full, based on its threshold.
 *
 * @return {Boolean} True if the queue is full.
 */
S3Queue.prototype.full = function () {
  return this.size >= this.threshold()
}

/**
 * Add a chunk to the queue to be uploaded. Triggers Queue.drain()
 * when the queue is full after the chunk is added. Emits a 'push'
 * event.
 *
 * @param {Buffer} chunk Data to add to the queue.
 */
S3Queue.prototype.push = function (chunk) {
  this.chunks.push(chunk)
  this.size += chunk.length
  if (this.full()) this.drain()

  this.emit('push', chunk)
}

/**
 * Drain the data currently in the queue. Emits a 'drain' event
 * with the data as a Buffer.
 */
S3Queue.prototype.drain = function () {
  var body = Buffer.concat(this.chunks, this.size)
  this.reset()

  this.emit('drain', body)
}
