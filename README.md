## Contributing

Check out the [roadmap](http://instantclick.io/roadmap) to see what features need to be implemented.

### Pull Requests

Look around the code to spot code convention (two spaces for tabs, no semicolons at the end of lines, etc.). I’ll need those to be respected to accept a pull request.

Adding a test to a pull request isn’t mandatory.

### Tests

Tests (in the `tests` folder) are PHP-generated HTML pages with which to check how InstantClick behaves on different browsers. That’s what I use before releasing a new version to make sure there are no obvious regressions.

To access the suite of tests, run `php -S 127.0.0.1:8000` from the project’s root directory (**not** from the `tests` folder) and head to [http://127.0.0.1:8000/tests/](http://127.0.0.1:8000/tests/).
