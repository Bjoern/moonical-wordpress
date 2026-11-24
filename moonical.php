<?php
/**
 * Plugin Name:       Moonical – Moon Calendar Widgets
 * Plugin URI:        https://moonical.com/widgets
 * Description:       Moon calendar widgets from Moonical: today's moon, the best days for an activity, a topic or the moon phases. A block and a shortcode.
 * Version:           1.0.0
 * Requires at least: 6.3
 * Requires PHP:      7.4
 * Author:            Moonical
 * Author URI:        https://moonical.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       moonical
 *
 * The widgets themselves are pages on moonical.com, shown in an iframe; this plugin only writes the
 * iframe. Which widgets exist, their shapes and their sizes come from moonical.com/widget/catalog.json,
 * kept for a day; catalog.json in this folder is the copy used until the first fetch succeeds.
 */

defined( 'ABSPATH' ) || exit;

define( 'MOONICAL_VERSION', '1.0.0' );

/** How long a fetched catalogue is used before the plugin asks for a new one. */
define( 'MOONICAL_CATALOG_AGE', DAY_IN_SECONDS );

/**
 * The site the widgets come from. A test setup may point it elsewhere with
 * define( 'MOONICAL_SITE_URL', 'http://...' ) in wp-config.php.
 */
function moonical_site_url() {
	return untrailingslashit( defined( 'MOONICAL_SITE_URL' ) ? MOONICAL_SITE_URL : 'https://moonical.com' );
}

// ------------------------------------------------------------------------------------------------
// Catalogue
// ------------------------------------------------------------------------------------------------

/**
 * The widgets on offer: the last catalogue fetched from Moonical, or the one that came with the
 * plugin. A catalogue older than a day is fetched again: at once in the admin (the editor shows the
 * current list), in the background on the site itself (no visitor waits for it).
 *
 * @return array{format:int, widgets:array<int, array>}
 */
function moonical_catalog() {
	static $catalog = null;

	if ( null !== $catalog ) {
		return $catalog;
	}

	$stored = get_option( 'moonical_catalog' );
	$fresh  = is_array( $stored ) && isset( $stored['fetched'] ) && $stored['fetched'] > time() - MOONICAL_CATALOG_AGE;

	if ( ! $fresh && ! get_transient( 'moonical_catalog_tried' ) ) {
		if ( is_admin() || wp_doing_cron() ) {
			$stored = moonical_fetch_catalog() ?? $stored;
		} elseif ( ! wp_next_scheduled( 'moonical_fetch_catalog' ) ) {
			wp_schedule_single_event( time(), 'moonical_fetch_catalog' );
		}
	}

	$catalog = is_array( $stored ) && isset( $stored['catalog'] ) ? $stored['catalog'] : moonical_bundled_catalog();

	return $catalog;
}

add_action( 'moonical_fetch_catalog', 'moonical_fetch_catalog' );

/**
 * Fetches the catalogue from Moonical and stores it. After a failure the plugin waits an hour before
 * it tries again, and goes on with what it has.
 *
 * @return array|null what was stored, or null if the fetch failed
 */
function moonical_fetch_catalog() {
	set_transient( 'moonical_catalog_tried', 1, HOUR_IN_SECONDS );

	$response = wp_remote_get( moonical_site_url() . '/widget/catalog.json', array( 'timeout' => 5 ) );

	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return null;
	}

	$catalog = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( ! moonical_catalog_valid( $catalog ) ) {
		return null;
	}

	$stored = array(
		'fetched' => time(),
		'catalog' => $catalog,
	);
	update_option( 'moonical_catalog', $stored, false );

	return $stored;
}

/** The catalogue that came with the plugin. */
function moonical_bundled_catalog() {
	$catalog = json_decode( (string) file_get_contents( __DIR__ . '/catalog.json' ), true );

	return moonical_catalog_valid( $catalog ) ? $catalog : array(
		'format'  => 1,
		'widgets' => array(),
	);
}

/** Format 1 with at least one widget, each with an id and at least one shape. */
function moonical_catalog_valid( $catalog ) {
	if ( ! is_array( $catalog ) || 1 !== ( $catalog['format'] ?? null ) || empty( $catalog['widgets'] ) || ! is_array( $catalog['widgets'] ) ) {
		return false;
	}

	foreach ( $catalog['widgets'] as $widget ) {
		if ( ! is_array( $widget ) || ! isset( $widget['id'], $widget['type'], $widget['name'], $widget['title'] )
			|| ! preg_match( '#^[a-z0-9-]+(/[a-z0-9-]+)?$#', $widget['id'] ) || empty( $widget['shapes'] ) || ! is_array( $widget['shapes'] ) ) {
			return false;
		}

		foreach ( $widget['shapes'] as $shape ) {
			if ( ! is_array( $shape ) || ! isset( $shape['shape'], $shape['height'] ) || ! preg_match( '/^[a-z]+$/', $shape['shape'] ) ) {
				return false;
			}
		}
	}

	return true;
}

/** @return array|null the widget with this id ("today", "moon-phases", "topic/hair", "haircut") */
function moonical_widget( $id ) {
	foreach ( moonical_catalog()['widgets'] as $widget ) {
		if ( $widget['id'] === $id ) {
			return $widget;
		}
	}

	return null;
}

// ------------------------------------------------------------------------------------------------
// The iframe
// ------------------------------------------------------------------------------------------------

/**
 * The time zone a widget is fixed to: none (each visitor sees their own day), this site's (as set
 * under Settings, General), or one named like Europe/Berlin.
 *
 * @param string $tz "", "site" or the name of a time zone
 * @return string the name of the time zone, or "" for the visitor's own
 */
