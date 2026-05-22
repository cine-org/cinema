import { basePreset } from '@repo/eslint-config/base';
import { nodePreset } from '@repo/eslint-config/node';
import { reactPreset } from '@repo/eslint-config/react';
import { javascriptPreset } from '@repo/eslint-config/js';
import { toolingPreset } from '@repo/eslint-config/tooling';

export default [
  ...basePreset([
    // global
  ]),
  ...nodePreset([
    'apps/api',
    'apps/scheduler',
    'apps/worker',
    'apps/integration',
    'modules',
    'packages',
    //
  ]),
  ...reactPreset([
    'apps/web-user',
    'apps/web-admin',
    //
  ]),
  ...javascriptPreset([
    // global
  ]),
  ...toolingPreset([
    'tooling',
    //
  ]),
];
