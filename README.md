## InstantClick

For information about what InstantClick is, how it works, etc., go to **[InstantClick’s website](http://instantclick.io/)**.

## Contributing

### Pull Requests

If you have a feature in mind that you think would be a great fit for InstantClick, I recommend first to open an issue to debate whether it’s worthy of inclusion in the first place. Assume no feature/optimization is wanted. This way you won’t risk doing  work for nothing, and I won’t feel bad for throwing away your work.

Look around the code to spot code convention (two spaces for tabs, no semicolons at the end of lines, etc.). I’ll need those to be respected to accept a pull request.

In the (hopefully near) future I’ll open [issues](https://github.com/dieulot/instantclick/issues?state=open) to say where I think InstantClick needs work on.

### Tests

Tests (in the `tests` folder) are HTML pages with which to check how InstantClick behaves on different browsers. That’s what I use before releasing a new version to make sure there is no obvious regressions.

Here are the tests that I do:

- Click on “Index page”, see if it works correctly.
- Click on “Index page” with 2000 ms of delay, see if it works correctly.
- Click on “Page with anchors #1”, click on “Page 2, anchor 1”, click on “Page 1, anchor 2”, go back and forward randomly. (At the time of this writing, 2014/03/19, scrolling *is* broken.)
- In Internet Explorer 6, check that InstantClick’s “change” event is called, as it needs to fire even if InstantClick is unsupported.

To start the tests website, with PHP 5.4 run `php -S 127.0.0.1:8000`, and head to [http://127.0.0.1:8000/tests/](http://127.0.0.1:8000/tests/). (Be sure to start php in `tests`’s parent directory, not in `tests` itself.)

Or just put the `instantclick` folder in your `www` directory, and head to [http://127.0.0.1/instantclick/tests/](http://127.0.0.1/instantclick/tests/).

These tests are oriented towards InstantClick’s behaviors in browser. For most bug fixes, you won’t need to go through them.

If you need or want to go through them, be warned, they’re kind of a mess right now.
