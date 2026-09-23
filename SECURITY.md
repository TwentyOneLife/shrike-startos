# Security Policy

## Reporting

Do not disclose suspected security vulnerabilities through public issues, pull requests, discussions, or other public channels.

Report vulnerabilities in this StartOS package using [GitHub private vulnerability reporting](https://github.com/TwentyOneLife/shrike-startos/security/advisories/new).

For bugs with no security or privacy impact, open a [regular GitHub issue](https://github.com/TwentyOneLife/shrike-startos/issues/new/choose).

Email reports are not monitored.

Include the affected package version, potential impact, and reproduction steps or a proof of concept. Do not include real credentials, private keys, or personal data.

## Scope

In scope are vulnerabilities caused by code, configuration, build artifacts, or upstream integration maintained in this repository.

Vulnerabilities solely in the packaged upstream application, its dependencies, or StartOS itself are out of scope and should be reported privately to the responsible project. If you are unsure whether the package causes the issue, report it here privately.

## Supported Versions

Security fixes are provided for the latest package release. Users should upgrade to receive them.

These disclosure rules also apply to automated tools and AI agents: suspected vulnerability details and secrets must not be placed in public or committed output before coordinated disclosure.
## Known advisories we cannot fix here

`npm audit` reports `brace-expansion` advisories against this repository. They are real advisories
and they are not fixable downstream, so rather than hide them:

- Every path is inside `@start9labs/start-sdk/node_modules/`, under the SDK's bundled `eslint` and
  `typescript-eslint`. The SDK declares those as `bundleDependencies`, which npm does not allow an
  `overrides` entry to reach. We run the latest SDK.
- None of it reaches what we ship. The service is built with `ncc` from `startos/index.ts`, which
  bundles only what that code imports, and `eslint` is not imported. The only occurrences of the
  name in the built artifact are the SDK's own `package.json` text, carried as metadata.
- The advisories are denial of service through pathological input to a brace-expansion routine used
  by a linter that never runs here.

The fix belongs in the SDK, and it has been reported there so it can be fixed rather than only
managed here.

**These alerts are dismissed rather than left open**, as `not_used`, with the reasoning above
recorded on each one. An earlier version of this file said the opposite, that they would stay
visible because an ignore rule also hides the day something becomes fixable. Looking at the actual
paths changed the answer: every one is a linter's dependency inside a bundled tree, and a security
page that is permanently red is a page people stop reading. Dismissal is per advisory, so a new one,
or the same code appearing somewhere that ships, raises a new alert rather than being silently
covered by this decision.

`js-yaml` advisories previously appeared here for a second reason, a dependency this package
declared and never imported. That one was real and is fixed by removing it.
