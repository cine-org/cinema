# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS runner
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /repo

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --filter @repo/database --no-frozen-lockfile --ignore-scripts

COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/prisma.config.ts ./packages/database/prisma.config.ts

WORKDIR /repo/packages/database

CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]
