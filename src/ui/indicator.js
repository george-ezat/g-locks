import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import { LockKey } from '../core/constants.js';

/**
 * Passive View (MVP): renders a pure RenderModel into the GNOME top bar.
 * Contains no business rules or GSettings reads.
 */
export const LockIndicator = GObject.registerClass(
class LockIndicator extends PanelMenu.Button {
    _init(iconRepo, onOpenPreferences) {
        super._init(0.5, 'g-locks', false);
        this._iconRepo = iconRepo;
        this._onOpenPreferences = onOpenPreferences;

        this._box = new St.BoxLayout({
            orientation: Clutter.Orientation.HORIZONTAL,
            style_class: 'glocks-box',
        });
        this.add_child(this._box);

        this._badges = {
            [LockKey.CAPS]: this._createBadge(),
            [LockKey.NUM]: this._createBadge(),
        };

        this._box.add_child(this._badges[LockKey.CAPS].container);
        this._box.add_child(this._badges[LockKey.NUM].container);

        this._buildMenu();
    }

    _createBadge() {
        const icon = new St.Icon({
            style_class: 'glocks-icon',
            y_align: Clutter.ActorAlign.CENTER,
        });
        const container = new St.Bin({
            style_class: 'glocks-badge',
            y_align: Clutter.ActorAlign.CENTER,
            child: icon,
        });
        return { container, icon };
    }

    _buildMenu() {
        this._menuSwitches = {
            [LockKey.CAPS]: new PopupMenu.PopupSwitchMenuItem(_('Caps Lock'), false, { reactive: false, can_focus: false }),
            [LockKey.NUM]: new PopupMenu.PopupSwitchMenuItem(_('Num Lock'), false, { reactive: false, can_focus: false }),
        };

        for (const item of Object.values(this._menuSwitches)) {
            item.label.opacity = 185;
            if (item._switch)
                item._switch.opacity = 120;
            this.menu.addMenuItem(item);
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const prefsItem = new PopupMenu.PopupMenuItem(_('Settings'));
        prefsItem.connect('activate', () => {
            if (this._onOpenPreferences)
                this._onOpenPreferences();
        });
        this.menu.addMenuItem(prefsItem);
    }

    /**
     * Applies a computed RenderModel to the top bar and popup menu.
     */
    render(model) {
        for (const key of [LockKey.CAPS, LockKey.NUM]) {
            const item = model.items[key];
            const badge = this._badges[key];

            badge.icon.gicon = this._iconRepo.getIcon(item.iconName);
            badge.container.visible = item.visible;

            badge.container.opacity = item.active ? 255 : 170;

            this._menuSwitches[key].visible = item.enabled;
            this._menuSwitches[key].setToggleState(item.active);
        }

        this.visible = model.panelVisible;
    }

    destroy() {
        this._iconRepo = null;
        this._onOpenPreferences = null;
        super.destroy();
    }
});
