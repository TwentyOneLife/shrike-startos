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

The fix belongs in the SDK. Until it lands, these stay visible rather than suppressed: an ignore
rule would also hide the day it becomes fixable.

`js-yaml` advisories previously appeared here too. Those were real and are fixed: the dependency was
declared and never imported, so it was removed.
