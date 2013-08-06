var fs = require('fs');
var crypto = require('crypto');
var should = require('should');

// Overload the AWS library with the shim
var proxyquire =  require('proxyquire');
var awsShim = require('./shim/aws');
proxyquire.noCallThru().load('../index', { 'aws-sdk': awsShim });

var getStream = function(cb) {
  var s3Shim = new awsShim.S3();
  var params = {Bucket: 'test-bucket', Key: 'testkey.log'};
  return s3Shim.createWriteStream(params, cb);
};


describe('S3 createWriteStream', function() {
  it('Should create writable stream', function(done){
    var immediateStream = getStream(function(err, stream) {
      stream.should.be.instanceof(require('stream').Writable);
      immediateStream.should.equal(stream);

      done();
    });

    immediateStream.should.be.instanceof(require('stream').Writable);
  });

  it('Should be writable', function(done) {
    getStream(function(err, stream) {
      stream.write("And we will never be alone again").should.be.ok;
      done();
    });
  });

  it('Should emit a "writable" event', function(done) {
    getStream().on('writable', done);
  });

  it('Should emit "uploaded" event', function(done) {
    getStream(function(err, stream) {
      stream.on('uploaded', function(err, response, chunk) {
        response.should.have.property('ETag');
        chunk.should.be.instanceof(Buffer);

        done(err);
      });
      stream.end("Somebody tell me if I am sleeping");
    });
  });

  it('Should emit "finish" event', function(done) {
    getStream(function(err, stream) {
      stream.on('finish', done);
      stream.end("'Cause it doesn't happen every day");
    });
  });

  it('Should emit "end" event after finish event', function(done) {
    getStream(function(err, stream) {
      stream.on('finish', function() {
        stream.on('end', done);
      });

      stream.end("Kinda given up on giving away");
    });
  });

  it('Should write data', function(done) {
    getStream(function(err, stream) {
      var lyric = "Kinda counted on you being a friend";
      var body = '';

      stream.on('uploaded', function(err, response, chunk) {
        body += chunk.toString();
      });

      stream.on('end', function() {
        body.should.equal(lyric);
        done();
      });

      stream.end(lyric);
    });
  });

  it('Should pipe readable streams', function(done) {
    getStream(function(err, stream) {
      var body = '';
      stream.on('uploaded', function(err, response, chunk) {
        body += chunk.toString();
      });

      stream.on('end', function(err) {
        var expected = fs.readFileSync(__filename, 'utf8');
        body.should.equal(expected, 'Did not write file contents correctly');

        done(err);
      });
      fs.createReadStream(__filename).pipe(stream);
    });
  });

  it('Should handle immediate writes', function(done) {
    var stream = getStream();

    stream.on('end', done);
    stream.end("Now I thought about what I wanna say");
  });

  it('Should run callbacks', function(done) {
    var stream = getStream();
    stream.write("But I never really know where to go", done);
  });

  it('Should return false on writes that overflow the highWaterMark', function() {
    var highWaterMark = getStream()._writableState.highWaterMark;
    var bigContent = crypto.randomBytes(highWaterMark);
    getStream().write(bigContent).should.not.be.ok;
  });

  it('Should finish the chorus', function() {
    var stream = getStream();
    stream.end("So I chained myself to a friend\n'Cause I know it unlocks like a door");
  });
});
