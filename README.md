![GitHub Latest Version](https://img.shields.io/github/v/release/Aedif/foundry-community-gallery?sort=semver)
![GitHub Latest Release](https://img.shields.io/github/downloads/Aedif/foundry-community-gallery/latest/foundry-community-gallery.zip)
![GitHub All Releases](https://img.shields.io/github/downloads/Aedif/foundry-community-gallery/foundry-community-gallery.zip)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ffoundry-community-gallery)](https://forge-vtt.com/bazaar#package=foundry-community-gallery)

# Foundry Community Gallery

A supplementary module to https://gallery.aedif.net/

- ## Register drop-listeners
- Insert controls to document sheets

### Developers

If you wish to simply render the browse and submit forms this module is not necessary.

API can be accessed dynamically via:

```js
	const { default: Gallery } = await import('https://gallery.aedif.net/foundry-app/gallery.js');
	Gallery.browse({ filter: '@"TMFX Preset"' });
  Gallery.submit({
		title: , // optional
		data: preset, // optional
		tags: Array.from(tags), // optional
		dependencies: ['tokenmagic'], // optional
		type: 'TMFX Preset', // optional
	});
```
