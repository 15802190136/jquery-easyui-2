(function($) {
	function init(target) {
		var state = $.data(target, "pagination");
		var opts = state.options;
		var bb = state.bb = {};
		var tableHtml = $(target).addClass("pagination").html("<table cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tr></tr></table>");
		var tr = tableHtml.find("tr");
		var aa = $.extend([], opts.layout);
		if (!opts.showPageList) {
			removeLayout(aa, "list");
		}
		if (!opts.showRefresh) {
			removeLayout(aa, "refresh");
		}
		if (aa[0] == "sep") {
			aa.shift();
		}
		if (aa[aa.length - 1] == "sep") {
			aa.pop();
		}
		for (var j = 0; j < aa.length; j++) {
			var layoutValue = aa[j];
			if (layoutValue == "list") {
				var ps = $("<select class=\"pagination-page-list\"></select>");
				ps.bind("change", function() {
					opts.pageSize = parseInt($(this).val());
					opts.onChangePageSize.call(target, opts.pageSize);
					setSelect(target, opts.pageNumber);
				});
				for (var i = 0; i < opts.pageList.length; i++) {
					$("<option></option>").text(opts.pageList[i]).appendTo(ps);
				}
				$("<td></td>").append(ps).appendTo(tr);
			} else {
				if (layoutValue == "sep") {
					$("<td><div class=\"pagination-btn-separator\"></div></td>").appendTo(tr);
				} else {
					if (layoutValue == "first") {
						bb.first = setPagination("first");
					} else {
						if (layoutValue == "prev") {
							bb.prev = setPagination("prev");
						} else {
							if (layoutValue == "next") {
								bb.next = setPagination("next");
							} else {
								if (layoutValue == "last") {
									bb.last = setPagination("last");
								} else {
									if (layoutValue == "manual") {
										$("<span style=\"padding-left:6px;\"></span>").html(opts.beforePageText).appendTo(tr).wrap("<td></td>");
										bb.num = $("<input class=\"pagination-num\" type=\"text\" value=\"1\" size=\"2\">").appendTo(tr).wrap("<td></td>");
										bb.num.unbind(".pagination").bind("keydown.pagination", function(e) {
											if (e.keyCode == 13) {
												var pageNum = parseInt($(this).val()) || 1;
												setSelect(target, pageNum);
												return false;
											}
										});
										bb.after = $("<span style=\"padding-right:6px;\"></span>").appendTo(tr).wrap("<td></td>");
									} else {
										if (layoutValue == "refresh") {
											bb.refresh = setPagination("refresh");
										} else {
											if (layoutValue == "links") {
												$("<td class=\"pagination-links\"></td>").appendTo(tr);
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
		if (opts.buttons) {
			$("<td><div class=\"pagination-btn-separator\"></div></td>").appendTo(tr);
			if ($.isArray(opts.buttons)) {
				for (var i = 0; i < opts.buttons.length; i++) {
					var button = opts.buttons[i];
					if (button == "-") {
						$("<td><div class=\"pagination-btn-separator\"></div></td>").appendTo(tr);
					} else {
						var td = $("<td></td>").appendTo(tr);
						var a = $("<a href=\"javascript:void(0)\"></a>").appendTo(td);
						a[0].onclick = eval(button.handler || function() {
						});
						a.linkbutton($.extend({}, button, {
							plain : true
						}));
					}
				}
			} else {
				var td = $("<td></td>").appendTo(tr);
				$(opts.buttons).appendTo(td).show();
			}
		}
		$("<div class=\"pagination-info\"></div>").appendTo(tableHtml);
		$("<div style=\"clear:both;\"></div>").appendTo(tableHtml);
		function setPagination(indexPage) {
			var linkbutton = opts.nav[indexPage];
			var a = $("<a href=\"javascript:void(0)\"></a>").appendTo(tr);
			a.wrap("<td></td>");
			a.linkbutton({
				iconCls : linkbutton.iconCls,
				plain : true
			}).unbind(".pagination").bind("click.pagination", function() {
				linkbutton.handler.call(target);
			});
			return a;
		}
		;
		function removeLayout(aa, layout) {
			var index = $.inArray(layout, aa);
			if (index >= 0) {
				aa.splice(index, 1);
			}
			return aa;
		}
		;
	}
	;
	function setSelect(target, pageNumber) {
		var opts = $.data(target, "pagination").options;
		setRefresh(target, {
			pageNumber : pageNumber
		});
		opts.onSelectPage.call(target, opts.pageNumber, opts.pageSize);
	}
	;
	function setRefresh(target, options) {
		var state = $.data(target, "pagination");
		var opts = state.options;
		var bb = state.bb;
		$.extend(opts, options || {});
		var ps = $(target).find("select.pagination-page-list");
		if (ps.length) {
			ps.val(opts.pageSize + "");
			opts.pageSize = parseInt(ps.val());
		}
		var pageCount = Math.ceil(opts.total / opts.pageSize) || 1;
		if (opts.pageNumber < 1) {
			opts.pageNumber = 1;
		}
		if (opts.pageNumber > pageCount) {
			opts.pageNumber = pageCount;
		}
		if (opts.total == 0) {
			opts.pageNumber = 0;
			pageCount = 0;
		}
		if (bb.num) {
			bb.num.val(opts.pageNumber);
		}
		if (bb.after) {
			bb.after.html(opts.afterPageText.replace(/{pages}/, pageCount));
		}
		var td = $(target).find("td.pagination-links");
		if (td.length) {
			td.empty();
			var pageNumber = opts.pageNumber - Math.floor(opts.links / 2);
			if (pageNumber < 1) {
				pageNumber = 1;
			}
			var layoutPageCount = pageNumber + opts.links - 1;
			if (layoutPageCount > pageCount) {
				layoutPageCount = pageCount;
			}
			pageNumber = layoutPageCount - opts.links + 1;
			if (pageNumber < 1) {
				pageNumber = 1;
			}
			for (var i = pageNumber; i <= layoutPageCount; i++) {
				var a = $("<a class=\"pagination-link\" href=\"javascript:void(0)\"></a>").appendTo(td);
				a.linkbutton({
					plain : true,
					text : i
				});
				if (i == opts.pageNumber) {
					a.linkbutton("select");
				} else {
					a.unbind(".pagination").bind("click.pagination", {
						pageNumber : i
					}, function(e) {
						setSelect(target, e.data.pageNumber);
					});
				}
			}
		}
		var displayMsg = opts.displayMsg;
		displayMsg = displayMsg.replace(/{from}/, opts.total == 0 ? 0 : opts.pageSize * (opts.pageNumber - 1) + 1);
		displayMsg = displayMsg.replace(/{to}/, Math.min(opts.pageSize * (opts.pageNumber), opts.total));
		displayMsg = displayMsg.replace(/{total}/, opts.total);
		$(target).find("div.pagination-info").html(displayMsg);
		if (bb.first) {
			bb.first.linkbutton({
				disabled : ((!opts.total) || opts.pageNumber == 1)
			});
		}
		if (bb.prev) {
			bb.prev.linkbutton({
				disabled : ((!opts.total) || opts.pageNumber == 1)
			});
		}
		if (bb.next) {
			bb.next.linkbutton({
				disabled : (opts.pageNumber == pageCount)
			});
		}
		if (bb.last) {
			bb.last.linkbutton({
				disabled : (opts.pageNumber == pageCount)
			});
		}
		setLoadStatus(target, opts.loading);
	}
	;
	function setLoadStatus(target, loading) {
		var state = $.data(target, "pagination");
		var opts = state.options;
		opts.loading = loading;
		if (opts.showRefresh && state.bb.refresh) {
			state.bb.refresh.linkbutton({
				iconCls : (opts.loading ? "pagination-loading" : "pagination-load")
			});
		}
	}
	;
	$.fn.pagination = function(options, param) {
		if (typeof options == "string") {
			return $.fn.pagination.methods[options](this, param);
		}
		options = options || {};
		return this.each(function() {
			var opts;
			var state = $.data(this, "pagination");
			if (state) {
				opts = $.extend(state.options, options);
			} else {
				opts = $.extend({}, $.fn.pagination.defaults, $.fn.pagination.parseOptions(this), options);
				$.data(this, "pagination", {
					options : opts
				});
			}
			init(this);
			setRefresh(this);
		});
	};
	$.fn.pagination.methods = {
		options : function(jq) {
			return $.data(jq[0], "pagination").options;
		},
		loading : function(jq) {
			return jq.each(function() {
				setLoadStatus(this, true);
			});
		},
		loaded : function(jq) {
			return jq.each(function() {
				setLoadStatus(this, false);
			});
		},
		refresh : function(jq, options) {
			return jq.each(function() {
				setRefresh(this, options);
			});
		},
		select : function(jq, page) {
			return jq.each(function() {
				setSelect(this, page);
			});
		}
	};
	$.fn.pagination.parseOptions = function(target) {
		var t = $(target);
		return $.extend({}, $.parser.parseOptions(target, [ {
			total : "number",
			pageSize : "number",
			pageNumber : "number",
			links : "number"
		}, {
			loading : "boolean",
			showPageList : "boolean",
			showRefresh : "boolean"
		} ]), {
			pageList : (t.attr("pageList") ? eval(t.attr("pageList")) : undefined)
		});
	};
	$.fn.pagination.defaults = {
		total : 1,
		pageSize : 10,
		pageNumber : 1,
		pageList : [ 10, 20, 30, 50 ],
		loading : false,
		buttons : null,
		showPageList : true,
		showRefresh : true,
		links : 10,
		layout : [ "list", "sep", "first", "prev", "sep", "manual", "sep", "next", "last", "sep", "refresh" ],
		onSelectPage : function(pageNumber, pageSize) {
		},
		onBeforeRefresh : function(pageNumber, pageSize) {
		},
		onRefresh : function(pageNumber, pageSize) {
		},
		onChangePageSize : function(pageSize) {
		},
		beforePageText : "Page",
		afterPageText : "of {pages}",
		displayMsg : "Displaying {from} to {to} of {total} items",
		nav : {
			first : {
				iconCls : "pagination-first",
				handler : function() {
					var opts = $(this).pagination("options");
					if (opts.pageNumber > 1) {
						$(this).pagination("select", 1);
					}
				}
			},
			prev : {
				iconCls : "pagination-prev",
				handler : function() {
					var opts = $(this).pagination("options");
					if (opts.pageNumber > 1) {
						$(this).pagination("select", opts.pageNumber - 1);
					}
				}
			},
			next : {
				iconCls : "pagination-next",
				handler : function() {
					var opts = $(this).pagination("options");
					var totalNumber = Math.ceil(opts.total / opts.pageSize);
					if (opts.pageNumber < totalNumber) {
						$(this).pagination("select", opts.pageNumber + 1);
					}
				}
			},
			last : {
				iconCls : "pagination-last",
				handler : function() {
					var opts = $(this).pagination("options");
					var totalNumber = Math.ceil(opts.total / opts.pageSize);
					if (opts.pageNumber < totalNumber) {
						$(this).pagination("select", totalNumber);
					}
				}
			},
			refresh : {
				iconCls : "pagination-refresh",
				handler : function() {
					var opts = $(this).pagination("options");
					if (opts.onBeforeRefresh.call(this, opts.pageNumber, opts.pageSize) != false) {
						$(this).pagination("select", opts.pageNumber);
						opts.onRefresh.call(this, opts.pageNumber, opts.pageSize);
					}
				}
			}
		}
	};
})(jQuery);
