import { DRAG_DROP_DIRECTORIES, SUPPORTED_DOCUMENTS, SUPPORTED_PLACEABLES } from '../core-support.js';
import { GalleryUtils, MODULE_ID } from '../utils.js';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class ButtonInsertionSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    static #settingKey = 'galleryButtonInsertion';

    /** @override */
    static DEFAULT_OPTIONS = {
        tag: 'form',
        window: {
            title: 'COMMUNITY_GALLERY.GalleryButtons.SettingLabel',
            icon: 'fas fa-cog',
            contentClasses: ['standard-form'],
        },
        position: {
            width: 400,
        },
        classes: [],
        form: {
            handler: ButtonInsertionSettings._onSubmit,
            submitOnChange: false,
            closeOnSubmit: true,
        },
        actions: {},
    };

    /** @override */
    static PARTS = {
        documents: { template: `modules/${MODULE_ID}/templates/documents.hbs` },
        footer: { template: 'templates/generic/form-footer.hbs' },
    };

    /** @override */
    async _preparePartContext(partId, context, options) {
        context.partId = partId;
        switch (partId) {
            case 'documents':
                const enabledDocuments = game.settings.get(MODULE_ID, ButtonInsertionSettings.#settingKey);
                context.documents = SUPPORTED_DOCUMENTS.reduce((obj, p) => {
                    obj[p] = Boolean(enabledDocuments[p]);
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
        const currentSettings = game.settings.get(MODULE_ID, ButtonInsertionSettings.#settingKey);
        game.settings.set(
            MODULE_ID,
            ButtonInsertionSettings.#settingKey,
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
            default: SUPPORTED_DOCUMENTS.reduce((obj, val) => {
                obj[val] = true;
                return obj;
            }, {}),
            requiresReload: true,
        });
        game.settings.registerMenu(MODULE_ID, this.#settingKey, {
            name: game.i18n.localize('COMMUNITY_GALLERY.GalleryButtons.SettingLabel'),
            icon: 'fas fa-cog',
            label: '',
            hint: game.i18n.localize('COMMUNITY_GALLERY.GalleryButtons.SettingHint'),
            type: ButtonInsertionSettings,
            restricted: true,
        });

        /* Insert browser buttons into the scene layer controls. */
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
                    title: game.i18n.localize('COMMUNITY_GALLERY.GalleryButtons.ControlTooltip'),
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

        /* Insert browser buttons into the sidebar.  */
        Hooks.on(`renderDocumentDirectory`, (app, html, context, options) => {
            if (!DRAG_DROP_DIRECTORIES.includes(app.documentName)) return;
            if (html.querySelector('.community-gallery-button')) return;

            const enabledDocuments = game.settings.get(MODULE_ID, ButtonInsertionSettings.#settingKey);
            if (!enabledDocuments[app.documentName]) return;

            const searchEl = html.querySelector('.directory-header search');
            if (!searchEl) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('community-gallery-button', 'inline-control', 'icon', 'fa-solid', 'fa-globe');
            button.dataset.tooltip = game.i18n.localize('COMMUNITY_GALLERY.GalleryButtons.ControlTooltip');

            searchEl.appendChild(button);

            button.addEventListener('click', () => {
                GalleryUtils.gallery().then((Gallery) => {
                    Gallery.browse({ filter: '@' + app.documentName });
                });
            });
        });
    }
}
