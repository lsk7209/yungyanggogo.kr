import { siteConfig } from "../lib/site";

export function AdsenseScript() {
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.publisherId}`}
      crossOrigin="anonymous"
    />
  );
}
