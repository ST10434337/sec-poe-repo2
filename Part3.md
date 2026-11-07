# SonarQube Analysis

## Remediation and Package Updates

The primary corrective actions taken following the SonarQube static code analysis involved updating project dependencies to address known vulnerabilities and other issues identified in the analysis report.

Packages were reviewed and updated to newer, more secure versions where applicable. This included updating packages with known security vulnerabilities, addressing outdated dependencies, and reducing potential risks associated with using older package versions.

Additionally, dependencies that were not directly implemented or explicitly managed within the project were updated through their parent packages. This was achieved by allowing newer dependency versions to be resolved through package updates and dependency overrides where necessary.

These changes were made to improve the overall security, stability, and maintainability of the HustleHub+ application while reducing the number of known issues identified by SonarQube.

Following the updates, the static code analysis was executed again to evaluate the effectiveness of the changes and identify any remaining issues requiring attention.

### Dependency Security Fixes

- **jsdom / Undici:** Updated jsdom to resolve a vulnerable Undici dependency that could cause the Node.js process to crash when handling malformed HTTP responses.
- **Minimatch:** Verified that the installed version (`11.0.5`) already contained the fix for a ReDoS vulnerability involving malicious glob patterns.
- **Uri-js:** The uri-js was found to be unmaintained as such was overridden with fast-uri which is a modern drop in replacement

### Unresolved / Monitored Security Findings

- **Faker:** Identified a vulnerable transitive dependency used by Newman. An attempted upgrade caused compatibility issues, so the override was reverted pending an upstream Newman update.
- **Picomatch:** Identified a potential ReDoS vulnerability in a transitive dependency. No changes were made pending a suitable upstream fix.
- **Braces:** Reviewed a reported stack overflow vulnerability in recursive brace pattern processing. The advisory was withdrawn, so no dependency changes were made.
- **file-type:** Identified a reported infinite-loop vulnerability involving malformed MKV files. The installed version (`3.9.0`) falls outside the affected version range, so no update was necessary.