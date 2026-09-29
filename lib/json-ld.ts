// JSON-LD is injected with dangerouslySetInnerHTML. Source-derived strings
// (food names, makers, post titles) must not be able to close the <script>
// element or start an HTML comment, so escape the HTML-significant characters.
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
