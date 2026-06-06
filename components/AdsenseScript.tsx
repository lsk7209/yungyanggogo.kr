import Script from "next/script";
import { siteConfig } from "../lib/site";

export function AdsenseScript() {
  return (
    <Script
      id="adsense-loader"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.publisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
