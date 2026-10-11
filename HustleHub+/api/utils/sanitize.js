// Escape regex special characters so user search text is matched literally, allowing for special characters,
// which stops regex injection and ReDoS patterns ~> (MDN Web Docs, n.d.)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Remove HTML tags like <script> or <b> from text before it is saved ~> (OWASP, n.d.)
// React already makes text safe when it shows it, so this is just an extra layer
// If the value is not text, send it back as it is so other checks still run
const stripTags = (value) => (typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : value);

module.exports = { escapeRegex, stripTags };

// MDN Web Docs (n.d.) Regular expressions - JavaScript.
//  Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping (Accessed: 8 October 2026).
// OWASP (n.d.) Cross Site Scripting Prevention Cheat Sheet.
//  Available at: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html (Accessed: 11 October 2026).
