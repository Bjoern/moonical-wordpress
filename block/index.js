/**
 * The block in the editor: the choices of Moonical's widget builder in the block's settings, and the
 * widget itself as the preview. No build step: plain JavaScript on the wp globals (index.asset.php
 * names them). The page itself is written by render.php; the block saves only its attributes.
 *
 * window.moonicalEditor comes from moonical_editor_data() in moonical.php.
 */
( function ( blocks, element, blockEditor, components, i18n ) {
	var el = element.createElement;
	var __ = i18n.__;
	var sprintf = i18n.sprintf;
	var data = window.moonicalEditor || { site: 'https://moonical.com', siteZone: '', catalog: { widgets: [] } };
	var widgets = data.catalog.widgets;

	var TYPES = [
		{ value: 'today', label: __( 'Today', 'moonical' ) },
		{ value: 'activity', label: __( 'One activity', 'moonical' ) },
		{ value: 'topic', label: __( 'A topic', 'moonical' ) },
		{ value: 'phases', label: __( 'Moon phases', 'moonical' ) },
	];
	var SHAPES = {
		card: __( 'Card', 'moonical' ),
		strip: __( 'Strip', 'moonical' ),
		badge: __( 'Badge', 'moonical' ),
		month: __( 'Month', 'moonical' ),
	};
	// what a new choice of type starts with
	var FIRST = { activity: 'haircut', topic: 'topic/hair' };

	function find( id ) {
		for ( var i = 0; i < widgets.length; i++ ) {
			if ( widgets[ i ].id === id ) {
				return widgets[ i ];
			}
		}
		return null;
	}

	function ofType( type ) {
		return widgets.filter( function ( widget ) {
			return widget.type === type;
		} );
	}

	function shapeOf( widget, name ) {
		for ( var i = 0; i < widget.shapes.length; i++ ) {
			if ( widget.shapes[ i ].shape === name ) {
				return widget.shapes[ i ];
			}
		}
		return widget.shapes[ 0 ];
	}

	/** The widget's address, as moonical_iframe() writes it. */
	function src( widget, shape, look, zone ) {
		var query = [];
		if ( shape !== widget.shapes[ 0 ] ) {
			query.push( 'shape=' + shape.shape );
		}
		if ( look === 'night' ) {
			query.push( 'look=night' );
		}
		if ( zone ) {
			query.push( 'tz=' + encodeURIComponent( zone ).replace( /%2F/g, '/' ) );
		}
		return data.site + '/widget/' + widget.id + ( query.length ? '?' + query.join( '&' ) : '' );
	}

	// the crescent of Moonical's site icon
	var icon = el(
		'svg',
		{ xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 40 40' },
		el( 'path', { d: 'M12.46 6.46A15.5 15.5 0 1 1 12.46 33.54A15 15 0 0 0 12.46 6.46Z' } )
	);

	function Edit( props ) {
		var attributes = props.attributes;
		var blockProps = blockEditor.useBlockProps();
		var widget = find( attributes.widget );

		if ( ! widget ) {
			return el(
				'div',
				blockProps,
				el( components.Placeholder, {
					icon: icon,
					label: __( 'Moonical moon calendar', 'moonical' ),
					instructions: widgets.length
						? sprintf( __( 'Moonical has no widget “%s” (any more). Choose another one in the block settings.', 'moonical' ), attributes.widget )
						: __( 'The list of widgets could not be loaded from moonical.com. Please try again later.', 'moonical' ),
				} ),
				settings( props, null )
			);
		}

		var shape = shapeOf( widget, attributes.shape );
		var zone = attributes.tz === 'site' ? data.siteZone : '';

		return el(
			'div',
			blockProps,
			settings( props, widget ),
			el( 'iframe', {
				src: src( widget, shape, attributes.look, zone ),
				title: widget.title,
				width: shape.width ? shape.width : '100%',
				height: shape.height,
				loading: 'lazy',
				// clicks select the block instead of following the widget's links
				style: { border: 0, maxWidth: '100%', pointerEvents: 'none' },
			} )
		);
	}

	function settings( props, widget ) {
		var attributes = props.attributes;
		var set = props.setAttributes;
		var type = widget ? widget.type : 'activity';
		var controls = [];

		controls.push(
			el( components.SelectControl, {
				key: 'type',
				label: __( 'What it shows', 'moonical' ),
				value: type,
				options: TYPES.filter( function ( option ) {
					return ofType( option.value ).length > 0;
				} ),
				onChange: function ( value ) {
					var first = find( FIRST[ value ] ) || ofType( value )[ 0 ];
					set( { widget: first.id, shape: '' } );
				},
				__nextHasNoMarginBottom: true,
				__next40pxDefaultSize: true,
			} )
		);

		if ( type === 'activity' ) {
			controls.push(
				el( components.ComboboxControl, {
					key: 'activity',
					label: __( 'Activity', 'moonical' ),
					help: __( 'Type to search.', 'moonical' ),
					value: widget ? widget.id : null,
					options: ofType( 'activity' ).map( function ( activity ) {
						return { value: activity.id, label: activity.name + ' (' + activity.group + ')' };
					} ),
					onChange: function ( value ) {
						if ( value ) {
							set( { widget: value } );
						}
					},
					__nextHasNoMarginBottom: true,
					__next40pxDefaultSize: true,
				} )
			);
		}

		if ( type === 'topic' ) {
			controls.push(
				el( components.SelectControl, {
					key: 'topic',
					label: __( 'Topic', 'moonical' ),
					value: widget.id,
					options: ofType( 'topic' ).map( function ( topic ) {
						return { value: topic.id, label: topic.name };
					} ),
					onChange: function ( value ) {
						set( { widget: value } );
					},
					__nextHasNoMarginBottom: true,
					__next40pxDefaultSize: true,
				} )
			);
		}

		if ( widget && widget.shapes.length > 1 ) {
			controls.push(
				el( components.RadioControl, {
					key: 'shape',
					label: __( 'Shape', 'moonical' ),
					selected: shapeOf( widget, attributes.shape ).shape,
					options: widget.shapes.map( function ( shape ) {
						return { value: shape.shape, label: SHAPES[ shape.shape ] || shape.shape };
					} ),
					onChange: function ( value ) {
						set( { shape: value === widget.shapes[ 0 ].shape ? '' : value } );
					},
				} )
			);
		}

		controls.push(
			el( components.RadioControl, {
				key: 'look',
				label: __( 'Look', 'moonical' ),
				selected: attributes.look === 'night' ? 'night' : '',
				options: [
					{ value: '', label: __( 'Light', 'moonical' ) },
					{ value: 'night', label: __( 'Night', 'moonical' ) },
				],
				onChange: function ( value ) {
					set( { look: value } );
				},
			} )
		);

		var zones = [ { value: '', label: __( 'The visitor’s own', 'moonical' ) } ];
		if ( data.siteZone ) {
			/* translators: %s: the name of a time zone, e.g. Europe/Berlin */
			zones.push( { value: 'site', label: sprintf( __( 'This site’s: %s', 'moonical' ), data.siteZone ) } );
		}
		var fixed = attributes.tz === 'site' && data.siteZone;

		controls.push(
			el( components.RadioControl, {
				key: 'tz',
				label: __( 'Time zone', 'moonical' ),
				selected: fixed ? 'site' : '',
				options: zones,
				help: fixed
					? __( 'Every visitor sees the day in this site’s time zone (Settings › General).', 'moonical' )
					: data.siteZone
					? __( 'Each visitor sees the day in their own time zone.', 'moonical' )
					: __( 'Each visitor sees the day in their own time zone. To show this site’s instead, set its time zone to a city under Settings › General.', 'moonical' ),
				onChange: function ( value ) {
					set( { tz: value } );
				},
			} )
		);

		return el(
			blockEditor.InspectorControls,
			{ key: 'settings' },
			el(
				components.PanelBody,
				{ title: __( 'Widget', 'moonical' ) },
				el( 'div', { style: { display: 'grid', gap: '20px' } }, controls )
			)
		);
	}

	blocks.registerBlockType( 'moonical/widget', {
		icon: icon,
		edit: Edit,
		save: function () {
			return null;
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );
