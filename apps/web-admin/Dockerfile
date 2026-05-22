# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo prune @repo/web-admin --docker

FROM base AS deps
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --no-frozen-lockfile --ignore-scripts

FROM deps AS builder
ARG TURBO_TOKEN
ARG TURBO_TEAM
ENV TURBO_TOKEN=$TURBO_TOKEN
ENV TURBO_TEAM=$TURBO_TEAM
ENV NODE_ENV=production
COPY --from=pruner /repo/out/full/ .
RUN --mount=type=cache,id=turbo-web-admin,target=/repo/.turbo \
    pnpm exec turbo run build --filter=@repo/web-admin --cache-dir=.turbo

FROM nginx:alpine AS runner
COPY --from=builder /repo/apps/web-admin/dist /usr/share/nginx/html
COPY --from=builder /repo/apps/web-admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/web-admin/scripts/write-runtime-config.sh /docker-entrypoint.d/40-write-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-write-runtime-config.sh
EXPOSE 80
