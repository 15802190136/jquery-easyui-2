(function($) {
	var idPrefix = 0;
	function indexOf(a, o) {
		for (var i = 0, len = a.length; i < len; i++) {
			if (a[i] == o) {
				return i;
			}
		}
		return -1;
	}
	;
	function removeById(a, o, id) {
		if (typeof o == "string") {
			for (var i = 0, len = a.length; i < len; i++) {
				if (a[i][o] == id) {
					a.splice(i, 1);
					return;
				}
			}
		} else {
			var index = indexOf(a, o);
			if (index != -1) {
				a.splice(index, 1);
			}
		}
	}
	;
	function getNestValue(a, o, r) {
		for (var i = 0, len = a.length; i < len; i++) {
			if (a[i][o] == r[o]) {
				return;
			}
		}
		a.push(r);
	}
	;
	function createStyleSheet(target) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var panel = state.panel;
		var dc = state.dc;
		var ss = null;
		if (opts.sharedStyleSheet) {
			ss = typeof opts.sharedStyleSheet == "boolean" ? "head" : opts.sharedStyleSheet;
		} else {
			ss = panel.closest("div.datagrid-view");
			if (!ss.length) {
				ss = dc.view;
			}
		}
		var cc = $(ss);
		var cellStyleOpts = $.data(cc[0], "ss");
		if (!cellStyleOpts) {
			cellStyleOpts = $.data(cc[0], "ss", {
				cache : {},
				dirty : []
			});
		}
		return {
			add : function(cellStyleOpt) {
				var ss = [ "<style type=\"text/css\" easyui=\"true\">" ];
				for (var i = 0; i < cellStyleOpt.length; i++) {
					cellStyleOpts.cache[cellStyleOpt[i][0]] = {
						width : cellStyleOpt[i][1]
					};
				}
				var index = 0;
				for ( var s in cellStyleOpts.cache) {
					var cellStyle = cellStyleOpts.cache[s];
					cellStyle.index = index++;
					ss.push(s + "{width:" + cellStyle.width + "}");
				}
				ss.push("</style>");
				$(ss.join("\n")).appendTo(cc);
				cc.children("style[easyui]:not(:last)").remove();
			},
			getRule : function(index) {
				var lastCellStyle = cc.children("style[easyui]:last")[0];
				var styleSheet = lastCellStyle.styleSheet ? lastCellStyle.styleSheet : (lastCellStyle.sheet || document.styleSheets[document.styleSheets.length - 1]);
				var cssRules = styleSheet.cssRules || styleSheet.rules;
				return cssRules[index];
			},
			set : function(index, width) {
				var styleSheet = cellStyleOpts.cache[index];
				if (styleSheet) {
					styleSheet.width = width;
					var rule = this.getRule(styleSheet.index);
					if (rule) {
						rule.style["width"] = width;
					}
				}
			},
			remove : function(cellStyleOpt) {
				var tmp = [];
				for ( var s in cellStyleOpts.cache) {
					if (s.indexOf(cellStyleOpt) == -1) {
						tmp.push([ s, cellStyleOpts.cache[s].width ]);
					}
				}
				cellStyleOpts.cache = {};
				this.add(tmp);
			},
			dirty : function(value) {
				if (value) {
					cellStyleOpts.dirty.push(value);
				}
			},
			clean : function() {
				for (var i = 0; i < cellStyleOpts.dirty.length; i++) {
					this.remove(cellStyleOpts.dirty[i]);
				}
				cellStyleOpts.dirty = [];
			}
		};
	}
	;
	function resize(target, param) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var panel = state.panel;
		if (param) {
			$.extend(opts, param);
		}
		if (opts.fit == true) {
			var p = panel.panel("panel").parent();
			opts.width = p.width();
			opts.height = p.height();
		}
		panel.panel("resize", opts);
	}
	;
	function fitGridSize(target) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var dc = state.dc;
		var panel = state.panel;
		var panelWidth = panel.width();
		var panelHeight = panel.height();
		var view = dc.view;
		var view1 = dc.view1;
		var view2 = dc.view2;
		var header1 = view1.children("div.datagrid-header");
		var header2 = view2.children("div.datagrid-header");
		var table1 = header1.find("table");
		var table2 = header2.find("table");
		view.width(panelWidth);
		var inner1 = header1.children("div.datagrid-header-inner").show();
		view1.width(inner1.find("table").width());
		if (!opts.showHeader) {
			inner1.hide();
		}
		view2.width(panelWidth - view1._outerWidth());
		view1.children("div.datagrid-header,div.datagrid-body,div.datagrid-footer").width(view1.width());
		view2.children("div.datagrid-header,div.datagrid-body,div.datagrid-footer").width(view2.width());
		var hh;
		header1.add(header2).css("height", "");
		table1.add(table2).css("height", "");
		hh = Math.max(table1.height(), table2.height());
		table1.add(table2).height(hh);
		header1.add(header2)._outerHeight(hh);
		dc.body1.add(dc.body2).children("table.datagrid-btable-frozen").css({
			position : "absolute",
			top : dc.header2._outerHeight()
		});
		var frozenHeight = dc.body2.children("table.datagrid-btable-frozen")._outerHeight();
		var height = frozenHeight + view2.children("div.datagrid-header")._outerHeight() + view2.children("div.datagrid-footer")._outerHeight() + panel.children("div.datagrid-toolbar")._outerHeight();
		panel.children("div.datagrid-pager").each(function() {
			height += $(this)._outerHeight();
		});
		var panelHeight = panel.outerHeight() - panel.height();
		var minHeight = panel._size("minHeight") || "";
		var maxHeight = panel._size("maxHeight") || "";
		view1.add(view2).children("div.datagrid-body").css({
			marginTop : frozenHeight,
			height : (isNaN(parseInt(opts.height)) ? "" : (panelHeight - height)),
			minHeight : (minHeight ? minHeight - panelHeight - height : ""),
			maxHeight : (maxHeight ? maxHeight - panelHeight - height : "")
		});
		view.height(view2.height());
	}
	;
	function fixRowHeight(target, index, type) {
		var rows = $.data(target, "datagrid").data.rows;
		var opts = $.data(target, "datagrid").options;
		var dc = $.data(target, "datagrid").dc;
		if (!dc.body1.is(":empty") && (!opts.nowrap || opts.autoRowHeight || type)) {
			if (index != undefined) {
				var tr1 = opts.finder.getTr(target, index, "body", 1);
				var tr2 = opts.finder.getTr(target, index, "body", 2);
				setRowHeight(tr1, tr2);
			} else {
				var tr1 = opts.finder.getTr(target, 0, "allbody", 1);
				var tr2 = opts.finder.getTr(target, 0, "allbody", 2);
				setRowHeight(tr1, tr2);
				if (opts.showFooter) {
					var tr1 = opts.finder.getTr(target, 0, "allfooter", 1);
					var tr2 = opts.finder.getTr(target, 0, "allfooter", 2);
					setRowHeight(tr1, tr2);
				}
			}
		}
		fitGridSize(target);
		if (opts.height == "auto") {
			var views = dc.body1.parent();
			var body2 = dc.body2;
			var position = setRowPosition(body2);
			var height = position.height;
			if (position.width > body2.width()) {
				height += 18;
			}
			height -= parseInt(body2.css("marginTop")) || 0;
			views.height(height);
			body2.height(height);
			dc.view.height(dc.view2.height());
		}
		dc.body2.triggerHandler("scroll");
		function setRowHeight(tr1Object, tr2Object) {
			for (var i = 0; i < tr2Object.length; i++) {
				var tr1 = $(tr1Object[i]);
				var tr2 = $(tr2Object[i]);
				tr1.css("height", "");
				tr2.css("height", "");
				var trHeight = Math.max(tr1.height(), tr2.height());
				tr1.css("height", trHeight);
				tr2.css("height", trHeight);
			}
		}
		;
		function setRowPosition(cc) {
			var width = 0;
			var height = 0;
			$(cc).children().each(function() {
				var c = $(this);
				if (c.is(":visible")) {
					height += c._outerHeight();
					if (width < c._outerWidth()) {
						width = c._outerWidth();
					}
				}
			});
			return {
				width : width,
				height : height
			};
		}
		;
	}
	;
	function freezeRow(target, index) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var dc = state.dc;
		if (!dc.body2.children("table.datagrid-btable-frozen").length) {
			dc.body1.add(dc.body2).prepend("<table class=\"datagrid-btable datagrid-btable-frozen\" cellspacing=\"0\" cellpadding=\"0\"></table>");
		}
		appendFrozenRow(true);
		appendFrozenRow(false);
		fitGridSize(target);
		function appendFrozenRow(frozen) {
			var type = frozen ? 1 : 2;
			var tr = opts.finder.getTr(target, index, "body", type);
			(frozen ? dc.body1 : dc.body2).children("table.datagrid-btable-frozen").append(tr);
		}
		;
	}
	;
	function wrapGrid(target, rownumbers) {
		function getcolumns() {
			var frozenColumns = [];
			var columns = [];
			$(target).children("thead").each(function() {
				var opt = $.parser.parseOptions(this, [ {
					frozen : "boolean"
				} ]);
				$(this).find("tr").each(function() {
					var cols = [];
					$(this).find("th").each(function() {
						var th = $(this);
						var col = $.extend({}, $.parser.parseOptions(this, [ "field", "align", "halign", "order", "width", {
							sortable : "boolean",
							checkbox : "boolean",
							resizable : "boolean",
							fixed : "boolean"
						}, {
							rowspan : "number",
							colspan : "number"
						} ]), {
							title : (th.html() || undefined),
							hidden : (th.attr("hidden") ? true : undefined),
							formatter : (th.attr("formatter") ? eval(th.attr("formatter")) : undefined),
							styler : (th.attr("styler") ? eval(th.attr("styler")) : undefined),
							sorter : (th.attr("sorter") ? eval(th.attr("sorter")) : undefined)
						});
						if (col.width && String(col.width).indexOf("%") == -1) {
							col.width = parseInt(col.width);
						}
						if (th.attr("editor")) {
							var s = $.trim(th.attr("editor"));
							if (s.substr(0, 1) == "{") {
								col.editor = eval("(" + s + ")");
							} else {
								col.editor = s;
							}
						}
						cols.push(col);
					});
					opt.frozen ? frozenColumns.push(cols) : columns.push(cols);
				});
			});
			return [ frozenColumns, columns ];
		}
		;
		var panel = $(
				"<div class=\"datagrid-wrap\">" + "<div class=\"datagrid-view\">" + "<div class=\"datagrid-view1\">" + "<div class=\"datagrid-header\">" + "<div class=\"datagrid-header-inner\"></div>" + "</div>" + "<div class=\"datagrid-body\">"
						+ "<div class=\"datagrid-body-inner\"></div>" + "</div>" + "<div class=\"datagrid-footer\">" + "<div class=\"datagrid-footer-inner\"></div>" + "</div>" + "</div>" + "<div class=\"datagrid-view2\">"
						+ "<div class=\"datagrid-header\">" + "<div class=\"datagrid-header-inner\"></div>" + "</div>" + "<div class=\"datagrid-body\"></div>" + "<div class=\"datagrid-footer\">" + "<div class=\"datagrid-footer-inner\"></div>"
						+ "</div>" + "</div>" + "</div>" + "</div>").insertAfter(target);
		panel.panel({
			doSize : false,
			cls : "datagrid"
		});
		$(target).addClass("datagrid-f").hide().appendTo(panel.children("div.datagrid-view"));
		var cc = getcolumns();
		var view = panel.children("div.datagrid-view");
		var view1 = view.children("div.datagrid-view1");
		var view2 = view.children("div.datagrid-view2");
		return {
			panel : panel,
			frozenColumns : cc[0],
			columns : cc[1],
			dc : {
				view : view,
				view1 : view1,
				view2 : view2,
				header1 : view1.children("div.datagrid-header").children("div.datagrid-header-inner"),
				header2 : view2.children("div.datagrid-header").children("div.datagrid-header-inner"),
				body1 : view1.children("div.datagrid-body").children("div.datagrid-body-inner"),
				body2 : view2.children("div.datagrid-body"),
				footer1 : view1.children("div.datagrid-footer").children("div.datagrid-footer-inner"),
				footer2 : view2.children("div.datagrid-footer").children("div.datagrid-footer-inner")
			}
		};
	}
	;
	function init(target) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var dc = state.dc;
		var panel = state.panel;
		state.ss = $(target).datagrid("createStyleSheet");
		panel.panel($.extend({}, opts, {
			id : null,
			doSize : false,
			onResize : function(width, height) {
				setTimeout(function() {
					if ($.data(target, "datagrid")) {
						fitGridSize(target);
						fitColumns(target);
						opts.onResize.call(panel, width, height);
					}
				}, 0);
			},
			onExpand : function() {
				fixRowHeight(target);
				opts.onExpand.call(panel);
			}
		}));
		state.rowIdPrefix = "datagrid-row-r" + (++idPrefix);
		state.cellClassPrefix = "datagrid-cell-c" + idPrefix;
		buildGridHeader(dc.header1, opts.frozenColumns, true);
		buildGridHeader(dc.header2, opts.columns, false);
		buildCellClass();
		dc.header1.add(dc.header2).css("display", opts.showHeader ? "block" : "none");
		dc.footer1.add(dc.footer2).css("display", opts.showFooter ? "block" : "none");
		if (opts.toolbar) {
			if ($.isArray(opts.toolbar)) {
				$("div.datagrid-toolbar", panel).remove();
				var tb = $("<div class=\"datagrid-toolbar\"><table cellspacing=\"0\" cellpadding=\"0\"><tr></tr></table></div>").prependTo(panel);
				var tr = tb.find("tr");
				for (var i = 0; i < opts.toolbar.length; i++) {
					var btn = opts.toolbar[i];
					if (btn == "-") {
						$("<td><div class=\"datagrid-btn-separator\"></div></td>").appendTo(tr);
					} else {
						var td = $("<td></td>").appendTo(tr);
						var tool = $("<a href=\"javascript:void(0)\"></a>").appendTo(td);
						tool[0].onclick = eval(btn.handler || function() {
						});
						tool.linkbutton($.extend({}, btn, {
							plain : true
						}));
					}
				}
			} else {
				$(opts.toolbar).addClass("datagrid-toolbar").prependTo(panel);
				$(opts.toolbar).show();
			}
		} else {
			$("div.datagrid-toolbar", panel).remove();
		}
		$("div.datagrid-pager", panel).remove();
		if (opts.pagination) {
			var pagerHtml = $("<div class=\"datagrid-pager\"></div>");
			if (opts.pagePosition == "bottom") {
				pagerHtml.appendTo(panel);
			} else {
				if (opts.pagePosition == "top") {
					pagerHtml.addClass("datagrid-pager-top").prependTo(panel);
				} else {
					var pagerTopHtml = $("<div class=\"datagrid-pager datagrid-pager-top\"></div>").prependTo(panel);
					pagerHtml.appendTo(panel);
					pagerHtml = pagerHtml.add(pagerTopHtml);
				}
			}
			pagerHtml.pagination({
				total : (opts.pageNumber * opts.pageSize),
				pageNumber : opts.pageNumber,
				pageSize : opts.pageSize,
				pageList : opts.pageList,
				onSelectPage : function(pageNumber, pageSize) {
					opts.pageNumber = pageNumber || 1;
					opts.pageSize = pageSize;
					pagerHtml.pagination("refresh", {
						pageNumber : pageNumber,
						pageSize : pageSize
					});
					loaded(target);
				}
			});
			opts.pageSize = pagerHtml.pagination("options").pageSize;
		}
		function buildGridHeader(header, columns, frozen) {
			if (!columns) {
				return;
			}
			$(header).show();
			$(header).empty();
			var sortNames = [];
			var sortOrders = [];
			if (opts.sortName) {
				sortNames = opts.sortName.split(",");
				sortOrders = opts.sortOrder.split(",");
			}
			var t = $("<table class=\"datagrid-htable\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tbody></tbody></table>").appendTo(header);
			for (var i = 0; i < columns.length; i++) {
				var tr = $("<tr class=\"datagrid-header-row\"></tr>").appendTo($("tbody", t));
				var column = columns[i];
				for (var j = 0; j < column.length; j++) {
					var col = column[j];
					var tdAttr = "";
					if (col.rowspan) {
						tdAttr += "rowspan=\"" + col.rowspan + "\" ";
					}
					if (col.colspan) {
						tdAttr += "colspan=\"" + col.colspan + "\" ";
					}
					var td = $("<td " + tdAttr + "></td>").appendTo(tr);
					if (col.checkbox) {
						td.attr("field", col.field);
						$("<div class=\"datagrid-header-check\"></div>").html("<input type=\"checkbox\"/>").appendTo(td);
					} else {
						if (col.field) {
							td.attr("field", col.field);
							td.append("<div class=\"datagrid-cell\"><span></span><span class=\"datagrid-sort-icon\"></span></div>");
							$("span", td).html(col.title);
							$("span.datagrid-sort-icon", td).html("&nbsp;");
							var cell = td.find("div.datagrid-cell");
							var pos = indexOf(sortNames, col.field);
							if (pos >= 0) {
								cell.addClass("datagrid-sort-" + sortOrders[pos]);
							}
							if (col.resizable == false) {
								cell.attr("resizable", "false");
							}
							if (col.width) {
								var colWidth = $.parser.parseValue("width", col.width, dc.view, opts.scrollbarSize);
								cell._outerWidth(colWidth - 1);
								col.boxWidth = parseInt(cell[0].style.width);
								col.deltaWidth = colWidth - col.boxWidth;
							} else {
								col.auto = true;
							}
							cell.css("text-align", (col.halign || col.align || ""));
							col.cellClass = state.cellClassPrefix + "-" + col.field.replace(/[\.|\s]/g, "-");
							cell.addClass(col.cellClass).css("width", "");
						} else {
							$("<div class=\"datagrid-cell-group\"></div>").html(col.title).appendTo(td);
						}
					}
					if (col.hidden) {
						td.hide();
					}
				}
			}
			if (frozen && opts.rownumbers) {
				var td = $("<td rowspan=\"" + opts.frozenColumns.length + "\"><div class=\"datagrid-header-rownumber\"></div></td>");
				if ($("tr", t).length == 0) {
					td.wrap("<tr class=\"datagrid-header-row\"></tr>").parent().appendTo($("tbody", t));
				} else {
					td.prependTo($("tr:first", t));
				}
			}
		}
		;
		function buildCellClass() {
			var cellClass = [];
			var columnFields = getColumnFields(target, true).concat(getColumnFields(target));
			for (var i = 0; i < columnFields.length; i++) {
				var col = getColumnOption(target, columnFields[i]);
				if (col && !col.checkbox) {
					cellClass.push([ "." + col.cellClass, col.boxWidth ? col.boxWidth + "px" : "auto" ]);
				}
			}
			state.ss.add(cellClass);
			state.ss.dirty(state.cellSelectorPrefix);
			state.cellSelectorPrefix = "." + state.cellClassPrefix;
		}
		;
	}
	;
	function setProperties(target) {
		var state = $.data(target, "datagrid");
		var panel = state.panel;
		var opts = state.options;
		var dc = state.dc;
		var header = dc.header1.add(dc.header2);
		header.find("input[type=checkbox]").unbind(".datagrid").bind("click.datagrid", function(e) {
			if (opts.singleSelect && opts.selectOnCheck) {
				return false;
			}
			if ($(this).is(":checked")) {
				checkAll(target);
			} else {
				clearChecked(target);
			}
			e.stopPropagation();
		});
		var cells = header.find("div.datagrid-cell");
		cells.closest("td").unbind(".datagrid").bind("mouseenter.datagrid", function() {
			if (state.resizing) {
				return;
			}
			$(this).addClass("datagrid-header-over");
		}).bind("mouseleave.datagrid", function() {
			$(this).removeClass("datagrid-header-over");
		}).bind("contextmenu.datagrid", function(e) {
			var fieldName = $(this).attr("field");
			opts.onHeaderContextMenu.call(target, e, fieldName);
		});
		cells.unbind(".datagrid").bind("click.datagrid", function(e) {
			var p1 = $(this).offset().left + 5;
			var p2 = $(this).offset().left + $(this)._outerWidth() - 5;
			if (e.pageX < p2 && e.pageX > p1) {
				sort(target, $(this).parent().attr("field"));
			}
		}).bind("dblclick.datagrid", function(e) {
			var p1 = $(this).offset().left + 5;
			var p2 = $(this).offset().left + $(this)._outerWidth() - 5;
			var position1 = opts.resizeHandle == "right" ? (e.pageX > p2) : (opts.resizeHandle == "left" ? (e.pageX < p1) : (e.pageX < p1 || e.pageX > p2));
			if (position1) {
				var fieldName = $(this).parent().attr("field");
				var col = getColumnOption(target, fieldName);
				if (col.resizable == false) {
					return;
				}
				$(target).datagrid("autoSizeColumn", fieldName);
				col.auto = false;
			}
		});
		var position2 = opts.resizeHandle == "right" ? "e" : (opts.resizeHandle == "left" ? "w" : "e,w");
		cells.each(function() {
			$(this).resizable({
				handles : position2,
				disabled : ($(this).attr("resizable") ? $(this).attr("resizable") == "false" : false),
				minWidth : 25,
				onStartResize : function(e) {
					state.resizing = true;
					header.css("cursor", $("body").css("cursor"));
					if (!state.proxy) {
						state.proxy = $("<div class=\"datagrid-resize-proxy\"></div>").appendTo(dc.view);
					}
					state.proxy.css({
						left : e.pageX - $(panel).offset().left - 1,
						display : "none"
					});
					setTimeout(function() {
						if (state.proxy) {
							state.proxy.show();
						}
					}, 500);
				},
				onResize : function(e) {
					state.proxy.css({
						left : e.pageX - $(panel).offset().left - 1,
						display : "block"
					});
					return false;
				},
				onStopResize : function(e) {
					header.css("cursor", "");
					$(this).css("height", "");
					var fieldName = $(this).parent().attr("field");
					var col = getColumnOption(target, fieldName);
					col.width = $(this)._outerWidth();
					col.boxWidth = col.width - col.deltaWidth;
					col.auto = undefined;
					$(this).css("width", "");
					fitColumnSize(target, fieldName);
					state.proxy.remove();
					state.proxy = null;
					if ($(this).parents("div:first.datagrid-header").parent().hasClass("datagrid-view1")) {
						fitGridSize(target);
					}
					fitColumns(target);
					opts.onResizeColumn.call(target, fieldName, col.width);
					setTimeout(function() {
						state.resizing = false;
					}, 0);
				}
			});
		});
		var bb = dc.body1.add(dc.body2);
		bb.unbind();
		for ( var i in opts.rowEvents) {
			bb.bind(i, opts.rowEvents[i]);
		}
		dc.body1.bind("mousewheel DOMMouseScroll", function(e) {
			var e1 = e.originalEvent || window.event;
			var num = e1.wheelDelta || e1.detail * (-1);
			var dg = $(e.target).closest("div.datagrid-view").children(".datagrid-f");
			var dc = dg.data("datagrid").dc;
			dc.body2.scrollTop(dc.body2.scrollTop() - num);
		});
		dc.body2.bind("scroll", function() {
			var b1 = dc.view1.children("div.datagrid-body");
			b1.scrollTop($(this).scrollTop());
			var c1 = dc.body1.children(":first");
			var c2 = dc.body2.children(":first");
			if (c1.length && c2.length) {
				var top1 = c1.offset().top;
				var top2 = c2.offset().top;
				if (top1 != top2) {
					b1.scrollTop(b1.scrollTop() + top1 - top2);
				}
			}
			dc.view2.children("div.datagrid-header,div.datagrid-footer")._scrollLeft($(this)._scrollLeft());
			dc.body2.children("table.datagrid-btable-frozen").css("left", -$(this)._scrollLeft());
		});
	}
	;
	function rowEvent_mouse(_1134) {
		return function(e) {
			var tr = _1135(e.target);
			if (!tr) {
				return;
			}
			var _1136 = _1137(tr);
			if ($.data(_1136, "datagrid").resizing) {
				return;
			}
			var _1138 = _1139(tr);
			if (_1134) {
				highlightRow(_1136, _1138);
			} else {
				var _1141 = $.data(_1136, "datagrid").options;
				_1141.finder.getTr(_1136, _1138).removeClass("datagrid-row-over");
			}
		};
	}
	;
	function rowEvent_click(e) {
		var tr = _1135(e.target);
		if (!tr) {
			return;
		}
		var _1143 = _1137(tr);
		var opts = $.data(_1143, "datagrid").options;
		var _1145 = _1139(tr);
		var tt = $(e.target);
		if (tt.parent().hasClass("datagrid-cell-check")) {
			if (opts.singleSelect && opts.selectOnCheck) {
				tt._propAttr("checked", !tt.is(":checked"));
				checkRow(_1143, _1145);
			} else {
				if (tt.is(":checked")) {
					tt._propAttr("checked", false);
					checkRow(_1143, _1145);
				} else {
					tt._propAttr("checked", true);
					uncheckRow(_1143, _1145);
				}
			}
		} else {
			var row = opts.finder.getRow(_1143, _1145);
			var td = tt.closest("td[field]", tr);
			if (td.length) {
				var _1148 = td.attr("field");
				opts.onClickCell.call(_1143, _1145, _1148, row[_1148]);
			}
			if (opts.singleSelect == true) {
				selectRow(_1143, _1145);
			} else {
				if (opts.ctrlSelect) {
					if (e.ctrlKey) {
						if (tr.hasClass("datagrid-row-selected")) {
							unselectRow(_1143, _1145);
						} else {
							selectRow(_1143, _1145);
						}
					} else {
						if (e.shiftKey) {
							$(_1143).datagrid("clearSelections");
							var _1151 = Math.min(opts.lastSelectedIndex || 0, _1145);
							var _1152 = Math.max(opts.lastSelectedIndex || 0, _1145);
							for (var i = _1151; i <= _1152; i++) {
								selectRow(_1143, i);
							}
						} else {
							$(_1143).datagrid("clearSelections");
							selectRow(_1143, _1145);
							opts.lastSelectedIndex = _1145;
						}
					}
				} else {
					if (tr.hasClass("datagrid-row-selected")) {
						unselectRow(_1143, _1145);
					} else {
						selectRow(_1143, _1145);
					}
				}
			}
			opts.onClickRow.call(_1143, _1145, row);
		}
	}
	;
	function rowEvent_dblclick(e) {
		var tr = _1135(e.target);
		if (!tr) {
			return;
		}
		var _1154 = _1137(tr);
		var _1155 = $.data(_1154, "datagrid").options;
		var _1156 = _1139(tr);
		var row = _1155.finder.getRow(_1154, _1156);
		var td = $(e.target).closest("td[field]", tr);
		if (td.length) {
			var _1157 = td.attr("field");
			_1155.onDblClickCell.call(_1154, _1156, _1157, row[_1157]);
		}
		_1155.onDblClickRow.call(_1154, _1156, row);
	}
	;
	function rowEvent_contextmenu(e) {
		var tr = _1135(e.target);
		if (!tr) {
			return;
		}
		var _1159 = _1137(tr);
		var opts = $.data(_1159, "datagrid").options;
		var _1161 = _1139(tr);
		var row = opts.finder.getRow(_1159, _1161);
		opts.onRowContextMenu.call(_1159, e, _1161, row);
	}
	;
	function _1137(t) {
		return $(t).closest("div.datagrid-view").children(".datagrid-f")[0];
	}
	;
	function _1135(t) {
		var tr = $(t).closest("tr.datagrid-row");
		if (tr.length && tr.parent().length) {
			return tr;
		} else {
			return undefined;
		}
	}
	;
	function _1139(tr) {
		if (tr.attr("datagrid-row-index")) {
			return parseInt(tr.attr("datagrid-row-index"));
		} else {
			return tr.attr("node-id");
		}
	}
	;
	function sort(target, param) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		param = param || {};
		var st = {
			sortName : opts.sortName,
			sortOrder : opts.sortOrder
		};
		if (typeof param == "object") {
			$.extend(st, param);
		}
		var sortNames = [];
		var sortOrders = [];
		if (st.sortName) {
			sortNames = st.sortName.split(",");
			sortOrders = st.sortOrder.split(",");
		}
		if (typeof param == "string") {
			var field = param;
			var col = getColumnOption(target, field);
			if (!col.sortable || state.resizing) {
				return;
			}
			var defaultOrder = col.order || "asc";
			var pos = indexOf(sortNames, field);
			if (pos >= 0) {
				var posOrder = sortOrders[pos] == "asc" ? "desc" : "asc";
				if (opts.multiSort && posOrder == defaultOrder) {
					sortNames.splice(pos, 1);
					sortOrders.splice(pos, 1);
				} else {
					sortOrders[pos] = posOrder;
				}
			} else {
				if (opts.multiSort) {
					sortNames.push(field);
					sortOrders.push(defaultOrder);
				} else {
					sortNames = [ field ];
					sortOrders = [ defaultOrder ];
				}
			}
			st.sortName = sortNames.join(",");
			st.sortOrder = sortOrders.join(",");
		}
		if (opts.onBeforeSortColumn.call(target, st.sortName, st.sortOrder) == false) {
			return;
		}
		$.extend(opts, st);
		var dc = state.dc;
		var header = dc.header1.add(dc.header2);
		header.find("div.datagrid-cell").removeClass("datagrid-sort-asc datagrid-sort-desc");
		for (var i = 0; i < sortNames.length; i++) {
			var col = getColumnOption(target, sortNames[i]);
			header.find("div." + col.cellClass).addClass("datagrid-sort-" + sortOrders[i]);
		}
		if (opts.remoteSort) {
			loaded(target);
		} else {
			loadData(target, $(target).datagrid("getData"));
		}
		opts.onSortColumn.call(target, opts.sortName, opts.sortOrder);
	}
	;
	function fitColumns(target) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var dc = state.dc;
		var header2 = dc.view2.children("div.datagrid-header");
		dc.body2.css("overflow-x", "");
		fixColumnBoxWidth();
		fixColumnHeaderWidth();
		if (header2.width() >= header2.find("table").width()) {
			dc.body2.css("overflow-x", "hidden");
		}
		function fixColumnHeaderWidth() {
			if (!opts.fitColumns) {
				return;
			}
			if (!state.leftWidth) {
				state.leftWidth = 0;
			}
			var width = 0;
			var cc = [];
			var columnFields = getColumnFields(target, false);
			for (var i = 0; i < columnFields.length; i++) {
				var col = getColumnOption(target, columnFields[i]);
				if (judgeWidthAttr(col)) {
					width += col.width;
					cc.push({
						field : col.field,
						col : col,
						addingWidth : 0
					});
				}
			}
			if (!width) {
				return;
			}
			cc[cc.length - 1].addingWidth -= state.leftWidth;
			var showHeader = header2.children("div.datagrid-header-inner").show();
			var width2 = header2.width() - header2.find("table").width() - opts.scrollbarSize + state.leftWidth;
			var rate = width2 / width;
			if (!opts.showHeader) {
				showHeader.hide();
			}
			for (var i = 0; i < cc.length; i++) {
				var c = cc[i];
				var addingWidth = parseInt(c.col.width * rate);
				c.addingWidth += addingWidth;
				width2 -= addingWidth;
			}
			cc[cc.length - 1].addingWidth += width2;
			for (var i = 0; i < cc.length; i++) {
				var c = cc[i];
				if (c.col.boxWidth + c.addingWidth > 0) {
					c.col.boxWidth += c.addingWidth;
					c.col.width += c.addingWidth;
				}
			}
			state.leftWidth = width2;
			fitColumnSize(target);
		}
		;
		function fixColumnBoxWidth() {
			var flag = false;
			var columnFields = getColumnFields(target, true).concat(getColumnFields(target, false));
			$.map(columnFields, function(field) {
				var col = getColumnOption(target, field);
				if (String(col.width || "").indexOf("%") >= 0) {
					var boxWidth = $.parser.parseValue("width", col.width, dc.view, opts.scrollbarSize) - col.deltaWidth;
					if (boxWidth > 0) {
						col.boxWidth = boxWidth;
						flag = true;
					}
				}
			});
			if (flag) {
				fitColumnSize(target);
			}
		}
		;
		function judgeWidthAttr(col) {
			if (String(col.width || "").indexOf("%") >= 0) {
				return false;
			}
			if (!col.hidden && !col.checkbox && !col.auto && !col.fixed) {
				return true;
			}
		}
		;
	}
	;
	function autoSizeColumn(target, field) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var dc = state.dc;
		var tmp = $("<div class=\"datagrid-cell\" style=\"position:absolute;left:-9999px\"></div>").appendTo("body");
		if (field) {
			resize(field);
			if (opts.fitColumns) {
				fitGridSize(target);
				fitColumns(target);
			}
		} else {
			var fits = false;
			var columnFields = getColumnFields(target, true).concat(getColumnFields(target, false));
			for (var i = 0; i < columnFields.length; i++) {
				var field = columnFields[i];
				var col = getColumnOption(target, field);
				if (col.auto) {
					resize(field);
					fits = true;
				}
			}
			if (fits && opts.fitColumns) {
				fitGridSize(target);
				fitColumns(target);
			}
		}
		tmp.remove();
		function resize(field) {
			var cell = dc.view.find("div.datagrid-header td[field=\"" + field + "\"] div.datagrid-cell");
			cell.css("width", "");
			var col = $(target).datagrid("getColumnOption", field);
			col.width = undefined;
			col.boxWidth = undefined;
			col.auto = true;
			$(target).datagrid("fixColumnSize", field);
			var width = Math.max(getWidth("header"), getWidth("allbody"), getWidth("allfooter")) + 1;
			cell._outerWidth(width - 1);
			col.width = width;
			col.boxWidth = parseInt(cell[0].style.width);
			col.deltaWidth = width - col.boxWidth;
			cell.css("width", "");
			$(target).datagrid("fixColumnSize", field);
			opts.onResizeColumn.call(target, field, col.width);
			function getWidth(type) {
				var outerWidth = 0;
				if (type == "header") {
					outerWidth = getOuterWidth(cell);
				} else {
					opts.finder.getTr(target, 0, type).find("td[field=\"" + field + "\"] div.datagrid-cell").each(function() {
						var w = getOuterWidth($(this));
						if (outerWidth < w) {
							outerWidth = w;
						}
					});
				}
				return outerWidth;
				function getOuterWidth(tdCell) {
					return tdCell.is(":visible") ? tdCell._outerWidth() : tmp.html(tdCell.html())._outerWidth();
				}
				;
			}
			;
		}
		;
	}
	;
	function fitColumnSize(target, field) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var dc = state.dc;
		var table = dc.view.find("table.datagrid-btable,table.datagrid-ftable");
		table.css("table-layout", "fixed");
		if (field) {
			fix(field);
		} else {
			var ff = getColumnFields(target, true).concat(getColumnFields(target, false));
			for (var i = 0; i < ff.length; i++) {
				fix(ff[i]);
			}
		}
		table.css("table-layout", "auto");
		fitColumnMergeWidth(target);
		fixRowHeight(target);
		fitColumnEditWidth(target);
		function fix(field) {
			var col = getColumnOption(target, field);
			if (col.cellClass) {
				state.ss.set("." + col.cellClass, col.boxWidth ? col.boxWidth + "px" : "auto");
			}
		}
		;
	}
	;
	function fitColumnMergeWidth(target) {
		var dc = $.data(target, "datagrid").dc;
		dc.view.find("td.datagrid-td-merged").each(function() {
			var td = $(this);
			var colspan = td.attr("colspan") || 1;
			var col = getColumnOption(target, td.attr("field"));
			var width = col.boxWidth + col.deltaWidth - 1;
			for (var i = 1; i < colspan; i++) {
				td = td.next();
				col = getColumnOption(target, td.attr("field"));
				width += col.boxWidth + col.deltaWidth;
			}
			$(this).children("div.datagrid-cell")._outerWidth(width);
		});
	}
	;
	function fitColumnEditWidth(target) {
		var dc = $.data(target, "datagrid").dc;
		dc.view.find("div.datagrid-editable").each(function() {
			var temp = $(this);
			var fieldName = temp.parent().attr("field");
			var col = $(target).datagrid("getColumnOption", fieldName);
			temp._outerWidth(col.boxWidth + col.deltaWidth - 1);
			var ed = $.data(this, "datagrid.editor");
			if (ed.actions.resize) {
				ed.actions.resize(ed.target, temp.width());
			}
		});
	}
	;
	function getColumnOption(target, field) {
		function getColumn(columns) {
			if (columns) {
				for (var i = 0; i < columns.length; i++) {
					var cc = columns[i];
					for (var j = 0; j < cc.length; j++) {
						var c = cc[j];
						if (c.field == field) {
							return c;
						}
					}
				}
			}
			return null;
		}
		;
		var opts = $.data(target, "datagrid").options;
		var col = getColumn(opts.columns);
		if (!col) {
			col = getColumn(opts.frozenColumns);
		}
		return col;
	}
	;
	function getColumnFields(target, frozen) {
		var opts = $.data(target, "datagrid").options;
		var columns = (frozen == true) ? (opts.frozenColumns || [ [] ]) : opts.columns;
		if (columns.length == 0) {
			return [];
		}
		var aa = [];
		var colspan = findColumnFields();
		for (var i = 0; i < columns.length; i++) {
			aa[i] = new Array(colspan);
		}
		for (var j = 0; j < columns.length; j++) {
			$.map(columns[j], function(col) {
				var value = getFixColspan(aa[j]);
				if (value >= 0) {
					var field = col.field || "";
					for (var c = 0; c < (col.colspan || 1); c++) {
						for (var r = 0; r < (col.rowspan || 1); r++) {
							aa[j + r][value] = field;
						}
						value++;
					}
				}
			});
		}
		return aa[aa.length - 1];
		function findColumnFields() {
			var c = 0;
			$.map(columns[0], function(col) {
				c += col.colspan || 1;
			});
			return c;
		}
		;
		function getFixColspan(a) {
			for (var i = 0; i < a.length; i++) {
				if (a[i] == undefined) {
					return i;
				}
			}
			return -1;
		}
		;
	}
	;
	function loadData(target, data) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var dc = state.dc;
		data = opts.loadFilter.call(target, data);
		data.total = parseInt(data.total);
		state.data = data;
		if (data.footer) {
			state.footer = data.footer;
		}
		if (!opts.remoteSort && opts.sortName) {
			var sortName = opts.sortName.split(",");
			var sortOrder = opts.sortOrder.split(",");
			data.rows.sort(function(r1, r2) {
				var r = 0;
				for (var i = 0; i < sortName.length; i++) {
					var sn = sortName[i];
					var so = sortOrder[i];
					var col = getColumnOption(target, sn);
					var sortFunc = col.sorter || function(a, b) {
						return a == b ? 0 : (a > b ? 1 : -1);
					};
					r = sortFunc(r1[sn], r2[sn]) * (so == "asc" ? 1 : -1);
					if (r != 0) {
						return r;
					}
				}
				return r;
			});
		}
		if (opts.view.onBeforeRender) {
			opts.view.onBeforeRender.call(opts.view, target, data.rows);
		}
		opts.view.render.call(opts.view, target, dc.body2, false);
		opts.view.render.call(opts.view, target, dc.body1, true);
		if (opts.showFooter) {
			opts.view.renderFooter.call(opts.view, target, dc.footer2, false);
			opts.view.renderFooter.call(opts.view, target, dc.footer1, true);
		}
		if (opts.view.onAfterRender) {
			opts.view.onAfterRender.call(opts.view, target);
		}
		state.ss.clean();
		var pager = $(target).datagrid("getPager");
		if (pager.length) {
			var pageOptions = pager.pagination("options");
			if (pageOptions.total != data.total) {
				pager.pagination("refresh", {
					total : data.total
				});
				if (opts.pageNumber != pageOptions.pageNumber && pageOptions.pageNumber > 0) {
					opts.pageNumber = pageOptions.pageNumber;
					loaded(target);
				}
			}
		}
		fixRowHeight(target);
		dc.body2.triggerHandler("scroll");
		$(target).datagrid("setSelectionState");
		$(target).datagrid("autoSizeColumn");
		opts.onLoadSuccess.call(target, data);
	}
	;
	function setSelectionState(target) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var dc = state.dc;
		dc.header1.add(dc.header2).find("input[type=checkbox]")._propAttr("checked", false);
		if (opts.idField) {
			var treegridState = $.data(target, "treegrid") ? true : false;
			var selectState = opts.onSelect;
			var checkState = opts.onCheck;
			opts.onSelect = opts.onCheck = function() {
			};
			var rows = opts.finder.getRows(target);
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var param = treegridState ? row[opts.idField] : i;
				if (setChectState(state.selectedRows, row)) {
					selectRow(target, param, true);
				}
				if (setChectState(state.checkedRows, row)) {
					checkRow(target, param, true);
				}
			}
			opts.onSelect = selectState;
			opts.onCheck = checkState;
		}
		function setChectState(a, r) {
			for (var i = 0; i < a.length; i++) {
				if (a[i][opts.idField] == r[opts.idField]) {
					a[i] = r;
					return true;
				}
			}
			return false;
		}
		;
	}
	;
	function getRowIndex(target, row) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var rows = state.data.rows;
		if (typeof row == "object") {
			return indexOf(rows, row);
		} else {
			for (var i = 0; i < rows.length; i++) {
				if (rows[i][opts.idField] == row) {
					return i;
				}
			}
			return -1;
		}
	}
	;
	function getSelections(target) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var data = state.data;
		if (opts.idField) {
			return state.selectedRows;
		} else {
			var rows = [];
			opts.finder.getTr(target, "", "selected", 2).each(function() {
				rows.push(opts.finder.getRow(target, $(this)));
			});
			return rows;
		}
	}
	;
	function getChecked(target) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		if (opts.idField) {
			return state.checkedRows;
		} else {
			var rows = [];
			opts.finder.getTr(target, "", "checked", 2).each(function() {
				rows.push(opts.finder.getRow(target, $(this)));
			});
			return rows;
		}
	}
	;
	function scrollTo(target, index) {
		var state = $.data(target, "datagrid");
		var dc = state.dc;
		var opts = state.options;
		var tr = opts.finder.getTr(target, index);
		if (tr.length) {
			if (tr.closest("table").hasClass("datagrid-btable-frozen")) {
				return;
			}
			var height = dc.view2.children("div.datagrid-header")._outerHeight();
			var body2 = dc.body2;
			var outerHeight = body2.outerHeight(true) - body2.outerHeight();
			var top = tr.position().top - height - outerHeight;
			if (top < 0) {
				body2.scrollTop(body2.scrollTop() + top);
			} else {
				if (top + tr._outerHeight() > body2.height() - 18) {
					body2.scrollTop(body2.scrollTop() + top + tr._outerHeight() - body2.height() + 18);
				}
			}
		}
	}
	;
	function highlightRow(target, index) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		opts.finder.getTr(target, state.highlightIndex).removeClass("datagrid-row-over");
		opts.finder.getTr(target, index).addClass("datagrid-row-over");
		state.highlightIndex = index;
	}
	;
	function selectRow(target, index, selectStatus) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var row = opts.finder.getRow(target, index);
		if (opts.onBeforeSelect.call(target, index, row) == false) {
			return;
		}
		if (opts.singleSelect) {
			unselectAll(target, true);
			state.selectedRows = [];
		}
		if (!selectStatus && opts.checkOnSelect) {
			checkRow(target, index, true);
		}
		if (opts.idField) {
			getNestValue(state.selectedRows, opts.idField, row);
		}
		opts.finder.getTr(target, index).addClass("datagrid-row-selected");
		opts.onSelect.call(target, index, row);
		scrollTo(target, index);
	}
	;
	function unselectRow(target, index, selectStatus) {
		var state = $.data(target, "datagrid");
		var dc = state.dc;
		var opts = state.options;
		var row = opts.finder.getRow(target, index);
		if (opts.onBeforeUnselect.call(target, index, row) == false) {
			return;
		}
		if (!selectStatus && opts.checkOnSelect) {
			uncheckRow(target, index, true);
		}
		opts.finder.getTr(target, index).removeClass("datagrid-row-selected");
		if (opts.idField) {
			removeById(state.selectedRows, opts.idField, row[opts.idField]);
		}
		opts.onUnselect.call(target, index, row);
	}
	;
	function selectAll(target, selectStatus) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var rows = opts.finder.getRows(target);
		var selectedRows = $.data(target, "datagrid").selectedRows;
		if (!selectStatus && opts.checkOnSelect) {
			checkAll(target, true);
		}
		opts.finder.getTr(target, "", "allbody").addClass("datagrid-row-selected");
		if (opts.idField) {
			for (var i = 0; i < rows.length; i++) {
				getNestValue(selectedRows, opts.idField, rows[i]);
			}
		}
		opts.onSelectAll.call(target, rows);
	}
	;
	function unselectAll(target, selectState) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var rows = opts.finder.getRows(target);
		var selectedRows = $.data(target, "datagrid").selectedRows;
		if (!selectState && opts.checkOnSelect) {
			clearChecked(target, true);
		}
		opts.finder.getTr(target, "", "selected").removeClass("datagrid-row-selected");
		if (opts.idField) {
			for (var i = 0; i < rows.length; i++) {
				removeById(selectedRows, opts.idField, rows[i][opts.idField]);
			}
		}
		opts.onUnselectAll.call(target, rows);
	}
	;
	function checkRow(target, index, checkStatus) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var row = opts.finder.getRow(target, index);
		if (opts.onBeforeCheck.call(target, index, row) == false) {
			return;
		}
		if (opts.singleSelect && opts.selectOnCheck) {
			clearChecked(target, true);
			state.checkedRows = [];
		}
		if (!checkStatus && opts.selectOnCheck) {
			selectRow(target, index, true);
		}
		var tr = opts.finder.getTr(target, index).addClass("datagrid-row-checked");
		tr.find("div.datagrid-cell-check input[type=checkbox]")._propAttr("checked", true);
		tr = opts.finder.getTr(target, "", "checked", 2);
		if (tr.length == opts.finder.getRows(target).length) {
			var dc = state.dc;
			dc.header1.add(dc.header2).find("input[type=checkbox]")._propAttr("checked", true);
		}
		if (opts.idField) {
			getNestValue(state.checkedRows, opts.idField, row);
		}
		opts.onCheck.call(target, index, row);
	}
	;
	function uncheckRow(target, index, checkStatus) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var row = opts.finder.getRow(target, index);
		if (opts.onBeforeUncheck.call(target, index, row) == false) {
			return;
		}
		if (!checkStatus && opts.selectOnCheck) {
			unselectRow(target, index, true);
		}
		var tr = opts.finder.getTr(target, index).removeClass("datagrid-row-checked");
		tr.find("div.datagrid-cell-check input[type=checkbox]")._propAttr("checked", false);
		var dc = state.dc;
		var header = dc.header1.add(dc.header2);
		header.find("input[type=checkbox]")._propAttr("checked", false);
		if (opts.idField) {
			removeById(state.checkedRows, opts.idField, row[opts.idField]);
		}
		opts.onUncheck.call(target, index, row);
	}
	;
	function checkAll(target, checkStatus) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var rows = opts.finder.getRows(target);
		if (!checkStatus && opts.selectOnCheck) {
			selectAll(target, true);
		}
		var dc = state.dc;
		var hck = dc.header1.add(dc.header2).find("input[type=checkbox]");
		var bck = opts.finder.getTr(target, "", "allbody").addClass("datagrid-row-checked").find("div.datagrid-cell-check input[type=checkbox]");
		hck.add(bck)._propAttr("checked", true);
		if (opts.idField) {
			for (var i = 0; i < rows.length; i++) {
				getNestValue(state.checkedRows, opts.idField, rows[i]);
			}
		}
		opts.onCheckAll.call(target, rows);
	}
	;
	function clearChecked(target, checkedState) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var rows = opts.finder.getRows(target);
		if (!checkedState && opts.selectOnCheck) {
			unselectAll(target, true);
		}
		var dc = state.dc;
		var hck = dc.header1.add(dc.header2).find("input[type=checkbox]");
		var bck = opts.finder.getTr(target, "", "checked").removeClass("datagrid-row-checked").find("div.datagrid-cell-check input[type=checkbox]");
		hck.add(bck)._propAttr("checked", false);
		if (opts.idField) {
			for (var i = 0; i < rows.length; i++) {
				removeById(state.checkedRows, opts.idField, rows[i][opts.idField]);
			}
		}
		opts.onUncheckAll.call(target, rows);
	}
	;
	function beginEdit(target, index) {
		var opts = $.data(target, "datagrid").options;
		var tr = opts.finder.getTr(target, index);
		var row = opts.finder.getRow(target, index);
		if (tr.hasClass("datagrid-row-editing")) {
			return;
		}
		if (opts.onBeforeEdit.call(target, index, row) == false) {
			return;
		}
		tr.addClass("datagrid-row-editing");
		beginEditRow(target, index);
		fitColumnEditWidth(target);
		tr.find("div.datagrid-editable").each(function() {
			var fieldName = $(this).parent().attr("field");
			var ed = $.data(this, "datagrid.editor");
			ed.actions.setValue(ed.target, row[fieldName]);
		});
		validateRow(target, index);
		opts.onBeginEdit.call(target, index, row);
	}
	;
	function endEdit(target, index, flag) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var updatedRows = state.updatedRows;
		var insertedRows = state.insertedRows;
		var tr = opts.finder.getTr(target, index);
		var row = opts.finder.getRow(target, index);
		if (!tr.hasClass("datagrid-row-editing")) {
			return;
		}
		if (!flag) {
			if (!validateRow(target, index)) {
				return;
			}
			var changeFlag = false;
			var changeRows = {};
			tr.find("div.datagrid-editable").each(function() {
				var field = $(this).parent().attr("field");
				var ed = $.data(this, "datagrid.editor");
				var t = $(ed.target);
				var textbox = t.data("textbox") ? t.textbox("textbox") : t;
				textbox.triggerHandler("blur");
				var value = ed.actions.getValue(ed.target);
				if (row[field] != value) {
					row[field] = value;
					changeFlag = true;
					changeRows[field] = value;
				}
			});
			if (changeFlag) {
				if (indexOf(insertedRows, row) == -1) {
					if (indexOf(updatedRows, row) == -1) {
						updatedRows.push(row);
					}
				}
			}
			opts.onEndEdit.call(target, index, row, changeRows);
		}
		tr.removeClass("datagrid-row-editing");
		endEditRow(target, index);
		$(target).datagrid("refreshRow", index);
		if (!flag) {
			opts.onAfterEdit.call(target, index, row, changeRows);
		} else {
			opts.onCancelEdit.call(target, index, row);
		}
	}
	;
	function getEditors(target, index) {
		var opts = $.data(target, "datagrid").options;
		var tr = opts.finder.getTr(target, index);
		var editor = [];
		tr.children("td").each(function() {
			var cell = $(this).find("div.datagrid-editable");
			if (cell.length) {
				var ed = $.data(cell[0], "datagrid.editor");
				editor.push(ed);
			}
		});
		return editor;
	}
	;
	function getEditor(target, options) {
		var editors = getEditors(target, options.index != undefined ? options.index : options.id);
		for (var i = 0; i < editors.length; i++) {
			if (editors[i].field == options.field) {
				return editors[i];
			}
		}
		return null;
	}
	;
	function beginEditRow(target, index) {
		var opts = $.data(target, "datagrid").options;
		var tr = opts.finder.getTr(target, index);
		tr.children("td").each(function() {
			var cell = $(this).find("div.datagrid-cell");
			var fieldName = $(this).attr("field");
			var col = getColumnOption(target, fieldName);
			if (col && col.editor) {
				var type, editorOpts;
				if (typeof col.editor == "string") {
					type = col.editor;
				} else {
					type = col.editor.type;
					editorOpts = col.editor.options;
				}
				var editorType = opts.editors[type];
				if (editorType) {
					var html = cell.html();
					var outerWidth = cell._outerWidth();
					cell.addClass("datagrid-editable");
					cell._outerWidth(outerWidth);
					cell.html("<table border=\"0\" cellspacing=\"0\" cellpadding=\"1\"><tr><td></td></tr></table>");
					cell.children("table").bind("click dblclick contextmenu", function(e) {
						e.stopPropagation();
					});
					$.data(cell[0], "datagrid.editor", {
						actions : editorType,
						target : editorType.init(cell.find("td"), editorOpts),
						field : fieldName,
						type : type,
						oldHtml : html
					});
				}
			}
		});
		fixRowHeight(target, index, true);
	}
	;
	function endEditRow(target, index) {
		var opts = $.data(target, "datagrid").options;
		var tr = opts.finder.getTr(target, index);
		tr.children("td").each(function() {
			var cell = $(this).find("div.datagrid-editable");
			if (cell.length) {
				var ed = $.data(cell[0], "datagrid.editor");
				if (ed.actions.destroy) {
					ed.actions.destroy(ed.target);
				}
				cell.html(ed.oldHtml);
				$.removeData(cell[0], "datagrid.editor");
				cell.removeClass("datagrid-editable");
				cell.css("width", "");
			}
		});
	}
	;
	function validateRow(target, index) {
		var tr = $.data(target, "datagrid").options.finder.getTr(target, index);
		if (!tr.hasClass("datagrid-row-editing")) {
			return true;
		}
		var vbox = tr.find(".validatebox-text");
		vbox.validatebox("validate");
		vbox.trigger("mouseleave");
		var invalid = tr.find(".validatebox-invalid");
		return invalid.length == 0;
	}
	;
	function getChanges(target, type) {
		var insertedRows = $.data(target, "datagrid").insertedRows;
		var deletedRows = $.data(target, "datagrid").deletedRows;
		var updatedRows = $.data(target, "datagrid").updatedRows;
		if (!type) {
			var rows = [];
			rows = rows.concat(insertedRows);
			rows = rows.concat(deletedRows);
			rows = rows.concat(updatedRows);
			return rows;
		} else {
			if (type == "inserted") {
				return insertedRows;
			} else {
				if (type == "deleted") {
					return deletedRows;
				} else {
					if (type == "updated") {
						return updatedRows;
					}
				}
			}
		}
		return [];
	}
	;
	function deleteRow(target, index) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var data = state.data;
		var insertedRows = state.insertedRows;
		var deletedRows = state.deletedRows;
		$(target).datagrid("cancelEdit", index);
		var row = opts.finder.getRow(target, index);
		if (indexOf(insertedRows, row) >= 0) {
			removeById(insertedRows, row);
		} else {
			deletedRows.push(row);
		}
		removeById(state.selectedRows, opts.idField, row[opts.idField]);
		removeById(state.checkedRows, opts.idField, row[opts.idField]);
		opts.view.deleteRow.call(opts.view, target, index);
		if (opts.height == "auto") {
			fixRowHeight(target);
		}
		$(target).datagrid("getPager").pagination("refresh", {
			total : data.total
		});
	}
	;
	function insertRow(target, param) {
		var data = $.data(target, "datagrid").data;
		var view = $.data(target, "datagrid").options.view;
		var insertedRows = $.data(target, "datagrid").insertedRows;
		view.insertRow.call(view, target, param.index, param.row);
		insertedRows.push(param.row);
		$(target).datagrid("getPager").pagination("refresh", {
			total : data.total
		});
	}
	;
	function appendRow(target, row) {
		var data = $.data(target, "datagrid").data;
		var view = $.data(target, "datagrid").options.view;
		var insertedRows = $.data(target, "datagrid").insertedRows;
		view.insertRow.call(view, target, null, row);
		insertedRows.push(row);
		$(target).datagrid("getPager").pagination("refresh", {
			total : data.total
		});
	}
	;
	function resetOperation(target) {
		var state = $.data(target, "datagrid");
		var data = state.data;
		var rows = data.rows;
		var originalRows = [];
		for (var i = 0; i < rows.length; i++) {
			originalRows.push($.extend({}, rows[i]));
		}
		state.originalRows = originalRows;
		state.updatedRows = [];
		state.insertedRows = [];
		state.deletedRows = [];
	}
	;
	function acceptChanges(target) {
		var data = $.data(target, "datagrid").data;
		var ok = true;
		for (var i = 0, len = data.rows.length; i < len; i++) {
			if (validateRow(target, i)) {
				$(target).datagrid("endEdit", i);
			} else {
				ok = false;
			}
		}
		if (ok) {
			resetOperation(target);
		}
	}
	;
	function rejectChanges(target) {
		var state = $.data(target, "datagrid");
		var opts = state.options;
		var oringinalRows = state.originalRows;
		var insertedRows = state.insertedRows;
		var deletedRows = state.deletedRows;
		var selectedRows = state.selectedRows;
		var checkedRows = state.checkedRows;
		var data = state.data;
		function getIds(a) {
			var ids = [];
			for (var i = 0; i < a.length; i++) {
				ids.push(a[i][opts.idField]);
			}
			return ids;
		}
		;
		function selectOrCheck(ids, type) {
			for (var i = 0; i < ids.length; i++) {
				var index = getRowIndex(target, ids[i]);
				if (index >= 0) {
					(type == "s" ? selectRow : checkRow)(target, index, true);
				}
			}
		}
		;
		for (var i = 0; i < data.rows.length; i++) {
			$(target).datagrid("cancelEdit", i);
		}
		var selectedIds = getIds(selectedRows);
		var checkedIds = getIds(checkedRows);
		selectedRows.splice(0, selectedRows.length);
		checkedRows.splice(0, checkedRows.length);
		data.total += deletedRows.length - insertedRows.length;
		data.rows = oringinalRows;
		loadData(target, data);
		selectOrCheck(selectedIds, "s");
		selectOrCheck(checkedIds, "c");
		resetOperation(target);
	}
	;
	function loaded(target, param) {
		var opts = $.data(target, "datagrid").options;
		if (param) {
			opts.queryParams = param;
		}
		var queryParams = $.extend({}, opts.queryParams);
		if (opts.pagination) {
			$.extend(queryParams, {
				page : opts.pageNumber || 1,
				rows : opts.pageSize
			});
		}
		if (opts.sortName) {
			$.extend(queryParams, {
				sort : opts.sortName,
				order : opts.sortOrder
			});
		}
		if (opts.onBeforeLoad.call(target, queryParams) == false) {
			return;
		}
		$(target).datagrid("loading");
		setTimeout(function() {
			callLoaded();
		}, 0);
		function callLoaded() {
			var result = opts.loader.call(target, queryParams, function(data) {
				setTimeout(function() {
					$(target).datagrid("loaded");
				}, 0);
				loadData(target, data);
				setTimeout(function() {
					resetOperation(target);
				}, 0);
			}, function() {
				setTimeout(function() {
					$(target).datagrid("loaded");
				}, 0);
				opts.onLoadError.apply(target, arguments);
			});
			if (result == false) {
				$(target).datagrid("loaded");
			}
		}
		;
	}
	;
	function mergeCells(target, options) {
		var opts = $.data(target, "datagrid").options;
		options.type = options.type || "body";
		options.rowspan = options.rowspan || 1;
		options.colspan = options.colspan || 1;
		if (options.rowspan == 1 && options.colspan == 1) {
			return;
		}
		var tr = opts.finder.getTr(target, (options.index != undefined ? options.index : options.id), options.type);
		if (!tr.length) {
			return;
		}
		var td = tr.find("td[field=\"" + options.field + "\"]");
		td.attr("rowspan", options.rowspan).attr("colspan", options.colspan);
		td.addClass("datagrid-td-merged");
		hiddenTd(td.next(), options.colspan - 1);
		for (var i = 1; i < options.rowspan; i++) {
			tr = tr.next();
			if (!tr.length) {
				break;
			}
			td = tr.find("td[field=\"" + options.field + "\"]");
			hiddenTd(td, options.colspan);
		}
		fitColumnMergeWidth(target);
		function hiddenTd(td, value) {
			for (var i = 0; i < value; i++) {
				td.hide();
				td = td.next();
			}
		}
		;
	}
	;
	$.fn.datagrid = function(options, param) {
		if (typeof options == "string") {
			return $.fn.datagrid.methods[options](this, param);
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "datagrid");
			var opts;
			if (state) {
				opts = $.extend(state.options, options);
				state.options = opts;
			} else {
				opts = $.extend({}, $.extend({}, $.fn.datagrid.defaults, {
					queryParams : {}
				}), $.fn.datagrid.parseOptions(this), options);
				$(this).css("width", "").css("height", "");
				var gridWrap = wrapGrid(this, opts.rownumbers);
				if (!opts.columns) {
					opts.columns = gridWrap.columns;
				}
				if (!opts.frozenColumns) {
					opts.frozenColumns = gridWrap.frozenColumns;
				}
				opts.columns = $.extend(true, [], opts.columns);
				opts.frozenColumns = $.extend(true, [], opts.frozenColumns);
				opts.view = $.extend({}, opts.view);
				$.data(this, "datagrid", {
					options : opts,
					panel : gridWrap.panel,
					dc : gridWrap.dc,
					ss : null,
					selectedRows : [],
					checkedRows : [],
					data : {
						total : 0,
						rows : []
					},
					originalRows : [],
					updatedRows : [],
					insertedRows : [],
					deletedRows : []
				});
			}
			init(this);
			setProperties(this);
			resize(this);
			if (opts.data) {
				loadData(this, opts.data);
				resetOperation(this);
			} else {
				var data = $.fn.datagrid.parseData(this);
				if (data.total > 0) {
					loadData(this, data);
					resetOperation(this);
				}
			}
			loaded(this);
		});
	};
	function initEditorOptions(params) {
		var editorOptions = {};
		$.map(params, function(name) {
			editorOptions[name] = initTextEditors(name);
		});
		return editorOptions;
		function initTextEditors(name) {
			function isA(obj) {
				return $.data($(obj)[0], name) != undefined;
			}
			;
			return {
				init : function(container, options) {
					var editor = $("<input type=\"text\" class=\"datagrid-editable-input\">").appendTo(container);
					if (editor[name] && name != "text") {
						return editor[name](options);
					} else {
						return editor;
					}
				},
				destroy : function(target) {
					if (isA(target, name)) {
						$(target)[name]("destroy");
					}
				},
				getValue : function(target) {
					if (isA(target, name)) {
						var opts = $(target)[name]("options");
						if (opts.multiple) {
							return $(target)[name]("getValues").join(opts.separator);
						} else {
							return $(target)[name]("getValue");
						}
					} else {
						return $(target).val();
					}
				},
				setValue : function(target, value) {
					if (isA(target, name)) {
						var opts = $(target)[name]("options");
						if (opts.multiple) {
							if (value) {
								$(target)[name]("setValues", value.split(opts.separator));
							} else {
								$(target)[name]("clear");
							}
						} else {
							$(target)[name]("setValue", value);
						}
					} else {
						$(target).val(value);
					}
				},
				resize : function(target, width) {
					if (isA(target, name)) {
						$(target)[name]("resize", width);
					} else {
						$(target)._outerWidth(width)._outerHeight(22);
					}
				}
			};
		}
		;
	}
	;
	var editors = $.extend({}, initEditorOptions([ "text", "textbox", "numberbox", "numberspinner", "combobox", "combotree", "combogrid", "datebox", "datetimebox", "timespinner", "datetimespinner" ]), {
		textarea : {
			init : function(container, options) {
				var editor = $("<textarea class=\"datagrid-editable-input\"></textarea>").appendTo(container);
				return editor;
			},
			getValue : function(target) {
				return $(target).val();
			},
			setValue : function(target, value) {
				$(target).val(value);
			},
			resize : function(target, value) {
				$(target)._outerWidth(value);
			}
		},
		checkbox : {
			init : function(container, options) {
				var editor = $("<input type=\"checkbox\">").appendTo(container);
				editor.val(options.on);
				editor.attr("offval", options.off);
				return editor;
			},
			getValue : function(target) {
				if ($(target).is(":checked")) {
					return $(target).val();
				} else {
					return $(target).attr("offval");
				}
			},
			setValue : function(target, value) {
				var checked = false;
				if ($(target).val() == value) {
					checked = true;
				}
				$(target)._propAttr("checked", checked);
			}
		},
		validatebox : {
			init : function(container, options) {
				var editor = $("<input type=\"text\" class=\"datagrid-editable-input\">").appendTo(container);
				editor.validatebox(options);
				return editor;
			},
			destroy : function(target) {
				$(target).validatebox("destroy");
			},
			getValue : function(target) {
				return $(target).val();
			},
			setValue : function(target, value) {
				$(target).val(value);
			},
			resize : function(target, value) {
				$(target)._outerWidth(value)._outerHeight(22);
			}
		}
	});
	$.fn.datagrid.methods = {
		options : function(jq) {
			var options = $.data(jq[0], "datagrid").options;
			var panelOptions = $.data(jq[0], "datagrid").panel.panel("options");
			var opts = $.extend(options, {
				width : panelOptions.width,
				height : panelOptions.height,
				closed : panelOptions.closed,
				collapsed : panelOptions.collapsed,
				minimized : panelOptions.minimized,
				maximized : panelOptions.maximized
			});
			return opts;
		},
		setSelectionState : function(jq) {
			return jq.each(function() {
				setSelectionState(this);
			});
		},
		createStyleSheet : function(jq) {
			return createStyleSheet(jq[0]);
		},
		getPanel : function(jq) {
			return $.data(jq[0], "datagrid").panel;
		},
		getPager : function(jq) {
			return $.data(jq[0], "datagrid").panel.children("div.datagrid-pager");
		},
		getColumnFields : function(jq, frozen) {
			return getColumnFields(jq[0], frozen);
		},
		getColumnOption : function(jq, field) {
			return getColumnOption(jq[0], field);
		},
		resize : function(jq, param) {
			return jq.each(function() {
				resize(this, param);
			});
		},
		load : function(jq, param) {
			return jq.each(function() {
				var opts = $(this).datagrid("options");
				if (typeof param == "string") {
					opts.url = param;
					param = null;
				}
				opts.pageNumber = 1;
				var pager = $(this).datagrid("getPager");
				pager.pagination("refresh", {
					pageNumber : 1
				});
				loaded(this, param);
			});
		},
		reload : function(jq, param) {
			return jq.each(function() {
				var opts = $(this).datagrid("options");
				if (typeof param == "string") {
					opts.url = param;
					param = null;
				}
				loaded(this, param);
			});
		},
		reloadFooter : function(jq, footer) {
			return jq.each(function() {
				var opts = $.data(this, "datagrid").options;
				var dc = $.data(this, "datagrid").dc;
				if (footer) {
					$.data(this, "datagrid").footer = footer;
				}
				if (opts.showFooter) {
					opts.view.renderFooter.call(opts.view, this, dc.footer2, false);
					opts.view.renderFooter.call(opts.view, this, dc.footer1, true);
					if (opts.view.onAfterRender) {
						opts.view.onAfterRender.call(opts.view, this);
					}
					$(this).datagrid("fixRowHeight");
				}
			});
		},
		loading : function(jq) {
			return jq.each(function() {
				var opts = $.data(this, "datagrid").options;
				$(this).datagrid("getPager").pagination("loading");
				if (opts.loadMsg) {
					var panel = $(this).datagrid("getPanel");
					if (!panel.children("div.datagrid-mask").length) {
						$("<div class=\"datagrid-mask\" style=\"display:block\"></div>").appendTo(panel);
						var msg = $("<div class=\"datagrid-mask-msg\" style=\"display:block;left:50%\"></div>").html(opts.loadMsg).appendTo(panel);
						msg._outerHeight(40);
						msg.css({
							marginLeft : (-msg.outerWidth() / 2),
							lineHeight : (msg.height() + "px")
						});
					}
				}
			});
		},
		loaded : function(jq) {
			return jq.each(function() {
				$(this).datagrid("getPager").pagination("loaded");
				var panel = $(this).datagrid("getPanel");
				panel.children("div.datagrid-mask-msg").remove();
				panel.children("div.datagrid-mask").remove();
			});
		},
		fitColumns : function(jq) {
			return jq.each(function() {
				fitColumns(this);
			});
		},
		fixColumnSize : function(jq, field) {
			return jq.each(function() {
				fitColumnSize(this, field);
			});
		},
		fixRowHeight : function(jq, index) {
			return jq.each(function() {
				fixRowHeight(this, index);
			});
		},
		freezeRow : function(jq, index) {
			return jq.each(function() {
				freezeRow(this, index);
			});
		},
		autoSizeColumn : function(jq, field) {
			return jq.each(function() {
				autoSizeColumn(this, field);
			});
		},
		loadData : function(jq, data) {
			return jq.each(function() {
				loadData(this, data);
				resetOperation(this);
			});
		},
		getData : function(jq) {
			return $.data(jq[0], "datagrid").data;
		},
		getRows : function(jq) {
			return $.data(jq[0], "datagrid").data.rows;
		},
		getFooterRows : function(jq) {
			return $.data(jq[0], "datagrid").footer;
		},
		getRowIndex : function(jq, id) {
			return getRowIndex(jq[0], id);
		},
		getChecked : function(jq) {
			return getChecked(jq[0]);
		},
		getSelected : function(jq) {
			var rows = getSelections(jq[0]);
			return rows.length > 0 ? rows[0] : null;
		},
		getSelections : function(jq) {
			return getSelections(jq[0]);
		},
		clearSelections : function(jq) {
			return jq.each(function() {
				var state = $.data(this, "datagrid");
				var selectedRows = state.selectedRows;
				var checkedRows = state.checkedRows;
				selectedRows.splice(0, selectedRows.length);
				unselectAll(this);
				if (state.options.checkOnSelect) {
					checkedRows.splice(0, checkedRows.length);
				}
			});
		},
		clearChecked : function(jq) {
			return jq.each(function() {
				var state = $.data(this, "datagrid");
				var selectedRows = state.selectedRows;
				var checkedRows = state.checkedRows;
				checkedRows.splice(0, checkedRows.length);
				clearChecked(this);
				if (state.options.selectOnCheck) {
					selectedRows.splice(0, selectedRows.length);
				}
			});
		},
		scrollTo : function(jq, index) {
			return jq.each(function() {
				scrollTo(this, index);
			});
		},
		highlightRow : function(jq, index) {
			return jq.each(function() {
				highlightRow(this, index);
				scrollTo(this, index);
			});
		},
		selectAll : function(jq) {
			return jq.each(function() {
				selectAll(this);
			});
		},
		unselectAll : function(jq) {
			return jq.each(function() {
				unselectAll(this);
			});
		},
		selectRow : function(jq, index) {
			return jq.each(function() {
				selectRow(this, index);
			});
		},
		selectRecord : function(jq, id) {
			return jq.each(function() {
				var opts = $.data(this, "datagrid").options;
				if (opts.idField) {
					var row = getRowIndex(this, id);
					if (row >= 0) {
						$(this).datagrid("selectRow", row);
					}
				}
			});
		},
		unselectRow : function(jq, index) {
			return jq.each(function() {
				unselectRow(this, index);
			});
		},
		checkRow : function(jq, index) {
			return jq.each(function() {
				checkRow(this, index);
			});
		},
		uncheckRow : function(jq, index) {
			return jq.each(function() {
				uncheckRow(this, index);
			});
		},
		checkAll : function(jq) {
			return jq.each(function() {
				checkAll(this);
			});
		},
		uncheckAll : function(jq) {
			return jq.each(function() {
				clearChecked(this);
			});
		},
		beginEdit : function(jq, index) {
			return jq.each(function() {
				beginEdit(this, index);
			});
		},
		endEdit : function(jq, index) {
			return jq.each(function() {
				endEdit(this, index, false);
			});
		},
		cancelEdit : function(jq, index) {
			return jq.each(function() {
				endEdit(this, index, true);
			});
		},
		getEditors : function(jq, index) {
			return getEditors(jq[0], index);
		},
		getEditor : function(jq, options) {
			return getEditor(jq[0], options);
		},
		refreshRow : function(jq, index) {
			return jq.each(function() {
				var opts = $.data(this, "datagrid").options;
				opts.view.refreshRow.call(opts.view, this, index);
			});
		},
		validateRow : function(jq, index) {
			return validateRow(jq[0], index);
		},
		updateRow : function(jq, param) {
			return jq.each(function() {
				var opts = $.data(this, "datagrid").options;
				opts.view.updateRow.call(opts.view, this, param.index, param.row);
			});
		},
		appendRow : function(jq, row) {
			return jq.each(function() {
				appendRow(this, row);
			});
		},
		insertRow : function(jq, param) {
			return jq.each(function() {
				insertRow(this, param);
			});
		},
		deleteRow : function(jq, index) {
			return jq.each(function() {
				deleteRow(this, index);
			});
		},
		getChanges : function(jq, type) {
			return getChanges(jq[0], type);
		},
		acceptChanges : function(jq) {
			return jq.each(function() {
				acceptChanges(this);
			});
		},
		rejectChanges : function(jq) {
			return jq.each(function() {
				rejectChanges(this);
			});
		},
		mergeCells : function(jq, options) {
			return jq.each(function() {
				mergeCells(this, options);
			});
		},
		showColumn : function(jq, field) {
			return jq.each(function() {
				var panel = $(this).datagrid("getPanel");
				panel.find("td[field=\"" + field + "\"]").show();
				$(this).datagrid("getColumnOption", field).hidden = false;
				$(this).datagrid("fitColumns");
			});
		},
		hideColumn : function(jq, field) {
			return jq.each(function() {
				var panel = $(this).datagrid("getPanel");
				panel.find("td[field=\"" + field + "\"]").hide();
				$(this).datagrid("getColumnOption", field).hidden = true;
				$(this).datagrid("fitColumns");
			});
		},
		sort : function(jq, param) {
			return jq.each(function() {
				sort(this, param);
			});
		}
	};
	$.fn.datagrid.parseOptions = function(target) {
		var t = $(target);
		return $.extend({}, $.fn.panel.parseOptions(target), $.parser.parseOptions(target, [ "url", "toolbar", "idField", "sortName", "sortOrder", "pagePosition", "resizeHandle", {
			sharedStyleSheet : "boolean",
			fitColumns : "boolean",
			autoRowHeight : "boolean",
			striped : "boolean",
			nowrap : "boolean"
		}, {
			rownumbers : "boolean",
			singleSelect : "boolean",
			ctrlSelect : "boolean",
			checkOnSelect : "boolean",
			selectOnCheck : "boolean"
		}, {
			pagination : "boolean",
			pageSize : "number",
			pageNumber : "number"
		}, {
			multiSort : "boolean",
			remoteSort : "boolean",
			showHeader : "boolean",
			showFooter : "boolean"
		}, {
			scrollbarSize : "number"
		} ]), {
			pageList : (t.attr("pageList") ? eval(t.attr("pageList")) : undefined),
			loadMsg : (t.attr("loadMsg") != undefined ? t.attr("loadMsg") : undefined),
			rowStyler : (t.attr("rowStyler") ? eval(t.attr("rowStyler")) : undefined)
		});
	};
	$.fn.datagrid.parseData = function(target) {
		var t = $(target);
		var data = {
			total : 0,
			rows : []
		};
		var columnFields = t.datagrid("getColumnFields", true).concat(t.datagrid("getColumnFields", false));
		t.find("tbody tr").each(function() {
			data.total++;
			var row = {};
			$.extend(row, $.parser.parseOptions(this, [ "iconCls", "state" ]));
			for (var i = 0; i < columnFields.length; i++) {
				row[columnFields[i]] = $(this).find("td:eq(" + i + ")").html();
			}
			data.rows.push(row);
		});
		return data;
	};
	var datagridView = {
		render : function(target, container, frozen) {
			var state = $.data(target, "datagrid");
			var opts = state.options;
			var rows = state.data.rows;
			var columnField = $(target).datagrid("getColumnFields", frozen);
			if (frozen) {
				if (!(opts.rownumbers || (opts.frozenColumns && opts.frozenColumns.length))) {
					return;
				}
			}
			var tableHtml = [ "<table class=\"datagrid-btable\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tbody>" ];
			for (var i = 0; i < rows.length; i++) {
				var css = opts.rowStyler ? opts.rowStyler.call(target, i, rows[i]) : "";
				var clss = "";
				var style = "";
				if (typeof css == "string") {
					style = css;
				} else {
					if (css) {
						clss = css["class"] || "";
						style = css["style"] || "";
					}
				}
				var cls = "class=\"datagrid-row " + (i % 2 && opts.striped ? "datagrid-row-alt " : " ") + clss + "\"";
				var styleCss = style ? "style=\"" + style + "\"" : "";
				var id = state.rowIdPrefix + "-" + (frozen ? 1 : 2) + "-" + i;
				tableHtml.push("<tr id=\"" + id + "\" datagrid-row-index=\"" + i + "\" " + cls + " " + styleCss + ">");
				tableHtml.push(this.renderRow.call(this, target, columnField, frozen, i, rows[i]));
				tableHtml.push("</tr>");
			}
			tableHtml.push("</tbody></table>");
			$(container).html(tableHtml.join(""));
		},
		renderFooter : function(target, container, frozen) {
			var opts = $.data(target, "datagrid").options;
			var rows = $.data(target, "datagrid").footer || [];
			var columnFields = $(target).datagrid("getColumnFields", frozen);
			var footerHtml = [ "<table class=\"datagrid-ftable\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tbody>" ];
			for (var i = 0; i < rows.length; i++) {
				footerHtml.push("<tr class=\"datagrid-row\" datagrid-row-index=\"" + i + "\">");
				footerHtml.push(this.renderRow.call(this, target, columnFields, frozen, i, rows[i]));
				footerHtml.push("</tr>");
			}
			footerHtml.push("</tbody></table>");
			$(container).html(footerHtml.join(""));
		},
		renderRow : function(target, fields, frozen, rowIndex, rowData) {
			var opts = $.data(target, "datagrid").options;
			var cc = [];
			if (frozen && opts.rownumbers) {
				var rownumber = rowIndex + 1;
				if (opts.pagination) {
					rownumber += (opts.pageNumber - 1) * opts.pageSize;
				}
				cc.push("<td class=\"datagrid-td-rownumber\"><div class=\"datagrid-cell-rownumber\">" + rownumber + "</div></td>");
			}
			for (var i = 0; i < fields.length; i++) {
				var field = fields[i];
				var col = $(target).datagrid("getColumnOption", field);
				if (col) {
					var value = rowData[field];
					var css = col.styler ? (col.styler(value, rowData, rowIndex) || "") : "";
					var clss = "";
					var styl = "";
					if (typeof css == "string") {
						styl = css;
					} else {
						if (css) {
							clss = css["class"] || "";
							styl = css["style"] || "";
						}
					}
					var cls = clss ? "class=\"" + clss + "\"" : "";
					var style = col.hidden ? "style=\"display:none;" + styl + "\"" : (styl ? "style=\"" + styl + "\"" : "");
					cc.push("<td field=\"" + field + "\" " + cls + " " + style + ">");
					var style = "";
					if (!col.checkbox) {
						if (col.align) {
							style += "text-align:" + col.align + ";";
						}
						if (!opts.nowrap) {
							style += "white-space:normal;height:auto;";
						} else {
							if (opts.autoRowHeight) {
								style += "height:auto;";
							}
						}
					}
					cc.push("<div style=\"" + style + "\" ");
					cc.push(col.checkbox ? "class=\"datagrid-cell-check\"" : "class=\"datagrid-cell " + col.cellClass + "\"");
					cc.push(">");
					if (col.checkbox) {
						cc.push("<input type=\"checkbox\" " + (rowData.checked ? "checked=\"checked\"" : ""));
						cc.push(" name=\"" + field + "\" value=\"" + (value != undefined ? value : "") + "\">");
					} else {
						if (col.formatter) {
							cc.push(col.formatter(value, rowData, rowIndex));
						} else {
							cc.push(value);
						}
					}
					cc.push("</div>");
					cc.push("</td>");
				}
			}
			return cc.join("");
		},
		refreshRow : function(target, rowIndex) {
			this.updateRow.call(this, target, rowIndex, {});
		},
		updateRow : function(target, rowIndex, row) {
			var opts = $.data(target, "datagrid").options;
			var rows = $(target).datagrid("getRows");
			var oldCss = getCss(rowIndex);
			$.extend(rows[rowIndex], row);
			var newCss = getCss(rowIndex);
			var c = oldCss.c;
			var s = newCss.s;
			var rowCss = "datagrid-row " + (rowIndex % 2 && opts.striped ? "datagrid-row-alt " : " ") + newCss.c;
			function getCss(index) {
				var css = opts.rowStyler ? opts.rowStyler.call(target, index, rows[index]) : "";
				var cssClass = "";
				var cssStyle = "";
				if (typeof css == "string") {
					cssStyle = css;
				} else {
					if (css) {
						cssClass = css["class"] || "";
						cssStyle = css["style"] || "";
					}
				}
				return {
					c : cssClass,
					s : cssStyle
				};
			}
			;
			function initCheckField(frozen) {
				var columnFields = $(target).datagrid("getColumnFields", frozen);
				var tr = opts.finder.getTr(target, rowIndex, "body", (frozen ? 1 : 2));
				var checkField = tr.find("div.datagrid-cell-check input[type=checkbox]").is(":checked");
				tr.html(this.renderRow.call(this, target, columnFields, frozen, rowIndex, rows[rowIndex]));
				tr.attr("style", s).removeClass(c).addClass(rowCss);
				if (checkField) {
					tr.find("div.datagrid-cell-check input[type=checkbox]")._propAttr("checked", true);
				}
			}
			;
			initCheckField.call(this, true);
			initCheckField.call(this, false);
			$(target).datagrid("fixRowHeight", rowIndex);
		},
		insertRow : function(target, rowIndex, row) {
			var state = $.data(target, "datagrid");
			var opts = state.options;
			var dc = state.dc;
			var data = state.data;
			if (rowIndex == undefined || rowIndex == null) {
				rowIndex = data.rows.length;
			}
			if (rowIndex > data.rows.length) {
				rowIndex = data.rows.length;
			}
			function setRownumber(frozen) {
				var flag = frozen ? 1 : 2;
				for (var i = data.rows.length - 1; i >= rowIndex; i--) {
					var tr = opts.finder.getTr(target, i, "body", flag);
					tr.attr("datagrid-row-index", i + 1);
					tr.attr("id", state.rowIdPrefix + "-" + flag + "-" + (i + 1));
					if (frozen && opts.rownumbers) {
						var rownumber = i + 2;
						if (opts.pagination) {
							rownumber += (opts.pageNumber - 1) * opts.pageSize;
						}
						tr.find("div.datagrid-cell-rownumber").html(rownumber);
					}
					if (opts.striped) {
						tr.removeClass("datagrid-row-alt").addClass((i + 1) % 2 ? "datagrid-row-alt" : "");
					}
				}
			}
			;
			function setRowIndex(frozen) {
				var flag = frozen ? 1 : 2;
				var columnFields = $(target).datagrid("getColumnFields", frozen);
				var id = state.rowIdPrefix + "-" + flag + "-" + rowIndex;
				var tr = "<tr id=\"" + id + "\" class=\"datagrid-row\" datagrid-row-index=\"" + rowIndex + "\"></tr>";
				if (rowIndex >= data.rows.length) {
					if (data.rows.length) {
						opts.finder.getTr(target, "", "last", flag).after(tr);
					} else {
						var cc = frozen ? dc.body1 : dc.body2;
						cc.html("<table cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tbody>" + tr + "</tbody></table>");
					}
				} else {
					opts.finder.getTr(target, rowIndex + 1, "body", flag).before(tr);
				}
			}
			;
			setRownumber.call(this, true);
			setRownumber.call(this, false);
			setRowIndex.call(this, true);
			setRowIndex.call(this, false);
			data.total += 1;
			data.rows.splice(rowIndex, 0, row);
			this.refreshRow.call(this, target, rowIndex);
		},
		deleteRow : function(target, index) {
			var state = $.data(target, "datagrid");
			var opts = state.options;
			var data = state.data;
			function setRownumber(frozen) {
				var flag = frozen ? 1 : 2;
				for (var i = index + 1; i < data.rows.length; i++) {
					var tr = opts.finder.getTr(target, i, "body", flag);
					tr.attr("datagrid-row-index", i - 1);
					tr.attr("id", state.rowIdPrefix + "-" + flag + "-" + (i - 1));
					if (frozen && opts.rownumbers) {
						var rownumber = i;
						if (opts.pagination) {
							rownumber += (opts.pageNumber - 1) * opts.pageSize;
						}
						tr.find("div.datagrid-cell-rownumber").html(rownumber);
					}
					if (opts.striped) {
						tr.removeClass("datagrid-row-alt").addClass((i - 1) % 2 ? "datagrid-row-alt" : "");
					}
				}
			}
			;
			opts.finder.getTr(target, index).remove();
			setRownumber.call(this, true);
			setRownumber.call(this, false);
			data.total -= 1;
			data.rows.splice(index, 1);
		},
		onBeforeRender : function(target, rows) {
		},
		onAfterRender : function(target) {
			var opts = $.data(target, "datagrid").options;
			if (opts.showFooter) {
				var footerPanel = $(target).datagrid("getPanel").find("div.datagrid-footer");
				footerPanel.find("div.datagrid-cell-rownumber,div.datagrid-cell-check").css("visibility", "hidden");
			}
		}
	};
	$.fn.datagrid.defaults = $.extend({}, $.fn.panel.defaults, {
		sharedStyleSheet : false,
		frozenColumns : undefined,
		columns : undefined,
		fitColumns : false,
		resizeHandle : "right",
		autoRowHeight : true,
		toolbar : null,
		striped : false,
		method : "post",
		nowrap : true,
		idField : null,
		url : null,
		data : null,
		loadMsg : "Processing, please wait ...",
		rownumbers : false,
		singleSelect : false,
		ctrlSelect : false,
		selectOnCheck : true,
		checkOnSelect : true,
		pagination : false,
		pagePosition : "bottom",
		pageNumber : 1,
		pageSize : 10,
		pageList : [ 10, 20, 30, 40, 50 ],
		queryParams : {},
		sortName : null,
		sortOrder : "asc",
		multiSort : false,
		remoteSort : true,
		showHeader : true,
		showFooter : false,
		scrollbarSize : 18,
		rowEvents : {
			mouseover : rowEvent_mouse(true),
			mouseout : rowEvent_mouse(false),
			click : rowEvent_click,
			dblclick : rowEvent_dblclick,
			contextmenu : rowEvent_contextmenu
		},
		rowStyler : function(index, row) {
		},
		loader : function(data, successCallback, errorCallback) {
			var opts = $(this).datagrid("options");
			if (!opts.url) {
				return false;
			}
			$.ajax({
				type : opts.method,
				url : opts.url,
				data : data,
				dataType : "json",
				success : function(data) {
					successCallback(data);
				},
				error : function() {
					errorCallback.apply(this, arguments);
				}
			});
		},
		loadFilter : function(data) {
			if (typeof data.length == "number" && typeof data.splice == "function") {
				return {
					total : data.length,
					rows : data
				};
			} else {
				return data;
			}
		},
		editors : editors,
		finder : {
			getTr : function(target, id, type, frozen) {
				type = type || "body";
				frozen = frozen || 0;
				var state = $.data(target, "datagrid");
				var dc = state.dc;
				var opts = state.options;
				if (frozen == 0) {
					var tr1 = opts.finder.getTr(target, id, type, 1);
					var tr2 = opts.finder.getTr(target, id, type, 2);
					return tr1.add(tr2);
				} else {
					if (type == "body") {
						var tr = $("#" + state.rowIdPrefix + "-" + frozen + "-" + id);
						if (!tr.length) {
							tr = (frozen == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr[datagrid-row-index=" + id + "]");
						}
						return tr;
					} else {
						if (type == "footer") {
							return (frozen == 1 ? dc.footer1 : dc.footer2).find(">table>tbody>tr[datagrid-row-index=" + id + "]");
						} else {
							if (type == "selected") {
								return (frozen == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr.datagrid-row-selected");
							} else {
								if (type == "highlight") {
									return (frozen == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr.datagrid-row-over");
								} else {
									if (type == "checked") {
										return (frozen == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr.datagrid-row-checked");
									} else {
										if (type == "editing") {
											return (frozen == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr.datagrid-row-editing");
										} else {
											if (type == "last") {
												return (frozen == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr[datagrid-row-index]:last");
											} else {
												if (type == "allbody") {
													return (frozen == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr[datagrid-row-index]");
												} else {
													if (type == "allfooter") {
														return (frozen == 1 ? dc.footer1 : dc.footer2).find(">table>tbody>tr[datagrid-row-index]");
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			},
			getRow : function(target, p) {
				var index = (typeof p == "object") ? p.attr("datagrid-row-index") : p;
				return $.data(target, "datagrid").data.rows[parseInt(index)];
			},
			getRows : function(target) {
				return $(target).datagrid("getRows");
			}
		},
		view : datagridView,
		onBeforeLoad : function(param) {
		},
		onLoadSuccess : function() {
		},
		onLoadError : function() {
		},
		onClickRow : function(index, row) {
		},
		onDblClickRow : function(index, row) {
		},
		onClickCell : function(index, field, value) {
		},
		onDblClickCell : function(index, field, value) {
		},
		onBeforeSortColumn : function(sort, order) {
		},
		onSortColumn : function(sort, order) {
		},
		onResizeColumn : function(field, width) {
		},
		onBeforeSelect : function(index, row) {
		},
		onSelect : function(index, row) {
		},
		onBeforeUnselect : function(index, row) {
		},
		onUnselect : function(index, row) {
		},
		onSelectAll : function(rows) {
		},
		onUnselectAll : function(rows) {
		},
		onBeforeCheck : function(index, row) {
		},
		onCheck : function(index, row) {
		},
		onBeforeUncheck : function(index, row) {
		},
		onUncheck : function(index, row) {
		},
		onCheckAll : function(rows) {
		},
		onUncheckAll : function(rows) {
		},
		onBeforeEdit : function(rowIndex, rowData) {
		},
		onBeginEdit : function(rowIndex, rowData) {
		},
		onEndEdit : function(rowIndex, rowData, changes) {
		},
		onAfterEdit : function(rowIndex, rowData, changes) {
		},
		onCancelEdit : function(rowIndex, rowData) {
		},
		onHeaderContextMenu : function(e, field) {
		},
		onRowContextMenu : function(e, rowIndex, rowData) {
		}
	});
})(jQuery);
