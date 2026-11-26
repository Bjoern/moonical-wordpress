// Writes assets/blueprints/blueprint.json, the recipe for the Live Preview on WordPress.org
// (WordPress Playground): the plugin from the directory, logged in, the sample page (id 2 in a fresh
// WordPress) filled with three widgets and opened in the editor. Run: deno run -A dev/make-blueprint.ts
const content = [
  '<!-- wp:paragraph -->',
  '<p>Click a widget, then choose what it shows in the block settings on the right (the "Block" tab, under "Widget"). To add another one, click "+" and search for "Moonical".</p>',
  '<!-- /wp:paragraph -->',
  '<!-- wp:moonical/widget /-->',
  '<!-- wp:moonical/widget {"widget":"haircut","shape":"badge"} /-->',
  '<!-- wp:moonical/widget {"widget":"moon-phases","look":"night"} /-->',
].join('\n');

// a PHP string in single quotes: only backslash and single quote need escaping
const quoted = "'" + content.replaceAll('\\', '\\\\').replaceAll("'", "\\'") + "'";
// the page, and no "Welcome to the editor" guide over it (the editor keeps that choice in user meta)
const php = "<?php require_once '/wordpress/wp-load.php'; wp_update_post(array('ID' => 2, "
  + "'post_title' => 'Moon calendar', 'post_status' => 'publish', 'post_content' => " + quoted + ')); '
  + "update_user_meta(1, 'wp_persisted_preferences', array('core/edit-post' => array('welcomeGuide' => false), "
  + "'_modified' => gmdate('Y-m-d\\TH:i:s.000\\Z')));";

const blueprint = {
  $schema: 'https://playground.wordpress.net/blueprint-schema.json',
  landingPage: '/wp-admin/post.php?post=2&action=edit',
  preferredVersions: { php: '8.3', wp: 'latest' },
  steps: [
    { step: 'login', username: 'admin', password: 'password' },
    { step: 'installPlugin', pluginData: { resource: 'wordpress.org/plugins', slug: 'moonical' }, options: { activate: true } },
    { step: 'setSiteOptions', options: { timezone_string: 'Europe/London' } },
    { step: 'runPHP', code: php },
  ],
};

Deno.writeTextFileSync('assets/blueprints/blueprint.json', JSON.stringify(blueprint, null, '\t') + '\n');
