import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import { NotificationMode } from '../core/constants.js';

/**
 * Strategy Pattern for delivering lock-key notifications.
 * - OsdStrategy: Native GNOME Shell OSD (GNOME 49/50 showAll + 47/48 fallback)
 * - CompactStrategy: Transient MessageTray banner
 * - NullStrategy: No-op (Null Object pattern)
 */
class NullNotificationStrategy {
    notify() {}
    destroy() {}
}

class OsdNotificationStrategy {
    constructor(iconRepo) {
        this._iconRepo = iconRepo;
    }

    notify(title, iconName) {
        const gicon = this._iconRepo.getIcon(iconName);
        if (typeof Main.osdWindowManager.showAll === 'function') {
            Main.osdWindowManager.showAll(gicon, title);
        } else {
            Main.osdWindowManager.show(-1, gicon, title);
        }
    }

    destroy() {
        this._iconRepo = null;
    }
}

class CompactNotificationStrategy {
    constructor(iconRepo, appName) {
        this._iconRepo = iconRepo;
        this._appName = appName;
        this._source = null;
    }

    _ensureSource(gicon) {
        if (!this._source) {
            this._source = new MessageTray.Source({
                title: this._appName,
                icon: gicon,
            });
            this._source.connect('destroy', () => {
                this._source = null;
            });
            Main.messageTray.add(this._source);
        } else {
            this._source.icon = gicon;
        }
        return this._source;
    }

    notify(title, iconName) {
        const gicon = this._iconRepo.getIcon(iconName);
        const source = this._ensureSource(gicon);

        for (const existing of [...source.notifications])
            existing.destroy();

        const notification = new MessageTray.Notification({
            source,
            title,
            isTransient: true,
            resident: false,
        });

        source.addNotification(notification);
    }

    destroy() {
        if (this._source) {
            this._source.destroy();
            this._source = null;
        }
        this._iconRepo = null;
    }
}

export class NotificationRouter {
    constructor(iconRepo, appName = 'g-locks') {
        this._strategies = {
            [NotificationMode.OFF]: new NullNotificationStrategy(),
            [NotificationMode.OSD]: new OsdNotificationStrategy(iconRepo),
            [NotificationMode.COMPACT]: new CompactNotificationStrategy(iconRepo, appName),
        };
    }

    dispatch(mode, title, iconName) {
        const strategy = this._strategies[mode] ?? this._strategies[NotificationMode.OFF];
        strategy.notify(title, iconName);
    }

    destroy() {
        for (const strategy of Object.values(this._strategies))
            strategy.destroy();
        this._strategies = {};
    }
}
