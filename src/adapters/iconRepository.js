import Gio from 'gi://Gio';
import St from 'gi://St';

/**
 * Repository for symbolic icons with theme override support and in-memory caching.
 */
export class IconRepository {
    constructor(extensionDir) {
        this._iconsDir = extensionDir.get_child('icons');
        this._iconTheme = new St.IconTheme();
        this._cache = new Map();
        this._themeChangedId = 0;
    }

    getIcon(iconName) {
        if (this._cache.has(iconName))
            return this._cache.get(iconName);

        let gicon;
        if (this._iconTheme.has_icon(iconName)) {
            gicon = Gio.ThemedIcon.new_with_default_fallbacks(iconName);
        } else {
            const file = this._iconsDir.get_child(`${iconName}.svg`);
            gicon = Gio.FileIcon.new(file);
        }

        this._cache.set(iconName, gicon);
        return gicon;
    }

    subscribeThemeChange(callback) {
        this.unsubscribeThemeChange();
        this._themeChangedId = this._iconTheme.connect('changed', () => {
            this._cache.clear();
            callback();
        });
    }

    unsubscribeThemeChange() {
        if (this._themeChangedId && this._iconTheme) {
            this._iconTheme.disconnect(this._themeChangedId);
            this._themeChangedId = 0;
        }
    }

    destroy() {
        this.unsubscribeThemeChange();
        this._cache.clear();
        this._iconTheme = null;
    }
}
