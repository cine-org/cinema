# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo prune @repo/web-user --docker

FROM base AS deps
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS builder
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM
ENV NODE_ENV=production
COPY --from=pruner /repo/out/full/ .
COPY apps/api/generated/openapi/schema.json ./apps/api/generated/openapi/schema.json

RUN --mount=type=cache,id=turbo-web-user,target=/repo/.turbo \
    # Secret mount: the Turbo token never lands in a layer or its metadata.
    --mount=type=secret,id=turbo_token,env=TURBO_TOKEN \
    pnpm exec turbo run build --filter=@repo/web-user --cache-dir=.turbo

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Owned by node so Next can write .next/cache (image optimization, ISR) at runtime.
COPY --from=builder --chown=node:node /repo/apps/web-user/public ./apps/web-user/public
COPY --from=builder --chown=node:node /repo/apps/web-user/.next/standalone ./
COPY --from=builder --chown=node:node /repo/apps/web-user/.next/static ./apps/web-user/.next/static

USER node
EXPOSE 3000

CMD ["node", "apps/web-user/server.js"]
