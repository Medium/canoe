# Changelog

### 0.3.0
* `S3Stream` -- Fix a race condition that caused the upload to be completed to early when `end()` happened to get called while there were no active uploads.
* `S3Stream` -- Introduce new `close` event, which fires *after* `finish` and means that the data is completely uploaded to S3.

### 0.2.2
#### September 30, 2013
* `S3Stream` -- Fix a bug that caused data to never upload when objects were an exact multiple of the threshold (e.g. 10mb).

### 0.2.1
#### September 26, 2013
* `S3Stream` -- Introduce `S3Stream.setThreshold()` to make the upload threshold easier to customize.

### 0.2.0
#### September 14, 2013
* `S3Stream` -- Standardize `finish` event to fire once the stream is completely done handling the data. Previously it would fire after the stream's `end()` method was called but before the upload to S3 had completed.
* `S3Stream` -- Remove `end` event. It is non-standard for writable streams and no longer useful. Use `finish` instead.
* Add [contributing guidelines](https://github.com/Obvious/canoe/blob/master/CONTRIBUTING.md).

### 0.1.1
#### September 6, 2013
* Make the `S3Queue` class significantly faster, especially when pushing small chunks.
* Store queued data in `S3Queue.chunks` instead of `S3Queue.buffer`.

### 0.1.0
#### September 4, 2013
* First version
* Introduce `createWriteStream()`
