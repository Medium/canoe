// Copyright 2013 The Obvious Corporation.

var util = require('util');
var Writable = require('stream').Writable;
var S3Queue = require('./Queue');

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
  Writable.call(this);

  // Cache inputs
  this.params = params;
  this.s3 = s3;

  // Set the stream's initial state, create a queue, and bind event listeners
  this.init();
}
util.inherits(S3Stream, Writable);
module.exports = S3Stream;

/**
 * Initialize the instance with default values and listeners
 */
S3Stream.prototype.init = function () {
  // Setup the stream's initial state and limits
  this.uploadPartNumber = 0;
  this.uploadedParts = [];
  this.activeUploads = 0;
  this.maxActiveUploads = 1;

  // Setup a queue instance
  this.setupQueue();

  // Bind internal listners
  this.setupEvents();
};

/**
 * Setup an instance of S3Queue and binds the stream's upload()
 * method to the queue's 'drain' event.
 */
S3Stream.prototype.setupQueue = function () {
  this.queue = new S3Queue();
  this.queue.on('drain', this.upload.bind(this));
};

/**
 * Bind internal events.
 *
 * Helps methods act more independently and keeps most communication
 * in events instead of nested calls.
 */
S3Stream.prototype.setupEvents = function () {
  var _this = this;

  // Complete the upload when the stream's 'finish' event fires
  this.once('finish', this.complete.bind(this));

  // By default, abort the upload on any error. Unbind this event with:
  // `s3stream.removeListener('error', s3stream.abort)`
  this.on('error', this.abort.bind(this));

  // When uploads complete, track the uploaded part and
  // emit drain/flush events
  this.on('uploaded', this.trackUploadedPart.bind(this));
  this.on('uploaded', function () {
    // 'drain' is emitted when the stream is writable
    if (_this.ready()) _this.emit('drain');

    // 'flush' is emitted when the stream has no active uploads
    if (_this.activeUploads === 0) _this.emit('flush');
  });
};

/**
 * Abstract stream.Writable method. Writes chunk to the stream.
 *
 * @private
 * @param {Buffer} chunk The data to write to the stream.
 * @param {String} encoding Ignored because chunk is always a Buffer.
 * @param {Function} callback Called when the chunk is successfully handled.
 */
S3Stream.prototype._write = function (chunk, encoding, callback) {
  var _this = this;

  // On the queue's `push` event, fire the callback if the queue is ready
  // for more data. If the queue is not ready, fire the callback on the
  // queue's next `drain` event
  this.queue.once('push', function () {
    return _this.ready() ? callback() : _this.once('drain', callback);
  });

  // If the queue is initialized, push this chunk
  if (this.initialized()) {
    this.queue.push(chunk);

  // If the queue is not initialized yet, push this chunk when it fires
  // its `writable` event
  } else {
    this.once('writable', function() {
      _this.queue.push(chunk);
    });
  }
};

/**
 * Check whether the stream is ready to accept data.
 *
 * @return {Boolean} True if the stream is ready.
 */
S3Stream.prototype.ready = function () {
  return !! (this.initialized() && this.activeUploads < this.maxActiveUploads);
};

/**
 * Check whether the stream has been initialized with an S3 upload ID.
 *
 * @return {Boolean} True if the stream has an upload ID.
 */
S3Stream.prototype.initialized = function () {
  return !! this.params.UploadId;
};

/**
 * Abort the stream's multi-part upload.
 *
 * By default, this method will be called when any error is emitted from
 * the queue so that the zombie parts are not left hanging around S3.
 */
S3Stream.prototype.abort = function () {
  this.params.UploadId = null;
  this.s3.abortMultipartUpload(this.params).send();
};


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
  };

  Object.keys(extraParams || {}).forEach(function (key) {
    params[key] = extraParams[key];
  });

  return params;
};

/**
 * Upload a chunk of data to S3. Emits an 'uploaded' event on completion.
 *
 * @param {Buffer} body Chunk of data to upload.
 */
S3Stream.prototype.upload = function (body) {
  var _this = this;
  this.uploadPartNumber++;

  var params = this.getUploadParams({
    Body: body,
    PartNumber: this.uploadPartNumber.toString()
  });

  this.activeUploads++;
  this.s3.uploadPart(params, function (err, response) {
    _this.activeUploads--;

    if (err) _this.emit('error', err);
    _this.emit('uploaded', err, response, body);
  });
};

// ### TrackUploadedPart
//
// Maintains `ETag` and `PartNumber` data about each uploaded part so
// that the data can be combined when the upload is complete.
/**
 * Maintains `ETag` and `PartNumber` data about each uploaded part so
 * that the data can be combined when the upload is complete.
 *
 * @param {Error} err Possible error generated by the upload attempt.
 * @param {Object} data Upload result data.
 * @param {String} data.ETag Entity tag returned when the part was uploaded.
 */
S3Stream.prototype.trackUploadedPart = function (err, data) {
  if (err) return;

  this.uploadedParts.push({
    ETag: data.ETag,
    PartNumber: this.uploadPartNumber
  });
};

/**
 * Finishes a multi-part upload. Any remaning data is flushed from the
 * underlying queue. Once all parts have been uploaded to S3 and the
 * 'flush' event is fired, completion starts. The stream emits an 'end'
 * event when the completed upload finishes with `err` and `response`
 * arguments.
 */
S3Stream.prototype.complete = function () {
  var _this = this;

  this.queue.drain();
  this.once('flush', function() {
    // Parts have to be sorted in ascending order
    _this.uploadedParts.sort(function (a, b) {
      return a.PartNumber < b.PartNumber ? -1 : 1;
    });

    var params = _this.getUploadParams({
      MultipartUpload: {Parts: _this.uploadedParts}
    });

    _this.s3.completeMultipartUpload(params, function (err, response) {
      if (err) _this.emit('error', err);
      _this.emit('end', err, response);
    });
  });
};