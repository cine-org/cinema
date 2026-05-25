# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo prune @repo/integration --docker

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
COPY --from=pruner /repo/out/full/ .
RUN --mount=type=cache,id=turbo-integration,target=/repo/.turbo \
    pnpm exec turbo run build --filter=@repo/integration --cache-dir=.turbo
RUN printf 'inject-workspace-packages=true\n' >> .npmrc
RUN pnpm --filter @repo/integration --prod deploy /deploy

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /deploy .
CMD ["node", "dist/src/main"]
