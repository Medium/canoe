# Changelog

### 0.2.0
* `S3Stream` -- Standardize `finish` event to fire once the stream is completely done handling the data. Previously it would fire after the stream's `end()` method was called but before the upload to S3 had completed.
* `S3Stream` -- Remove `end` event. It is non-standard for writable streams and no longer useful. Use `finish` instead.
* Add [contributing guidelines](https://github.com/Obvious/canoe/blob/master/CONTRIBUTING.md).

### 0.1.1
* Make the `S3Queue` class significantly faster, especially when pushing small chunks.
* Store queued data in `S3Queue.chunks` instead of `S3Queue.buffer`.

### 0.1.0
* First version
* Introduce `createWriteStream()`
