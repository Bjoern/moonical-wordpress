=== Moonical – Moon Calendar Widgets ===
Contributors: moonical
Tags: moon, moon calendar, moon phases, full moon, gardening
Requires at least: 6.3
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Today's moon, the best days for a haircut or for sowing, and the moon phases: Moonical's moon calendar widgets as a block and a shortcode.

== Description ==

Show the moon calendar on your site with the widgets of [Moonical](https://moonical.com), a moon calendar in English:

* **Today**: the moon's phase and sign, the kind of day, and the activities the traditional moon calendar recommends for it. As a card, or as a strip across the page.
* **One activity**: the next good days for one of more than 130 activities, from a haircut to sowing tomatoes. As a card with a small month, or as a one-line badge.
* **A topic**: a few activities at once, such as hair, skin and nails, cleaning or the garden.
* **Moon phases**: the next new, first quarter, full and last quarter moon with their times, the days of the month with their moon, or the next full moon as a badge.

Each widget comes in a light and a night look. It shows the day in each visitor's own time zone, or always in your site's time zone.

Add the block "Moonical moon calendar" and choose the widget in the block settings; the editor shows it as your visitors will see it. Without the block editor, use the shortcode:

`[moonical widget="haircut" shape="badge" look="night"]`

* `widget`: `today` (the default), `moon-phases`, a topic (`topic/hair`, `topic/skin-nails`, `topic/cleaning`, `topic/garden`) or an activity, named as in its address on moonical.com (`haircut` for moonical.com/haircut).
* `shape`: `card` (the default), `strip` (today), `badge` (an activity, the moon phases) or `month` (the moon phases).
* `look`: `night` for the dark look.
* `tz`: `site` for your site's time zone (Settings › General, set as a city), or the name of a time zone such as `Europe/London`. Without it, every visitor sees their own day.

The widgets are pages of moonical.com shown in an iframe: they stay up to date without plugin updates and need no settings, no account and no key. They set no cookies.

== External services ==

This plugin shows content from moonical.com, run by the makers of this plugin. It does not work without it.

* **The widgets.** Every page with a widget makes the visitor's browser load the widget from moonical.com. Moonical receives the visitor's IP address, the address of the page that shows the widget and the information browsers send with every request, and keeps them in its server logs. The widgets set no cookies.
* **The list of widgets.** About once a day, and when you open the block editor after that, your site fetches the list of widgets and their sizes from https://moonical.com/widget/catalog.json. That request comes from your server and sends nothing about you or your visitors.

Moonical's privacy policy: https://moonical.com/privacy
Moonical's imprint and terms: https://moonical.com/imprint

The plugin adds a suggested paragraph about the widgets to WordPress's privacy policy guide (Settings › Privacy).

== Installation ==

1. Install the plugin from Plugins › Add New, or upload the folder `moonical` to `/wp-content/plugins/`.
2. Activate it.
3. Add the block "Moonical moon calendar" to a page, a post or a widget area, or use the shortcode `[moonical]`.

== Frequently Asked Questions ==

= Does it set cookies or collect data? =

The plugin stores nothing about your visitors. The widgets set no cookies; their requests to moonical.com appear in Moonical's server logs, see "External services".

= Does the plugin add links to my site? =

No. The widget itself, which moonical.com serves inside the iframe, shows the Moonical name and links to moonical.com for the full calendar. The plugin adds nothing around it: no credit, no "powered by", no link of its own.

= Which time zone does the widget use? =

By default each visitor's own: the widget shows their day, so a visitor in Sydney sees tomorrow when it is still today in London. Choose "This site's" in the block settings (or `tz="site"` in the shortcode) to show the day in your site's time zone to everyone. That needs the time zone set as a city under Settings › General, not as an offset like UTC+1.

= Can I change the colours or the size? =

There are two looks, light and night. The sizes are fixed, so the widget never needs a scroll bar; the strip takes the full width of its column.

= Where do the recommendations come from? =

From the traditional moon calendar, as books on it have given them for decades. They are tradition, not science; the widgets link to moonical.com, where each activity explains its rule.

== Screenshots ==

1. The block in the editor: choose what the widget shows, its shape, its look and its time zone.
2. Today's moon as a strip and as cards, in the light and the night look, and the garden topic.
3. The best days for a haircut as a card, the hair topic, and three activities as badges.
4. The moon phases: the next four, the days of the month in the night look, and the full moon as a badge.

== Changelog ==

= 1.0.0 =
* First version: a block and a shortcode for the widgets of moonical.com.
