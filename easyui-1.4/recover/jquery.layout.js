(function($) {
	var resizing = false;
	function resize(target, text) {
		var state = $.data(target, "layout");
		var opts = state.options;
		var panels = state.panels;
		var cc = $(target);
		if (text) {
			$.extend(opts, {
				width : text.width,
				height : text.height
			});
		}
		if (target.tagName.toLowerCase() == "body") {
			opts.fit = true;
			cc._size(opts, $("body"))._size("clear");
		} else {
			cc._size(opts);
		}
		var cpos = {
			top : 0,
			left : 0,
			width : cc.width(),
			height : cc.height()
		};
		setSouthNorth(isVisible(panels.expandNorth) ? panels.expandNorth : panels.north, "n");
		setSouthNorth(isVisible(panels.expandSouth) ? panels.expandSouth : panels.south, "s");
		setEastWest(isVisible(panels.expandEast) ? panels.expandEast : panels.east, "e");
		setEastWest(isVisible(panels.expandWest) ? panels.expandWest : panels.west, "w");
		panels.center.panel("resize", cpos);
		function setSouthNorth(pp, direct) {
			if (!pp.length || !isVisible(pp)) {
				return;
			}
			var panelOpts = pp.panel("options");
			pp.panel("resize", {
				width : cc.width(),
				height : panelOpts.height
			});
			var outerHeight = pp.panel("panel").outerHeight();
			pp.panel("move", {
				left : 0,
				top : (direct == "n" ? 0 : cc.height() - outerHeight)
			});
			cpos.height -= outerHeight;
			if (direct == "n") {
				cpos.top += outerHeight;
				if (!panelOpts.split && panelOpts.border) {
					cpos.top--;
				}
			}
			if (!panelOpts.split && panelOpts.border) {
				cpos.height++;
			}
		}
		;
		function setEastWest(pp, region) {
			if (!pp.length || !isVisible(pp)) {
				return;
			}
			var panelOpts = pp.panel("options");
			pp.panel("resize", {
				width : panelOpts.width,
				height : cpos.height
			});
			var outerWidth = pp.panel("panel").outerWidth();
			pp.panel("move", {
				left : (region == "e" ? cc.width() - outerWidth : 0),
				top : cpos.top
			});
			cpos.width -= outerWidth;
			if (region == "w") {
				cpos.left += outerWidth;
				if (!panelOpts.split && panelOpts.border) {
					cpos.left--;
				}
			}
			if (!panelOpts.split && panelOpts.border) {
				cpos.width++;
			}
		}
		;
	}
	;
	function init(target) {
		var cc = $(target);
		cc.addClass("layout");
		function setRegion(cc) {
			cc.children("div").each(function() {
				var panelOpts = $.fn.layout.parsePanelOptions(this);
				if ("north,south,east,west,center".indexOf(panelOpts.region) >= 0) {
					addPanel(target, panelOpts, this);
				}
			});
		}
		;
		cc.children("form").length ? setRegion(cc.children("form")) : setRegion(cc);
		cc.append("<div class=\"layout-split-proxy-h\"></div><div class=\"layout-split-proxy-v\"></div>");
		cc.bind("_resize", function(e, force) {
			if ($(this).hasClass("easyui-fluid") || force) {
				resize(target);
			}
			return false;
		});
	}
	;
	function addPanel(target, options, el) {
		options.region = options.region || "center";
		var panels = $.data(target, "layout").panels;
		var cc = $(target);
		var dir = options.region;
		if (panels[dir].length) {
			return;
		}
		var pp = $(el);
		if (!pp.length) {
			pp = $("<div></div>").appendTo(cc);
		}
		var opts = $.extend({}, $.fn.layout.paneldefaults, {
			width : (pp.length ? parseInt(pp[0].style.width) || pp.outerWidth() : "auto"),
			height : (pp.length ? parseInt(pp[0].style.height) || pp.outerHeight() : "auto"),
			doSize : false,
			collapsible : true,
			cls : ("layout-panel layout-panel-" + dir),
			bodyCls : "layout-body",
			onOpen : function() {
				var panelTool = $(this).panel("header").children("div.panel-tool");
				panelTool.children("a.panel-tool-collapse").hide();
				var icon = {
					north : "up",
					south : "down",
					east : "right",
					west : "left"
				};
				if (!icon[dir]) {
					return;
				}
				var button = "layout-button-" + icon[dir];
				var t = panelTool.children("a." + button);
				if (!t.length) {
					t = $("<a href=\"javascript:void(0)\"></a>").addClass(button).appendTo(panelTool);
					t.bind("click", {
						dir : dir
					}, function(e) {
						collapsePanel(target, e.data.dir);
						return false;
					});
				}
				$(this).panel("options").collapsible ? t.show() : t.hide();
			}
		}, options);
		pp.panel(opts);
		panels[dir] = pp;
		if (pp.panel("options").split) {
			var panel = pp.panel("panel");
			panel.addClass("layout-split-" + dir);
			var handles = "";
			if (dir == "north") {
				handles = "s";
			}
			if (dir == "south") {
				handles = "n";
			}
			if (dir == "east") {
				handles = "w";
			}
			if (dir == "west") {
				handles = "e";
			}
			panel.resizable($.extend({}, {
				handles : handles,
				onStartResize : function(e) {
					resizing = true;
					if (dir == "north" || dir == "south") {
						var proxy = $(">div.layout-split-proxy-v", target);
					} else {
						var proxy = $(">div.layout-split-proxy-h", target);
					}
					var top = 0, left = 0, width = 0, height = 0;
					var pos = {
						display : "block"
					};
					if (dir == "north") {
						pos.top = parseInt(panel.css("top")) + panel.outerHeight() - proxy.height();
						pos.left = parseInt(panel.css("left"));
						pos.width = panel.outerWidth();
						pos.height = proxy.height();
					} else {
						if (dir == "south") {
							pos.top = parseInt(panel.css("top"));
							pos.left = parseInt(panel.css("left"));
							pos.width = panel.outerWidth();
							pos.height = proxy.height();
						} else {
							if (dir == "east") {
								pos.top = parseInt(panel.css("top")) || 0;
								pos.left = parseInt(panel.css("left")) || 0;
								pos.width = proxy.width();
								pos.height = panel.outerHeight();
							} else {
								if (dir == "west") {
									pos.top = parseInt(panel.css("top")) || 0;
									pos.left = panel.outerWidth() - proxy.width();
									pos.width = proxy.width();
									pos.height = panel.outerHeight();
								}
							}
						}
					}
					proxy.css(pos);
					$("<div class=\"layout-mask\"></div>").css({
						left : 0,
						top : 0,
						width : cc.width(),
						height : cc.height()
					}).appendTo(cc);
				},
				onResize : function(e) {
					if (dir == "north" || dir == "south") {
						var proxy = $(">div.layout-split-proxy-v", target);
						proxy.css("top", e.pageY - $(target).offset().top - proxy.height() / 2);
					} else {
						var proxy = $(">div.layout-split-proxy-h", target);
						proxy.css("left", e.pageX - $(target).offset().left - proxy.width() / 2);
					}
					return false;
				},
				onStopResize : function(e) {
					cc.children("div.layout-split-proxy-v,div.layout-split-proxy-h").hide();
					pp.panel("resize", e.data);
					resize(target);
					resizing = false;
					cc.find(">div.layout-mask").remove();
				}
			}, options));
		}
	}
	;
	function removePanel(target, region) {
		var panels = $.data(target, "layout").panels;
		if (panels[region].length) {
			panels[region].panel("destroy");
			panels[region] = $();
			var expand = "expand" + region.substring(0, 1).toUpperCase() + region.substring(1);
			if (panels[expand]) {
				panels[expand].panel("destroy");
				panels[expand] = undefined;
			}
		}
	}
	;
	function collapsePanel(target, region, speed) {
		if (speed == undefined) {
			speed = "normal";
		}
		var panels = $.data(target, "layout").panels;
		var p = panels[region];
		var panelOpts = p.panel("options");
		if (panelOpts.onBeforeCollapse.call(p) == false) {
			return;
		}
		var pp = "expand" + region.substring(0, 1).toUpperCase() + region.substring(1);
		if (!panels[pp]) {
			panels[pp] = createExpandPanel(region);
			panels[pp].panel("panel").bind("click", function() {
				p.panel("expand", false).panel("open");
				var p1 = createPanel();
				p.panel("resize", p1.collapse);
				p.panel("panel").animate(p1.expand, function() {
					$(this).unbind(".layout").bind("mouseleave.layout", {
						region : region
					}, function(e) {
						if (resizing == true) {
							return;
						}
						if ($("body>div.combo-p>div.combo-panel:visible").length) {
							return;
						}
						collapsePanel(target, e.data.region);
					});
				});
				return false;
			});
		}
		var p2 = createPanel();
		if (!isVisible(panels[pp])) {
			panels.center.panel("resize", p2.resizeC);
		}
		p.panel("panel").animate(p2.collapse, speed, function() {
			p.panel("collapse", false).panel("close");
			panels[pp].panel("open").panel("resize", p2.expandP);
			$(this).unbind(".layout");
		});
		function createExpandPanel(dir) {
			var icon;
			if (dir == "east") {
				icon = "layout-button-left";
			} else {
				if (dir == "west") {
					icon = "layout-button-right";
				} else {
					if (dir == "north") {
						icon = "layout-button-down";
					} else {
						if (dir == "south") {
							icon = "layout-button-up";
						}
					}
				}
			}
			var p = $("<div></div>").appendTo(target);
			p.panel($.extend({}, $.fn.layout.paneldefaults, {
				cls : ("layout-expand layout-expand-" + dir),
				title : "&nbsp;",
				closed : true,
				minWidth : 0,
				minHeight : 0,
				doSize : false,
				tools : [ {
					iconCls : icon,
					handler : function() {
						expandPanel(target, region);
						return false;
					}
				} ]
			}));
			p.panel("panel").hover(function() {
				$(this).addClass("layout-expand-over");
			}, function() {
				$(this).removeClass("layout-expand-over");
			});
			return p;
		}
		;
		function createPanel() {
			var cc = $(target);
			var centerPanelOpts = panels.center.panel("options");
			var collapsedSize = panelOpts.collapsedSize;
			if (region == "east") {
				var outerWidth = p.panel("panel")._outerWidth();
				var ww = centerPanelOpts.width + outerWidth - collapsedSize;
				if (panelOpts.split || !panelOpts.border) {
					ww++;
				}
				return {
					resizeC : {
						width : ww
					},
					expand : {
						left : cc.width() - outerWidth
					},
					expandP : {
						top : centerPanelOpts.top,
						left : cc.width() - collapsedSize,
						width : collapsedSize,
						height : centerPanelOpts.height
					},
					collapse : {
						left : cc.width(),
						top : centerPanelOpts.top,
						height : centerPanelOpts.height
					}
				};
			} else {
				if (region == "west") {
					var outerWidth = p.panel("panel")._outerWidth();
					var ww = centerPanelOpts.width + outerWidth - collapsedSize;
					if (panelOpts.split || !panelOpts.border) {
						ww++;
					}
					return {
						resizeC : {
							width : ww,
							left : collapsedSize - 1
						},
						expand : {
							left : 0
						},
						expandP : {
							left : 0,
							top : centerPanelOpts.top,
							width : collapsedSize,
							height : centerPanelOpts.height
						},
						collapse : {
							left : -outerWidth,
							top : centerPanelOpts.top,
							height : centerPanelOpts.height
						}
					};
				} else {
					if (region == "north") {
						var outerHeight = p.panel("panel")._outerHeight();
						var hh = centerPanelOpts.height;
						if (!isVisible(panels.expandNorth)) {
							hh += outerHeight - collapsedSize + ((panelOpts.split || !panelOpts.border) ? 1 : 0);
						}
						panels.east.add(panels.west).add(panels.expandEast).add(panels.expandWest).panel("resize", {
							top : collapsedSize - 1,
							height : hh
						});
						return {
							resizeC : {
								top : collapsedSize - 1,
								height : hh
							},
							expand : {
								top : 0
							},
							expandP : {
								top : 0,
								left : 0,
								width : cc.width(),
								height : collapsedSize
							},
							collapse : {
								top : -outerHeight,
								width : cc.width()
							}
						};
					} else {
						if (region == "south") {
							var outerHeight = p.panel("panel")._outerHeight();
							var hh = centerPanelOpts.height;
							if (!isVisible(panels.expandSouth)) {
								hh += outerHeight - collapsedSize + ((panelOpts.split || !panelOpts.border) ? 1 : 0);
							}
							panels.east.add(panels.west).add(panels.expandEast).add(panels.expandWest).panel("resize", {
								height : hh
							});
							return {
								resizeC : {
									height : hh
								},
								expand : {
									top : cc.height() - outerHeight
								},
								expandP : {
									top : cc.height() - collapsedSize,
									left : 0,
									width : cc.width(),
									height : collapsedSize
								},
								collapse : {
									top : cc.height(),
									width : cc.width()
								}
							};
						}
					}
				}
			}
		}
		;
	}
	;
	function expandPanel(target, region) {
		var panels = $.data(target, "layout").panels;
		var p = panels[region];
		var panelOpts = p.panel("options");
		if (panelOpts.onBeforeExpand.call(p) == false) {
			return;
		}
		var closeRegion = "expand" + region.substring(0, 1).toUpperCase() + region.substring(1);
		if (panels[closeRegion]) {
			panels[closeRegion].panel("close");
			p.panel("panel").stop(true, true);
			p.panel("expand", false).panel("open");
			var region = expandResion();
			p.panel("resize", region.collapse);
			p.panel("panel").animate(region.expand, function() {
				resize(target);
			});
		}
		function expandResion() {
			var cc = $(target);
			var centerPanelOpts = panels.center.panel("options");
			if (region == "east" && panels.expandEast) {
				return {
					collapse : {
						left : cc.width(),
						top : centerPanelOpts.top,
						height : centerPanelOpts.height
					},
					expand : {
						left : cc.width() - p.panel("panel")._outerWidth()
					}
				};
			} else {
				if (region == "west" && panels.expandWest) {
					return {
						collapse : {
							left : -p.panel("panel")._outerWidth(),
							top : centerPanelOpts.top,
							height : centerPanelOpts.height
						},
						expand : {
							left : 0
						}
					};
				} else {
					if (region == "north" && panels.expandNorth) {
						return {
							collapse : {
								top : -p.panel("panel")._outerHeight(),
								width : cc.width()
							},
							expand : {
								top : 0
							}
						};
					} else {
						if (region == "south" && panels.expandSouth) {
							return {
								collapse : {
									top : cc.height(),
									width : cc.width()
								},
								expand : {
									top : cc.height() - p.panel("panel")._outerHeight()
								}
							};
						}
					}
				}
			}
		}
		;
	}
	;
	function isVisible(pp) {
		if (!pp) {
			return false;
		}
		if (pp.length) {
			return pp.panel("panel").is(":visible");
		} else {
			return false;
		}
	}
	;
	function setCollapsedPanel(target) {
		var panels = $.data(target, "layout").panels;
		if (panels.east.length && panels.east.panel("options").collapsed) {
			collapsePanel(target, "east", 0);
		}
		if (panels.west.length && panels.west.panel("options").collapsed) {
			collapsePanel(target, "west", 0);
		}
		if (panels.north.length && panels.north.panel("options").collapsed) {
			collapsePanel(target, "north", 0);
		}
		if (panels.south.length && panels.south.panel("options").collapsed) {
			collapsePanel(target, "south", 0);
		}
	}
	;
	$.fn.layout = function(options, param) {
		if (typeof options == "string") {
			return $.fn.layout.methods[options](this, param);
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "layout");
			if (state) {
				$.extend(state.options, options);
			} else {
				var opts = $.extend({}, $.fn.layout.defaults, $.fn.layout.parseOptions(this), options);
				$.data(this, "layout", {
					options : opts,
					panels : {
						center : $(),
						north : $(),
						south : $(),
						east : $(),
						west : $()
					}
				});
				init(this);
			}
			resize(this);
			setCollapsedPanel(this);
		});
	};
	$.fn.layout.methods = {
		resize : function(jq, obj) {
			return jq.each(function() {
				resize(this, obj);
			});
		},
		panel : function(jq, region) {
			return $.data(jq[0], "layout").panels[region];
		},
		collapse : function(jq, region) {
			return jq.each(function() {
				collapsePanel(this, region);
			});
		},
		expand : function(jq, region) {
			return jq.each(function() {
				expandPanel(this, region);
			});
		},
		add : function(jq, options) {
			return jq.each(function() {
				addPanel(this, options);
				resize(this);
				if ($(this).layout("panel", options.region).panel("options").collapsed) {
					collapsePanel(this, options.region, 0);
				}
			});
		},
		remove : function(jq, region) {
			return jq.each(function() {
				removePanel(this, region);
				resize(this);
			});
		}
	};
	$.fn.layout.parseOptions = function(target) {
		return $.extend({}, $.parser.parseOptions(target, [ {
			fit : "boolean"
		} ]));
	};
	$.fn.layout.defaults = {
		fit : false
	};
	$.fn.layout.parsePanelOptions = function(target) {
		var t = $(target);
		return $.extend({}, $.fn.panel.parseOptions(target), $.parser.parseOptions(target, [ "region", {
			split : "boolean",
			collpasedSize : "number",
			minWidth : "number",
			minHeight : "number",
			maxWidth : "number",
			maxHeight : "number"
		} ]));
	};
	$.fn.layout.paneldefaults = $.extend({}, $.fn.panel.defaults, {
		region : null,
		split : false,
		collapsedSize : 28,
		minWidth : 10,
		minHeight : 10,
		maxWidth : 10000,
		maxHeight : 10000
	});
})(jQuery);
