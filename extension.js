import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import { LockKey } from './src/core/constants.js';
import { StateEngine } from './src/core/stateEngine.js';
import { resolveNotifications, resolveRenderModel } from './src/core/visibilityPolicy.js';
import { IconRepository } from './src/adapters/iconRepository.js';
import { KeymapAdapter } from './src/adapters/keymapAdapter.js';
import { NotificationRouter } from './src/adapters/notifier.js';
import { SettingsStore } from './src/adapters/settingsStore.js';
import { LockIndicator } from './src/ui/indicator.js';

/**
 * Composition Root: wires core logic, GNOME adapters, and UI view,
 * and guarantees clean teardown on disable().
 */
export default class GLocksExtension extends Extension {
    enable() {
        this._settingsStore = new SettingsStore(this.getSettings());
        this._iconRepo = new IconRepository(this.dir);
        this._notifier = new NotificationRouter(this._iconRepo, this.metadata.name);

        this._panelPosition = this._settingsStore.getSnapshot().panelPosition;
        this._mountIndicator(this._panelPosition);

        this._keymap = new KeymapAdapter(this._indicator);
        this._stateEngine = new StateEngine(this._keymap.readState());

        this._keymap.subscribe(nextState => this._onKeymapChanged(nextState));
        this._settingsStore.subscribe(config => this._onSettingsChanged(config));
        this._iconRepo.subscribeThemeChange(() => this._render());

        this._render();
    }

    _mountIndicator(position) {
        this._indicator?.destroy();
        this._indicator = new LockIndicator(
            this._iconRepo,
            () => this.openPreferences()
        );
        Main.panel.addToStatusArea(this.uuid, this._indicator, 1, position);
    }

    _onSettingsChanged(config) {
        if (config.panelPosition !== this._panelPosition) {
            this._panelPosition = config.panelPosition;
            this._mountIndicator(this._panelPosition);
        }
        this._render();
    }

    disable() {
        this._keymap?.destroy();
        this._keymap = null;

        this._settingsStore?.destroy();
        this._settingsStore = null;

        this._notifier?.destroy();
        this._notifier = null;

        this._indicator?.destroy();
        this._indicator = null;

        this._iconRepo?.destroy();
        this._iconRepo = null;

        this._stateEngine = null;
    }

    _onKeymapChanged(nextState) {
        const changes = this._stateEngine.transition(nextState);
        if (changes.length === 0)
            return;

        const config = this._settingsStore.getSnapshot();
        const events = resolveNotifications(changes, config);

        for (const event of events) {
            const label = event.key === LockKey.CAPS ? _('Caps Lock') : _('Num Lock');
            const status = event.active ? _('On') : _('Off');
            this._notifier.dispatch(event.mode, `${label} ${status}`, event.iconName);
        }

        this._render();
    }

    _render() {
        const state = this._stateEngine.getState();
        const config = this._settingsStore.getSnapshot();
        const model = resolveRenderModel(state, config);
        this._indicator.render(model);
    }
}
