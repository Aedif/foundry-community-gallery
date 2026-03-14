const DRAG_DROP_DIRECTORIES = new Set(['RollTable', 'Macro', 'Item', 'Cards', 'JournalEntry', 'Actor']);
const SUPPORTED_PLACEABLES = new Set([
  'AmbientLight',
  'Tile',
  'Drawing',
  'MeasuredTemplate',
  'Token',
  'AmbientSound',
  'Region',
]);
const SUPPORTED_DOCUMENTS = new Set([
  'RollTable',
  'Macro',
  'Item',
  'Cards',
  'JournalEntry',
  'Actor',
  'AmbientLight',
  'Tile',
  'Drawing',
  'MeasuredTemplate',
  'Token',
  'AmbientSound',
  'Region',
]);

// SideBar Directory drop listeners
Hooks.on(`renderDocumentDirectory`, (app, html, context, options) => {
  if (!DRAG_DROP_DIRECTORIES.has(app.documentName)) return;

  if (app._communityGalleryDropListener) return;
  app._communityGalleryDropListener = true;

  html.addEventListener('drop', async (event) => {
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (data.type === 'CommunityGalleryEntry' && data.subtype === app.documentName) {
      const entry = await resolveDropData(data);
      if (entry)
        app.documentClass.createDocuments([foundry.utils.deepClone(entry.data)], { pack: app.collection.collection });
    }
  });
});

Hooks.on('dropCanvasData', async (canvas, data, event) => {
  const { type, subtype } = data;
  let { x, y } = data;
  if (type === 'CommunityGalleryEntry' && SUPPORTED_PLACEABLES.has(subtype)) {
    const entry = await resolveDropData(data);
    if (!entry) return;

    const createData = foundry.utils.deepClone(entry.data);

    const layer = canvas.getLayerByEmbeddedName(subtype);
    if (!layer.active) layer.activate();

    if (!event.shiftKey) {
      const { x: snappedX, y: snappedY } = layer.getSnappedPoint(data);
      x = snappedX;
      y = snappedY;
    }

    if (!canvas.dimensions.rect.contains(x, y)) return;

    const bounds = DataTransformer.calculateDataBounds(subtype, createData);
    const tX = x - bounds.width / 2 - bounds.x;
    const tY = y - bounds.height / 2 - bounds.y;

    if (createData.x !== null) {
      createData.x += tX;
      createData.y += tY;
    }

    if (subtype === 'Region') {
      createData.shapes.forEach((shape) => {
        if (shape.type === 'polygon') {
          for (let i = 0; i < shape.points.length; i += 2) {
            try {
              shape.points[i] += tX;
              shape.points[i + 1] += tY;
            } catch (e) {}
          }
        } else {
          shape.x += tX;
          shape.y += tY;
        }
      });
    }

    if (event.altKey) createData.hidden = true;

    const cls = foundry.utils.getDocumentClass(subtype);
    console.log(cls, createData, canvas);
    cls.create(createData, { parent: canvas.scene });
  }
});

// Insert Upload/Browse header controls for supported documents
Hooks.on('getHeaderControlsDocumentSheetV2', (sheet, controls) => {
  const documentName = sheet.documentName ?? sheet.document?.documentName;
  if (!SUPPORTED_DOCUMENTS.has(documentName)) return;

  controls.push(
    {
      label: 'Community Gallery',
      icon: 'fa-fw fa-solid fa-cloud',
      onClick: () => {
        gallery().then((Gallery) => Gallery.browse({ filter: '@' + docName }));
      },
    },
    {
      label: 'Upload to Gallery',
      icon: 'fa-fw fa-solid fa-cloud-arrow-up',
      onClick: () => {
        const document = sheet.document;
        const documentName = document.documentName;
        gallery().then((Gallery) => {
          const options = {
            title: document.name,
            data: DataTransformer.retrieveCleanDocumentData(document),
            type: documentName,
          };
          if (documentName === 'Item' || documentName === 'Actor') {
            options.dependencies = [game.system.id];
          }
          Gallery.submit(options);
        });
      },
    },
  );
});

async function gallery() {
  // TODO
  CONFIG.CommunityGalleryDebug = true;
  const { default: Gallery } = await import('http://localhost:30000/foundry-gallery/public/foundry-app/gallery.js');

  // const { default: Gallery } = await import('https://gallery.aedif.net/foundry-app/gallery.js');
  return Gallery;
}

async function resolveDropData(data) {
  const Gallery = await gallery();
  return data.entry ?? (await Gallery.resolve(data.id));
}

class DataTransformer {
  static retrieveCleanDocumentData(document) {
    const data = document.toObject();
    delete data._id;
    delete data._stats;
    delete data.folder;
    delete data.ownership;
    if (document.documentName === 'RollTable') {
      data.results?.forEach((r) => {
        delete r._id;
        delete r._stats;
      });
    } else if (document.documentName === 'Item') {
      // TODO is this necessary?
      data.effects?.forEach((ef) => {
        delete ef._id;
        delete ef._stats;
        DataTransformer.cleanFlags(ef);
      });
    }
    // Cleanup flags of in-active modules
    DataTransformer.cleanFlags(data);
    return data;
  }

  static cleanFlags(data) {
    if (!data.flags) return;

    for (const id of Object.keys(data.flags)) {
      if (id === 'world' || id === game.system.id) continue;
      if (!game.modules.get(id)?.active) delete data.flags[id];
    }
  }

  static calculateDataBounds(documentName, data) {
    let x1, y1, x2, y2;

    if (documentName === 'Wall') {
      x1 = Math.min(data.c[0], data.c[2]);
      y1 = Math.min(data.c[1], data.c[3]);
      x2 = Math.max(data.c[0], data.c[2]);
      y2 = Math.max(data.c[1], data.c[3]);
    } else if (documentName === 'Region') {
      x2 = -Infinity;
      y2 = -Infinity;
      x1 = Infinity;
      y1 = Infinity;
      data.shapes?.forEach((shape) => {
        if (shape.points) {
          for (let i = 0; i < shape.points.length; i += 2) {
            let x = shape.points[i];
            let y = shape.points[i + 1];
            x1 = Math.min(x1, x);
            y1 = Math.min(y1, y);
            x2 = Math.max(x2, x);
            y2 = Math.max(y2, y);
          }
        } else {
          x1 = Math.min(x1, shape.x);
          y1 = Math.min(y1, shape.y);
          x2 = Math.max(x2, shape.x + (shape.radiusX ?? shape.width));
          y2 = Math.max(y2, shape.y + (shape.radiusY ?? shape.height));
        }
      });
    } else {
      x1 = data.x || 0;
      y1 = data.y || 0;

      let width, height;
      if (documentName === 'Tile') {
        width = data.width;
        height = data.height;
      } else if (documentName === 'Drawing') {
        width = data.shape.width;
        height = data.shape.height;
      } else if (documentName === 'Token') {
        if (data.flags?.[MODULE_ID]?.width != null) {
          width = data.flags[MODULE_ID].width;
        } else {
          width = data.width;
        }

        if (data.flags?.[MODULE_ID]?.height != null) {
          height = data.flags[MODULE_ID].height;
        } else {
          height = data.height;
        }

        width *= canvas.dimensions.size;
        height *= canvas.dimensions.size;
      } else {
        width = 0;
        height = 0;
      }

      x2 = x1 + (width || 0);
      y2 = y1 + (height || 0);
    }
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  }
}
