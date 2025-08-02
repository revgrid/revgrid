// @ts-check

import eslint from '@eslint/js';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    {
        ignores: [
            'eslint.config.mjs',
            'webpack.bundles.js',
            'webpack.docs-dev.js',
            'docs/**/*',
            'lib/**/*.ts',
            'dist/**/*',
            'test-app/**/out-tsc/**/*',
            'test-app/**/*.js',
        ],
    },
    {
        files: ['src/code/**/*.ts', 'test-app/**/*.ts'],
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
                projectService: true,
            },
        },
        settings: {
            'import-x/resolver-next': [
                createTypeScriptImportResolver(),
            ],
        },

        rules: {
            // "no-underscore-dangle": "off",
            // "prefer-arrow/prefer-arrow-functions": "off",
            // "newline-after-description": "off",

            "brace-style": ["error", "1tbs", {
                allowSingleLine: true,
            }],

            "no-constant-condition": ["error", {
                checkLoops: false,
            }],
            "quotes": ["error",
                "single", {"avoidEscape": true, "allowTemplateLiterals": true }
            ],
            "@typescript-eslint/consistent-type-definitions": "error",
            "@typescript-eslint/no-unnecessary-condition": ["error", {
                allowConstantLoopConditions: true,
            }],
            "@typescript-eslint/no-confusing-void-expression": ["error", {
                ignoreArrowShorthand: true,
            }],
            "@typescript-eslint/naming-convention": ["error", {
                selector: "enumMember",
                format: null,
            }],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/restrict-template-expressions": ["error", {
                allowNumber: true,
            }],
            "@typescript-eslint/no-invalid-void-type": ["warn", {
                allowAsThisParameter: true,
            }],
            "@typescript-eslint/prefer-nullish-coalescing": ["off", {
                ignoreTernaryTests: true,
            }],
            "@typescript-eslint/preferprefer-optional-chain": ["warn", {
                checkBoolean: true,
            }],
            // "@typescript-eslint/no-empty-object-type": ["warn", {
            //     allowInterfaces: 'always',
            // }],

            "@typescript-eslint/member-ordering": ["warn", {
                default: [
                    "signature",
                    "call-signature",
                    "public-static-field",
                    "protected-static-field",
                    "private-static-field",
                    "public-decorated-field",
                    "protected-decorated-field",
                    "private-decorated-field",
                    "public-instance-field",
                    "protected-instance-field",
                    "private-instance-field",
                    "public-abstract-field",
                    "protected-abstract-field",
                    "public-field",
                    "protected-field",
                    "private-field",
                    "private-field",
                    "static-field",
                    "instance-field",
                    "abstract-field",
                    "decorated-field",
                    "field",
                    "static-initialization",
                    "public-constructor",
                    "protected-constructor",
                    "private-constructor",
                    "constructor",
                    ["public-static-get", "public-static-set"],
                    ["protected-static-get", "protected-static-set"],
                    ["private-static-get", "private-static-set"],
                    ["public-decorated-get", "public-decorated-set"],
                    ["protected-decorated-get", "protected-decorated-set"],
                    ["private-decorated-get", "private-decorated-set"],
                    ["public-instance-get", "public-instance-set"],
                    ["protected-instance-get", "protected-instance-set"],
                    ["private-instance-get", "private-instance-set"],
                    ["public-abstract-get", "public-abstract-set"],
                    ["protected-abstract-get", "protected-abstract-set"],
                    ["public-get", "public-set"],
                    ["protected-get", "protected-set"],
                    ["private-get", "private-set"],
                    ["static-get", "static-set"],
                    ["instance-get", "instance-set"],
                    ["abstract-get", "abstract-set"],
                    ["decorated-get", "decorated-set"],
                    ["get", "set"],
                    "public-static-method",
                    "protected-static-method",
                    "private-static-method",
                    "public-decorated-method",
                    "protected-decorated-method",
                    "private-decorated-method",
                    "public-instance-method",
                    "protected-instance-method",
                    "private-instance-method",
                    "public-abstract-method",
                    "protected-abstract-method",
                    "public-method",
                    "protected-method",
                    "private-method",
                    "static-method",
                    "instance-method",
                    "abstract-method",
                    "decorated-method",
                    "method",
                ],
            }],

            // "@typescript-eslint/non-nullable-type-assertion-style": "off",
            // "@typescript-eslint/dot-notation": "off",

            // "@typescript-eslint/explicit-member-accessibility": ["off", {
            //     accessibility: "explicit",
            // }],

            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/prefer-for-of": "off",

            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error", {
                args: "none",
                varsIgnorePattern: "[iI]gnored",
                argsIgnorePattern: "^_",
            }],

            "no-shadow": "off",
            "@typescript-eslint/no-shadow": ["error", {
                ignoreTypeValueShadow: true,
            }],

            "no-return-await": "off",
            "@typescript-eslint/return-await": "error",
            "import-x/no-cycle": ["error"],
        },
    },
);
