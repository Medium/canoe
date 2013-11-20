// Copyright 2013 The Obvious Corporation.

var util = require('util')
var Writable = require('stream').Writable
var S3Queue = require('./Queue')

var MIN_UPLOAD = 5 * 1024 * 1024

/**
 * Writable stream interface for S3. Inherits stream.Writable
 *
 * @constructor
 * @param {Object} params Same params object as AWS.S3.createMultipartUpload
 * @param {String} params.Bucket The S3 bucket your file will go in.
 * @param {String} params.Key The full path to the object on S3, within its bucket.
 * @param {Object} s3 Authenticated instance of AWS.S3
 */
function S3Stream(params, s3) {
  // Initialize the parent stream class
  Writable.call(this)

  // Cache inputs
  this.params = params
  this.s3 = s3
  this.uploadFn = this.upload.bind(this)

  // Set the stream's initial state, create a queue, and bind event listeners
  this.init()
}
util.inherits(S3Stream, Writable)
module.exports = S3Stream

/**
 * Initialize the instance with default values and listeners
 */
S3Stream.prototype.init = function () {
  // Setup the stream's initial state and limits
  this.uploadPartNumber = 0
  this.uploadedParts = []
  this.activeUploads = 0
  this.maxActiveUploads = 1
  this.finishHasBeenCalled = false

  // Setup a queue instance
  this.setupQueue()

  // Bind internal listners
  this.setupEvents()
}

/**
 * Setup an instance of S3Queue and binds the stream's upload()
 * method to the queue's 'drain' event.
 */
S3Stream.prototype.setupQueue = function () {
  this.queue = new S3Queue(MIN_UPLOAD)
  this.queue.on('drain', this.uploadFn)
}

/**
 * Set the minimum size (in bytes) to upload in a non-final part.
 * The theshold is set to 5mb if the given amount is smaller.
 *
 * @param {Number} bytes Minimum upload size.
 */
S3Stream.prototype.setThreshold = function (bytes) {
  this.queue.threshold = Math.max(bytes, MIN_UPLOAD)
  return this
}

/**
 * Bind internal events.
 *
 * Helps methods act more independently and keeps most communication
 * in events instead of nested calls.
 */
S3Stream.prototype.setupEvents = function () {
  var _this = this

  // By default, abort the upload on any error. Unbind this event with:
  // `s3stream.removeListener('error', s3stream.abort)`
  this.on('error', this.abort.bind(this))

  // The queue will not emit any drain events before our writable event.
  this.on('writable', function () { _this.queue.setDrainable(true) })

  // This event is emitted by the node api; it means we've received all data.
  this.on('finish', this.finish.bind(this))
}

/**
 * Abstract stream.Writable method. Writes chunk to the stream.
 *
 * @private
 * @param {Buffer} chunk The data to write to the stream.
 * @param {String} encoding Ignored because chunk is always a Buffer.
 * @param {Function} callback Called when the chunk is successfully handled.
 */
S3Stream.prototype._write = function (chunk, encoding, callback) {
  this.queue.push(chunk, callback)
}

/**
 * Abort the stream's multi-part upload.
 *
 * By default, this method will be called when any error is emitted from
 * the queue so that the zombie parts are not left hanging around S3.
 */
S3Stream.prototype.abort = function () {
  this.params.UploadId = null
  this.s3.abortMultipartUpload(this.params).send()
}


/**
 * Helper to generate an object of params used by multiple S3 upload methods.
 *
 * @param {Object} extraParams Additional params to merge with the default params.
 * @return {Object} Merged params.
 */
S3Stream.prototype.getUploadParams = function (extraParams) {
  var params = {
    Bucket: this.params.Bucket,
    Key: this.params.Key,
    UploadId: this.params.UploadId
  }

  Object.keys(extraParams || {}).forEach(function (key) {
    params[key] = extraParams[key]
  })

  return params
}

/**
 * Upload a chunk of data to S3. Emits an 'uploaded' event on completion.
 *
 * @param {Buffer} body Chunk of data to upload.
 * @param {Array.<Function>} callbacks Callbacks to be called when the upload completes.
 */
S3Stream.prototype.upload = function (body, callbacks) {
  var _this = this
  this.uploadPartNumber++
  var partNumber = this.uploadPartNumber

  var params = this.getUploadParams({
    Body: body,
    PartNumber: partNumber.toString()
  })

  this.activeUploads++
  if (this.activeUploads === this.maxActiveUploads) this.queue.setDrainable(false)
  this.s3.uploadPart(params, function (err, response) {
    _this.activeUploads--
    if (_this.params.UploadId && !_this.queue.drainable) {
      _this.queue.setDrainable(true)
    }

    if (err) {
      _this.emit('error', err)
    } else {
      // Maintain `ETag` and `PartNumber` data about each uploaded part
      // so that the data can be combined when the upload is complete.
      _this.uploadedParts.push({
        ETag: response.ETag,
        PartNumber: partNumber
      })
    }
    callbacks.forEach(function (callback) { callback() })
    if (_this.finishHasBeenCalled) {
      if (_this.activeUploads === 0) _this.complete()
    } else {
      _this.queue.drainIfNeeded()
    }
    _this.emit('uploaded', err, response, body)
  })
}

/**
 * Start the final, and possibly very-small (including 0 bytes), upload;
 * setting finishHasBeenCalled will trigger complete() when all uploads reach 0.
 */
S3Stream.prototype.finish = function () {
  this.finishHasBeenCalled = true

  // Accept one more drain of any size. This handles two cases:
  // (1) The writable event has occurred, and we drain & upload now; or
  // (2) writable has not occurred, but we'll upload as soon as it occurs.
  this.queue.threshold = 0
  this.queue.removeListener('drain', this.uploadFn)
  this.queue.once('drain', this.uploadFn)  // Avoid more than 1 last upload.
  this.queue.drainIfNeeded()
}

/**
 * Completes a multi-part upload. When the completion is done, the stream
 * emits a 'close' event with `err` and `response` arguments.
 */
S3Stream.prototype.complete = function () {
  var _this = this

  this.uploadedParts.sort(function (a, b) {
    return a.PartNumber < b.PartNumber ? -1 : 1
  })

  var params = this.getUploadParams({
    MultipartUpload: {Parts: this.uploadedParts}
  })

  this.s3.completeMultipartUpload(params, function (err, response) {
    if (err) _this.emit('error', err)
    _this.emit('close', err, response)
  })
}
