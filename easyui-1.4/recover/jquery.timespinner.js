(function($) {
	function setSelectStart(target) {
		var start = 0;
		if (target.selectionStart) {
			start = target.selectionStart;
		} else {
			if (target.createTextRange) {
				var range = target.createTextRange();
				var s = document.selection.createRange();
				s.setEndPoint("StartToStart", range);
				start = s.text.length;
			}
		}
		return start;
	}
	;
	function setCharacter(target, start, end) {
		if (target.selectionStart) {
			target.setSelectionRange(start, end);
		} else {
			if (target.createTextRange) {
				var range = target.createTextRange();
				range.collapse();
				range.moveEnd("character", end);
				range.moveStart("character", start);
				range.select();
			}
		}
	}
	;
	function init(target) {
		var opts = $.data(target, "timespinner").options;
		$(target).addClass("timespinner-f").spinner(opts);
		var formatValue = opts.formatter.call(target, opts.parser.call(target, opts.value));
		$(target).timespinner("initValue", formatValue);
	}
	;
	function spinnerClick(e) {
		var target = e.data.target;
		var opts = $.data(target, "timespinner").options;
		var start = setSelectStart(this);
		for (var i = 0; i < opts.selections.length; i++) {
			var selection = opts.selections[i];
			if (start >= selection[0] && start <= selection[1]) {
				doSelection(target, i);
				return;
			}
		}
	}
	;
	function doSelection(target, index) {
		var opts = $.data(target, "timespinner").options;
		if (index != undefined) {
			opts.highlight = index;
		}
		var selection = opts.selections[opts.highlight];
		if (selection) {
			var tb = $(target).timespinner("textbox");
			setCharacter(tb[0], selection[0], selection[1]);
			tb.focus();
		}
	}
	;
	function setValue(target, value) {
		var opts = $.data(target, "timespinner").options;
		var value = opts.parser.call(target, value);
		var formatValue = opts.formatter.call(target, value);
		$(target).spinner("setValue", formatValue);
	}
	;
	function doSpin(target, down) {
		var opts = $.data(target, "timespinner").options;
		var s = $(target).timespinner("getValue");
		var highlight = opts.selections[opts.highlight];
		var s1 = s.substring(0, highlight[0]);
		var s2 = s.substring(highlight[0], highlight[1]);
		var s3 = s.substring(highlight[1]);
		var v = s1 + ((parseInt(s2) || 0) + opts.increment * (down ? -1 : 1)) + s3;
		$(target).timespinner("setValue", v);
		doSelection(target);
	}
	;
	$.fn.timespinner = function(options, param) {
		if (typeof options == "string") {
			var method = $.fn.timespinner.methods[options];
			if (method) {
				return method(this, param);
			} else {
				return this.spinner(options, param);
			}
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "timespinner");
			if (state) {
				$.extend(state.options, options);
			} else {
				$.data(this, "timespinner", {
					options : $.extend({}, $.fn.timespinner.defaults, $.fn.timespinner.parseOptions(this), options)
				});
			}
			init(this);
		});
	};
	$.fn.timespinner.methods = {
		options : function(jq) {
			var opts = jq.data("spinner") ? jq.spinner("options") : {};
			return $.extend($.data(jq[0], "timespinner").options, {
				width : opts.width,
				value : opts.value,
				originalValue : opts.originalValue,
				disabled : opts.disabled,
				readonly : opts.readonly
			});
		},
		setValue : function(jq, value) {
			return jq.each(function() {
				setValue(this, value);
			});
		},
		getHours : function(jq) {
			var opts = $.data(jq[0], "timespinner").options;
			var vv = jq.timespinner("getValue").split(opts.separator);
			return parseInt(vv[0], 10);
		},
		getMinutes : function(jq) {
			var opts = $.data(jq[0], "timespinner").options;
			var vv = jq.timespinner("getValue").split(opts.separator);
			return parseInt(vv[1], 10);
		},
		getSeconds : function(jq) {
			var opts = $.data(jq[0], "timespinner").options;
			var vv = jq.timespinner("getValue").split(opts.separator);
			return parseInt(vv[2], 10) || 0;
		}
	};
	$.fn.timespinner.parseOptions = function(target) {
		return $.extend({}, $.fn.spinner.parseOptions(target), $.parser.parseOptions(target, [ "separator", {
			showSeconds : "boolean",
			highlight : "number"
		} ]));
	};
	$.fn.timespinner.defaults = $.extend({}, $.fn.spinner.defaults, {
		inputEvents : $.extend({}, $.fn.spinner.defaults.inputEvents, {
			click : function(e) {
				spinnerClick.call(this, e);
			},
			blur : function(e) {
				var t = $(e.data.target);
				t.timespinner("setValue", t.timespinner("getText"));
			}
		}),
		formatter : function(date) {
			if (!date) {
				return "";
			}
			var opts = $(this).timespinner("options");
			var tt = [ fixZero(date.getHours()), fixZero(date.getMinutes()) ];
			if (opts.showSeconds) {
				tt.push(fixZero(date.getSeconds()));
			}
			return tt.join(opts.separator);
			function fixZero(value) {
				return (value < 10 ? "0" : "") + value;
			}
			;
		},
		parser : function(s) {
			var opts = $(this).timespinner("options");
			var validDate = getValidDate(s);
			if (validDate) {
				var min = getValidDate(opts.min);
				var max = getValidDate(opts.max);
				if (min && min > validDate) {
					validDate = min;
				}
				if (max && max < validDate) {
					validDate = max;
				}
			}
			return validDate;
			function getValidDate(s) {
				if (!s) {
					return null;
				}
				var tt = s.split(opts.separator);
				return new Date(1900, 0, 0, parseInt(tt[0], 10) || 0, parseInt(tt[1], 10) || 0, parseInt(tt[2], 10) || 0);
			}
			;
			if (!s) {
				return null;
			}
			var tt = s.split(opts.separator);
			return new Date(1900, 0, 0, parseInt(tt[0], 10) || 0, parseInt(tt[1], 10) || 0, parseInt(tt[2], 10) || 0);
		},
		selections : [ [ 0, 2 ], [ 3, 5 ], [ 6, 8 ] ],
		separator : ":",
		showSeconds : false,
		highlight : 0,
		spin : function(down) {
			doSpin(this, down);
		}
	});
})(jQuery);
