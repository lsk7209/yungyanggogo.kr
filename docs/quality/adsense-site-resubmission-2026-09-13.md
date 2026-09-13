# AdSense review checkpoint — 2026-09-13

Status: **needs review; resubmission state not checked**.

## Local gates

- [x] Publisher ID in `public/ads.txt` matches `lib/site.ts`.
- [x] Ad loading is opt-in and limited to existing nutrition-detail records.
- [x] About, contact, privacy, terms and editorial-policy pages exist and passed the local production smoke.
- [x] Robots, sitemap, feed and canonical output passed the representative local sample.
- [x] Homepage canonical inheritance on 404 responses is repaired and regression-tested.
- [ ] Continue legacy-content replacement/merge review; do not expose generated rows merely to increase page count.

## External gates not verified

- [ ] Current AdSense account/review/rejection state.
- [ ] Live deployment parity with this checkout.
- [ ] Regional consent/CMP and privacy-message behavior.
- [ ] Real AdSense crawler access and live ad-request behavior.
- [ ] Search Console index coverage and submitted sitemap state.

This checkpoint does not estimate approval probability and does not authorize submission.
