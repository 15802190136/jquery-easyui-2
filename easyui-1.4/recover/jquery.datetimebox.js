(function($) {
	function init(target) {
		var state = $.data(target, "datetimebox");
		var opts = state.options;
		$(target).datebox($.extend({}, opts, {
			onShowPanel : function() {
				var value = $(this).datetimebox("getValue");
				setValue(this, value, true);
				opts.onShowPanel.call(this);
			},
			formatter : $.fn.datebox.defaults.formatter,
			parser : $.fn.datebox.defaults.parser
		}));
		$(target).removeClass("datebox-f").addClass("datetimebox-f");
		$(target).datebox("calendar").calendar({
			onSelect : function(date) {
				opts.onSelect.call(this.target, date);
			}
		});
		if (!state.spinner) {
			var panel = $(target).datebox("panel");
			var p = $("<div style=\"padding:2px\"><input></div>").insertAfter(panel.children("div.datebox-calendar-inner"));
			state.spinner = p.children("input");
		}
		state.spinner.timespinner({
			width : opts.spinnerWidth,
			showSeconds : opts.showSeconds,
			separator : opts.timeSeparator
		});
		$(target).datetimebox("initValue", opts.value);
	}
	;
	function getCurrentDate(target) {
		var c = $(target).datetimebox("calendar");
		var t = $(target).datetimebox("spinner");
		var currentDate = c.calendar("options").current;
		return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), t.timespinner("getHours"), t.timespinner("getMinutes"), t.timespinner("getSeconds"));
	}
	;
	function doQuery(target, q) {
		setValue(target, q, true);
	}
	;
	function doEnter(target) {
		var opts = $.data(target, "datetimebox").options;
		var date = getCurrentDate(target);
		setValue(target, opts.formatter.call(target, date));
		$(target).combo("hidePanel");
	}
	;
	function setValue(target, value, remainText) {
		var opts = $.data(target, "datetimebox").options;
		$(target).combo("setValue", value);
		if (!remainText) {
			if (value) {
				var date = opts.parser.call(target, value);
				$(target).combo("setValue", opts.formatter.call(target, date));
				$(target).combo("setText", opts.formatter.call(target, date));
			} else {
				$(target).combo("setText", value);
			}
		}
		var date = opts.parser.call(target, value);
		$(target).datetimebox("calendar").calendar("moveTo", date);
		$(target).datetimebox("spinner").timespinner("setValue", getTimeS(date));
		function getTimeS(date) {
			function formatNumber(value) {
				return (value < 10 ? "0" : "") + value;
			}
			;
			var tt = [ formatNumber(date.getHours()), formatNumber(date.getMinutes()) ];
			if (opts.showSeconds) {
				tt.push(formatNumber(date.getSeconds()));
			}
			return tt.join($(target).datetimebox("spinner").timespinner("options").separator);
		}
		;
	}
	;
	$.fn.datetimebox = function(options, param) {
		if (typeof options == "string") {
			var method = $.fn.datetimebox.methods[options];
			if (method) {
				return method(this, param);
			} else {
				return this.datebox(options, param);
			}
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "datetimebox");
			if (state) {
				$.extend(state.options, options);
			} else {
				$.data(this, "datetimebox", {
					options : $.extend({}, $.fn.datetimebox.defaults, $.fn.datetimebox.parseOptions(this), options)
				});
			}
			init(this);
		});
	};
	$.fn.datetimebox.methods = {
		options : function(jq) {
			var opts = jq.datebox("options");
			return $.extend($.data(jq[0], "datetimebox").options, {
				originalValue : opts.originalValue,
				disabled : opts.disabled,
				readonly : opts.readonly
			});
		},
		cloneFrom : function(jq, dateboxObj) {
			return jq.each(function() {
				$(this).datebox("cloneFrom", dateboxObj);
				$.data(this, "datetimebox", {
					options : $.extend(true, {}, $(dateboxObj).datetimebox("options")),
					spinner : $(dateboxObj).datetimebox("spinner")
				});
				$(this).removeClass("datebox-f").addClass("datetimebox-f");
			});
		},
		spinner : function(jq) {
			return $.data(jq[0], "datetimebox").spinner;
		},
		initValue : function(jq, value) {
			return jq.each(function() {
				var opts = $(this).datetimebox("options");
				var oldValue = opts.value;
				if (oldValue) {
					oldValue = opts.formatter.call(this, opts.parser.call(this, oldValue));
				}
				$(this).combo("initValue", oldValue).combo("setText", oldValue);
			});
		},
		setValue : function(jq, value) {
			return jq.each(function() {
				setValue(this, value);
			});
		},
		reset : function(jq) {
			return jq.each(function() {
				var opts = $(this).datetimebox("options");
				$(this).datetimebox("setValue", opts.originalValue);
			});
		}
	};
	$.fn.datetimebox.parseOptions = function(target) {
		var t = $(target);
		return $.extend({}, $.fn.datebox.parseOptions(target), $.parser.parseOptions(target, [ "timeSeparator", "spinnerWidth", {
			showSeconds : "boolean"
		} ]));
	};
	$.fn.datetimebox.defaults = $.extend({}, $.fn.datebox.defaults, {
		spinnerWidth : "100%",
		showSeconds : true,
		timeSeparator : ":",
		keyHandler : {
			up : function(e) {
			},
			down : function(e) {
			},
			left : function(e) {
			},
			right : function(e) {
			},
			enter : function(e) {
				doEnter(this);
			},
			query : function(q, e) {
				doQuery(this, q);
			}
		},
		buttons : [ {
			text : function(target) {
				return $(target).datetimebox("options").currentText;
			},
			handler : function(target) {
				var opts = $(target).datetimebox("options");
				setValue(target, opts.formatter.call(target, new Date()));
				$(target).datetimebox("hidePanel");
			}
		}, {
			text : function(target) {
				return $(target).datetimebox("options").okText;
			},
			handler : function(target) {
				doEnter(target);
			}
		}, {
			text : function(target) {
				return $(target).datetimebox("options").closeText;
			},
			handler : function(target) {
				$(target).datetimebox("hidePanel");
			}
		} ],
		formatter : function(date) {
			var h = date.getHours();
			var M = date.getMinutes();
			var s = date.getSeconds();
			function formatNumber(value) {
				return (value < 10 ? "0" : "") + value;
			}
			;
			var separator = $(this).datetimebox("spinner").timespinner("options").separator;
			var r = $.fn.datebox.defaults.formatter(date) + " " + formatNumber(h) + separator + formatNumber(M);
			if ($(this).datetimebox("options").showSeconds) {
				r += separator + formatNumber(s);
			}
			return r;
		},
		parser : function(s) {
			if ($.trim(s) == "") {
				return new Date();
			}
			var dt = s.split(" ");
			var d = $.fn.datebox.defaults.parser(dt[0]);
			if (dt.length < 2) {
				return d;
			}
			var separator = $(this).datetimebox("spinner").timespinner("options").separator;
			var tt = dt[1].split(separator);
			var hour = parseInt(tt[0], 10) || 0;
			var minute = parseInt(tt[1], 10) || 0;
			var second = parseInt(tt[2], 10) || 0;
			return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, second);
		}
	});
})(jQuery);
