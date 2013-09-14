# Canoe

[![Build Status](https://secure.travis-ci.org/Obvious/canoe.png?branch=master)](http://travis-ci.org/Obvious/canoe)

Paddle downstream with Canoe, an S3 utility library for Node.js. Built on the [AWS Node SDK](https://github.com/aws/aws-sdk-js).

## Install

`npm install canoe --save`

## Usage

Create a new `Canoe` instance by passing an instance of `AWS.S3` from the `aws-sdk` module.

```javascript
var AWS = require('aws-sdk'),
  Canoe = require('canoe');

var s3 = new AWS.S3();
var canoe = new Canoe(s3);
```

## Methods

### createWriteStream

A Node 0.10-friendly writable stream interface ("streams2") for uploading objects to S3.

#### Usage

Creates a writable stream for a given S3 bucket/key. The stream will be returned immediately and also passed to an optional callback.

The stream will be writable when it's returned, but not actually ready to send data to S3 yet (data will be buffered internally in the meantime). If you use the immediately returned stream, be sure to respect `false`-y return values, as Node's `readable.pipe()` does. The stream will be fully ready when the callback is run.

The stream will emit a `writable` event when it's ready to send data to S3.

Basic usage:

```javascript
var writableStream = canoe.createWriteStream({
  Bucket: 'bucket-name',
  Key: 'file/name'
});
writableStream.write(stuff);
writableStream.end();
```

#### Example: Piping a large file

```javascript
// Create a stream and use it immediately
var writeable = canoe.createWriteStream({
  Bucket: 'random-access-memories',
  Key: 'instant.crush'
});


// For fun, let's keep track of how much memory we need.
// We'll print the memory peak once the upload finishes.
// Peak will stay fairly consistent regardless of file size.
var maxMemory = 0;
setInterval(function() {
  maxMemory = Math.max(maxMemory, process.memoryUsage().heapUsed);
}, 100);

writeable.on('finish', function(data) {
  console.log('Peak memory heap usage was ' + maxMemory + ' bytes');
  process.exit();
});

// Imagine you have some massive file you want to upload that doesn't fit into memory
fs.createReadStream('./random-access-memories.log').pipe(writeable);
```

#### Example: Writing chunks of data

```javascript
// Create a stream and wait to use it in a callback
var s3Params = {Bucket: 'random-access-memories', Key: 'instant.crush'};
canoe.createWriteStream(s3Params, function(err, writable) {
  if (err) return;

  writable.write("And we will never be alone again\n");
  writable.write("'Cause it doesn't happen every day\n");
  writable.write("Kinda counted on you being a friend\n");
  writable.write("Kinda given up on giving away\n");
  writable.write("Now I thought about what I wanna say\n");
  writable.write("But I never really know where to go\n");
  writable.write("So I chained myself to a friend\n");
  writable.write("'Cause I know it unlocks like a door...");
  writable.end("\n");
});
```


## Contributing

See the [contributing documentation](https://github.com/Obvious/canoe/tree/master/CONTRIBUTING.md).

## Author

[Evan Solomon](https://github.com/evansolomon) ([personal website](http://evansolomon.me/)), supported by [The Obvious Corporation](http://obvious.com/).

## License

Copyright 2013 [The Obvious Corporation](http://obvious.com/).

Licensed under the Apache License, Version 2.0. See the top-level file `LICENSE.txt` and (http://www.apache.org/licenses/LICENSE-2.0).

