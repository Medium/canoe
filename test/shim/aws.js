// Copyright 2014 A Medium Corporation.

// Testable shim for the AWS SDK
//
// Stubs all of the AWS methods that the stream uses
// Sets a timeout before calling any callbacks to simulate small network lag

var crypto = require('crypto')
var s3 = {}

var AWS = {}
module.exports = AWS

var NETWORK_TIMEOUT = 10

AWS.S3 = function () {
  // An easy way to confirm we're using the shim
  this.shim = true

  // https://github.com/Medium/canoe/pull/22
  this.requireUploadPartType = null
}

AWS.S3.prototype.createMultipartUpload = function (params, callback) {
  var _this = this
  setTimeout(function () {
    var required = ['Bucket', 'Key']
    for (var i = 0; i < required.length; i++) {
      if (params[required[i]] == null)
        return callback(new Error(required[i] + ' is required'))
    }

    // Fake an upload ID and set it on the instance
    var UploadId = '' + crypto.randomBytes(50).toString()
    _this.cachedUploadId = UploadId

    callback(null, {UploadId: UploadId})
  }, NETWORK_TIMEOUT)
}

AWS.S3.prototype.abortMultipartUpload = function (params) {
  var _this = this

  return {
    send: function (callback) {
      setTimeout(function () {
        if (typeof callback === 'function' && params.UploadId !== _this.cachedUploadId) {
          callback(new Error('UploadId does not match'))
        }
      }, NETWORK_TIMEOUT)
    }
  }
}

AWS.S3.prototype.uploadPart = function (params, callback) {
  var _this = this
  setTimeout(function () {
    var required = ['Body', 'Bucket', 'Key', 'PartNumber']
    for (var i = 0; i < required.length; i++) {
      if (params[required[i]] == null)
        return callback(new Error(required[i] + ' is required'))
    }

    // The PartNumber param is type agnostic. It used to be strict, but inconsistent.
    //
    // https://github.com/Medium/canoe/pull/22
    if (_this.requireUploadPartType && typeof params.PartNumber !== _this.requireUploadPartType) {
      return callback(new Error('PartNumber must be a ' + _this.requireUploadPartType))
    }

    if (params.UploadId !== _this.cachedUploadId) {
      return callback(new Error('UploadId does not match'))
    }

    var etag = crypto.randomBytes(50).toString()
    callback(null, {ETag: etag})
  }, NETWORK_TIMEOUT)
}

AWS.S3.prototype.completeMultipartUpload = function (params, callback) {
  var _this = this
  setTimeout(function () {
    var required = ['Bucket', 'Key', 'UploadId', 'MultipartUpload']
    for (var i = 0; i < required.length; i++) {
      if (params[required[i]] == null)
        return callback(new Error(required[i] + ' is required'))
    }

    if (params.UploadId !== _this.cachedUploadId) {
      return callback(new Error('UploadId did not match'))
    }

    // MultipartUpload must be sorted
    var lastPart
    for (i = 0; i < params.MultipartUpload.length; i++) {
      if (lastPart && params.MultipartUpload[i].PartNumber <= lastPart)
        return callback(new Error('MultipartUpload was not sorted'))

      lastPart = params.MultipartUpload[i].PartNumber
    }

    callback()
  }, NETWORK_TIMEOUT)
}
