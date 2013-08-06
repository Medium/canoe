// ## Load S3Stream
//
// Loads the base S3Stream class, which extends `stream.Writable`.
var S3Stream = require('./lib/Stream');

// ## AWS SDK
//
// Load and export the AWS SDK. We will monkeypatch `AWS.S3's.prototype`.
//
// This module requires the AWS SDK module as a peer dependency, so it
// must be present in the parent package.
var AWS = require('aws-sdk');
module.exports = AWS;

// ## CreateWriteStream
//
// Define `AWS.S3.prototype.createWriteStream`.
// 
// Usage:
//
// ```
// require('s3-write-stream');
// var AWS = require('aws-sdk');
// var s3 = new AWS.S3(configParams);
// var targetFile = {Bucket: 'random-access-memories', Key: 'to-get-lucky.log'};
// var s3stream = s3.createWriteStream(targetFile);;
// fs.createReadStream('./for-good-fun.log').pipe(s3stream);
// ```
//
// `createWriteStream()` accepts the same params object as
// `s3.createMultipartUpload()`.
// 
// It will immediately return a writeable stream, but the stream will not
// be ready yet. An upload ID must be retrieved from S3 before the stream
// will be ready. You can handle this in a few ways:
// 
// * Wait for the stream to emit a `writable` event
// * Provide a callback, which will be called with `(err, writeableStream)`
//   when the stream is ready
// * Start writing immediately and respect `false` return values. This is how
//   Node's `stream.pipe()` behaves
AWS.S3.prototype.createWriteStream = function(params, callback) {
  var s3stream = new S3Stream(params, this);

  this.createMultipartUpload(params, function(err, data) {
    // Default callback to a noop
    callback = callback || function(){};

    // Pass errors to the callback and emit them from the stream
    if (err) {
      s3stream.emit('error', err);
      return callback(err);
    }

    // Set the `UploadId` from S3
    s3stream.params.UploadId = data.UploadId;

    // Run the callback
    callback(null, s3stream);

    // Fire the 'writable' event after the callback, in case the callback is
    // mistakenly waiting for the event.
    s3stream.emit('writable');
  });

  // Return the write stream
  return s3stream;
};
