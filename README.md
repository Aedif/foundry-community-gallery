![GitHub Latest Version](https://img.shields.io/github/v/release/Aedif/foundry-community-gallery?sort=semver)
![GitHub Latest Release](https://img.shields.io/github/downloads/Aedif/foundry-community-gallery/latest/foundry-community-gallery.zip)
![GitHub All Releases](https://img.shields.io/github/downloads/Aedif/foundry-community-gallery/foundry-community-gallery.zip)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ffoundry-community-gallery)](https://forge-vtt.com/bazaar#package=foundry-community-gallery)

# Foundry Community Gallery

A supplementary module to https://gallery.aedif.net/, a gallery of user submitted data structures.

Adds support for upload and browsing of the following documents:

- RollTable
- Macro
- Item
- Cards
- JournalEntry
- Actor
- AmbientLight
- Tile
- Drawing
- MeasuredTemplate
- Token
- AmbientSound
- Region

Each of these document sheets will have header controls added to open the Upload & Browser forms.

In addition drag and drop from the gallery to the canvas or document directory will result in document creation.

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

A slightly flickering candle light.
5ft Bright - 10ft Dim

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
