# Contributing

Questions, comments, bug reports, and pull requests are all welcome.  Submit them at [the project on GitHub](https://github.com/Obvious/canoe/).  If you haven't contributed to an [Obvious](http://github.com/Obvious/) project before please head over to the [Open Source Project](https://github.com/Obvious/open-source#note-to-external-contributors) and fill out an OCLA (it should be pretty painless).

Bug reports that include steps-to-reproduce (including code) are the best. Even better, make them in the form of pull requests.

## Workflow

### Pull requests

[Fork](https://github.com/Obvious/canoe/fork) the project on GitHub and make a pull request from your feature branch against the upstream master branch. Consider rebasing your branch onto the latest master before sending a pull request to make sure there are no merge conflicts, failing tests, or other regressions.

### Grunt

We use [Grunt](http://gruntjs.com/) for development. Install the command line tool with `npm install grunt-cli -g`.

During development, you can run `grunt watch` to automatically run tests, run JS Hint, and update documentation. It's a good idea to run the default `grunt` command before making a pull request or other changes.

### Code style

There is no formal style guide, but your code should pass JS Hint (part of the default `grunt` task). When in doubt, try to follow existing convenetions and these basic rules:

* Use semi-colons, even though they're optional.
* Indent using two spaces. Never use tabs.
* Delete trailing whitespace. It's ugly.
* Use spaces after the `function` keyword, like this: `function () {}`


## Documentation

### JSDoc

We use [JSDoc](http://usejsdoc.org/) for inline documentation. There is no formal guideline, but please try to follow the existing conventions for documentation. For example, function paramaters and return values should always be documented, and functions should also have a brief, clear description.

Use examples and in-line documentation when they're helpful. Avoid comments like `This adds 1 to the variable "i"`.

Documentation is built in `./.grunt/docs`. You can view the documentation with `open ./.grunt/docs/index.html`. When new versions are released, documentation will be published to http://obvious.github.io/canoe/.

### Readme

If you introduce changes or new features that will affect users, consider updating or adding the relevant section of the [readme](https://github.com/Obvious/canoe/blob/master/README.md).

## Tests

### Unit tests

Tests use [Mocha](http://visionmedia.github.io/mocha/) and [Should](https://github.com/visionmedia/should.js/), and can be run with `npm test`. Tests will automatically be run on [Travis CI](https://travis-ci.org/Obvious/canoe) for new pull requests, and pull requests will only be merged if the tests pass.

New features and bug fixes should have new unit tests. Don't be afraid to make the tests fun to read, we will all be fine without another example of asserting "foobar" or "example data". I like [Daft Punk lyrics](https://github.com/Obvious/canoe/blob/e185a0fb011328ce6ef8bd197c9aa9f8de8f2efa/test/createWriteStream.js#L124-L127); be creative.

### Performance benchmarks

If you introduce a performance improvement, consider adding a [benchmark](https://github.com/Obvious/canoe/tree/master/benchmark) to quantify the change. It's also generally a good idea to run the benchmarks and compare your change against the master branch to check for any regressions.

Benchmarks can be run with `grunt benchmark`.

## Maintainers

### Changelog

Try to keep the [Changelog](https://github.com/Obvious/canoe/blob/master/CHANGELOG.md) useful. It should capture important changes, but not be so verbose that it's unreadable.

### New versions

There is a Grunt task for publishing a new version of Canoe, appropriately called: `grunt publish`. You should update the [Changelog](#changelog) before publishing a new version.

The task will update the [package.json](https://github.com/Obvious/canoe/blob/master/package.json), commit it, tag a new version, and push the new version to GitHub and NPM. That means you should **not** update the package version or create a Git tag before running `grunt publish`. You should probably only run this task from the master branch.

To use this task you **must** be authenticated as an owner on NPM *and* have push access to this repo.  You can check your NPM access by running `npm whoami` and `npm owner ls canoe` (the output of the former should be in the latter).

The `grunt publish` task comes in three flavors, based on [semver](https://npmjs.org/doc/misc/semver.html): patch (default), minor, and major.

* To publish a new patch version (e.g. 0.1.1 -> 0.1.2), run `grunt publish` (this is an alias for `grunt publish:patch`)
* To publish a new minor version (e.g. 0.1.1 -> 0.2.0), run `grunt publish:minor`
* To publish a new major version (e.g. 0.1.1 -> 1.0.0), run `grunt publish:major`
