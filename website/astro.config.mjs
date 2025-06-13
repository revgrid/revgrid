// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';

// https://astro.build/config
export default defineConfig({
	integrations: [
		sitemap(),
		starlight({
			plugins: [
				// Generate the documentation.
				starlightTypeDoc({
					entryPoints: ['../package/src/code/public-api.ts'],
					tsconfig: '../package/src/code/tsconfig.json',
				}),
			],
			title: 'Revgrid',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/revgrid/revgrid' }],
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				// Add the generated sidebar group to the sidebar.
				typeDocSidebarGroup,
			],
		}),
		mdx(),
	],
});
