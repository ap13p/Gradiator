/*
	ui.js
	By George Czabania, July 2012
	-----------------------------
	Handle the UI

*/

gradiator.init.push(function( app, undefined ) {

	var ui = app.ui,
		core = app.core,
		selected = app.selected;

	// Cache elements

	var $$ = ui.$$ = {
		app: $('#app'),
		editor: {
			preview: $('#gradient-preview .gradient'),
			slider: {
				el: $('#gradient-slider'),
				width: $('#gradient-slider').width(),
				stops: {
					el: $('#gradient-slider .color-stops'),
					selected: function() {
						return $$.editor.slider.stops.el.find('.selected');
					},
					all: function() {
						return $$.editor.slider.stops.el.find('.color-stop');
					},
					select: function( id ) {
						$$.editor.slider.stops.selected().removeClass('selected');
						var stop = ui.get.stop(id);
						stop.addClass('selected');
						return stop;
					}
				},
				track: $('#gradient-slider .track')
			},
			settings: {
				el: $('#color-stop-settings'),
				alpha: {
					el: $('#color-stop-settings .alpha'),
					input: $('#color-stop-settings .alpha input')
				},
				color: {
					el: $('#color-stop-settings .color'),
					input: $('#color-stop-settings .color input')
				},
				position: {
					el: $('#color-stop-settings .position'),
					input: $('#color-stop-settings .position input')
				},
				remove: {
					el: $('#color-stop-settings .remove'),
					button: $('#color-stop-settings .remove button')
				}
			}
		},
		sidebar: {
			el: $('#sidebar'),
			opacity: $('#sidebar .opacity input'),
			layers: {
				el: $('#layers'),
				all: function() {
					return $$.sidebar.layers.el.find('.layer');
				},
				selected: function() {
					return $$.sidebar.layers.el.find('.selected');
				},
				get: function( id ) {
					return $$.sidebar.layers.el.find('[data-id='+id+']');
				}
			},
			buttons: {
				addLayer: $('#sidebar .bottom-bar .add-layer'),
				addAdjustmentLayer: $('#sidebar .bottom-bar .add-adjustment-layer'),
				removeLayer: $('#sidebar .bottom-bar .remove-layer')
			}
		}
	};


	// Globals

	var select = ui.select = {

		// Select a layer in the sidebar
		// id: [string|number] the ID of the layer
		layer: function( id ) {

			// Update 'selected' class name
			$$.sidebar.layers.selected().removeClass('selected');
			$$.sidebar.layers.el.find('[data-id=' + id + ']').addClass('selected');
			
			// Update stops
			$$.editor.slider.stops.all().remove();
			var stops = core.get.layer(id).stops;
			for (var i = 0; i < stops.length; i++) {
				ui.add.stop(stops[i]);
			}
			ui.preview();
		},

		// Select a stop in a gradient
		// id: [string|number] the ID of the stop
		stop: function( stop ) {

			// Update 'selected' class name
			$$.editor.slider.stops.select(stop.id);

			// Update settings
			ui.settings.update(stop);
		}
	};

	ui.settings = {
		update: function ( stop ) {
			$$.editor.settings.alpha.input.val( stop.color.a * 100 );
			$$.editor.settings.color.input.val( stop.get('color', 'hex') );
			$$.editor.settings.position.input.val( stop.pos );
		}
	};

	ui.layer = function( layer ) {
		var el = $$.sidebar.layers.get(layer.id);
		return {
			update: function() {
				console.log(layer.visible);
				if (layer.visible) {
					el.removeClass('disabled');
				} else {
					el.addClass('disabled');
				}
				el.find('.name').html(layer.name);
			}
		};
	};

	ui.stop = function( stop ) {
		return {
			update: function() {
				// Get stop
				var $this = ui.get.stop( stop.id );
				// Replace it with updated version
				$this.replaceWith(draw.stop( stop ));
				// Move it into the right spot
				$this.css('left', stop.get('pos'));
				// Re-add selected class
				ui.get.stop( stop.id ).addClass('selected');
			},
			add: function(e) {
				if ($(e.target).is('.track')) {
					var raw = e.clientX - ui.mouse.offset,
						pos = Math.round(raw / ui.mouse.max * 100);
					app.selected.layer.addStop({
						pos: pos,
						color: app.selected.layer.blend(pos)
					});
				}
			}
		};
	};
	
	ui.preview = function( layer ) {
		layer = layer || gradiator.selected.layer;
		ui.$$.editor.preview[0].style.background = layer.render();
	};



	// Mouse movements
	ui.mouse = {
		offset: 0,
		active: null,
		max: $$.editor.slider.width - 3,
		down: function() {
			var id = $(this).data('id');
			core.select.stop( app.selected.layer, id );
			ui.mouse.active = $(this);
			document.onmousemove = ui.mouse.move;
		},
		up: function() {
			document.onmousemove = null;
		},
		move: function(e) {
			var raw = e.clientX - ui.mouse.offset;
			if (raw > ui.mouse.max) raw = ui.mouse.max;
			else if (raw < 0) raw = 0;
			ui.mouse.active.css('left', raw);
			var pos = Math.round(raw / ui.mouse.max * 100);
			selected.stop.set({pos: pos, updateStop: false});
		}
	};
	
	// Set offset
	ui.mouse.offset = $$.editor.slider.el.offset().left;



	// Locals

	// Templates
	var templates = {
		layer: _.template($('#layer-template').html()),
		stop: _.template($('#color-stop-template').html())
	};

	// Draw a new layer
	var draw = {
		layer: function( obj ) {
			switch (obj.type) {
				case 'gradient':
					return templates.layer({
						id: obj.id,
						name: obj.name
					});
				case 'color':
					break;
				case 'adjustment':
					break;
			}
		},
		stop: function( obj ) {
			return templates.stop({
				id: obj.id,
				color: obj.get('color'),
				pos: obj.get('pos')
			});
		}
	};
	ui.add = {
		layer: function( obj ) {
			$$.sidebar.layers.el.append(draw.layer(obj));
		},
		stop: function( obj ) {
			$$.editor.slider.stops.el.append(draw.stop(obj));
		}
	};
	ui.get = {
		stop: function( id ) {
			return $$.editor.slider.stops.el.find('[data-id='+id+']');
		}
	};

});