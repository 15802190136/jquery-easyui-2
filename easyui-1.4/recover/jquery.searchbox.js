(function($) {
	function init(target) {
		var state = $.data(target, "searchbox");
		var opts = state.options;
		var icons = $.extend(true, [], opts.icons);
		icons.push({
			iconCls : "searchbox-button",
			handler : function(e) {
				var t = $(e.data.target);
				var btnOpts = t.searchbox("options");
				btnOpts.searcher.call(e.data.target, t.searchbox("getValue"), t.searchbox("getName"));
			}
		});
		initMenu();
		var item = getMenuItem();
		$(target).addClass("searchbox-f").textbox($.extend({}, opts, {
			icons : icons,
			buttonText : (item ? item.text : "")
		}));
		$(target).attr("searchboxName", $(target).attr("textboxName"));
		state.searchbox = $(target).next();
		state.searchbox.addClass("searchbox");
		initMenuBtn(item);
		function initMenu() {
			if (opts.menu) {
				state.menu = $(opts.menu).menu();
				var menuOpts = state.menu.menu("options");
				var clickFtn = menuOpts.onClick;
				menuOpts.onClick = function(item) {
					initMenuBtn(item);
					clickFtn.call(this, item);
				};
			} else {
				if (state.menu) {
					state.menu.menu("destroy");
				}
				state.menu = null;
			}
		}
		;
		function getMenuItem() {
			if (state.menu) {
				var firstItem = state.menu.children("div.menu-item:first");
				state.menu.children("div.menu-item").each(function() {
					var menuOpts = $.extend({}, $.parser.parseOptions(this), {
						selected : ($(this).attr("selected") ? true : undefined)
					});
					if (menuOpts.selected) {
						firstItem = $(this);
						return false;
					}
				});
				return state.menu.menu("getItem", firstItem[0]);
			} else {
				return null;
			}
		}
		;
		function initMenuBtn(item) {
			if (!item) {
				return;
			}
			$(target).textbox("button").menubutton({
				text : item.text,
				iconCls : (item.iconCls || null),
				menu : state.menu,
				menuAlign : opts.buttonAlign,
				plain : false
			});
			state.searchbox.find("input.textbox-value").attr("name", item.name || item.text);
			$(target).searchbox("resize");
		}
		;
	}
	;
	$.fn.searchbox = function(options, param) {
		if (typeof options == "string") {
			var method = $.fn.searchbox.methods[options];
			if (method) {
				return method(this, param);
			} else {
				return this.textbox(options, param);
			}
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "searchbox");
			if (state) {
				$.extend(state.options, options);
			} else {
				$.data(this, "searchbox", {
					options : $.extend({}, $.fn.searchbox.defaults, $.fn.searchbox.parseOptions(this), options)
				});
			}
			init(this);
		});
	};
	$.fn.searchbox.methods = {
		options : function(jq) {
			var opts = jq.textbox("options");
			return $.extend($.data(jq[0], "searchbox").options, {
				width : opts.width,
				value : opts.value,
				originalValue : opts.originalValue,
				disabled : opts.disabled,
				readonly : opts.readonly
			});
		},
		menu : function(jq) {
			return $.data(jq[0], "searchbox").menu;
		},
		getName : function(jq) {
			return $.data(jq[0], "searchbox").searchbox.find("input.textbox-value").attr("name");
		},
		selectName : function(jq, name) {
			return jq.each(function() {
				var menu = $.data(this, "searchbox").menu;
				if (menu) {
					menu.children("div.menu-item").each(function() {
						var item = menu.menu("getItem", this);
						if (item.name == name) {
							$(this).triggerHandler("click");
							return false;
						}
					});
				}
			});
		},
		destroy : function(jq) {
			return jq.each(function() {
				var menu = $(this).searchbox("menu");
				if (menu) {
					menu.menu("destroy");
				}
				$(this).textbox("destroy");
			});
		}
	};
	$.fn.searchbox.parseOptions = function(target) {
		var t = $(target);
		return $.extend({}, $.fn.textbox.parseOptions(target), $.parser.parseOptions(target, [ "menu" ]), {
			searcher : (t.attr("searcher") ? eval(t.attr("searcher")) : undefined)
		});
	};
	$.fn.searchbox.defaults = $.extend({}, $.fn.textbox.defaults, {
		inputEvents : $.extend({}, $.fn.textbox.defaults.inputEvents, {
			keydown : function(e) {
				if (e.keyCode == 13) {
					e.preventDefault();
					var t = $(e.data.target);
					var opts = t.searchbox("options");
					t.searchbox("setValue", $(this).val());
					opts.searcher.call(e.data.target, t.searchbox("getValue"), t.searchbox("getName"));
					return false;
				}
			}
		}),
		buttonAlign : "left",
		menu : null,
		searcher : function(value, name) {
		}
	});
})(jQuery);
