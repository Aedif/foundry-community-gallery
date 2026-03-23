import { SUPPORTED_PLACEABLES } from '../core-support.js';
import { GalleryUtils, MODULE_ID } from '../utils.js';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class SceneControlButtonSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    static #settingKey = 'sceneControlButtons';

    /** @override */
    static DEFAULT_OPTIONS = {
        tag: 'form',
        window: {
            title: 'Scene Control Buttons',
            icon: 'fas fa-cog',
            contentClasses: ['standard-form'],
        },
        position: {
            width: 400,
        },
        classes: [],
        form: {
            handler: SceneControlButtonSettings._onSubmit,
            submitOnChange: false,
            closeOnSubmit: true,
        },
        actions: {},
    };

    /** @override */
    static PARTS = {
        layers: { template: `modules/${MODULE_ID}/templates/layers.hbs` },
        footer: { template: 'templates/generic/form-footer.hbs' },
    };

    /** @override */
    async _preparePartContext(partId, context, options) {
        context.partId = partId;
        switch (partId) {
            case 'layers':
                const enabledLayers = game.settings.get(MODULE_ID, SceneControlButtonSettings.#settingKey);
                context.layers = SUPPORTED_PLACEABLES.reduce((obj, p) => {
                    obj[p] = Boolean(enabledLayers[p]);
                    return obj;
                }, {});
                break;
            case 'footer':
                context.buttons = [
                    {
                        type: 'submit',
                        icon: 'fa-solid fa-floppy-disk',
                        label: 'Save Changes',
                    },
                ];
                break;
        }
        return context;
    }

    /**
     * Process form data
     */
    static async _onSubmit(event, form, formData) {
        const currentSettings = game.settings.get(MODULE_ID, SceneControlButtonSettings.#settingKey);
        game.settings.set(
            MODULE_ID,
            SceneControlButtonSettings.#settingKey,
            foundry.utils.mergeObject(currentSettings, formData.object),
        );
    }

    /**
     * Register settings and hooks for controlling scene control insertion
     */
    static register() {
        game.settings.register(MODULE_ID, this.#settingKey, {
            scope: 'world',
            config: false,
            type: Object,
            default: SUPPORTED_PLACEABLES.reduce((obj, val) => {
                obj[val] = true;
                return obj;
            }, {}),
            requiresReload: true,
        });
        game.settings.registerMenu(MODULE_ID, this.#settingKey, {
            name: game.i18n.localize('COMMUNITY_GALLERY.SceneControls.SettingLabel'),
            icon: 'fas fa-cog',
            label: '',
            hint: game.i18n.localize('COMMUNITY_GALLERY.SceneControls.SettingHint'),
            type: SceneControlButtonSettings,
            restricted: true,
        });

        Hooks.on('getSceneControlButtons', (controls) => {
            const enabledLayers = game.settings.get(MODULE_ID, this.#settingKey);
            const layers = SUPPORTED_PLACEABLES.filter((name) => enabledLayers[name]).map(
                (name) => CONFIG[name].layerClass.layerOptions.name,
            );
            for (const [layer, options] of Object.entries(controls)) {
                if (!layers.includes(layer)) continue;

                const order = options.tools.clear?.order
                    ? options.tools.clear.order - 0.1
                    : Math.max.apply(
                          Math,
                          Object.values(options.tools).map((t) => t.order),
                      ) + 1;
                options.tools.communityGallery = {
                    name: 'communityGallery',
                    order,
                    title: game.i18n.localize('COMMUNITY_GALLERY.SceneControls.ControlTooltip'),
                    icon: 'fa-solid fa-globe',
                    visible: game.user.isGM,
                    active: false,
                    button: true,
                    onChange: () => {
                        GalleryUtils.gallery().then((Gallery) => {
                            Gallery.browse({ filter: '@' + canvas[layer].documentCollection.documentName });
                        });
                    },
                };
            }
        });
    }
}
