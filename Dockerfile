# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:24.21.0-trixie-slim@sha256:173f125896c3b47ddf056734c7ea789d04595a6a08769a8f78e0df642781fb66
FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS builder
ARG REVISION=unknown
ENV NODE_ENV=production NEXT_STANDALONE=true NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SITE_URL=https://yungyanggogo.kr \
    NEXT_PUBLIC_ANALYTICS_ENABLED=false NEXT_PUBLIC_ADSENSE_ENABLED=false
COPY . .
# No production DB or provider credentials are accepted by this staging build.
RUN npm run build

FROM ${NODE_IMAGE} AS runtime
ARG REVISION=unknown
LABEL org.opencontainers.image.revision=${REVISION}
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx
RUN groupadd --gid 1001 nextjs && useradd --uid 1001 --gid nextjs --no-create-home nextjs
COPY --from=builder --chown=1001:1001 /app/.next/standalone ./
COPY --from=builder --chown=1001:1001 /app/.next/static ./.next/static
COPY --from=builder --chown=1001:1001 /app/public ./public
COPY --from=builder --chown=1001:1001 /app/content/blog ./content/blog
COPY --from=builder --chown=1001:1001 /app/content/editorial-data ./content/editorial-data
COPY --chown=1001:1001 scripts/migration/healthcheck.cjs ./healthcheck.cjs
COPY --chown=1001:1001 scripts/migration/staging-server.cjs ./staging-server.cjs
USER 1001:1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 CMD ["node", "healthcheck.cjs"]
CMD ["node", "server.js"]
