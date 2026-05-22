# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
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
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY --from=pruner /repo/out/full/ .
RUN pnpm --filter @repo/web-admin build

FROM nginx:alpine AS runner
COPY --from=builder /repo/apps/web-admin/dist /usr/share/nginx/html
COPY --from=builder /repo/apps/web-admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
