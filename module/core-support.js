import { ButtonInsertionSettings } from './apps/buttonInsertion.js';
import { GalleryUtils, DataTransformer } from './utils.js';

export const DRAG_DROP_DIRECTORIES = ['RollTable', 'Macro', 'Item', 'Cards', 'JournalEntry', 'Actor'];
export const SUPPORTED_PLACEABLES = [
    'AmbientLight',
    'Tile',
    'Drawing',
    'MeasuredTemplate',
    'Token',
    'AmbientSound',
    'Region',
];
export const SUPPORTED_DOCUMENTS = [...SUPPORTED_PLACEABLES, ...DRAG_DROP_DIRECTORIES];

/**
 * Register supporting hooks for core foundry document sheets
 */
export function registerCoreSupport() {
    ButtonInsertionSettings.register();

    // Document Directory drop listener
    // Gallery entries dropped on directories will be created as documents within them
    Hooks.on(`renderDocumentDirectory`, (app, html, context, options) => {
        if (!DRAG_DROP_DIRECTORIES.includes(app.documentName)) return;

        if (app._communityGalleryDropListener) return;
        app._communityGalleryDropListener = true;

        html.addEventListener('drop', async (event) => {
            const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
            if (data.type === 'CommunityGalleryEntry' && data.subtype === app.documentName) {
                const entry = await GalleryUtils.resolveDropData(data);
                if (!entry) return;
                if (!GalleryUtils.verifyDependencies(entry)) return;
                app.documentClass.createDocuments([foundry.utils.deepClone(entry.data)], {
                    pack: app.collection.collection,
                });
            }
        });
    });

    // Canvas Drop hook
    // Entries subtyped as placeable documents will be created on canvas drop
    Hooks.on('dropCanvasData', async (canvas, data, event) => {
        const { type, subtype } = data;
        let { x, y } = data;
        if (type === 'CommunityGalleryEntry' && SUPPORTED_PLACEABLES.includes(subtype)) {
            const entry = await GalleryUtils.resolveDropData(data);
            if (!entry) return;
            if (!GalleryUtils.verifyDependencies(entry)) return;

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
            cls.create(createData, { parent: canvas.scene });
        }
    });

    // Supported document sheets will have 'Upload' and 'Browse Gallery' buttons added to them
    Hooks.on('getHeaderControlsDocumentSheetV2', (sheet, controls) => {
        const documentName = sheet.documentName ?? sheet.document?.documentName;
        if (!SUPPORTED_DOCUMENTS.includes(documentName)) return;

        controls.push({
            label: game.i18n.localize('COMMUNITY_GALLERY.GalleryButtons.SheetUpload'),
            icon: 'fa-fw fa-solid fa-cloud-arrow-up',
            onClick: () => {
                const document = sheet.document;
                const documentName = document.documentName;
                GalleryUtils.gallery().then((Gallery) => {
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
        });
    });
}
