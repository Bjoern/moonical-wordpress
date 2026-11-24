# Moonical – Moon Calendar Widgets (WordPress plugin)

A thin wrapper around the widgets of moonical.com: a block and a shortcode that write the widget's
iframe. No moon calculations here; the widgets are pages of moonical.com (`/widget/...`), made by
Moonical's own code, which is not in this repository.

`readme.txt` is the page in the WordPress plugin directory; this file is for working on the plugin.
The plugin is free software under the GPL, version 2 or later (see the header of `moonical.php`).

## Files

| File | What it does |
| ---- | ------------ |
| `moonical.php` | The plugin: the catalogue, the iframe, the shortcode, the block's registration, the privacy text |
| `block/block.json` | The block: name, attributes (`widget`, `shape`, `look`, `tz`), alignment |
| `block/index.js` | The block in the editor: the settings and a live preview. Plain JavaScript on the `wp` globals, **no build step** |
| `block/index.asset.php` | The scripts `index.js` needs (a build would write this file; here it is kept by hand) |
| `block/render.php` | The block on the page |
| `catalog.json` | The copy of the catalogue that comes with the plugin (see below) |
| `uninstall.php` | Removes the stored catalogue when the plugin is deleted |
| `docker-compose.yml` | A WordPress to try the plugin in (not part of the plugin) |

## The catalogue

Which widgets exist, their shapes and their sizes come from `https://moonical.com/widget/catalog.json`
(format 1). The plugin keeps the last one it fetched for a
day (option `moonical_catalog`) and then fetches it again: at once in the admin, in the background
(WP cron) on the site. After a failure it waits an hour. Until the first fetch it uses `catalog.json`.

Refresh `catalog.json` before every release, from the live site:

```
curl -s https://moonical.com/widget/catalog.json -o catalog.json
```

A new activity on Moonical reaches every site without a plugin update. A new widget **type** or
**shape** needs one: the editor names them (`TYPES`, `SHAPES` in `index.js`). A changed meaning of a
catalogue field needs a new format number on Moonical, and the plugin reads only format 1.

## Trying it out

Needs Docker Desktop, and Moonical running locally on port 8650 (for Moonical's developers; anyone
else can set `MOONICAL_SITE_URL` in `docker-compose.yml` to `https://moonical.com`).

```
docker compose up -d
docker compose run --rm cli wp core install --url=http://localhost:8090 --title="Moon test" --admin_user=admin --admin_password=moon-test-admin --admin_email=admin@example.com --skip-email
docker compose run --rm cli wp plugin activate moonical
docker compose run --rm cli wp option update timezone_string Europe/Berlin
```

Then http://localhost:8090/wp-admin (user `admin`, password `moon-test-admin`: a local test site only).
`MOONICAL_SITE_URL` points the plugin to `http://host.docker.internal:8650`, which the container and
the browser on this machine both reach. `docker compose down -v` removes the site again.

## The directory's pictures

`assets/` holds what the plugin directory shows: `banner-1544x500.png` and `banner-772x250.png`, the
icon (`icon-256x256.png`, `icon-128x128.png`) and `screenshot-1.png` to `-4.png`, captioned in
`readme.txt` under "Screenshots". They go to the `assets` folder of the directory's SVN repository,
not into the zip. The banner and the icon are made from Moonical's wordmark and favicon (the moon on yellow), outside this
repository.

To take the screenshots again (after a change in the editor or in the widgets), in the test site:

```
docker compose run --rm cli wp option update timezone_string Europe/London
docker compose run --rm -T cli wp post create - --post_type=page --post_status=publish --post_title=shot-today --post_name=shot-today < dev/shot-today.html
docker compose run --rm -T cli wp post create - --post_type=page --post_status=publish --post_title=shot-activity --post_name=shot-activity < dev/shot-activity.html
docker compose run --rm -T cli wp post create - --post_type=page --post_status=publish --post_title=shot-phases --post_name=shot-phases < dev/shot-phases.html
docker compose run --rm -T cli wp post create - --post_status=publish --post_title="Sowing by the moon" --porcelain < dev/sowing-by-the-moon.html
deno run -A dev/screenshots.ts assets <the id the last command printed>
```

The script crops each page around its widgets, on a soft background, in London time.

## Releasing

1. Refresh `catalog.json`, raise the version in `moonical.php` (header and `MOONICAL_VERSION`),
   `block/block.json`, `block/index.asset.php` and `readme.txt` (`Stable tag`), add a changelog entry.
2. Check "Tested up to" in `readme.txt` against the current WordPress (Plugin Check fails otherwise).
3. Run Plugin Check, the reviewers' own tool, in the test site:
   `docker compose run --rm cli wp plugin install plugin-check --activate`, then
   `docker compose run --rm cli wp plugin check moonical`. It flags the dot files of the repository
   (the test site uses the folder as it is); the zip leaves them out.
4. Commit, then make the zip: `git archive --format=zip --prefix=moonical/ -o dist/moonical-1.0.0.zip HEAD`.
   `.gitattributes` (`export-ignore`) keeps this README, `docker-compose.yml` and the dot files out.

The first submission goes through https://wordpress.org/plugins/developers/add/ (a WordPress.org
account; the review takes a few weeks). After that, releases go to the directory's SVN repository.
`Contributors:` in `readme.txt` is the WordPress.org user name of that account, `moonical`
(created 2026-11-24). Screenshots for the directory (`assets/` in SVN, not in the zip) are named
in `readme.txt` under "Screenshots".
