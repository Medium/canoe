var util = require('util');
var EventEmitter = require('events').EventEmitter;

// ## S3Queue
// *Inherits `events.EventEmitter`*
//
// Buffer multi-part uploads to S3. Used by `S3Stream`.
//
var S3Queue = module.exports = function(threshold) {
  EventEmitter.call(this);

  this._threshold = threshold;
  this.reset();
};
util.inherits(S3Queue, EventEmitter);

// ### Reset
//
// Empty the queue's buffer
S3Queue.prototype.reset = function() {
  this.emit('reset');
  this.buffer = new Buffer(0);
};

// ### Threshold
//
// Return the queue's threshold
S3Queue.prototype.threshold = function() {
  return Math.max(this._threshold || 0, 5 * 1024 * 1024);
};

// ### Full
//
// Determine whether the queue is full, based on `threshold`. AWS' minimum
// size for S3 partial uploads is 5 mb, except for the last part, which can
// be whatever size is remaining.
S3Queue.prototype.full = function() {
  return this.buffer.length >= this.threshold();
};

// ### Push
//
// Add a chunk to the queue to be uploaded. `Queue.drain()` will
// be triggered when the queue is full.
S3Queue.prototype.push = function(chunk) {
  this.buffer = Buffer.concat([this.buffer, chunk]);
  if (this.full()) this.drain();

  this.emit('push', chunk);
};

// ### Drain
//
// Drain the items currently in the queue. Emits a `drain` event.
S3Queue.prototype.drain = function() {
  var body = this.buffer;
  this.reset();

  this.emit('drain', body);
};
