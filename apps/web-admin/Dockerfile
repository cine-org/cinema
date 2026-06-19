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
    pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS builder
ARG TURBO_TOKEN
ARG TURBO_TEAM
ENV TURBO_TOKEN=$TURBO_TOKEN
ENV TURBO_TEAM=$TURBO_TEAM
ENV NODE_ENV=production
COPY --from=pruner /repo/out/full/ .
COPY apps/api/generated/openapi/schema.json ./apps/api/generated/openapi/schema.json

ARG NEXT_PUBLIC_API_PREFIX
ARG NEXT_PUBLIC_API_ORIGIN
ENV NEXT_PUBLIC_API_PREFIX=$NEXT_PUBLIC_API_PREFIX
ENV NEXT_PUBLIC_API_ORIGIN=$NEXT_PUBLIC_API_ORIGIN

RUN --mount=type=cache,id=turbo-web-admin,target=/repo/.turbo \
    pnpm exec turbo run build --filter=@repo/web-admin --cache-dir=.turbo

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

COPY --from=builder /repo/apps/web-admin/public ./apps/web-admin/public
COPY --from=builder /repo/apps/web-admin/.next/standalone ./
COPY --from=builder /repo/apps/web-admin/.next/static ./apps/web-admin/.next/static

EXPOSE 80

CMD ["node", "apps/web-admin/server.js"]
