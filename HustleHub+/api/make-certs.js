const fs = require('fs');
const { execSync } = require('child_process');

// 1. Create folder safely if it doesn't exist (Pichler, 2022)
if (!fs.existsSync('certs')) {
  fs.mkdirSync('certs');
}

// 2. Only generate if certs don't exist yet
if (!fs.existsSync('certs/localhost-cert.pem')) {
  console.log('Generating certificates...');
  // Note the single slash for Windows/GitBash compatibility on the subject
  execSync("openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 -keyout certs/localhost-key.pem -out certs/localhost-cert.pem -subj /CN=localhost", { stdio: 'inherit' });
  console.log('Certs created successfully!');
} else {
  console.log('Certs already exist. Skipping generation.');
}
// Pichler, F., 2022. Self-signed certificates for local HTTPS made easy. Mainmatter blog, [blog] 22 September. Available at: https://mainmatter.com/blog/2022/09/22/selfsigned-certificates-for-development/ [Accessed 7 September 2026].
