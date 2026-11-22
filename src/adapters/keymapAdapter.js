import Clutter from 'gi://Clutter';
import { LockKey } from '../core/constants.js';

/**
 * Adapter isolating Clutter.Keymap access across GNOME 47-50 and GNOME 51+.
 * Zero polling: strictly event-driven via 'state-changed'.
 */
export class KeymapAdapter {
    constructor(actor = null) {
        this._keymap = this._resolveKeymap(actor);
        this._signalId = 0;
    }

    _resolveKeymap(actor) {
        // GNOME 51+ removed Clutter.get_default_backend() in favor of actor.get_context().
        if (actor && typeof actor.get_context === 'function') {
            const context = actor.get_context();
            if (context)
                return context.get_backend().get_default_seat().get_keymap();
        }
        return Clutter.get_default_backend().get_default_seat().get_keymap();
    }

    readState() {
        return {
            [LockKey.CAPS]: this._keymap.get_caps_lock_state(),
            [LockKey.NUM]: this._keymap.get_num_lock_state(),
        };
    }

    subscribe(callback) {
        this.unsubscribe();
        this._signalId = this._keymap.connect('state-changed', () => {
            callback(this.readState());
        });
    }

    unsubscribe() {
        if (this._signalId && this._keymap) {
            this._keymap.disconnect(this._signalId);
            this._signalId = 0;
        }
    }

    destroy() {
        this.unsubscribe();
        this._keymap = null;
    }
}
