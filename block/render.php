<?php
/**
 * The block on the page: the widget's iframe in the block's wrapper. Nothing if the widget is gone.
 *
 * @var array $attributes
 */

defined( 'ABSPATH' ) || exit;

$moonical_iframe = moonical_iframe( $attributes['widget'] ?? 'today', $attributes['shape'] ?? '', $attributes['look'] ?? '', $attributes['tz'] ?? '' );

if ( '' !== $moonical_iframe ) {
	// moonical_iframe() escapes every value it writes
	echo '<div ' . get_block_wrapper_attributes() . '>' . $moonical_iframe . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}
