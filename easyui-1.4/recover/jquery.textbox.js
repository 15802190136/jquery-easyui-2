(function($) {
	function init(target) {
		$(target).addClass("textbox-f").hide();
		var textbox = $("<span class=\"textbox\">" + "<input class=\"textbox-text\" autocomplete=\"off\">" + "<input type=\"hidden\" class=\"textbox-value\">" + "</span>").insertAfter(target);
		var name = $(target).attr("name");
		if (name) {
			textbox.find("input.textbox-value").attr("name", name);
			$(target).removeAttr("name").attr("textboxName", name);
		}
		return textbox;
	}
	;
	function initBtns(target) {
		var state = $.data(target, "textbox");
		var opts = state.options;
		var tb = state.textbox;
		tb.find(".textbox-text").remove();
		if (opts.multiline) {
			$("<textarea class=\"textbox-text\" autocomplete=\"off\"></textarea>").prependTo(tb);
		} else {
			$("<input type=\"" + opts.type + "\" class=\"textbox-text\" autocomplete=\"off\">").prependTo(tb);
		}
		tb.find(".textbox-addon").remove();
		var bb = opts.icons ? $.extend(true, [], opts.icons) : [];
		if (opts.iconCls) {
			bb.push({
				iconCls : opts.iconCls,
				disabled : true
			});
		}
		if (bb.length) {
			var bc = $("<span class=\"textbox-addon\"></span>").prependTo(tb);
			bc.addClass("textbox-addon-" + opts.iconAlign);
			for (var i = 0; i < bb.length; i++) {
				bc.append("<a href=\"javascript:void(0)\" class=\"textbox-icon " + bb[i].iconCls + "\" icon-index=\"" + i + "\" tabindex=\"-1\"></a>");
			}
		}
		tb.find(".textbox-button").remove();
		if (opts.buttonText || opts.buttonIcon) {
			var btn = $("<a href=\"javascript:void(0)\" class=\"textbox-button\"></a>").prependTo(tb);
			btn.addClass("textbox-button-" + opts.buttonAlign).linkbutton({
				text : opts.buttonText,
				iconCls : opts.buttonIcon
			});
		}
		setDisabled(target, opts.disabled);
		setReadonly(target, opts.readonly);
	}
	;
	function destroy(target) {
		var tb = $.data(target, "textbox").textbox;
		tb.find(".textbox-text").validatebox("destroy");
		tb.remove();
		$(target).remove();
	}
	;
	function resize(target, width) {
		var state = $.data(target, "textbox");
		var opts = state.options;
		var tb = state.textbox;
		var span = tb.parent();
		if (width) {
			opts.width = width;
		}
		if (isNaN(parseInt(opts.width))) {
			var c = $(target).clone();
			c.css("visibility", "hidden");
			c.insertAfter(target);
			opts.width = c.outerWidth();
			c.remove();
		}
		tb.appendTo("body");
		var text = tb.find(".textbox-text");
		var btn = tb.find(".textbox-button");
		var addon = tb.find(".textbox-addon");
		var icon = addon.find(".textbox-icon");
		tb._size(opts, span);
		btn.linkbutton("resize", {
			height : tb.height()
		});
		btn.css({
			left : (opts.buttonAlign == "left" ? 0 : ""),
			right : (opts.buttonAlign == "right" ? 0 : "")
		});
		addon.css({
			left : (opts.iconAlign == "left" ? (opts.buttonAlign == "left" ? btn._outerWidth() : 0) : ""),
			right : (opts.iconAlign == "right" ? (opts.buttonAlign == "right" ? btn._outerWidth() : 0) : "")
		});
		icon.css({
			width : opts.iconWidth + "px",
			height : tb.height() + "px"
		});
		text.css({
			paddingLeft : (target.style.paddingLeft || ""),
			paddingRight : (target.style.paddingRight || ""),
			marginLeft : setAlign("left"),
			marginRight : setAlign("right")
		});
		if (opts.multiline) {
			text.css({
				paddingTop : (target.style.paddingTop || ""),
				paddingBottom : (target.style.paddingBottom || "")
			});
			text._outerHeight(tb.height());
		} else {
			var paddingTop = Math.floor((tb.height() - text.height()) / 2);
			text.css({
				paddingTop : paddingTop + "px",
				paddingBottom : paddingTop + "px"
			});
		}
		text._outerWidth(tb.width() - icon.length * opts.iconWidth - btn._outerWidth());
		tb.insertAfter(target);
		opts.onResize.call(target, opts.width, opts.height);
		function setAlign(type) {
			return (opts.iconAlign == type ? addon._outerWidth() : 0) + (opts.buttonAlign == type ? btn._outerWidth() : 0);
		}
		;
	}
	;
	function validateTextbox(target) {
		var opts = $(target).textbox("options");
		var textbox = $(target).textbox("textbox");
		textbox.validatebox($.extend({}, opts, {
			deltaX : $(target).textbox("getTipX"),
			onBeforeValidate : function() {
				var box = $(this);
				if (!box.is(":focus")) {
					opts.oldInputValue = box.val();
					box.val(opts.value);
				}
			},
			onValidate : function(valid) {
				var box = $(this);
				if (opts.oldInputValue != undefined) {
					box.val(opts.oldInputValue);
					opts.oldInputValue = undefined;
				}
				var tb = box.parent();
				if (valid) {
					tb.removeClass("textbox-invalid");
				} else {
					tb.addClass("textbox-invalid");
				}
			}
		}));
	}
	;
	function initBindEvents(target) {
		var state = $.data(target, "textbox");
		var opts = state.options;
		var tb = state.textbox;
		var text = tb.find(".textbox-text");
		text.attr("placeholder", opts.prompt);
		text.unbind(".textbox");
		if (!opts.disabled && !opts.readonly) {
			text.bind("blur.textbox", function(e) {
				if (!tb.hasClass("textbox-focused")) {
					return;
				}
				opts.value = $(this).val();
				if (opts.value == "") {
					$(this).val(opts.prompt).addClass("textbox-prompt");
				} else {
					$(this).removeClass("textbox-prompt");
				}
				tb.removeClass("textbox-focused");
			}).bind("focus.textbox", function(e) {
				if (tb.hasClass("textbox-focused")) {
					return;
				}
				if ($(this).val() != opts.value) {
					$(this).val(opts.value);
				}
				$(this).removeClass("textbox-prompt");
				tb.addClass("textbox-focused");
			});
			for ( var inputEvent in opts.inputEvents) {
				text.bind(inputEvent + ".textbox", {
					target : target
				}, opts.inputEvents[inputEvent]);
			}
		}
		var addon = tb.find(".textbox-addon");
		addon.unbind().bind("click", {
			target : target
		}, function(e) {
			var icon = $(e.target).closest("a.textbox-icon:not(.textbox-icon-disabled)");
			if (icon.length) {
				var index = parseInt(icon.attr("icon-index"));
				var activeIcon = opts.icons[index];
				if (activeIcon && activeIcon.handler) {
					activeIcon.handler.call(icon[0], e);
					opts.onClickIcon.call(target, index);
				}
			}
		});
		addon.find(".textbox-icon").each(function(indexIcon) {
			var icon = opts.icons[indexIcon];
			var currentSpan = $(this);
			if (!icon || icon.disabled || opts.disabled || opts.readonly) {
				currentSpan.addClass("textbox-icon-disabled");
			} else {
				currentSpan.removeClass("textbox-icon-disabled");
			}
		});
		var btn = tb.find(".textbox-button");
		btn.unbind(".textbox").bind("click.textbox", function() {
			if (!btn.linkbutton("options").disabled) {
				opts.onClickButton.call(target);
			}
		});
		btn.linkbutton((opts.disabled || opts.readonly) ? "disable" : "enable");
		tb.unbind(".textbox").bind("_resize.textbox", function(e, customClass) {
			if ($(this).hasClass("easyui-fluid") || customClass) {
				resize(target);
			}
			return false;
		});
	}
	;
	function setDisabled(target, disabled) {
		var state = $.data(target, "textbox");
		var opts = state.options;
		var tb = state.textbox;
		if (disabled) {
			opts.disabled = true;
			$(target).attr("disabled", "disabled");
			tb.find(".textbox-text,.textbox-value").attr("disabled", "disabled");
		} else {
			opts.disabled = false;
			$(target).removeAttr("disabled");
			tb.find(".textbox-text,.textbox-value").removeAttr("disabled");
		}
	}
	;
	function setReadonly(target, mode) {
		var state = $.data(target, "textbox");
		var opts = state.options;
		opts.readonly = mode == undefined ? true : mode;
		var text = state.textbox.find(".textbox-text");
		text.removeAttr("readonly").removeClass("textbox-text-readonly");
		if (opts.readonly || !opts.editable) {
			text.attr("readonly", "readonly").addClass("textbox-text-readonly");
		}
	}
	;
	$.fn.textbox = function(options, param) {
		if (typeof options == "string") {
			var method = $.fn.textbox.methods[options];
			if (method) {
				return method(this, param);
			} else {
				return this.each(function() {
					var textbox = $(this).textbox("textbox");
					textbox.validatebox(options, param);
				});
			}
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "textbox");
			if (state) {
				$.extend(state.options, options);
				if (options.value != undefined) {
					state.options.originalValue = options.value;
				}
			} else {
				state = $.data(this, "textbox", {
					options : $.extend({}, $.fn.textbox.defaults, $.fn.textbox.parseOptions(this), options),
					textbox : init(this)
				});
				state.options.originalValue = state.options.value;
			}
			initBtns(this);
			initBindEvents(this);
			resize(this);
			validateTextbox(this);
			$(this).textbox("initValue", state.options.value);
		});
	};
	$.fn.textbox.methods = {
		options : function(jq) {
			return $.data(jq[0], "textbox").options;
		},
		cloneFrom : function(jq, cloneObj) {
			return jq.each(function() {
				var t = $(this);
				if (t.data("textbox")) {
					return;
				}
				if (!$(cloneObj).data("textbox")) {
					$(cloneObj).textbox();
				}
				var nameObj = t.attr("name") || "";
				t.addClass("textbox-f").hide();
				t.removeAttr("name").attr("textboxName", nameObj);
				var nextObj = $(cloneObj).next().clone().insertAfter(t);
				nextObj.find("input.textbox-value").attr("name", nameObj);
				$.data(this, "textbox", {
					options : $.extend(true, {}, $(cloneObj).textbox("options")),
					textbox : nextObj
				});
				var button = $(cloneObj).textbox("button");
				if (button.length) {
					t.textbox("button").linkbutton($.extend(true, {}, button.linkbutton("options")));
				}
				initBindEvents(this);
				validateTextbox(this);
			});
		},
		textbox : function(jq) {
			return $.data(jq[0], "textbox").textbox.find(".textbox-text");
		},
		button : function(jq) {
			return $.data(jq[0], "textbox").textbox.find(".textbox-button");
		},
		destroy : function(jq) {
			return jq.each(function() {
				destroy(this);
			});
		},
		resize : function(jq, width) {
			return jq.each(function() {
				resize(this, width);
			});
		},
		disable : function(jq) {
			return jq.each(function() {
				setDisabled(this, true);
				initBindEvents(this);
			});
		},
		enable : function(jq) {
			return jq.each(function() {
				setDisabled(this, false);
				initBindEvents(this);
			});
		},
		readonly : function(jq, mode) {
			return jq.each(function() {
				setReadonly(this, mode);
				initBindEvents(this);
			});
		},
		isValid : function(jq) {
			return jq.textbox("textbox").validatebox("isValid");
		},
		clear : function(jq) {
			return jq.each(function() {
				$(this).textbox("setValue", "");
			});
		},
		setText : function(jq, text) {
			return jq.each(function() {
				var opts = $(this).textbox("options");
				var textbox = $(this).textbox("textbox");
				if ($(this).textbox("getText") != text) {
					opts.value = text;
					textbox.val(text);
				}
				if (!textbox.is(":focus")) {
					if (text) {
						textbox.removeClass("textbox-prompt");
					} else {
						textbox.val(opts.prompt).addClass("textbox-prompt");
					}
				}
				$(this).textbox("validate");
			});
		},
		initValue : function(jq, value) {
			return jq.each(function() {
				var state = $.data(this, "textbox");
				state.options.value = "";
				$(this).textbox("setText", value);
				state.textbox.find(".textbox-value").val(value);
				$(this).val(value);
			});
		},
		setValue : function(jq, value) {
			return jq.each(function() {
				var opts = $.data(this, "textbox").options;
				var oldValue = $(this).textbox("getValue");
				$(this).textbox("initValue", value);
				if (oldValue != value) {
					opts.onChange.call(this, value, oldValue);
				}
			});
		},
		getText : function(jq) {
			var textbox = jq.textbox("textbox");
			if (textbox.is(":focus")) {
				return textbox.val();
			} else {
				return jq.textbox("options").value;
			}
		},
		getValue : function(jq) {
			return jq.data("textbox").textbox.find(".textbox-value").val();
		},
		reset : function(jq) {
			return jq.each(function() {
				var options = $(this).textbox("options");
				$(this).textbox("setValue", options.originalValue);
			});
		},
		getIcon : function(jq, index) {
			return jq.data("textbox").textbox.find(".textbox-icon:eq(" + index + ")");
		},
		getTipX : function(jq) {
			var state = jq.data("textbox");
			var opts = state.options;
			var tb = state.textbox;
			var text = tb.find(".textbox-text");
			var addon = tb.find(".textbox-addon")._outerWidth();
			var btn = tb.find(".textbox-button")._outerWidth();
			if (opts.tipPosition == "right") {
				return (opts.iconAlign == "right" ? addon : 0) + (opts.buttonAlign == "right" ? btn : 0) + 1;
			} else {
				if (opts.tipPosition == "left") {
					return (opts.iconAlign == "left" ? -addon : 0) + (opts.buttonAlign == "left" ? -btn : 0) - 1;
				} else {
					return addon / 2 * (opts.iconAlign == "right" ? 1 : -1);
				}
			}
		}
	};
	$.fn.textbox.parseOptions = function(target) {
		var t = $(target);
		return $.extend({}, $.fn.validatebox.parseOptions(target), $.parser.parseOptions(target, [ "prompt", "iconCls", "iconAlign", "buttonText", "buttonIcon", "buttonAlign", {
			multiline : "boolean",
			editable : "boolean",
			iconWidth : "number"
		} ]), {
			value : (t.val() || undefined),
			type : (t.attr("type") ? t.attr("type") : undefined),
			disabled : (t.attr("disabled") ? true : undefined),
			readonly : (t.attr("readonly") ? true : undefined)
		});
	};
	$.fn.textbox.defaults = $.extend({}, $.fn.validatebox.defaults, {
		width : "auto",
		height : 22,
		prompt : "",
		value : "",
		type : "text",
		multiline : false,
		editable : true,
		disabled : false,
		readonly : false,
		icons : [],
		iconCls : null,
		iconAlign : "right",
		iconWidth : 18,
		buttonText : "",
		buttonIcon : null,
		buttonAlign : "right",
		inputEvents : {
			blur : function(e) {
				var t = $(e.data.target);
				var opts = t.textbox("options");
				t.textbox("setValue", opts.value);
			},
			keydown : function(e) {
				if (e.keyCode == 13) {
					var t = $(e.data.target);
					t.textbox("setValue", t.textbox("getText"));
				}
			}
		},
		onChange : function(newValue, oldValue) {
		},
		onResize : function(width, height) {
		},
		onClickButton : function() {
		},
		onClickIcon : function(index) {
		}
	});
})(jQuery);
