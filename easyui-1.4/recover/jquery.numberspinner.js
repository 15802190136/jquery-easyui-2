(function($) {
	function init(target) {
		$(target).addClass("numberspinner-f");
		var opts = $.data(target, "numberspinner").options;
		$(target).numberbox(opts).spinner(opts);
		$(target).numberbox("setValue", opts.value);
	}
	;
	function doSpin(target, down) {
		var opts = $.data(target, "numberspinner").options;
		var v = parseFloat($(target).numberbox("getValue") || opts.value) || 0;
		if (down) {
			v -= opts.increment;
		} else {
			v += opts.increment;
		}
		$(target).numberbox("setValue", v);
	}
	;
	$.fn.numberspinner = function(options, param) {
		if (typeof options == "string") {
			var method = $.fn.numberspinner.methods[options];
			if (method) {
				return method(this, param);
			} else {
				return this.numberbox(options, param);
			}
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "numberspinner");
			if (state) {
				$.extend(state.options, options);
			} else {
				$.data(this, "numberspinner", {
					options : $.extend({}, $.fn.numberspinner.defaults, $.fn.numberspinner.parseOptions(this), options)
				});
			}
			init(this);
		});
	};
	$.fn.numberspinner.methods = {
		options : function(jq) {
			var numberboxOpts = jq.numberbox("options");
			return $.extend($.data(jq[0], "numberspinner").options, {
				width : numberboxOpts.width,
				value : numberboxOpts.value,
				originalValue : numberboxOpts.originalValue,
				disabled : numberboxOpts.disabled,
				readonly : numberboxOpts.readonly
			});
		}
	};
	$.fn.numberspinner.parseOptions = function(target) {
		return $.extend({}, $.fn.spinner.parseOptions(target), $.fn.numberbox.parseOptions(target), {});
	};
	$.fn.numberspinner.defaults = $.extend({}, $.fn.spinner.defaults, $.fn.numberbox.defaults, {
		spin : function(down) {
			doSpin(this, down);
		}
	});
})(jQuery);
