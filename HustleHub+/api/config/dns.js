const dns = require('dns');

// Use custom DNS servers only when DNS_SERVERS is set in .env, for example DNS_SERVERS=8.8.8.8,8.8.4.4
// Some home networks can't look up the Atlas mongodb+srv address, so a public DNS server can be set here.
// The addresses live in .env, not in the code, so each machine can choose its own ~> (SonarSource, n.d.; Node.js, n.d.)
const applyDnsServers = () => {
    const servers = (process.env.DNS_SERVERS || '')
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean);

    // When nothing is set, Node keeps using the computer's normal DNS servers
    if (servers.length > 0) dns.setServers(servers);
    return servers;
};

module.exports = { applyDnsServers };

// Node.js. n.d. DNS: dns.setServers(servers). [online]. Available at: https://nodejs.org/api/dns.html#dnssetserversservers. [Accessed 7 November 2026]
// SonarSource. n.d. Using hardcoded IP addresses is security-sensitive (javascript:S1313). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=javascript%3AS1313&rule_key=javascript%3AS1313. [Accessed 7 November 2026]
