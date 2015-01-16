(function($) {
	function init(target) {
		var opts = $.data(target, "dialog").options;
		opts.inited = false;
		$(target).window($.extend({}, opts, {
			onResize : function(w, h) {
				if (opts.inited) {
					resize(this);
					opts.onResize.call(this, w, h);
				}
			}
		}));
		var window = $(target).window("window");
		if (opts.toolbar) {
			if ($.isArray(opts.toolbar)) {
				$(target).siblings("div.dialog-toolbar").remove();
				var toolbarHtml = $("<div class=\"dialog-toolbar\"><table cellspacing=\"0\" cellpadding=\"0\"><tr></tr></table></div>").appendTo(window);
				var tr = toolbarHtml.find("tr");
				for (var i = 0; i < opts.toolbar.length; i++) {
					var linkbutton = opts.toolbar[i];
					if (linkbutton == "-") {
						$("<td><div class=\"dialog-tool-separator\"></div></td>").appendTo(tr);
					} else {
						var td = $("<td></td>").appendTo(tr);
						var linkbuttonJq = $("<a href=\"javascript:void(0)\"></a>").appendTo(td);
						linkbuttonJq[0].onclick = eval(linkbutton.handler || function() {
						});
						linkbuttonJq.linkbutton($.extend({}, linkbutton, {
							plain : true
						}));
					}
				}
			} else {
				$(opts.toolbar).addClass("dialog-toolbar").appendTo(window);
				$(opts.toolbar).show();
			}
		} else {
			$(target).siblings("div.dialog-toolbar").remove();
		}
		if (opts.buttons) {
			if ($.isArray(opts.buttons)) {
				$(target).siblings("div.dialog-button").remove();
				var buttonHtml = $("<div class=\"dialog-button\"></div>").appendTo(window);
				for (var i = 0; i < opts.buttons.length; i++) {
					var p = opts.buttons[i];
					var linkbuttonJq = $("<a href=\"javascript:void(0)\"></a>").appendTo(buttonHtml);
					if (p.handler) {
						linkbuttonJq[0].onclick = p.handler;
					}
					linkbuttonJq.linkbutton(p);
				}
			} else {
				$(opts.buttons).addClass("dialog-button").appendTo(window);
				$(opts.buttons).show();
			}
		} else {
			$(target).siblings("div.dialog-button").remove();
		}
		opts.inited = true;
		window.show();
		$(target).window("resize");
		if (opts.closed) {
			window.hide();
		}
	}
	;
	function resize(target, param) {
		var t = $(target);
		var opts = t.dialog("options");
		var noheader = opts.noheader;
		var tb = t.siblings(".dialog-toolbar");
		var bb = t.siblings(".dialog-button");
		tb.insertBefore(target).css({
			position : "relative",
			borderTopWidth : (noheader ? 1 : 0),
			top : (noheader ? tb.length : 0)
		});
		bb.insertAfter(target).css({
			position : "relative",
			top : -1
		});
		if (!isNaN(parseInt(opts.height))) {
			t._outerHeight(t._outerHeight() - tb._outerHeight() - bb._outerHeight());
		}
		tb.add(bb)._outerWidth(t._outerWidth());
		var shadow = $.data(target, "window").shadow;
		if (shadow) {
			var cc = t.panel("panel");
			shadow.css({
				width : cc._outerWidth(),
				height : cc._outerHeight()
			});
		}
	}
	;
	$.fn.dialog = function(options, param) {
		if (typeof options == "string") {
			var method = $.fn.dialog.methods[options];
			if (method) {
				return method(this, param);
			} else {
				return this.window(options, param);
			}
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "dialog");
			if (state) {
				$.extend(state.options, options);
			} else {
				$.data(this, "dialog", {
					options : $.extend({}, $.fn.dialog.defaults, $.fn.dialog.parseOptions(this), options)
				});
			}
			init(this);
		});
	};
	$.fn.dialog.methods = {
		options : function(jq) {
			var opts = $.data(jq[0], "dialog").options;
			var panelOpts = jq.panel("options");
			$.extend(opts, {
				width : panelOpts.width,
				height : panelOpts.height,
				left : panelOpts.left,
				top : panelOpts.top,
				closed : panelOpts.closed,
				collapsed : panelOpts.collapsed,
				minimized : panelOpts.minimized,
				maximized : panelOpts.maximized
			});
			return opts;
		},
		dialog : function(jq) {
			return jq.window("window");
		}
	};
	$.fn.dialog.parseOptions = function(target) {
		return $.extend({}, $.fn.window.parseOptions(target), $.parser.parseOptions(target, [ "toolbar", "buttons" ]));
	};
	$.fn.dialog.defaults = $.extend({}, $.fn.window.defaults, {
		title : "New Dialog",
		collapsible : false,
		minimizable : false,
		maximizable : false,
		resizable : false,
		toolbar : null,
		buttons : null
	});
})(jQuery);
