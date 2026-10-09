// Escape regex special characters so user search text is matched literally, allowing for special characters,
// which stops regex injection and ReDoS patterns ~> (MDN Web Docs, n.d.)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { escapeRegex };

// MDN Web Docs (n.d.) Regular expressions - JavaScript.
//  Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping (Accessed: 8 October 2026).
