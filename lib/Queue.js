// Copyright 2013 The Obvious Corporation.

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

  this.threshold = threshold
  this.drainable = false
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
  this.callbacks = []
}

/**
 * Set whether or not the queue drains when it's full.
 * A drain event may be triggered immediately if the queue is full when
 * drainable is set to true.
 *
 * @param {Boolean} drainable Whether or not the queue should drain when it's full.
 */
S3Queue.prototype.setDrainable = function (drainable) {
  this.drainable = drainable
  this.drainIfNeeded()
}

/**
 * Returns true if and only if the queue has at least as much data
 * as the threshold level.
 *
 * @return {Boolean}
 */
S3Queue.prototype.full = function () {
  return this.size >= this.threshold
}

/**
 * Add a chunk and callback to the queue to be uploaded. Triggers a drain event
 * when the queue is full after the chunk is added. The callback is called immediately
 * except when both the queue is full and not drainable, as this is the case when
 * continued writes are known to continuously fill memory.
 *
 * @param {Buffer} chunk Data to add to the queue.
 * @param {Function} callback Function to be called now or later, depending on if new data will eat extra memory.
 */
S3Queue.prototype.push = function (chunk, callback) {
  this.chunks.push(chunk)
  this.size += chunk.length
  if (this.drainable || !this.full()) {
    setImmediate(callback)
  } else {
    this.callbacks.push(callback)
  }
  this.drainIfNeeded()
}

/**
 * Emit a drain event if the queue is full and drainable.
 */
S3Queue.prototype.drainIfNeeded = function () {
  if (!this.drainable || !this.full()) return

  var body = Buffer.concat(this.chunks, this.size)
  var callbacks = this.callbacks
  this.reset()
  this.emit('drain', body, callbacks)
}

