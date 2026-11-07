// Escape regex special characters so user search text is matched literally, allowing for special characters,
// which stops regex injection and ReDoS patterns ~> (MDN Web Docs, n.d.a)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Remove HTML tags like <script> or <b> from text before it is saved ~> (OWASP, n.d.a)
// React already makes text safe when it shows it, so this is just an extra layer
// If the value is not text, send it back as it is so other checks still run
// Walks the text once with indexOf instead of a regex, so long text full of '<' cannot slow it down ~> (SonarSource, n.d.; OWASP, n.d.b; MDN Web Docs, n.d.b)
const removeTags = (text) => {
    let result = '';
    let pos = 0;
    while (pos < text.length) {
        const open = text.indexOf('<', pos);
        if (open === -1) break;
        const close = text.indexOf('>', open);
        if (close === -1) break; // A '<' with no '>' after it is not a tag, so keep the rest
        result += text.slice(pos, open);
        pos = close + 1;
    }
    return result + text.slice(pos);
};
const stripTags = (value) => (typeof value === 'string' ? removeTags(value) : value);

module.exports = { escapeRegex, stripTags };

// MDN Web Docs (n.d.a) Regular expressions - JavaScript.
//  Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping (Accessed: 8 October 2026).
// OWASP (n.d.a) Cross Site Scripting Prevention Cheat Sheet.
//  Available at: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html (Accessed: 11 October 2026).

// MDN Web Docs. n.d.b. String.prototype.indexOf(). [online]. Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf. [Accessed 7 November 2026]
// OWASP. n.d.b. Regular expression Denial of Service - ReDoS. [online]. Available at: https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS. [Accessed 7 November 2026]
// SonarSource. n.d. Regular expressions should not cause non-linear backtracking (javascript:S8786). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=javascript%3AS8786&rule_key=javascript%3AS8786. [Accessed 7 November 2026]
