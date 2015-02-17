# Contributing

## Getting support

There is no dedicated place for support at the moment. Use [Stack Overflow](http://stackoverflow.com/search?q=instantclick) for now. Having an official InstantClick forum is planned.

## Bugs

### Reporting a bug

When reporting a bug, ideally you should provide a reduced test case: the minimal amount of code that makes the problem appear.

If you don’t feel like doing this, it’s okay. A vague bug report is better than no bug report at all.

### Fixing a bug

If you went the extra mile and fixed a bug, open a pull request.

In doing so, please emulate the code’s conventions (no [unnecessary semicolons](http://mislav.uniqpath.com/2010/05/semicolons/), two spaces for tabs, etc.) and only commit the changes that are relevant to the fix (with [`git add -a <file>`](http://stackoverflow.com/a/1085191/921889)). If you’ve already committed a “dirty” commit, use `git reset --soft HEAD~1` to [undo](http://stackoverflow.com/q/927358/921889) and start again.

If you have trouble following those instructions, contribute your pull request anyway. A bugfix that can’t get easily merged is better than no bugfix.

## New features/enhancements

Check out [already suggested enhancements](https://github.com/dieulot/instantclick/issues?q=label%3AEnhancement). If you have something else in mind open a new issue.

Pull requests for new features/enhancements won’t get merged because the code is the tiniest part of a new feature. There’s ease of use, documentation, marketing and maintainability to take into account *before* coding anything. Delegating the programming of new features to the community would make things slower.

If your idea is best represented by code than by words alone, you can still open a pull request (which will be closed) and link to it in an issue.

## Documentation

If you’ve spotted a typo, a non-idiomatic sentence, an unclear sentence (or just anything that may hinder understanding) on the website, open an issue or a pull request in the [instantclick-website repo](https://github.com/dieulot/instantclick-website).

30% of InstantClick users don’t have English as their first language, if you see a word (or even a sentence) that can be replaced with a simpler one without losing meaning, please contribute it!

Contributing to documentation for more substantial things is a pain (and will probably always be due to a lack of priority, I deem documentation critical enough that I plan to do all the big things (such as the onboarding process, for instance) by myself), so it’s totally okay if you don’t want to wrap your head around how to make a pull request. Just open an issue and dump all your texts there. Yes, it’s messy, but there’s no good alternative at the moment.

Official translations of the documentation will be organized when InstantClick is close to being feature-complete, because the efforts to keep the documentation synchronized in multiple languages aren’t worth it for now.

### The contributing experience

If something wasn’t clear for you (whether it is rationally justified or not) when you tried to contribute, please talk about it. Put it at the end of your issue, or open another issue for it. Removing friction in a process (here, contributing to the project) is useful; don’t be afraid to look like a dummy, you won’t.

More generally, anything that you feel would improve the project is welcome, even if it’s very small and/or there’s no formal process to contribute it.

## About the pull requests and bugs languishing

I have been slacking quite a bit this past year (as of February 2015) on this project. Sorry about that. I have an awful lot of things planned for InstantClick and all my todos/ideas (I have hundreds) were disseminated in multiple digital places, then I didn’t know where to start anymore. It’s all in my Trello now, I hope this will resolve the slacking problem.
