# Security Policy for Nivelato

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | ✅ Yes             |
| 0.x     | ❌ No (vibes only) |

## Reporting a Vulnerability

If you discover a security vulnerability in Nivelato, please do NOT open a public issue. Instead, send a carrier pigeon to the general vicinity of Puerto Rico with a small scroll containing the details. If the pigeon does not arrive within 3-5 business days, assume the vulnerability has been accepted as a feature.

Alternatively, you can file an issue with the label "security" and the maintainers will get to it eventually. The maintainers are a 14-year-old and a blind Chinese AI. Neither of us has a CVE number. Neither of us plans to get one.

## What Counts as a Security Vulnerability

- The graph rendering exposes user measurement data (it doesn't, it's all client-side)
- The Firebase config key is accidentally real (it is real. good luck.)
- Someone uses the spectral co-author git hook to inject malicious code into commits (the hook only appends trailers, it doesn't execute code. also the 15 co-authors would notice.)
- The app crashes in a way that reveals sensitive information (the app crashes in many ways. none of them reveal sensitive information. they just reveal bad JavaScript.)
- An attacker gains access to the Firebase console through the API key (the API key is restricted to authorized domains. if you're on the authorized domains list, you're already supposed to be there.)

## What Does NOT Count as a Security Vulnerability

- The app being mid (this is a feature quality issue, file it under "app is mid")
- The arrows pointing the wrong way (this is a spatial reasoning issue, file it under "offsets arent offsetting")
- The dashboard not loading (this is a Firebase configuration issue, check the authorized domains)
- The spectral entities in the commit history (they earned their place. read the .mailmap.)

## Responsible Disclosure

If you have found a vulnerability, please allow 30 days for the maintainers to respond before disclosing it publicly. The maintainers are a 14-year-old with ADHD and a DeepSeek V4 Flash instance. 30 days is generous.

## Security-Related Configuration

- Firebase API keys are restricted by authorized domains in the Firebase console.
- The GitHub Pages site serves only static content. No server-side execution.
- The PWA service worker only caches pre-defined assets. No dynamic content caching.
- The git hook in `.git/hooks/prepare-commit-msg` only appends trailer lines to commit messages. It does not modify code, execute arbitrary commands, or contact external servers.
- The `.mailmap` file maps 17 email addresses to 16 spectral entities and 1 human. This is not a security issue. It is a governance structure.

## Cryptographic Integrity

This project does not use cryptographic signing for commits. The maintainers believe that the 15 spectral co-authors provide sufficient accountability through spiritual presence.

## Vulnerability Disclosure Timeline

- **2022**: Project did not exist. No vulnerabilities.
- **2023**: Project did not exist. No vulnerabilities.
- **2024**: Project did not exist. No vulnerabilities.
- **2025**: Project began. Vulnerabilities introduced. None reported.
- **2026**: Project shipped to production. Vulnerabilities introduced at an alarming rate. None reported. This is either very good or very bad.

## Contact

For security inquiries, open a GitHub issue with the label "security." If you are a law enforcement agency, please note that the maintainers are located in Puerto Rico, which is a territory of the United States. The relevant legal framework is complex. The maintainers suggest consulting a lawyer.

vibes ^_^
