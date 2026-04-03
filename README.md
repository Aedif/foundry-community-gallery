![GitHub Latest Version](https://img.shields.io/github/v/release/Aedif/foundry-community-gallery?sort=semver)
![GitHub Latest Release](https://img.shields.io/github/downloads/Aedif/foundry-community-gallery/latest/community-gallery.zip)
![GitHub All Releases](https://img.shields.io/github/downloads/Aedif/foundry-community-gallery/community-gallery.zip)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fcommunity-gallery)](https://forge-vtt.com/bazaar#package=community-gallery)

# Foundry Community Gallery

A supplementary module to https://gallery.aedif.net/, a gallery of user submitted data structures.

Adds support for upload and browsing of the following documents:

- AmbientLight
- AmbientSound
- Tile
- Drawing
- MeasuredTemplate
- Token
- Region

The sheets/forms of these documents will have header controls added to them to open an upload form to allow document submission to the gallery:

<img width="auto" height="512" alt="image" src="https://github.com/user-attachments/assets/ed409128-530c-477a-b41e-a75648ac0b52" />

Placeables such as Tiles and Ambient Lights will be inserted with a button to open up the gallery browser:

<img width="307" height="250" alt="image" src="https://github.com/user-attachments/assets/4b07ee95-7052-43bf-be33-daa83f82f2e2" />

Gallery entries can be dragged on to the canvas:

TODO (RECORD VIDEO OF LIGHTS being dropped in)

## Developers

This module is not a dependency if you wish to render the browser and submit forms.

API can be imported dynamically.

Bellow is an example of the browser and submit form being opened for the [TokenMagic FX](https://foundryvtt.com/packages/tokenmagic/) module's effect presets.

```js
const { default: Gallery } = await import('https://gallery.aedif.net/foundry-app/gallery.js');

Gallery.browse({
  window: {
    title: 'TMFX Filter Gallery',
  },
  filter: '@"TMFX Preset"' });
Gallery.submit({
  data: [ ... ],
  tags: ['xfire', 'bloom'],
  dependencies: ['tokenmagic'],
  type: 'TMFX Preset',
});
```

`Gallery.browse` and `Gallery.submit` accept all the usual `ApplicationV2` options in addition to:

### Gallery.browse

- `filter` accepts a string used to filter gallery entries
    - `@` prefix for type search
    - `#` prefix for tag search
    - `AND`/`OR`/`()` can be used to build complex filters (e.g. `red AND ( @AmbientLight OR #crimson )`)

\* _This filter is not visible within the opened app_

### Gallery.submit

- `title`
- `author`
- `description`
- `tags` array of string tags
- `data` data to be submitted
- `type` type associated with the `data`
- `dependencies` game system and module IDs which this submission is dependent on

### Drop Event/Data

Gallery drop events are encoded as:
`{ type: "CommunityGalleryEntry", subtype: "{{entry_type}}", src: {{url}} }`

Listener/Handler Example:

```js
html.addEventListener('drop', (event) => {
   const { type, subtype, src } = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
   if (type === 'CommunityGalleryEntry' && subtype === 'SomeType') {
      const response = await fetch(src);
      const entry = await response.json();
      console.log(entry);
    }
});
```
