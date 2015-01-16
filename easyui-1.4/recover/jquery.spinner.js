(function($) {
	function init(target) {
		var spinner = $.data(target, "spinner");
		var opts = spinner.options;
		var icon = $.extend(true, [], opts.icons);
		icon.push({
			iconCls : "spinner-arrow",
			handler : function(e) {
				bindArrow(e);
			}
		});
		$(target).addClass("spinner-f").textbox($.extend({}, opts, {
			icons : icon
		}));
		var iconText = $(target).textbox("getIcon", icon.length - 1);
		iconText.append("<a href=\"javascript:void(0)\" class=\"spinner-arrow-up\"></a>");
		iconText.append("<a href=\"javascript:void(0)\" class=\"spinner-arrow-down\"></a>");
		$(target).attr("spinnerName", $(target).attr("textboxName"));
		spinner.spinner = $(target).next();
		spinner.spinner.addClass("spinner");
	}
	;
	function bindArrow(e) {
		var target = e.data.target;
		var opts = $(target).spinner("options");
		var up = $(e.target).closest("a.spinner-arrow-up");
		if (up.length) {
			opts.spin.call(target, false);
			opts.onSpinUp.call(target);
			$(target).spinner("validate");
		}
		var down = $(e.target).closest("a.spinner-arrow-down");
		if (down.length) {
			opts.spin.call(target, true);
			opts.onSpinDown.call(target);
			$(target).spinner("validate");
		}
	}
	;
	$.fn.spinner = function(options, param) {
		if (typeof options == "string") {
			var methods = $.fn.spinner.methods[options];
			if (methods) {
				return methods(this, param);
			} else {
				return this.textbox(options, param);
			}
		}
		options = options || {};
		return this.each(function() {
			var spinner = $.data(this, "spinner");
			if (spinner) {
				$.extend(spinner.options, options);
			} else {
				spinner = $.data(this, "spinner", {
					options : $.extend({}, $.fn.spinner.defaults, $.fn.spinner.parseOptions(this), options)
				});
			}
			init(this);
		});
	};
	$.fn.spinner.methods = {
		options : function(jq) {
			var opts = jq.textbox("options");
			return $.extend($.data(jq[0], "spinner").options, {
				width : opts.width,
				value : opts.value,
				originalValue : opts.originalValue,
				disabled : opts.disabled,
				readonly : opts.readonly
			});
		}
	};
	$.fn.spinner.parseOptions = function(target) {
		return $.extend({}, $.fn.textbox.parseOptions(target), $.parser.parseOptions(target, [ "min", "max", {
			increment : "number"
		} ]));
	};
	$.fn.spinner.defaults = $.extend({}, $.fn.textbox.defaults, {
		min : null,
		max : null,
		increment : 1,
		spin : function(down) {
		},
		onSpinUp : function() {
		},
		onSpinDown : function() {
		}
	});
})(jQuery);
