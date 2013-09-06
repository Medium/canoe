# Changelog

### 0.1.1
* Make the `S3Queue` class significantly faster, especially when pushing small chunks.
* Store queued data in `S3Queue.chunks` instead of `S3Queue.buffer`.

### 0.1.0
* First version
* Introduce `createWriteStream()`
