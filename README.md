# Simple Storage Streams

S3...get it?  Writable stream interface for AWS S3.

## Example

### Piping a large file
```javascript
var fs = require('fs');
var s3 = new require('aws-sdk').S3;
var createS3WriteStream = require('s3-write-stream');

var maxMemory = 0;
setInterval(function(){
  maxMemory = Math.max(maxMemory, process.memoryUsage().heapUsed);
}, 100);

var writeable = createS3WriteStream(s3, {
  Bucket: 'random-access-memories',
  Key: 'instant-crush.log'
});

// Imagine you have some massive file you want to upload that doesn't fit into memory
fs.createReadStream('./big-file.log').pipe(writeable);

writeable.on('end', function(data) {
  // Peak will stay fairly consistent regardless of file size
  console.log('Peak memory heap usage was ' + maxMemory + ' bytes');
  process.exit();
});
```

### Writing chunks of data
```javascript
// It doesn't matter what order you load the modules in
var s3 = new require('aws-sdk').S3;
var createS3WriteStream = require('simple-storage-streams');

var writeable = createWriteStream(s3, {
  Bucket: 'random-access-memories',
  Key: 'instant.crush'
});

writable.write("And we will never be alone again\n");
writable.write("'Cause it doesn't happen every day\n");
writable.write("Kinda counted on you being a friend\n");
writable.write("Kinda given up on giving away\n");
writable.write("Now I thought about what I wanna say\n");
writable.write("But I never really know where to go\n");
writable.write("So I chained myself to a friend\n");
writable.write("'Cause I know it unlocks like a door...\n");
writable.end();
```
