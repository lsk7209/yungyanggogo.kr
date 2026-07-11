const DASHBOARD_BASE = "https://multi-dashboard-one.vercel.app";
const SITE_URL = "https://yungyanggogo.kr/";
const SITE_KEY = "yungyanggogo";
const SLOT_KEY = "coupang-inline";
const DISCLOSURE =
  "\uc774 \uac8c\uc2dc\ubb3c\uc740 \ucfe0\ud321 \ud30c\ud2b8\ub108\uc2a4 \ud65c\ub3d9\uc758 \uc77c\ud658\uc73c\ub85c, \uc774\uc5d0 \ub530\ub978 \uc77c\uc815\uc561\uc758 \uc218\uc218\ub8cc\ub97c \uc81c\uacf5\ubc1b\uc2b5\ub2c8\ub2e4.";

export function CoupangPartnersBanner() {
  const params = new URLSearchParams({
    siteKey: SITE_KEY,
    slotKey: SLOT_KEY,
    purpose: "public",
    pageUrl: SITE_URL,
  });
  const query = params.toString();

  return (
    <div data-banner-measurement data-banner-measurement-base={DASHBOARD_BASE} data-banner-site-key={SITE_KEY} data-banner-slot-key={SLOT_KEY}>
    <aside className="coupang-partners-banner" data-codex-coupang-banner="1" aria-label="Coupang Partners">
      <a
        className="coupang-partners-banner__link"
        href={`${DASHBOARD_BASE}/api/banner-management/click?${query}`}
        rel="sponsored nofollow noopener noreferrer"
        target="_blank"
      >
        <span>광고</span>
        <img
          alt="쿠팡에서 영양제 추천 상품 보기"
          height="90"
          loading="lazy"
          src={`${DASHBOARD_BASE}/api/banner-management/image?${query}`}
          width="728"
        />
      </a>
      <p>{DISCLOSURE}</p>
    </aside>
      <script src={`${DASHBOARD_BASE}/banner-measurement.js`} defer />
    </div>
  );
}
