(function($) {
	function initTreeGrid(target) {
		var state = $.data(target, "treegrid");
		var opts = state.options;
		$(target).datagrid($.extend({}, opts, {
			url : null,
			data : null,
			loader : function() {
				return false;
			},
			onBeforeLoad : function() {
				return false;
			},
			onLoadSuccess : function() {
			},
			onResizeColumn : function(field, width) {
				fixRowHeight(target);
				opts.onResizeColumn.call(target, field, width);
			},
			onBeforeSortColumn : function(sortName, sortOrder) {
				if (opts.onBeforeSortColumn.call(target, sortName, sortOrder) == false) {
					return false;
				}
			},
			onSortColumn : function(sortName, sortOrder) {
				opts.sortName = sortName;
				opts.sortOrder = sortOrder;
				if (opts.remoteSort) {
					reload(target);
				} else {
					var data = $(target).treegrid("getData");
					loadData(target, 0, data);
				}
				opts.onSortColumn.call(target, sortName, sortOrder);
			},
			onBeforeEdit : function(rowIndex, rowData) {
				if (opts.onBeforeEdit.call(target, rowData) == false) {
					return false;
				}
			},
			onAfterEdit : function(rowIndex, rowData, changes) {
				opts.onAfterEdit.call(target, rowData, changes);
			},
			onCancelEdit : function(rowIndex, row) {
				opts.onCancelEdit.call(target, row);
			},
			onBeforeSelect : function(id) {
				if (opts.onBeforeSelect.call(target, findTreeNode(target, id)) == false) {
					return false;
				}
			},
			onSelect : function(id) {
				opts.onSelect.call(target, findTreeNode(target, id));
			},
			onBeforeUnselect : function(id) {
				if (opts.onBeforeUnselect.call(target, findTreeNode(target, id)) == false) {
					return false;
				}
			},
			onUnselect : function(id) {
				opts.onUnselect.call(target, findTreeNode(target, id));
			},
			onBeforeCheck : function(id) {
				if (opts.onBeforeCheck.call(target, findTreeNode(target, id)) == false) {
					return false;
				}
			},
			onCheck : function(row) {
				opts.onCheck.call(target, findTreeNode(target, row));
			},
			onBeforeUncheck : function(id) {
				if (opts.onBeforeUncheck.call(target, findTreeNode(target, id)) == false) {
					return false;
				}
			},
			onUncheck : function(row) {
				opts.onUncheck.call(target, findTreeNode(target, row));
			},
			onClickRow : function(row) {
				opts.onClickRow.call(target, findTreeNode(target, row));
			},
			onDblClickRow : function(row) {
				opts.onDblClickRow.call(target, findTreeNode(target, row));
			},
			onClickCell : function(field, row) {
				opts.onClickCell.call(target, row, findTreeNode(target, field));
			},
			onDblClickCell : function(field, row) {
				opts.onDblClickCell.call(target, row, findTreeNode(target, field));
			},
			onRowContextMenu : function(e, row) {
				opts.onContextMenu.call(target, e, findTreeNode(target, row));
			}
		}));
		if (!opts.columns) {
			var datagridOpts = $.data(target, "datagrid").options;
			opts.columns = datagridOpts.columns;
			opts.frozenColumns = datagridOpts.frozenColumns;
		}
		state.dc = $.data(target, "datagrid").dc;
		if (opts.pagination) {
			var pager = $(target).datagrid("getPager");
			pager.pagination({
				pageNumber : opts.pageNumber,
				pageSize : opts.pageSize,
				pageList : opts.pageList,
				onSelectPage : function(pageNumber, pageSize) {
					opts.pageNumber = pageNumber;
					opts.pageSize = pageSize;
					reload(target);
				}
			});
			opts.pageSize = pager.pagination("options").pageSize;
		}
	}
	;
	function fixRowHeight(target, id) {
		var options = $.data(target, "datagrid").options;
		var dc = $.data(target, "datagrid").dc;
		if (!dc.body1.is(":empty") && (!options.nowrap || options.autoRowHeight)) {
			if (id != undefined) {
				var children = getChildren(target, id);
				for (var i = 0; i < children.length; i++) {
					setHeight(children[i][options.idField]);
				}
			}
		}
		$(target).datagrid("fixRowHeight", id);
		function setHeight(nodeId) {
			var tr1 = options.finder.getTr(target, nodeId, "body", 1);
			var tr2 = options.finder.getTr(target, nodeId, "body", 2);
			tr1.css("height", "");
			tr2.css("height", "");
			var height = Math.max(tr1.height(), tr2.height());
			tr1.css("height", height);
			tr2.css("height", height);
		}
		;
	}
	;
	function setRowNumber(target) {
		var dc = $.data(target, "datagrid").dc;
		var fields = $.data(target, "treegrid").options;
		if (!fields.rownumbers) {
			return;
		}
		dc.body1.find("div.datagrid-cell-rownumber").each(function(i) {
			$(this).html(i + 1);
		});
	}
	;
	function initTreeEvents(target) {
		return function(e) {
			$.fn.datagrid.defaults.rowEvents[target ? "mouseover" : "mouseout"](e);
			var tt = $(e.target);
			var fn = target ? "addClass" : "removeClass";
			if (tt.hasClass("tree-hit")) {
				tt.hasClass("tree-expanded") ? tt[fn]("tree-expanded-hover") : tt[fn]("tree-collapsed-hover");
			}
		};
	}
	;
	function body(e) {
		var tt = $(e.target);
		if (tt.hasClass("tree-hit")) {
			var tr = tt.closest("tr.datagrid-row");
			var opts = tr.closest("div.datagrid-view").children(".datagrid-f")[0];
			toggle(opts, tr.attr("node-id"));
		} else {
			$.fn.datagrid.defaults.rowEvents.click(e);
		}
	}
	;
	function initSubTree(target, nodeId) {
		var opts = $.data(target, "treegrid").options;
		var tr1 = opts.finder.getTr(target, nodeId, "body", 1);
		var tr2 = opts.finder.getTr(target, nodeId, "body", 2);
		var colspan1 = $(target).datagrid("getColumnFields", true).length + (opts.rownumbers ? 1 : 0);
		var colspan2 = $(target).datagrid("getColumnFields", false).length;
		createSubTree(tr1, colspan1);
		createSubTree(tr2, colspan2);
		function createSubTree(tr, colspan) {
			$("<tr class=\"treegrid-tr-tree\">" + "<td style=\"border:0px\" colspan=\"" + colspan + "\">" + "<div></div>" + "</td>" + "</tr>").insertAfter(tr);
		}
		;
	}
	;
	function loadData(target, nodeId, param, isAppend) {
		var state = $.data(target, "treegrid");
		var opts = state.options;
		var dc = state.dc;
		param = opts.loadFilter.call(target, param, nodeId);
		var row = findTreeNode(target, nodeId);
		if (row) {
			var tr1 = opts.finder.getTr(target, nodeId, "body", 1);
			var tr2 = opts.finder.getTr(target, nodeId, "body", 2);
			var cc1 = tr1.next("tr.treegrid-tr-tree").children("td").children("div");
			var cc2 = tr2.next("tr.treegrid-tr-tree").children("td").children("div");
			if (!isAppend) {
				row.children = [];
			}
		} else {
			var cc1 = dc.body1;
			var cc2 = dc.body2;
			if (!isAppend) {
				state.data = [];
			}
		}
		if (!isAppend) {
			cc1.empty();
			cc2.empty();
		}
		if (opts.view.onBeforeRender) {
			opts.view.onBeforeRender.call(opts.view, target, nodeId, param);
		}
		opts.view.render.call(opts.view, target, cc1, true);
		opts.view.render.call(opts.view, target, cc2, false);
		if (opts.showFooter) {
			opts.view.renderFooter.call(opts.view, target, dc.footer1, true);
			opts.view.renderFooter.call(opts.view, target, dc.footer2, false);
		}
		if (opts.view.onAfterRender) {
			opts.view.onAfterRender.call(opts.view, target);
		}
		if (!nodeId && opts.pagination) {
			var total = $.data(target, "treegrid").total;
			var pager = $(target).datagrid("getPager");
			if (pager.pagination("options").total != total) {
				pager.pagination({
					total : total
				});
			}
		}
		fixRowHeight(target);
		setRowNumber(target);
		$(target).treegrid("showLines");
		$(target).treegrid("setSelectionState");
		$(target).treegrid("autoSizeColumn");
		opts.onLoadSuccess.call(target, row, param);
	}
	;
	function reload(target, nodeId, param, isAppend, callBack) {
		var opts = $.data(target, "treegrid").options;
		var dbody = $(target).datagrid("getPanel").find("div.datagrid-body");
		if (param) {
			opts.queryParams = param;
		}
		var queryParams = $.extend({}, opts.queryParams);
		if (opts.pagination) {
			$.extend(queryParams, {
				page : opts.pageNumber,
				rows : opts.pageSize
			});
		}
		if (opts.sortName) {
			$.extend(queryParams, {
				sort : opts.sortName,
				order : opts.sortOrder
			});
		}
		var row = findTreeNode(target, nodeId);
		if (opts.onBeforeLoad.call(target, row, queryParams) == false) {
			return;
		}
		var folder = dbody.find("tr[node-id=\"" + nodeId + "\"] span.tree-folder");
		folder.addClass("tree-loading");
		$(target).treegrid("loading");
		var result = opts.loader.call(target, queryParams, function(data) {
			folder.removeClass("tree-loading");
			$(target).treegrid("loaded");
			loadData(target, nodeId, data, isAppend);
			if (callBack) {
				callBack();
			}
		}, function() {
			folder.removeClass("tree-loading");
			$(target).treegrid("loaded");
			opts.onLoadError.apply(target, arguments);
			if (callBack) {
				callBack();
			}
		});
		if (result == false) {
			folder.removeClass("tree-loading");
			$(target).treegrid("loaded");
		}
	}
	;
	function getRoot(target) {
		var roots = getRoots(target);
		if (roots.length) {
			return roots[0];
		} else {
			return null;
		}
	}
	;
	function getRoots(target) {
		return $.data(target, "treegrid").data;
	}
	;
	function getParent(target, nodeId) {
		var row = findTreeNode(target, nodeId);
		if (row._parentId) {
			return findTreeNode(target, row._parentId);
		} else {
			return null;
		}
	}
	;
	function getChildren(target, nodeId) {
		var opts = $.data(target, "treegrid").options;
		var dbody = $(target).datagrid("getPanel").find("div.datagrid-view2 div.datagrid-body");
		var children = [];
		if (nodeId) {
			findChildren(nodeId);
		} else {
			var roots = getRoots(target);
			for (var i = 0; i < roots.length; i++) {
				children.push(roots[i]);
				findChildren(roots[i][opts.idField]);
			}
		}
		function findChildren(nodeId) {
			var node = findTreeNode(target, nodeId);
			if (node && node.children) {
				for (var i = 0, len = node.children.length; i < len; i++) {
					var child = node.children[i];
					children.push(child);
					findChildren(child[opts.idField]);
				}
			}
		}
		;
		return children;
	}
	;
	function getLevel(target, nodeId) {
		if (!nodeId) {
			return 0;
		}
		var opts = $.data(target, "treegrid").options;
		var gridView = $(target).datagrid("getPanel").children("div.datagrid-view");
		var treeNode = gridView.find("div.datagrid-body tr[node-id=\"" + nodeId + "\"]").children("td[field=\"" + opts.treeField + "\"]");
		return treeNode.find("span.tree-indent,span.tree-hit").length;
	}
	;
	function findTreeNode(target, id) {
		var opts = $.data(target, "treegrid").options;
		var data = $.data(target, "treegrid").data;
		var cc = [ data ];
		while (cc.length) {
			var c = cc.shift();
			for (var i = 0; i < c.length; i++) {
				var treeData = c[i];
				if (treeData[opts.idField] == id) {
					return treeData;
				} else {
					if (treeData["children"]) {
						cc.push(treeData["children"]);
					}
				}
			}
		}
		return null;
	}
	;
	function collapse(target, id) {
		var opts = $.data(target, "treegrid").options;
		var row = findTreeNode(target, id);
		var tr = opts.finder.getTr(target, id);
		var hit = tr.find("span.tree-hit");
		if (hit.length == 0) {
			return;
		}
		if (hit.hasClass("tree-collapsed")) {
			return;
		}
		if (opts.onBeforeCollapse.call(target, row) == false) {
			return;
		}
		hit.removeClass("tree-expanded tree-expanded-hover").addClass("tree-collapsed");
		hit.next().removeClass("tree-folder-open");
		row.state = "closed";
		tr = tr.next("tr.treegrid-tr-tree");
		var cc = tr.children("td").children("div");
		if (opts.animate) {
			cc.slideUp("normal", function() {
				$(target).treegrid("autoSizeColumn");
				fixRowHeight(target, id);
				opts.onCollapse.call(target, row);
			});
		} else {
			cc.hide();
			$(target).treegrid("autoSizeColumn");
			fixRowHeight(target, id);
			opts.onCollapse.call(target, row);
		}
	}
	;
	function expand(target, id) {
		var opts = $.data(target, "treegrid").options;
		var tr = opts.finder.getTr(target, id);
		var hit = tr.find("span.tree-hit");
		var row = findTreeNode(target, id);
		if (hit.length == 0) {
			return;
		}
		if (hit.hasClass("tree-expanded")) {
			return;
		}
		if (opts.onBeforeExpand.call(target, row) == false) {
			return;
		}
		hit.removeClass("tree-collapsed tree-collapsed-hover").addClass("tree-expanded");
		hit.next().addClass("tree-folder-open");
		var subtree = tr.next("tr.treegrid-tr-tree");
		if (subtree.length) {
			var cc = subtree.children("td").children("div");
			expandSubtree(cc);
		} else {
			initSubTree(target, row[opts.idField]);
			var subtree = tr.next("tr.treegrid-tr-tree");
			var cc = subtree.children("td").children("div");
			cc.hide();
			var queryParams = $.extend({}, opts.queryParams || {});
			queryParams.id = row[opts.idField];
			reload(target, row[opts.idField], queryParams, true, function() {
				if (cc.is(":empty")) {
					subtree.remove();
				} else {
					expandSubtree(cc);
				}
			});
		}
		function expandSubtree(cc) {
			row.state = "open";
			if (opts.animate) {
				cc.slideDown("normal", function() {
					$(target).treegrid("autoSizeColumn");
					fixRowHeight(target, id);
					opts.onExpand.call(target, row);
				});
			} else {
				cc.show();
				$(target).treegrid("autoSizeColumn");
				fixRowHeight(target, id);
				opts.onExpand.call(target, row);
			}
		}
		;
	}
	;
	function toggle(target, id) {
		var opts = $.data(target, "treegrid").options;
		var tr = opts.finder.getTr(target, id);
		var hit = tr.find("span.tree-hit");
		if (hit.hasClass("tree-expanded")) {
			collapse(target, id);
		} else {
			expand(target, id);
		}
	}
	;
	function collapseAll(target, id) {
		var opts = $.data(target, "treegrid").options;
		var child = getChildren(target, id);
		if (id) {
			child.unshift(findTreeNode(target, id));
		}
		for (var i = 0; i < child.length; i++) {
			collapse(target, child[i][opts.idField]);
		}
	}
	;
	function expandAll(target, id) {
		var opts = $.data(target, "treegrid").options;
		var child = getChildren(target, id);
		if (id) {
			child.unshift(findTreeNode(target, id));
		}
		for (var i = 0; i < child.length; i++) {
			expand(target, child[i][opts.idField]);
		}
	}
	;
	function expandTo(target, id) {
		var opts = $.data(target, "treegrid").options;
		var ids = [];
		var p = getParent(target, id);
		while (p) {
			var id = p[opts.idField];
			ids.unshift(id);
			p = getParent(target, id);
		}
		for (var i = 0; i < ids.length; i++) {
			expand(target, ids[i]);
		}
	}
	;
	function append(target, param) {
		var opts = $.data(target, "treegrid").options;
		if (param.parent) {
			var tr = opts.finder.getTr(target, param.parent);
			if (tr.next("tr.treegrid-tr-tree").length == 0) {
				initSubTree(target, param.parent);
			}
			var treecell = tr.children("td[field=\"" + opts.treeField + "\"]").children("div.datagrid-cell");
			var treeicon = treecell.children("span.tree-icon");
			if (treeicon.hasClass("tree-file")) {
				treeicon.removeClass("tree-file").addClass("tree-folder tree-folder-open");
				var hit = $("<span class=\"tree-hit tree-expanded\"></span>").insertBefore(treeicon);
				if (hit.prev().length) {
					hit.prev().remove();
				}
			}
		}
		loadData(target, param.parent, param.data, true);
	}
	;
	function insert(target, param) {
		var ref = param.before || param.after;
		var opts = $.data(target, "treegrid").options;
		var parent = getParent(target, ref);
		append(target, {
			parent : (parent ? parent[opts.idField] : null),
			data : [ param.data ]
		});
		var treeNode = parent ? parent.children : $(target).treegrid("getRoots");
		for (var i = 0; i < treeNode.length; i++) {
			if (treeNode[i][opts.idField] == ref) {
				var lastNode = treeNode[treeNode.length - 1];
				treeNode.splice(param.before ? i : (i + 1), 0, lastNode);
				treeNode.splice(treeNode.length - 1, 1);
				break;
			}
		}
		insertSubTree(true);
		insertSubTree(false);
		setRowNumber(target);
		$(target).treegrid("showLines");
		function insertSubTree(frozen) {
			var temp = frozen ? 1 : 2;
			var tr = opts.finder.getTr(target, param.data[opts.idField], "body", temp);
			var gridtable = tr.closest("table.datagrid-btable");
			tr = tr.parent().children();
			var tr1 = opts.finder.getTr(target, ref, "body", temp);
			if (param.before) {
				tr.insertBefore(tr1);
			} else {
				var sub = tr1.next("tr.treegrid-tr-tree");
				tr.insertAfter(sub.length ? sub : tr1);
			}
			gridtable.remove();
		}
		;
	}
	;
	function remove(target, id) {
		var state = $.data(target, "treegrid");
		$(target).datagrid("deleteRow", id);
		setRowNumber(target);
		state.total -= 1;
		$(target).datagrid("getPager").pagination("refresh", {
			total : state.total
		});
		$(target).treegrid("showLines");
	}
	;
	function showLines(target) {
		var t = $(target);
		var opts = t.treegrid("options");
		if (opts.lines) {
			t.treegrid("getPanel").addClass("tree-lines");
		} else {
			t.treegrid("getPanel").removeClass("tree-lines");
			return;
		}
		t.treegrid("getPanel").find("span.tree-indent").removeClass("tree-line tree-join tree-joinbottom");
		t.treegrid("getPanel").find("div.datagrid-cell").removeClass("tree-node-last tree-root-first tree-root-one");
		var roots = t.treegrid("getRoots");
		if (roots.length > 1) {
			getCell(roots[0]).addClass("tree-root-first");
		} else {
			if (roots.length == 1) {
				getCell(roots[0]).addClass("tree-root-one");
			}
		}
		setTreeJoinClass(roots);
		setTreeLine(roots);
		function setTreeJoinClass(roots) {
			$.map(roots, function(root) {
				if (root.children && root.children.length) {
					setTreeJoinClass(root.children);
				} else {
					var cell = getCell(root);
					cell.find(".tree-icon").prev().addClass("tree-join");
				}
			});
			if (roots.length) {
				var cell1 = getCell(roots[roots.length - 1]);
				cell1.addClass("tree-node-last");
				cell1.find(".tree-join").removeClass("tree-join").addClass("tree-joinbottom");
			}
		}
		;
		function setTreeLine(roots) {
			$.map(roots, function(root) {
				if (root.children && root.children.length) {
					setTreeLine(root.children);
				}
			});
			for (var i = 0; i < roots.length - 1; i++) {
				var node = roots[i];
				var level = t.treegrid("getLevel", node[opts.idField]);
				var tr = opts.finder.getTr(target, node[opts.idField]);
				var cc = tr.next().find("tr.datagrid-row td[field=\"" + opts.treeField + "\"] div.datagrid-cell");
				cc.find("span:eq(" + (level - 1) + ")").addClass("tree-line");
			}
		}
		;
		function getCell(roots) {
			var tr = opts.finder.getTr(target, roots[opts.idField]);
			var cell = tr.find("td[field=\"" + opts.treeField + "\"] div.datagrid-cell");
			return cell;
		}
		;
	}
	;
	$.fn.treegrid = function(options, param) {
		if (typeof options == "string") {
			var method = $.fn.treegrid.methods[options];
			if (method) {
				return method(this, param);
			} else {
				return this.datagrid(options, param);
			}
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "treegrid");
			if (state) {
				$.extend(state.options, options);
			} else {
				state = $.data(this, "treegrid", {
					options : $.extend({}, $.fn.treegrid.defaults, $.fn.treegrid.parseOptions(this), options),
					data : []
				});
			}
			initTreeGrid(this);
			if (state.options.data) {
				$(this).treegrid("loadData", state.options.data);
			}
			reload(this);
		});
	};
	$.fn.treegrid.methods = {
		options : function(jq) {
			return $.data(jq[0], "treegrid").options;
		},
		resize : function(jq, options) {
			return jq.each(function() {
				$(this).datagrid("resize", options);
			});
		},
		fixRowHeight : function(jq, id) {
			return jq.each(function() {
				fixRowHeight(this, id);
			});
		},
		loadData : function(jq, data) {
			return jq.each(function() {
				loadData(this, data.parent, data);
			});
		},
		load : function(jq, param) {
			return jq.each(function() {
				$(this).treegrid("options").pageNumber = 1;
				$(this).treegrid("getPager").pagination({
					pageNumber : 1
				});
				$(this).treegrid("reload", param);
			});
		},
		reload : function(jq, id) {
			return jq.each(function() {
				var target = $(this).treegrid("options");
				var queryParams = {};
				if (typeof id == "object") {
					queryParams = id;
				} else {
					queryParams = $.extend({}, target.queryParams);
					queryParams.id = id;
				}
				if (queryParams.id) {
					var target = $(this).treegrid("find", queryParams.id);
					if (target.children) {
						target.children.splice(0, target.children.length);
					}
					target.queryParams = queryParams;
					var tr = target.finder.getTr(this, queryParams.id);
					tr.next("tr.treegrid-tr-tree").remove();
					tr.find("span.tree-hit").removeClass("tree-expanded tree-expanded-hover").addClass("tree-collapsed");
					expand(this, queryParams.id);
				} else {
					reload(this, null, queryParams);
				}
			});
		},
		reloadFooter : function(jq, id) {
			return jq.each(function() {
				var target = $.data(this, "treegrid").options;
				var dc = $.data(this, "datagrid").dc;
				if (id) {
					$.data(this, "treegrid").footer = id;
				}
				if (target.showFooter) {
					target.view.renderFooter.call(target.view, this, dc.footer1, true);
					target.view.renderFooter.call(target.view, this, dc.footer2, false);
					if (target.view.onAfterRender) {
						target.view.onAfterRender.call(target.view, this);
					}
					$(this).treegrid("fixRowHeight");
				}
			});
		},
		getData : function(jq) {
			return $.data(jq[0], "treegrid").data;
		},
		getFooterRows : function(jq) {
			return $.data(jq[0], "treegrid").footer;
		},
		getRoot : function(jq) {
			return getRoot(jq[0]);
		},
		getRoots : function(jq) {
			return getRoots(jq[0]);
		},
		getParent : function(jq, id) {
			return getParent(jq[0], id);
		},
		getChildren : function(jq, id) {
			return getChildren(jq[0], id);
		},
		getLevel : function(jq, id) {
			return getLevel(jq[0], id);
		},
		find : function(jq, id) {
			return findTreeNode(jq[0], id);
		},
		isLeaf : function(jq, id) {
			var opts = $.data(jq[0], "treegrid").options;
			var tr = opts.finder.getTr(jq[0], id);
			var hit = tr.find("span.tree-hit");
			return hit.length == 0;
		},
		select : function(jq, id) {
			return jq.each(function() {
				$(this).datagrid("selectRow", id);
			});
		},
		unselect : function(jq, id) {
			return jq.each(function() {
				$(this).datagrid("unselectRow", id);
			});
		},
		collapse : function(jq, id) {
			return jq.each(function() {
				collapse(this, id);
			});
		},
		expand : function(jq, id) {
			return jq.each(function() {
				expand(this, id);
			});
		},
		toggle : function(jq, id) {
			return jq.each(function() {
				toggle(this, id);
			});
		},
		collapseAll : function(jq, id) {
			return jq.each(function() {
				collapseAll(this, id);
			});
		},
		expandAll : function(jq, id) {
			return jq.each(function() {
				expandAll(this, id);
			});
		},
		expandTo : function(jq, id) {
			return jq.each(function() {
				expandTo(this, id);
			});
		},
		append : function(jq, param) {
			return jq.each(function() {
				append(this, param);
			});
		},
		insert : function(jq, param) {
			return jq.each(function() {
				insert(this, param);
			});
		},
		remove : function(jq, id) {
			return jq.each(function() {
				remove(this, id);
			});
		},
		pop : function(jq, id) {
			var row = jq.treegrid("find", id);
			jq.treegrid("remove", id);
			return row;
		},
		refresh : function(jq, id) {
			return jq.each(function() {
				var opts = $.data(this, "treegrid").options;
				opts.view.refreshRow.call(opts.view, this, id);
			});
		},
		update : function(jq, param) {
			return jq.each(function() {
				var opts = $.data(this, "treegrid").options;
				opts.view.updateRow.call(opts.view, this, param.id, param.row);
			});
		},
		beginEdit : function(jq, id) {
			return jq.each(function() {
				$(this).datagrid("beginEdit", id);
				$(this).treegrid("fixRowHeight", id);
			});
		},
		endEdit : function(jq, id) {
			return jq.each(function() {
				$(this).datagrid("endEdit", id);
			});
		},
		cancelEdit : function(jq, id) {
			return jq.each(function() {
				$(this).datagrid("cancelEdit", id);
			});
		},
		showLines : function(jq) {
			return jq.each(function() {
				showLines(this);
			});
		}
	};
	$.fn.treegrid.parseOptions = function(target) {
		return $.extend({}, $.fn.datagrid.parseOptions(target), $.parser.parseOptions(target, [ "treeField", {
			animate : "boolean"
		} ]));
	};
	var view = $.extend({}, $.fn.datagrid.defaults.view, {
		render : function(target, container, frozen) {
			var state = $.data(target, "treegrid").options;
			var columnFields = $(target).datagrid("getColumnFields", frozen);
			var rowIdPrefix = $.data(target, "datagrid").rowIdPrefix;
			if (frozen) {
				if (!(state.rownumbers || (state.frozenColumns && state.frozenColumns.length))) {
					return;
				}
			}
			var grid = this;
			if (this.treeNodes && this.treeNodes.length) {
				var treeNodes = buildTreeNodes(frozen, this.treeLevel, this.treeNodes);
				$(container).append(treeNodes.join(""));
			}
			function buildTreeNodes(frozen, treeLevel, treeNodes) {
				var parentNodes = $(target).treegrid("getParent", treeNodes[0][state.idField]);
				var length = (parentNodes ? parentNodes.children.length : $(target).treegrid("getRoots").length) - treeNodes.length;
				var gridtable = [ "<table class=\"datagrid-btable\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tbody>" ];
				for (var i = 0; i < treeNodes.length; i++) {
					var row = treeNodes[i];
					if (row.state != "open" && row.state != "closed") {
						row.state = "open";
					}
					var css = state.rowStyler ? state.rowStyler.call(target, row) : "";
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
					var cls = "class=\"datagrid-row " + (length++ % 2 && state.striped ? "datagrid-row-alt " : " ") + clss + "\"";
					var stylAttr = styl ? "style=\"" + styl + "\"" : "";
					var id = rowIdPrefix + "-" + (frozen ? 1 : 2) + "-" + row[state.idField];
					gridtable.push("<tr id=\"" + id + "\" node-id=\"" + row[state.idField] + "\" " + cls + " " + stylAttr + ">");
					gridtable = gridtable.concat(grid.renderRow.call(grid, target, columnFields, frozen, treeLevel, row));
					gridtable.push("</tr>");
					if (row.children && row.children.length) {
						var tt = buildTreeNodes(frozen, treeLevel + 1, row.children);
						var v = row.state == "closed" ? "none" : "block";
						gridtable.push("<tr class=\"treegrid-tr-tree\"><td style=\"border:0px\" colspan=" + (columnFields.length + (state.rownumbers ? 1 : 0)) + "><div style=\"display:" + v + "\">");
						gridtable = gridtable.concat(tt);
						gridtable.push("</div></td></tr>");
					}
				}
				gridtable.push("</tbody></table>");
				return gridtable;
			}
			;
		},
		renderFooter : function(target, container, frozen) {
			var opts = $.data(target, "treegrid").options;
			var footers = $.data(target, "treegrid").footer || [];
			var columnFields = $(target).datagrid("getColumnFields", frozen);
			var gridtable = [ "<table class=\"datagrid-ftable\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tbody>" ];
			for (var i = 0; i < footers.length; i++) {
				var row = footers[i];
				row[opts.idField] = row[opts.idField] || ("foot-row-id" + i);
				gridtable.push("<tr class=\"datagrid-row\" node-id=\"" + row[opts.idField] + "\">");
				gridtable.push(this.renderRow.call(this, target, columnFields, frozen, 0, row));
				gridtable.push("</tr>");
			}
			gridtable.push("</tbody></table>");
			$(container).html(gridtable.join(""));
		},
		renderRow : function(target, fields, frozen, rowIndex, row) {
			var opts = $.data(target, "treegrid").options;
			var cc = [];
			if (frozen && opts.rownumbers) {
				cc.push("<td class=\"datagrid-td-rownumber\"><div class=\"datagrid-cell-rownumber\">0</div></td>");
			}
			for (var i = 0; i < fields.length; i++) {
				var field = fields[i];
				var col = $(target).datagrid("getColumnOption", field);
				if (col) {
					var css = col.styler ? (col.styler(row[field], row) || "") : "";
					var clss = "";
					var styl = "";
					if (typeof css == "string") {
						styl = css;
					} else {
						if (cc) {
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
					if (col.checkbox) {
						cc.push("class=\"datagrid-cell-check ");
					} else {
						cc.push("class=\"datagrid-cell " + col.cellClass);
					}
					cc.push("\">");
					if (col.checkbox) {
						if (row.checked) {
							cc.push("<input type=\"checkbox\" checked=\"checked\"");
						} else {
							cc.push("<input type=\"checkbox\"");
						}
						cc.push(" name=\"" + field + "\" value=\"" + (row[field] != undefined ? row[field] : "") + "\">");
					} else {
						var val = null;
						if (col.formatter) {
							val = col.formatter(row[field], row);
						} else {
							val = row[field];
						}
						if (field == opts.treeField) {
							for (var j = 0; j < rowIndex; j++) {
								cc.push("<span class=\"tree-indent\"></span>");
							}
							if (row.state == "closed") {
								cc.push("<span class=\"tree-hit tree-collapsed\"></span>");
								cc.push("<span class=\"tree-icon tree-folder " + (row.iconCls ? row.iconCls : "") + "\"></span>");
							} else {
								if (row.children && row.children.length) {
									cc.push("<span class=\"tree-hit tree-expanded\"></span>");
									cc.push("<span class=\"tree-icon tree-folder tree-folder-open " + (row.iconCls ? row.iconCls : "") + "\"></span>");
								} else {
									cc.push("<span class=\"tree-indent\"></span>");
									cc.push("<span class=\"tree-icon tree-file " + (row.iconCls ? row.iconCls : "") + "\"></span>");
								}
							}
							cc.push("<span class=\"tree-title\">" + val + "</span>");
						} else {
							cc.push(val);
						}
					}
					cc.push("</div>");
					cc.push("</td>");
				}
			}
			return cc.join("");
		},
		refreshRow : function(target, id) {
			this.updateRow.call(this, target, id, {});
		},
		updateRow : function(target, id, row) {
			var opts = $.data(target, "treegrid").options;
			var row = $(target).treegrid("find", id);
			$.extend(row, row);
			var level = $(target).treegrid("getLevel", id) - 1;
			var rowStyler = opts.rowStyler ? opts.rowStyler.call(target, row) : "";
			var rowIdPrefix = $.data(target, "datagrid").rowIdPrefix;
			var fieldValue = row[opts.idField];
			function updateRowCheck(frozen) {
				var fields = $(target).treegrid("getColumnFields", frozen);
				var tr = opts.finder.getTr(target, id, "body", (frozen ? 1 : 2));
				var rownumber = tr.find("div.datagrid-cell-rownumber").html();
				var ischeck = tr.find("div.datagrid-cell-check input[type=checkbox]").is(":checked");
				tr.html(this.renderRow(target, fields, frozen, level, row));
				tr.attr("style", rowStyler || "");
				tr.find("div.datagrid-cell-rownumber").html(rownumber);
				if (ischeck) {
					tr.find("div.datagrid-cell-check input[type=checkbox]")._propAttr("checked", true);
				}
				if (fieldValue != id) {
					tr.attr("id", rowIdPrefix + "-" + (frozen ? 1 : 2) + "-" + fieldValue);
					tr.attr("node-id", fieldValue);
				}
			}
			;
			updateRowCheck.call(this, true);
			updateRowCheck.call(this, false);
			$(target).treegrid("fixRowHeight", id);
		},
		deleteRow : function(target, id) {
			var opts = $.data(target, "treegrid").options;
			var tr = opts.finder.getTr(target, id);
			tr.next("tr.treegrid-tr-tree").remove();
			tr.remove();
			var delRow = del(id);
			if (delRow) {
				if (delRow.children.length == 0) {
					tr = opts.finder.getTr(target, delRow[opts.idField]);
					tr.next("tr.treegrid-tr-tree").remove();
					var delTr = tr.children("td[field=\"" + opts.treeField + "\"]").children("div.datagrid-cell");
					delTr.find(".tree-icon").removeClass("tree-folder").addClass("tree-file");
					delTr.find(".tree-hit").remove();
					$("<span class=\"tree-indent\"></span>").prependTo(delTr);
				}
			}
			function del(id) {
				var cc;
				var parent = $(target).treegrid("getParent", id);
				if (parent) {
					cc = parent.children;
				} else {
					cc = $(target).treegrid("getData");
				}
				for (var i = 0; i < cc.length; i++) {
					if (cc[i][opts.idField] == id) {
						cc.splice(i, 1);
						break;
					}
				}
				return parent;
			}
			;
		},
		onBeforeRender : function(target, rows, data) {
			if ($.isArray(rows)) {
				data = {
					total : rows.length,
					rows : rows
				};
				rows = null;
			}
			if (!data) {
				return false;
			}
			var state = $.data(target, "treegrid");
			var opts = state.options;
			if (data.length == undefined) {
				if (data.footer) {
					state.footer = data.footer;
				}
				if (data.total) {
					state.total = data.total;
				}
				data = this.transfer(target, rows, data.rows);
			} else {
				function setParent(param, rows) {
					for (var i = 0; i < param.length; i++) {
						var row = param[i];
						row._parentId = rows;
						if (row.children && row.children.length) {
							setParent(row.children, row[opts.idField]);
						}
					}
				}
				;
				setParent(data, rows);
			}
			var node = findTreeNode(target, rows);
			if (node) {
				if (node.children) {
					node.children = node.children.concat(data);
				} else {
					node.children = data;
				}
			} else {
				state.data = state.data.concat(data);
			}
			this.sort(target, data);
			this.treeNodes = data;
			this.treeLevel = $(target).treegrid("getLevel", rows);
		},
		sort : function(target, data) {
			var opts = $.data(target, "treegrid").options;
			if (!opts.remoteSort && opts.sortName) {
				var sortNames = opts.sortName.split(",");
				var sortOrders = opts.sortOrder.split(",");
				sort(data);
			}
			function sort(rows) {
				rows.sort(function(r1, r2) {
					var r = 0;
					for (var i = 0; i < sortNames.length; i++) {
						var sn = sortNames[i];
						var so = sortOrders[i];
						var col = $(target).treegrid("getColumnOption", sn);
						var result = col.sorter || function(a, b) {
							return a == b ? 0 : (a > b ? 1 : -1);
						};
						r = result(r1[sn], r2[sn]) * (so == "asc" ? 1 : -1);
						if (r != 0) {
							return r;
						}
					}
					return r;
				});
				for (var i = 0; i < rows.length; i++) {
					var childen = rows[i].children;
					if (childen && childen.length) {
						sort(childen);
					}
				}
			}
			;
		},
		transfer : function(target, nodeId, data) {
			var opts = $.data(target, "treegrid").options;
			var rows = [];
			for (var i = 0; i < data.length; i++) {
				rows.push(data[i]);
			}
			var transferResult = [];
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				if (!nodeId) {
					if (!row._parentId) {
						transferResult.push(row);
						rows.splice(i, 1);
						i--;
					}
				} else {
					if (row._parentId == nodeId) {
						transferResult.push(row);
						rows.splice(i, 1);
						i--;
					}
				}
			}
			var toDo = [];
			for (var i = 0; i < transferResult.length; i++) {
				toDo.push(transferResult[i]);
			}
			while (toDo.length) {
				var node = toDo.shift();
				for (var i = 0; i < rows.length; i++) {
					var row = rows[i];
					if (row._parentId == node[opts.idField]) {
						if (node.children) {
							node.children.push(row);
						} else {
							node.children = [ row ];
						}
						toDo.push(row);
						rows.splice(i, 1);
						i--;
					}
				}
			}
			return transferResult;
		}
	});
	$.fn.treegrid.defaults = $.extend({}, $.fn.datagrid.defaults, {
		treeField : null,
		lines : false,
		animate : false,
		singleSelect : true,
		view : view,
		rowEvents : $.extend({}, $.fn.datagrid.defaults.rowEvents, {
			mouseover : initTreeEvents(true),
			mouseout : initTreeEvents(false),
			click : body
		}),
		loader : function(params, success, error) {
			var opts = $(this).treegrid("options");
			if (!opts.url) {
				return false;
			}
			$.ajax({
				type : opts.method,
				url : opts.url,
				data : params,
				dataType : "json",
				success : function(data) {
					success(data);
				},
				error : function() {
					error.apply(this, arguments);
				}
			});
		},
		loadFilter : function(data, parentId) {
			return data;
		},
		finder : {
			getTr : function(target, id, type, frozen) {
				type = type || "body";
				frozen = frozen || 0;
				var dc = $.data(target, "datagrid").dc;
				if (frozen == 0) {
					var opts = $.data(target, "treegrid").options;
					var tr1 = opts.finder.getTr(target, id, type, 1);
					var tr2 = opts.finder.getTr(target, id, type, 2);
					return tr1.add(tr2);
				} else {
					if (type == "body") {
						var tr = $("#" + $.data(target, "datagrid").rowIdPrefix + "-" + frozen + "-" + id);
						if (!tr.length) {
							tr = (frozen == 1 ? dc.body1 : dc.body2).find("tr[node-id=\"" + id + "\"]");
						}
						return tr;
					} else {
						if (type == "footer") {
							return (frozen == 1 ? dc.footer1 : dc.footer2).find("tr[node-id=\"" + id + "\"]");
						} else {
							if (type == "selected") {
								return (frozen == 1 ? dc.body1 : dc.body2).find("tr.datagrid-row-selected");
							} else {
								if (type == "highlight") {
									return (frozen == 1 ? dc.body1 : dc.body2).find("tr.datagrid-row-over");
								} else {
									if (type == "checked") {
										return (frozen == 1 ? dc.body1 : dc.body2).find("tr.datagrid-row-checked");
									} else {
										if (type == "last") {
											return (frozen == 1 ? dc.body1 : dc.body2).find("tr:last[node-id]");
										} else {
											if (type == "allbody") {
												return (frozen == 1 ? dc.body1 : dc.body2).find("tr[node-id]");
											} else {
												if (type == "allfooter") {
													return (frozen == 1 ? dc.footer1 : dc.footer2).find("tr[node-id]");
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
				var id = (typeof p == "object") ? p.attr("node-id") : p;
				return $(target).treegrid("find", id);
			},
			getRows : function(target) {
				return $(target).treegrid("getChildren");
			}
		},
		onBeforeLoad : function(row, param) {
		},
		onLoadSuccess : function(row, data) {
		},
		onLoadError : function() {
		},
		onBeforeCollapse : function(row) {
		},
		onCollapse : function(row) {
		},
		onBeforeExpand : function(row) {
		},
		onExpand : function(row) {
		},
		onClickRow : function(row) {
		},
		onDblClickRow : function(row) {
		},
		onClickCell : function(field, row) {
		},
		onDblClickCell : function(field, row) {
		},
		onContextMenu : function(e, row) {
		},
		onBeforeEdit : function(row) {
		},
		onAfterEdit : function(row, changes) {
		},
		onCancelEdit : function(row) {
		}
	});
})(jQuery);
