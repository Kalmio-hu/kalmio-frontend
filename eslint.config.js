// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ── Kalmio Move import boundary (movement-build-contract.md §2) ───────────────
// Mirrored by src/features/move/boundary.test.ts as a second line of defence.
const MOVE_FEATURE_FILES = ['src/features/move/**/*.{ts,tsx}']
// Files outside the feature that may import from the feature index.
const MOVE_INDEX_IMPORTERS = [
  'src/App.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Settings.tsx',
  'src/pages/admin/MoveReviewQueue.tsx',
  'src/components/layout/*.{ts,tsx}',
  'src/components/OnboardingGate.tsx',
  'src/i18n/index.ts',
]
const NUTRITION_COMPONENT_DIRS =
  '(dashboard|plan|shopping|recipe|recipes|schedule|fridge|grooming|cook|taste|member|family|retail)'

export default defineConfig([globalIgnores(['dist', 'storybook-static']), {
  files: ['**/*.{ts,tsx}'],
  extends: [
    js.configs.recommended,
    tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite,
  ],
  languageOptions: {
    globals: globals.browser,
  },
},
// Storybook config files mix component helpers with config object exports —
// the react-refresh rule does not apply to them (no HMR in .storybook/).
{
  files: ['.storybook/**/*.{ts,tsx}'],
  rules: {
    'react-refresh/only-export-components': 'off',
  },
},
// Block 1 — inside the Move feature: no nutrition pages, nutrition component
// folders or services (except the four shared ones).
{
  files: MOVE_FEATURE_FILES,
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          regex: '^@/pages(/|$)',
          message: 'Move may not import nutrition pages (movement-build-contract.md §2).',
        },
        {
          regex: `^@/components/${NUTRITION_COMPONENT_DIRS}(/|$)`,
          message: 'Move may not import nutrition components (movement-build-contract.md §2).',
        },
        {
          regex: '^@/services/(?!(users|notificationService|momentum|family)$)',
          message: 'Move may import only @/services/users, notificationService, momentum and family (movement-build-contract.md §2).',
        },
      ],
    }],
  },
},
// Block 2 — everything else: the Move feature is reachable through its index
// only, and only from the allow-listed files. Other files may not import it at all.
{
  files: ['src/**/*.{ts,tsx}'],
  ignores: [...MOVE_FEATURE_FILES, ...MOVE_INDEX_IMPORTERS],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          regex: '^@/features/move(/|$)',
          message: 'Only App.tsx, pages/Dashboard.tsx, pages/Settings.tsx, components/layout/*, components/OnboardingGate.tsx and pages/admin/MoveReviewQueue.tsx may import from @/features/move (movement-build-contract.md §2).',
        },
        {
          regex: '^\\.\\.?/.*features/move(/|$)',
          message: 'Import Kalmio Move from @/features/move only (movement-build-contract.md §2).',
        },
      ],
    }],
  },
},
{
  files: MOVE_INDEX_IMPORTERS,
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          regex: '^@/features/move/(?!i18n/move\\.(hu|en)\\.json$)',
          message: 'Import from the Move index (@/features/move) only — no deep imports (movement-build-contract.md §2).',
        },
        {
          regex: '^\\.\\.?/.*features/move/',
          message: 'Import from the Move index (@/features/move) only — no deep imports (movement-build-contract.md §2).',
        },
      ],
    }],
  },
},
...storybook.configs["flat/recommended"]])
