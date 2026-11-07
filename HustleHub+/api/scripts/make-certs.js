const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Run openssl from a fixed, full path instead of looking it up in PATH,
// so a folder added to PATH can't swap in a fake openssl ~> (SonarSource, n.d.)
// If openssl is somewhere else on your computer, set OPENSSL_PATH to its full path before running
const DEFAULT_OPENSSL = process.platform === 'win32'
  ? String.raw`C:\Program Files\Git\usr\bin\openssl.exe` // Comes with Git for Windows
  : '/usr/bin/openssl';
const OPENSSL = process.env.OPENSSL_PATH || DEFAULT_OPENSSL;

// 1. Create folder safely if it doesn't exist (Pichler, 2022)
if (!fs.existsSync('certs')) {
  fs.mkdirSync('certs');
}

// 2. Only generate if certs don't exist yet
if (!fs.existsSync('certs/localhost-cert.pem')) {
  if (!path.isAbsolute(OPENSSL) || !fs.existsSync(OPENSSL)) {
    console.error(`openssl not found at ${OPENSSL}. Set OPENSSL_PATH to the full path of openssl.`);
    process.exit(1);
  }

  console.log('Generating certificates...');
  // Note the single slash for Windows/GitBash compatibility on the subject
  // execFileSync passes each argument on its own, with no shell in between (Node.js, n.d.)
  execFileSync(OPENSSL, [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '365',
    '-keyout', 'certs/localhost-key.pem',
    '-out', 'certs/localhost-cert.pem',
    '-subj', '/CN=localhost',
  ], { stdio: 'inherit' });
  console.log('Certs created successfully!');
} else {
  console.log('Certs already exist. Skipping generation.');
}
// Pichler, F., 2022. Self-signed certificates for local HTTPS made easy. Mainmatter blog, [blog] 22 September. Available at: https://mainmatter.com/blog/2022/09/22/selfsigned-certificates-for-development/ [Accessed 7 September 2026].
// Node.js. n.d. Child process: child_process.execFileSync(file[, args][, options]). [online]. Available at: https://nodejs.org/api/child_process.html#child_processexecfilesyncfile-args-options. [Accessed 7 November 2026]
// SonarSource. n.d. Searching OS commands in PATH is security-sensitive (javascript:S4036). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=javascript%3AS4036&rule_key=javascript%3AS4036. [Accessed 7 November 2026]
