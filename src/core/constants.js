export const LockKey = Object.freeze({
    CAPS: 'capslock',
    NUM: 'numlock',
});

export const VisibilityMode = Object.freeze({
    NEVER: 'never',
    WHEN_ACTIVE: 'when-active',
    ALWAYS: 'always',
});

export const NotificationMode = Object.freeze({
    OFF: 'off',
    COMPACT: 'compact',
    OSD: 'osd',
});

export const PanelPosition = Object.freeze({
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right',
});

export const ICON_NAMES = Object.freeze({
    [LockKey.CAPS]: Object.freeze({
        on: 'glocks-capslock-on-symbolic',
        off: 'glocks-capslock-off-symbolic',
    }),
    [LockKey.NUM]: Object.freeze({
        on: 'glocks-numlock-on-symbolic',
        off: 'glocks-numlock-off-symbolic',
    }),
});
