import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class GLocksPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window._settings = settings;
        const signalIds = [];

        const notificationOptions = [
            { id: 'off', label: _('Off') },
            { id: 'compact', label: _('Compact') },
            { id: 'osd', label: _('OSD') },
        ];

        const visibilityOptions = [
            { id: 'never', label: _('Never') },
            { id: 'when-active', label: _('When Active') },
            { id: 'always', label: _('Always') },
        ];

        const positionOptions = [
            { id: 'left', label: _('Left') },
            { id: 'center', label: _('Center') },
            { id: 'right', label: _('Right') },
        ];

        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'input-keyboard-symbolic',
        });

        page.add(this._buildKeyGroup(
            settings,
            signalIds,
            'capslock',
            _('Caps Lock'),
            _('Indicator and notifications for Caps Lock'),
            notificationOptions,
            visibilityOptions
        ));

        page.add(this._buildKeyGroup(
            settings,
            signalIds,
            'numlock',
            _('Num Lock'),
            _('Indicator and notifications for Num Lock'),
            notificationOptions,
            visibilityOptions
        ));

        const panelGroup = new Adw.PreferencesGroup({
            title: _('Top Bar'),
            description: _('Placement of the indicator in the top panel'),
        });
        panelGroup.add(this._createSegmentedRow(
            settings,
            signalIds,
            'panel-position',
            _('Position'),
            positionOptions
        ));
        page.add(panelGroup);

        window.add(page);

        window.connect('close-request', () => {
            for (const id of signalIds)
                settings.disconnect(id);
            signalIds.length = 0;
        });
    }

    _buildKeyGroup(settings, signalIds, prefix, title, description, notificationOptions, visibilityOptions) {
        const masterSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        settings.bind(`${prefix}-enabled`, masterSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        const group = new Adw.PreferencesGroup({
            title,
            description,
            header_suffix: masterSwitch,
        });

        const notifRow = this._createSegmentedRow(
            settings,
            signalIds,
            `${prefix}-notification`,
            _('Notifications'),
            notificationOptions
        );

        const visRow = this._createSegmentedRow(
            settings,
            signalIds,
            `${prefix}-visibility`,
            _('Top Bar Indicator'),
            visibilityOptions
        );

        group.add(notifRow);
        group.add(visRow);

        const syncSensitivity = () => {
            const active = settings.get_boolean(`${prefix}-enabled`);
            notifRow.sensitive = active;
            visRow.sensitive = active;
        };
        syncSensitivity();
        signalIds.push(settings.connect(`changed::${prefix}-enabled`, syncSensitivity));

        return group;
    }

    _createSegmentedRow(settings, signalIds, key, title, options) {
        const row = new Adw.ActionRow({ title });
        const box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            css_classes: ['linked'],
            valign: Gtk.Align.CENTER,
        });

        const buttons = new Map();
        let firstButton = null;

        for (const opt of options) {
            const btn = new Gtk.ToggleButton({
                label: opt.label,
                group: firstButton,
            });
            if (!firstButton)
                firstButton = btn;

            btn.connect('toggled', () => {
                if (btn.active && settings.get_string(key) !== opt.id)
                    settings.set_string(key, opt.id);
            });

            buttons.set(opt.id, btn);
            box.append(btn);
        }

        const syncFromSettings = () => {
            const current = settings.get_string(key);
            const target = buttons.get(current);
            if (target && !target.active)
                target.active = true;
        };

        syncFromSettings();
        signalIds.push(settings.connect(`changed::${key}`, syncFromSettings));

        row.add_suffix(box);
        return row;
    }
}