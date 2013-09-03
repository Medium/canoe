// Copyright 2013 The Obvious Corporation.

var S3Stream = require('./lib/Stream');

/**
 * Helper functionality for working with S3.
 *
 * @example
 *   var AWS = require('aws-sdk');
 *   var s3 = new AWS.S3(configParams);
 *   var s3Utils = new S3Utils(s3);
 *
 * @constructor
 * @param {Object} s3 Authenticated instance of AWS.S3
 */
function S3Utils(s3) {
  this.s3 = s3;
}
module.exports = S3Utils;


/**
 * Create a writable stream to upload an object to S3.
 *
 * @example
 *   var s3Utils = new S3Utils(s3);
 *   var s3stream = s3Utils.createWriteStream({
 *     Bucket: 'random-access-memories',
 *     Key: 'to-get-lucky.log'
 *   });
 *   fs.createReadStream('./for-good-fun.log').pipe(s3stream);
 *
 * @fires S3Utils#writable
 * @fires S3Utils#error
 *
 * @param {Object} params Params to create an instance of S3Stream
 * @param {Function=} callback Called when the stream is ready.
 * @return {Stream} Writable stream
 */
S3Utils.prototype.createWriteStream = function (params, callback) {
  var s3stream = new S3Stream(params, this.s3);

  this.s3.createMultipartUpload(params, function (err, data) {
    // Default callback to a noop
    callback = callback || function(){};

    // Pass errors to the callback and emit them from the stream
    if (err) {
      /**
       * Error event.
       *
       * @event S3Utils#error
       * @type {Error}
       */
      s3stream.emit('error', err);
      return callback(err);
    }

    // Set the `UploadId` from S3
    s3stream.params.UploadId = data.UploadId;

    // Run the callback
    callback(null, s3stream);

    /**
     * S3 stream is writable.
     *
     * @event S3Utils#writable
     */
    s3stream.emit('writable');
  });

  // Return the write stream
  return s3stream;
};