function moonical_time_zone( $tz ) {
	if ( 'site' === $tz ) {
		$tz = moonical_site_time_zone();
	}

	return '' !== $tz && in_array( $tz, timezone_identifiers_list(), true ) ? $tz : '';
}

/** This site's time zone if it is set as a place (Europe/Berlin), "" if it is set as an offset (UTC+1). */
function moonical_site_time_zone() {
	$zone = (string) get_option( 'timezone_string' );

	return in_array( $zone, timezone_identifiers_list(), true ) ? $zone : '';
}

/**
 * The iframe of a widget, as Moonical's own widget builder writes it.
 *
 * @param string $id    the widget, see moonical_widget()
 * @param string $shape one of the widget's shapes; "" or an unknown one is its first
 * @param string $look  "night" for the dark look, anything else for the light one
 * @param string $tz    see moonical_time_zone()
 * @return string the HTML, or "" if there is no such widget
 */
function moonical_iframe( $id, $shape = '', $look = '', $tz = '' ) {
	$widget = moonical_widget( (string) $id );

	if ( null === $widget ) {
		return '';
	}

	$chosen = $widget['shapes'][0];

	foreach ( $widget['shapes'] as $candidate ) {
		if ( $candidate['shape'] === $shape ) {
			$chosen = $candidate;
		}
	}

	$query = array();

	if ( $chosen !== $widget['shapes'][0] ) {
		$query[] = 'shape=' . $chosen['shape'];
	}

	if ( 'night' === $look ) {
		$query[] = 'look=night';
	}

	$zone = moonical_time_zone( (string) $tz );

	if ( '' !== $zone ) {
		$query[] = 'tz=' . str_replace( '%2F', '/', rawurlencode( $zone ) );
	}

	$src   = moonical_site_url() . '/widget/' . $widget['id'] . ( $query ? '?' . implode( '&', $query ) : '' );
	$width = isset( $chosen['width'] ) ? (string) (int) $chosen['width'] : '100%';

	return sprintf(
		'<iframe src="%s" title="%s" width="%s" height="%d" style="border:0;max-width:100%%" loading="lazy"></iframe>',
		esc_url( $src ),
		esc_attr( $widget['title'] ),
		esc_attr( $width ),
		(int) $chosen['height']
	);
}

// ------------------------------------------------------------------------------------------------
// Shortcode and block
// ------------------------------------------------------------------------------------------------

/**
 * [moonical widget="haircut" shape="badge" look="night" tz="site"]: every attribute is optional; the
 * default is today's card in the visitor's own time zone.
 */
function moonical_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'widget' => 'today',
			'shape'  => '',
			'look'   => '',
			'tz'     => '',
		),
		$atts,
		'moonical'
	);

	return moonical_iframe( $atts['widget'], $atts['shape'], $atts['look'], $atts['tz'] );
}

add_shortcode( 'moonical', 'moonical_shortcode' );

function moonical_register_block() {
	register_block_type( __DIR__ . '/block' );
	wp_set_script_translations( generate_block_asset_handle( 'moonical/widget', 'editorScript' ), 'moonical' );
}

add_action( 'init', 'moonical_register_block' );

/** What the block's editor needs: the catalogue, where the widgets come from, and this site's time zone. */
function moonical_editor_data() {
	$data = array(
		'site'     => moonical_site_url(),
		'siteZone' => moonical_site_time_zone(),
		'settings' => admin_url( 'options-general.php' ),
		'catalog'  => moonical_catalog(),
	);

	wp_add_inline_script(
		generate_block_asset_handle( 'moonical/widget', 'editorScript' ),
		'window.moonicalEditor = ' . wp_json_encode( $data ) . ';',
		'before'
	);
}

add_action( 'enqueue_block_editor_assets', 'moonical_editor_data' );

// ------------------------------------------------------------------------------------------------
// Privacy
// ------------------------------------------------------------------------------------------------

/** A suggested paragraph for this site's privacy policy (Settings, Privacy, "Policy guide"). */
function moonical_privacy_policy_content() {
	if ( ! function_exists( 'wp_add_privacy_policy_content' ) ) {
		return;
	}

	$content = '<p class="privacy-policy-tutorial">'
		. esc_html__( 'Add this if your pages show Moonical widgets.', 'moonical' )
		. '</p><p>'
		. esc_html__( 'Some pages of this website show moon calendar widgets from Moonical (moonical.com). When you open such a page, your browser loads the widget from moonical.com. Moonical then receives your IP address, the address of this page and the information your browser sends with every request, and records the request in its server logs, with the IP address shortened. The widgets set no cookies.', 'moonical' )
		. '</p><p>'
		. sprintf(
			/* translators: %s: link to Moonical's privacy policy */
			esc_html__( 'Details are in Moonical\'s privacy policy: %s', 'moonical' ),
			'<a href="https://moonical.com/privacy#widgets">https://moonical.com/privacy</a>'
		)
		. '</p>';

	wp_add_privacy_policy_content( 'Moonical – Moon Calendar Widgets', wp_kses_post( $content ) );
}

add_action( 'admin_init', 'moonical_privacy_policy_content' );

/** Removes what the plugin stored. */
function moonical_deactivate() {
	wp_clear_scheduled_hook( 'moonical_fetch_catalog' );
	delete_transient( 'moonical_catalog_tried' );
}

register_deactivation_hook( __FILE__, 'moonical_deactivate' );
