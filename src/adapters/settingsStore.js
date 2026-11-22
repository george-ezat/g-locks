import { LockKey } from '../core/constants.js';

/**
 * Facade over Gio.Settings providing a clean, typed config snapshot
 * and lifecycle-safe change subscriptions.
 */
export class SettingsStore {
    constructor(gioSettings) {
        this._settings = gioSettings;
        this._signalId = 0;
    }

    getSnapshot() {
        return {
            panelPosition: this._settings.get_string('panel-position'),
            [LockKey.CAPS]: {
                enabled: this._settings.get_boolean('capslock-enabled'),
                visibility: this._settings.get_string('capslock-visibility'),
                notification: this._settings.get_string('capslock-notification'),
            },
            [LockKey.NUM]: {
                enabled: this._settings.get_boolean('numlock-enabled'),
                visibility: this._settings.get_string('numlock-visibility'),
                notification: this._settings.get_string('numlock-notification'),
            },
        };
    }

    subscribe(callback) {
        this.unsubscribe();
        this._signalId = this._settings.connect('changed', () => {
            callback(this.getSnapshot());
        });
    }

    unsubscribe() {
        if (this._signalId) {
            this._settings.disconnect(this._signalId);
            this._signalId = 0;
        }
    }

    destroy() {
        this.unsubscribe();
        this._settings = null;
    }
}
