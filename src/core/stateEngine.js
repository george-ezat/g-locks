import { LockKey } from './constants.js';

/**
 * Pure State Machine that tracks lock-key transitions and emits exact diffs.
 * Contains zero GNOME/GObject dependencies for fast deterministic testing.
 */
export class StateEngine {
    constructor(initialState = { [LockKey.CAPS]: false, [LockKey.NUM]: false }) {
        this._state = {
            [LockKey.CAPS]: Boolean(initialState[LockKey.CAPS]),
            [LockKey.NUM]: Boolean(initialState[LockKey.NUM]),
        };
    }

    getState() {
        return { ...this._state };
    }

    /**
     * Synchronizes internal state without emitting transition events
     * (used on startup or settings refresh).
     */
    sync(nextState) {
        this._state = {
            [LockKey.CAPS]: Boolean(nextState[LockKey.CAPS]),
            [LockKey.NUM]: Boolean(nextState[LockKey.NUM]),
        };
        return this.getState();
    }

    /**
     * Evaluates a new hardware keymap snapshot and returns only the keys
     * whose boolean state actually changed.
     *
     * @param {{ capslock: boolean, numlock: boolean }} nextState
     * @returns {Array<{ key: string, active: boolean }>}
     */
    transition(nextState) {
        const changes = [];
        for (const key of [LockKey.CAPS, LockKey.NUM]) {
            const nextVal = Boolean(nextState[key]);
            if (this._state[key] !== nextVal) {
                this._state[key] = nextVal;
                changes.push({ key, active: nextVal });
            }
        }
        return changes;
    }
}
