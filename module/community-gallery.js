import { GalleryUtils, MODULE_ID } from './utils.js';
import { registerCoreSupport } from './core-support.js';

Hooks.on('init', () => {
    registerCoreSupport();
    game.modules.get(MODULE_ID).api = {
        utils: GalleryUtils,
    };
});
