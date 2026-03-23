export const MODULE_ID = 'community-gallery';

/**
 * Data processing utilities
 */
export class DataTransformer {
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
                width = data.width;
                height = data.height;

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

export class GalleryUtils {
    /**
     * Retrieve gallery API
     * @returns {GalleryAPI}
     */
    static async gallery() {
        CONFIG.CommunityGalleryDebug = true;

        const { default: Gallery } =
            await import('http://localhost:30000/foundry-gallery/public/foundry-app/gallery.js');

        // const { default: Gallery } = await import('https://gallery.aedif.net/foundry-app/gallery.js');
        return Gallery;
    }

    /**
     * Resolved drag/drop data as a full Gallery entry
     * @param {object} data
     * @returns {object}
     */
    static async resolveDropData(data) {
        const response = await fetch(data.src);
        const entry = await response.json();
        return entry;
    }

    /**
     * Verify whether the gallery entry meets all dependency requirements
     * @param {object} entry
     * @returns
     */
    static verifyDependencies(entry) {
        const missingDependencyWarnings = [];
        if (entry.system.dependency && game.system.id !== entry.system.id) {
            missingDependencyWarnings.push('Game system: ' + game.system.id);
        }
        for (const id of entry.dependencies) {
            if (!game.modules.get(id)?.active) {
                missingDependencyWarnings.push('Module: ' + id);
            }
        }
        if (missingDependencyWarnings.length) {
            ui.notifications.warn('Gallery Entry contains missing dependencies.');
            missingDependencyWarnings.forEach((warn) => {
                ui.notifications.warn(warn);
            });
            return false;
        }
        return true;
    }
}
