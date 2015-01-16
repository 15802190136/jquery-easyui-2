(function($) {
	$.fn._remove = function() {
		return this.each(function() {
			$(this).remove();
			try {
				this.outerHTML = "";
			} catch (err) {
			}
		});
	};
	function remove(panel) {
		panel._remove();
	}
	;
	function resize(target, param) {
		var state = $.data(target, "panel");
		var opts = state.options;
		var panel = state.panel;
		var header = panel.children("div.panel-header");
		var pbody = panel.children("div.panel-body");
		var pfooter = panel.children("div.panel-footer");
		if (param) {
			$.extend(opts, {
				width : param.width,
				height : param.height,
				minWidth : param.minWidth,
				maxWidth : param.maxWidth,
				minHeight : param.minHeight,
				maxHeight : param.maxHeight,
				left : param.left,
				top : param.top
			});
		}
		panel._size(opts);
		header.add(pbody)._outerWidth(panel.width());
		if (!isNaN(parseInt(opts.height))) {
			pbody._outerHeight(panel.height() - header._outerHeight() - pfooter._outerHeight());
		} else {
			pbody.css("height", "");
			var minHeight = $.parser.parseValue("minHeight", opts.minHeight, panel.parent());
			var maxHeight = $.parser.parseValue("maxHeight", opts.maxHeight, panel.parent());
			var outerHeight = header._outerHeight() + pfooter._outerHeight() + panel._outerHeight() - panel.height();
			pbody._size("minHeight", minHeight ? (minHeight - outerHeight) : "");
			pbody._size("maxHeight", maxHeight ? (maxHeight - outerHeight) : "");
		}
		panel.css({
			height : "",
			minHeight : "",
			maxHeight : "",
			left : opts.left,
			top : opts.top
		});
		opts.onResize.apply(target, [ opts.width, opts.height ]);
		$(target).panel("doLayout");
	}
	;
	function move(target, param) {
		var opts = $.data(target, "panel").options;
		var panel = $.data(target, "panel").panel;
		if (param) {
			if (param.left != null) {
				opts.left = param.left;
			}
			if (param.top != null) {
				opts.top = param.top;
			}
		}
		panel.css({
			left : opts.left,
			top : opts.top
		});
		opts.onMove.apply(target, [ opts.left, opts.top ]);
	}
	;
	function wrapPanel(target) {
		$(target).addClass("panel-body")._size("clear");
		var panel = $("<div class=\"panel\"></div>").insertBefore(target);
		panel[0].appendChild(target);
		panel.bind("_resize", function(e, flag) {
			if ($(this).hasClass("easyui-fluid") || flag) {
				resize(target);
			}
			return false;
		});
		return panel;
	}
	;
	function addHeader(target) {
		var state = $.data(target, "panel");
		var opts = state.options;
		var panel = state.panel;
		panel.css(opts.style);
		panel.addClass(opts.cls);
		initPanelTool();
		initPanelFooter();
		var pheader = $(target).panel("header");
		var pbody = $(target).panel("body");
		var pfooter = $(target).siblings("div.panel-footer");
		if (opts.border) {
			pheader.removeClass("panel-header-noborder");
			pbody.removeClass("panel-body-noborder");
			pfooter.removeClass("panel-footer-noborder");
		} else {
			pheader.addClass("panel-header-noborder");
			pbody.addClass("panel-body-noborder");
			pfooter.addClass("panel-footer-noborder");
		}
		pheader.addClass(opts.headerCls);
		pbody.addClass(opts.bodyCls);
		$(target).attr("id", opts.id || "");
		if (opts.content) {
			$(target).panel("clear");
			$(target).html(opts.content);
			$.parser.parse($(target));
		}
		function initPanelTool() {
			if (opts.tools && typeof opts.tools == "string") {
				panel.find(">div.panel-header>div.panel-tool .panel-tool-a").appendTo(opts.tools);
			}
			remove(panel.children("div.panel-header"));
			if (opts.title && !opts.noheader) {
				var pheader = $("<div class=\"panel-header\"></div>").prependTo(panel);
				var ptitle = $("<div class=\"panel-title\"></div>").html(opts.title).appendTo(pheader);
				if (opts.iconCls) {
					ptitle.addClass("panel-with-icon");
					$("<div class=\"panel-icon\"></div>").addClass(opts.iconCls).appendTo(pheader);
				}
				var ptool = $("<div class=\"panel-tool\"></div>").appendTo(pheader);
				ptool.bind("click", function(e) {
					e.stopPropagation();
				});
				if (opts.tools) {
					if ($.isArray(opts.tools)) {
						for (var i = 0; i < opts.tools.length; i++) {
							var t = $("<a href=\"javascript:void(0)\"></a>").addClass(opts.tools[i].iconCls).appendTo(ptool);
							if (opts.tools[i].handler) {
								t.bind("click", eval(opts.tools[i].handler));
							}
						}
					} else {
						$(opts.tools).children().each(function() {
							$(this).addClass($(this).attr("iconCls")).addClass("panel-tool-a").appendTo(ptool);
						});
					}
				}
				if (opts.collapsible) {
					$("<a class=\"panel-tool-collapse\" href=\"javascript:void(0)\"></a>").appendTo(ptool).bind("click", function() {
						if (opts.collapsed == true) {
							expand(target, true);
						} else {
							collapse(target, true);
						}
						return false;
					});
				}
				if (opts.minimizable) {
					$("<a class=\"panel-tool-min\" href=\"javascript:void(0)\"></a>").appendTo(ptool).bind("click", function() {
						minimize(target);
						return false;
					});
				}
				if (opts.maximizable) {
					$("<a class=\"panel-tool-max\" href=\"javascript:void(0)\"></a>").appendTo(ptool).bind("click", function() {
						if (opts.maximized == true) {
							restore(target);
						} else {
							maximize(target);
						}
						return false;
					});
				}
				if (opts.closable) {
					$("<a class=\"panel-tool-close\" href=\"javascript:void(0)\"></a>").appendTo(ptool).bind("click", function() {
						close(target);
						return false;
					});
				}
				panel.children("div.panel-body").removeClass("panel-body-noheader");
			} else {
				panel.children("div.panel-body").addClass("panel-body-noheader");
			}
		}
		;
		function initPanelFooter() {
			if (opts.footer) {
				$(opts.footer).addClass("panel-footer").appendTo(panel);
				$(target).addClass("panel-body-nobottom");
			} else {
				panel.children("div.panel-footer").remove();
				$(target).removeClass("panel-body-nobottom");
			}
		}
		;
	}
	;
	function refresh(target, queryParams) {
		var state = $.data(target, "panel");
		var opts = state.options;
		if (queryParams) {
			opts.queryParams = queryParams;
		}
		if (!opts.href) {
			return;
		}
		if (!state.isLoaded || !opts.cache) {
			var queryParams = $.extend({}, opts.queryParams);
			if (opts.onBeforeLoad.call(target, queryParams) == false) {
				return;
			}
			state.isLoaded = false;
			$(target).panel("clear");
			if (opts.loadingMessage) {
				$(target).html($("<div class=\"panel-loading\"></div>").html(opts.loadingMessage));
			}
			opts.loader.call(target, queryParams, function(data) {
				var result = opts.extractor.call(target, data);
				$(target).html(result);
				$.parser.parse($(target));
				opts.onLoad.apply(target, arguments);
				state.isLoaded = true;
			}, function() {
				opts.onLoadError.apply(target, arguments);
			});
		}
	}
	;
	function clear(target) {
		var t = $(target);
		t.find(".combo-f").each(function() {
			$(this).combo("destroy");
		});
		t.find(".m-btn").each(function() {
			$(this).menubutton("destroy");
		});
		t.find(".s-btn").each(function() {
			$(this).splitbutton("destroy");
		});
		t.find(".tooltip-f").each(function() {
			$(this).tooltip("destroy");
		});
		t.children("div").each(function() {
			$(this)._size("unfit");
		});
		t.empty();
	}
	;
	function setLayout(target) {
		$(target).panel("doLayout", true);
	}
	;
	function open(target, forceOpen) {
		var opts = $.data(target, "panel").options;
		var panel = $.data(target, "panel").panel;
		if (forceOpen != true) {
			if (opts.onBeforeOpen.call(target) == false) {
				return;
			}
		}
		panel.stop(true, true);
		if ($.isFunction(opts.openAnimation)) {
			opts.openAnimation.call(target, cb);
		} else {
			switch (opts.openAnimation) {
			case "slide":
				panel.slideDown(opts.openDuration, cb);
				break;
			case "fade":
				panel.fadeIn(opts.openDuration, cb);
				break;
			case "show":
				panel.show(opts.openDuration, cb);
				break;
			default:
				panel.show();
				cb();
			}
		}
		function cb() {
			opts.closed = false;
			opts.minimized = false;
			var toolRestore = panel.children("div.panel-header").find("a.panel-tool-restore");
			if (toolRestore.length) {
				opts.maximized = true;
			}
			opts.onOpen.call(target);
			if (opts.maximized == true) {
				opts.maximized = false;
				maximize(target);
			}
			if (opts.collapsed == true) {
				opts.collapsed = false;
				collapse(target);
			}
			if (!opts.collapsed) {
				refresh(target);
				setLayout(target);
			}
		}
		;
	}
	;
	function close(target, forceClose) {
		var opts = $.data(target, "panel").options;
		var panel = $.data(target, "panel").panel;
		if (forceClose != true) {
			if (opts.onBeforeClose.call(target) == false) {
				return;
			}
		}
		panel.stop(true, true);
		panel._size("unfit");
		if ($.isFunction(opts.closeAnimation)) {
			opts.closeAnimation.call(target, cb);
		} else {
			switch (opts.closeAnimation) {
			case "slide":
				panel.slideUp(opts.closeDuration, cb);
				break;
			case "fade":
				panel.fadeOut(opts.closeDuration, cb);
				break;
			case "hide":
				panel.hide(opts.closeDuration, cb);
				break;
			default:
				panel.hide();
				cb();
			}
		}
		function cb() {
			opts.closed = true;
			opts.onClose.call(target);
		}
		;
	}
	;
	function destroy(target, forceDestroy) {
		var state = $.data(target, "panel");
		var opts = state.options;
		var panel = state.panel;
		if (forceDestroy != true) {
			if (opts.onBeforeDestroy.call(target) == false) {
				return;
			}
		}
		$(target).panel("clear").panel("clear", "footer");
		remove(panel);
		opts.onDestroy.call(target);
	}
	;
	function collapse(target, animate) {
		var opts = $.data(target, "panel").options;
		var panel = $.data(target, "panel").panel;
		var pbody = panel.children("div.panel-body");
		var header = panel.children("div.panel-header").find("a.panel-tool-collapse");
		if (opts.collapsed == true) {
			return;
		}
		pbody.stop(true, true);
		if (opts.onBeforeCollapse.call(target) == false) {
			return;
		}
		header.addClass("panel-tool-expand");
		if (animate == true) {
			pbody.slideUp("normal", function() {
				opts.collapsed = true;
				opts.onCollapse.call(target);
			});
		} else {
			pbody.hide();
			opts.collapsed = true;
			opts.onCollapse.call(target);
		}
	}
	;
	function expand(target, animate) {
		var opts = $.data(target, "panel").options;
		var panel = $.data(target, "panel").panel;
		var pbody = panel.children("div.panel-body");
		var toolCollapse = panel.children("div.panel-header").find("a.panel-tool-collapse");
		if (opts.collapsed == false) {
			return;
		}
		pbody.stop(true, true);
		if (opts.onBeforeExpand.call(target) == false) {
			return;
		}
		toolCollapse.removeClass("panel-tool-expand");
		if (animate == true) {
			pbody.slideDown("normal", function() {
				opts.collapsed = false;
				opts.onExpand.call(target);
				refresh(target);
				setLayout(target);
			});
		} else {
			pbody.show();
			opts.collapsed = false;
			opts.onExpand.call(target);
			refresh(target);
			setLayout(target);
		}
	}
	;
	function maximize(target) {
		var opts = $.data(target, "panel").options;
		var panel = $.data(target, "panel").panel;
		var toolMax = panel.children("div.panel-header").find("a.panel-tool-max");
		if (opts.maximized == true) {
			return;
		}
		toolMax.addClass("panel-tool-restore");
		if (!$.data(target, "panel").original) {
			$.data(target, "panel").original = {
				width : opts.width,
				height : opts.height,
				left : opts.left,
				top : opts.top,
				fit : opts.fit
			};
		}
		opts.left = 0;
		opts.top = 0;
		opts.fit = true;
		resize(target);
		opts.minimized = false;
		opts.maximized = true;
		opts.onMaximize.call(target);
	}
	;
	function minimize(target) {
		var opts = $.data(target, "panel").options;
		var panel = $.data(target, "panel").panel;
		panel._size("unfit");
		panel.hide();
		opts.minimized = true;
		opts.maximized = false;
		opts.onMinimize.call(target);
	}
	;
	function restore(target) {
		var opts = $.data(target, "panel").options;
		var panel = $.data(target, "panel").panel;
		var toolMax = panel.children("div.panel-header").find("a.panel-tool-max");
		if (opts.maximized == false) {
			return;
		}
		panel.show();
		toolMax.removeClass("panel-tool-restore");
		$.extend(opts, $.data(target, "panel").original);
		resize(target);
		opts.minimized = false;
		opts.maximized = false;
		$.data(target, "panel").original = null;
		opts.onRestore.call(target);
	}
	;
	function setTitle(target, title) {
		$.data(target, "panel").options.title = title;
		$(target).panel("header").find("div.panel-title").html(title);
	}
	;
	var ptemp = null;
	$(window).unbind(".panel").bind("resize.panel", function() {
		if (ptemp) {
			clearTimeout(ptemp);
		}
		ptemp = setTimeout(function() {
			var playout = $("body.layout");
			if (playout.length) {
				playout.layout("resize");
				$("body").children(".easyui-fluid:visible").trigger("_resize");
			} else {
				$("body").panel("doLayout");
			}
			ptemp = null;
		}, 100);
	});
	$.fn.panel = function(options, param) {
		if (typeof options == "string") {
			return $.fn.panel.methods[options](this, param);
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "panel");
			var opts;
			if (state) {
				opts = $.extend(state.options, options);
				state.isLoaded = false;
			} else {
				opts = $.extend({}, $.fn.panel.defaults, $.fn.panel.parseOptions(this), options);
				$(this).attr("title", "");
				state = $.data(this, "panel", {
					options : opts,
					panel : wrapPanel(this),
					isLoaded : false
				});
			}
			addHeader(this);
			if (opts.doSize == true) {
				state.panel.css("display", "block");
				resize(this);
			}
			if (opts.closed == true || opts.minimized == true) {
				state.panel.hide();
			} else {
				open(this);
			}
		});
	};
	$.fn.panel.methods = {
		options : function(jq) {
			return $.data(jq[0], "panel").options;
		},
		panel : function(jq) {
			return $.data(jq[0], "panel").panel;
		},
		header : function(jq) {
			return $.data(jq[0], "panel").panel.find(">div.panel-header");
		},
		footer : function(jq) {
			return jq.panel("panel").children(".panel-footer");
		},
		body : function(jq) {
			return $.data(jq[0], "panel").panel.find(">div.panel-body");
		},
		setTitle : function(jq, title) {
			return jq.each(function() {
				setTitle(this, title);
			});
		},
		open : function(jq, forceOpen) {
			return jq.each(function() {
				open(this, forceOpen);
			});
		},
		close : function(jq, forceClose) {
			return jq.each(function() {
				close(this, forceClose);
			});
		},
		destroy : function(jq, forceDestroy) {
			return jq.each(function() {
				destroy(this, forceDestroy);
			});
		},
		clear : function(jq, isFooter) {
			return jq.each(function() {
				clear(isFooter == "footer" ? $(this).panel("footer") : this);
			});
		},
		refresh : function(jq, href) {
			return jq.each(function() {
				var state = $.data(this, "panel");
				state.isLoaded = false;
				if (href) {
					if (typeof href == "string") {
						state.options.href = href;
					} else {
						state.options.queryParams = href;
					}
				}
				refresh(this);
			});
		},
		resize : function(jq, options) {
			return jq.each(function() {
				resize(this, options);
			});
		},
		doLayout : function(jq, all) {
			return jq.each(function() {
				doLayout2(this, "body");
				doLayout2($(this).siblings("div.panel-footer")[0], "footer");
				function doLayout2(jq2, bodyOrFooter) {
					if (!jq2) {
						return;
					}
					var flag = jq2 == $("body")[0];
					var s = $(jq2).find("div.panel:visible,div.accordion:visible,div.tabs-container:visible,div.layout:visible,.easyui-fluid:visible").filter(function(index, el) {
						var p = $(el).parents("div.panel-" + bodyOrFooter + ":first");
						return flag ? p.length == 0 : p[0] == jq2;
					});
					s.trigger("_resize", [ all || false ]);
				}
				;
			});
		},
		move : function(jq, options) {
			return jq.each(function() {
				move(this, options);
			});
		},
		maximize : function(jq) {
			return jq.each(function() {
				maximize(this);
			});
		},
		minimize : function(jq) {
			return jq.each(function() {
				minimize(this);
			});
		},
		restore : function(jq) {
			return jq.each(function() {
				restore(this);
			});
		},
		collapse : function(jq, animate) {
			return jq.each(function() {
				collapse(this, animate);
			});
		},
		expand : function(jq, animate) {
			return jq.each(function() {
				expand(this, animate);
			});
		}
	};
	$.fn.panel.parseOptions = function(target) {
		var t = $(target);
		return $.extend({}, $.parser.parseOptions(target, [ "id", "width", "height", "left", "top", "title", "iconCls", "cls", "headerCls", "bodyCls", "tools", "href", "method", {
			cache : "boolean",
			fit : "boolean",
			border : "boolean",
			noheader : "boolean"
		}, {
			collapsible : "boolean",
			minimizable : "boolean",
			maximizable : "boolean"
		}, {
			closable : "boolean",
			collapsed : "boolean",
			minimized : "boolean",
			maximized : "boolean",
			closed : "boolean"
		}, "openAnimation", "closeAnimation", {
			openDuration : "number",
			closeDuration : "number"
		}, ]), {
			loadingMessage : (t.attr("loadingMessage") != undefined ? t.attr("loadingMessage") : undefined)
		});
	};
	$.fn.panel.defaults = {
		id : null,
		title : null,
		iconCls : null,
		width : "auto",
		height : "auto",
		left : null,
		top : null,
		cls : null,
		headerCls : null,
		bodyCls : null,
		style : {},
		href : null,
		cache : true,
		fit : false,
		border : true,
		doSize : true,
		noheader : false,
		content : null,
		collapsible : false,
		minimizable : false,
		maximizable : false,
		closable : false,
		collapsed : false,
		minimized : false,
		maximized : false,
		closed : false,
		openAnimation : false,
		openDuration : 400,
		closeAnimation : false,
		closeDuration : 400,
		tools : null,
		footer : null,
		queryParams : {},
		method : "get",
		href : null,
		loadingMessage : "Loading...",
		loader : function(queryParams, successCallback, errorCallback) {
			var opts = $(this).panel("options");
			if (!opts.href) {
				return false;
			}
			$.ajax({
				type : opts.method,
				url : opts.href,
				cache : false,
				data : queryParams,
				dataType : "html",
				success : function(data) {
					successCallback(data);
				},
				error : function() {
					errorCallback.apply(this, arguments);
				}
			});
		},
		extractor : function(data) {
			var patterns = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
			var matchers = patterns.exec(data);
			if (matchers) {
				return matchers[1];
			} else {
				return data;
			}
		},
		onBeforeLoad : function(param) {
		},
		onLoad : function() {
		},
		onLoadError : function() {
		},
		onBeforeOpen : function() {
		},
		onOpen : function() {
		},
		onBeforeClose : function() {
		},
		onClose : function() {
		},
		onBeforeDestroy : function() {
		},
		onDestroy : function() {
		},
		onResize : function(width, height) {
		},
		onMove : function(left, top) {
		},
		onMaximize : function() {
		},
		onRestore : function() {
		},
		onMinimize : function() {
		},
		onBeforeCollapse : function() {
		},
		onBeforeExpand : function() {
		},
		onCollapse : function() {
		},
		onExpand : function() {
		}
	};
})(jQuery);
