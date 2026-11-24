<?php
/**
 * Removes what the plugin stored when it is deleted: the catalogue and the note of the last try.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'moonical_catalog' );
delete_transient( 'moonical_catalog_tried' );
wp_clear_scheduled_hook( 'moonical_fetch_catalog' );
