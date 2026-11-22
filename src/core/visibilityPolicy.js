import { ICON_NAMES, LockKey, VisibilityMode } from './constants.js';

/**
 * Pure Policy / Strategy resolver.
 * Transforms (hardwareState, settingsSnapshot) -> immutable RenderModel for the View.
 */
export function resolveRenderModel(state, config) {
    const items = {};
    let anyVisible = false;

    for (const key of [LockKey.CAPS, LockKey.NUM]) {
        const keyCfg = config[key];
        const active = Boolean(state[key]);

        const visible = resolveKeyVisibility(keyCfg.enabled, keyCfg.visibility, active);
        if (visible)
            anyVisible = true;

        items[key] = {
            key,
            enabled: Boolean(keyCfg.enabled),
            active,
            visible,
            iconName: active ? ICON_NAMES[key].on : ICON_NAMES[key].off,
        };
    }

    return {
        panelVisible: anyVisible,
        items,
    };
}

export function resolveKeyVisibility(enabled, visibilityMode, active) {
    if (!enabled || visibilityMode === VisibilityMode.NEVER)
        return false;
    if (visibilityMode === VisibilityMode.WHEN_ACTIVE)
        return active;
    if (visibilityMode === VisibilityMode.ALWAYS)
        return true;
    return false;
}

/**
 * Determines which notifications should fire for a list of state transitions.
 */
export function resolveNotifications(changes, config) {
    const events = [];
    for (const change of changes) {
        const keyCfg = config[change.key];
        if (!keyCfg || !keyCfg.enabled)
            continue;
        events.push({
            key: change.key,
            active: change.active,
            mode: keyCfg.notification,
            iconName: change.active
                ? ICON_NAMES[change.key].on
                : ICON_NAMES[change.key].off,
        });
    }
    return events;
}
