"use client";

import { usePathname } from "next/navigation";
import { canRequestAdsForPath, isAdsenseRuntimeEnabled } from "../lib/ad-policy";
import { siteConfig } from "../lib/site";

export function AdsenseScript() {
  const pathname = usePathname();
  if (!isAdsenseRuntimeEnabled() || !canRequestAdsForPath(pathname)) {
    return null;
  }

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.publisherId}`}
      crossOrigin="anonymous"
    />
  );
}
