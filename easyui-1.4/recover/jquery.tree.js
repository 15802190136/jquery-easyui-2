(function($) {
	function wrapTree(target) {
		var tree = $(target);
		tree.addClass("tree");
		return tree;
	}
	;
	function bindEvents(target) {
		var opts = $.data(target, "tree").options;
		$(target).unbind().bind("mouseover", function(e) {
			var tt = $(e.target);
			var treeNode = tt.closest("div.tree-node");
			if (!treeNode.length) {
				return;
			}
			treeNode.addClass("tree-node-hover");
			if (tt.hasClass("tree-hit")) {
				if (tt.hasClass("tree-expanded")) {
					tt.addClass("tree-expanded-hover");
				} else {
					tt.addClass("tree-collapsed-hover");
				}
			}
			e.stopPropagation();
		}).bind("mouseout", function(e) {
			var tt = $(e.target);
			var treeNode = tt.closest("div.tree-node");
			if (!treeNode.length) {
				return;
			}
			treeNode.removeClass("tree-node-hover");
			if (tt.hasClass("tree-hit")) {
				if (tt.hasClass("tree-expanded")) {
					tt.removeClass("tree-expanded-hover");
				} else {
					tt.removeClass("tree-collapsed-hover");
				}
			}
			e.stopPropagation();
		}).bind("click", function(e) {
			var tt = $(e.target);
			var treeNode = tt.closest("div.tree-node");
			if (!treeNode.length) {
				return;
			}
			if (tt.hasClass("tree-hit")) {
				toggle(target, treeNode[0]);
				return false;
			} else {
				if (tt.hasClass("tree-checkbox")) {
					setChecked(target, treeNode[0], !tt.hasClass("tree-checkbox1"));
					return false;
				} else {
					select(target, treeNode[0]);
					opts.onClick.call(target, getNode(target, treeNode[0]));
				}
			}
			e.stopPropagation();
		}).bind("dblclick", function(e) {
			var treeNode = $(e.target).closest("div.tree-node");
			if (!treeNode.length) {
				return;
			}
			select(target, treeNode[0]);
			opts.onDblClick.call(target, getNode(target, treeNode[0]));
			e.stopPropagation();
		}).bind("contextmenu", function(e) {
			var treeNode = $(e.target).closest("div.tree-node");
			if (!treeNode.length) {
				return;
			}
			opts.onContextMenu.call(target, e, getNode(target, treeNode[0]));
			e.stopPropagation();
		});
	}
	;
	function disableDnd(target) {
		var opts = $.data(target, "tree").options;
		opts.dnd = false;
		var node = $(target).find("div.tree-node");
		node.draggable("disable");
		node.css("cursor", "pointer");
	}
	;
	function enableDnd(target) {
		var state = $.data(target, "tree");
		var opts = state.options;
		var tree = state.tree;
		state.disabledNodes = [];
		opts.dnd = true;
		tree.find("div.tree-node").draggable({
			disabled : false,
			revert : true,
			cursor : "pointer",
			proxy : function(target) {
				var p = $("<div class=\"tree-node-proxy\"></div>").appendTo("body");
				p.html("<span class=\"tree-dnd-icon tree-dnd-no\">&nbsp;</span>" + $(target).find(".tree-title").html());
				p.hide();
				return p;
			},
			deltaX : 15,
			deltaY : 15,
			onBeforeDrag : function(e) {
				if (opts.onBeforeDrag.call(target, getNode(target, this)) == false) {
					return false;
				}
				if ($(e.target).hasClass("tree-hit") || $(e.target).hasClass("tree-checkbox")) {
					return false;
				}
				if (e.which != 1) {
					return false;
				}
				$(this).next("ul").find("div.tree-node").droppable({
					accept : "no-accept"
				});
				var indent = $(this).find("span.tree-indent");
				if (indent.length) {
					e.data.offsetWidth -= indent.length * indent.width();
				}
			},
			onStartDrag : function() {
				$(this).draggable("proxy").css({
					left : -10000,
					top : -10000
				});
				opts.onStartDrag.call(target, getNode(target, this));
				var node = getNode(target, this);
				if (node.id == undefined) {
					node.id = "easyui_tree_node_id_temp";
					update(target, node);
				}
				state.draggingNodeId = node.id;
			},
			onDrag : function(e) {
				var x1 = e.pageX, y1 = e.pageY, x2 = e.data.startX, y2 = e.data.startY;
				var d = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
				if (d > 3) {
					$(this).draggable("proxy").show();
				}
				this.pageY = e.pageY;
			},
			onStopDrag : function() {
				$(this).next("ul").find("div.tree-node").droppable({
					accept : "div.tree-node"
				});
				for (var i = 0; i < state.disabledNodes.length; i++) {
					$(state.disabledNodes[i]).droppable("enable");
				}
				state.disabledNodes = [];
				var node = find(target, state.draggingNodeId);
				if (node && node.id == "easyui_tree_node_id_temp") {
					node.id = "";
					update(target, node);
				}
				opts.onStopDrag.call(target, node);
			}
		}).droppable({
			accept : "div.tree-node",
			onDragEnter : function(e, source) {
				if (opts.onDragEnter.call(target, this, getData(source)) == false) {
					setDndFlag(source, false);
					$(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
					$(this).droppable("disable");
					state.disabledNodes.push(this);
				}
			},
			onDragOver : function(e, source) {
				if ($(this).droppable("options").disabled) {
					return;
				}
				var pageY = source.pageY;
				var top = $(this).offset().top;
				var height = top + $(this).outerHeight();
				setDndFlag(source, true);
				$(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
				if (pageY > top + (height - top) / 2) {
					if (height - pageY < 5) {
						$(this).addClass("tree-node-bottom");
					} else {
						$(this).addClass("tree-node-append");
					}
				} else {
					if (pageY - top < 5) {
						$(this).addClass("tree-node-top");
					} else {
						$(this).addClass("tree-node-append");
					}
				}
				if (opts.onDragOver.call(target, this, getData(source)) == false) {
					setDndFlag(source, false);
					$(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
					$(this).droppable("disable");
					state.disabledNodes.push(this);
				}
			},
			onDragLeave : function(e, source) {
				setDndFlag(source, false);
				$(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
				opts.onDragLeave.call(target, this, getData(source));
			},
			onDrop : function(e, source) {
				var target = this;
				var action, point;
				if ($(this).hasClass("tree-node-append")) {
					action = moveNode;
					point = "append";
				} else {
					action = insertNode;
					point = $(this).hasClass("tree-node-top") ? "top" : "bottom";
				}
				if (opts.onBeforeDrop.call(target, target, getData(source), point) == false) {
					$(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
					return;
				}
				action(source, target, point);
				$(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
			}
		});
		function getData(target, pop) {
			return $(target).closest("ul.tree").tree(pop ? "pop" : "getData", target);
		}
		;
		function setDndFlag(target, flag) {
			var dndIcon = $(target).draggable("proxy").find("span.tree-dnd-icon");
			dndIcon.removeClass("tree-dnd-yes tree-dnd-no").addClass(flag ? "tree-dnd-yes" : "tree-dnd-no");
		}
		;
		function moveNode(nodeEl, parent) {
			if (getNode(target, parent).state == "closed") {
				expand(target, parent, function() {
					doMoveNode();
				});
			} else {
				doMoveNode();
			}
			function doMoveNode() {
				var nodeData = getData(nodeEl, true);
				$(target).tree("append", {
					parent : parent,
					data : [ nodeData ]
				});
				opts.onDrop.call(target, parent, nodeData, "append");
			}
			;
		}
		;
		function insertNode(nodeEl, parent, point) {
			var param = {};
			if (point == "top") {
				param.before = parent;
			} else {
				param.after = parent;
			}
			var nodeData = getData(nodeEl, true);
			param.data = nodeData;
			$(target).tree("insert", param);
			opts.onDrop.call(target, parent, nodeData, point);
		}
		;
	}
	;
	function setChecked(target, nodeEl, checked) {
		var opts = $.data(target, "tree").options;
		if (!opts.checkbox) {
			return;
		}
		var node = getNode(target, nodeEl);
		if (opts.onBeforeCheck.call(target, node, checked) == false) {
			return;
		}
		var nodes = $(nodeEl);
		var ck = nodes.find(".tree-checkbox");
		ck.removeClass("tree-checkbox0 tree-checkbox1 tree-checkbox2");
		if (checked) {
			ck.addClass("tree-checkbox1");
		} else {
			ck.addClass("tree-checkbox0");
		}
		if (opts.cascadeCheck) {
			setParentCheckbox(nodes);
			setChildCheckbox(nodes);
		}
		opts.onCheck.call(target, node, checked);
		function setChildCheckbox(nodeEl) {
			var childck = nodeEl.next().find(".tree-checkbox");
			childck.removeClass("tree-checkbox0 tree-checkbox1 tree-checkbox2");
			if (nodeEl.find(".tree-checkbox").hasClass("tree-checkbox1")) {
				childck.addClass("tree-checkbox1");
			} else {
				childck.addClass("tree-checkbox0");
			}
		}
		;
		function setParentCheckbox(nodeEl) {
			var pNode = getParent(target, nodeEl[0]);
			if (pNode) {
				var ck = $(pNode.target).find(".tree-checkbox");
				ck.removeClass("tree-checkbox0 tree-checkbox1 tree-checkbox2");
				if (isAllSelected(nodeEl)) {
					ck.addClass("tree-checkbox1");
				} else {
					if (isAllNull(nodeEl)) {
						ck.addClass("tree-checkbox0");
					} else {
						ck.addClass("tree-checkbox2");
					}
				}
				setParentCheckbox($(pNode.target));
			}
			function isAllSelected(n) {
				var ck = n.find(".tree-checkbox");
				if (ck.hasClass("tree-checkbox0") || ck.hasClass("tree-checkbox2")) {
					return false;
				}
				var b = true;
				n.parent().siblings().each(function() {
					if (!$(this).children("div.tree-node").children(".tree-checkbox").hasClass("tree-checkbox1")) {
						b = false;
					}
				});
				return b;
			}
			;
			function isAllNull(n) {
				var ck = n.find(".tree-checkbox");
				if (ck.hasClass("tree-checkbox1") || ck.hasClass("tree-checkbox2")) {
					return false;
				}
				var b = true;
				n.parent().siblings().each(function() {
					if (!$(this).children("div.tree-node").children(".tree-checkbox").hasClass("tree-checkbox0")) {
						b = false;
					}
				});
				return b;
			}
			;
		}
		;
	}
	;
	function setCheckBoxValue(target, nodeEl) {
		var opts = $.data(target, "tree").options;
		if (!opts.checkbox) {
			return;
		}
		var node = $(nodeEl);
		if (isLeaf(target, nodeEl)) {
			var ck = node.find(".tree-checkbox");
			if (ck.length) {
				if (ck.hasClass("tree-checkbox1")) {
					setChecked(target, nodeEl, true);
				} else {
					setChecked(target, nodeEl, false);
				}
			} else {
				if (opts.onlyLeafCheck) {
					$("<span class=\"tree-checkbox tree-checkbox0\"></span>").insertBefore(node.find(".tree-title"));
				}
			}
		} else {
			var ck = node.find(".tree-checkbox");
			if (opts.onlyLeafCheck) {
				ck.remove();
			} else {
				if (ck.hasClass("tree-checkbox1")) {
					setChecked(target, nodeEl, true);
				} else {
					if (ck.hasClass("tree-checkbox2")) {
						var checked = true;
						var unchecked = true;
						var children = getChildren(target, nodeEl);
						for (var i = 0; i < children.length; i++) {
							if (children[i].checked) {
								unchecked = false;
							} else {
								checked = false;
							}
						}
						if (checked) {
							setChecked(target, nodeEl, true);
						}
						if (unchecked) {
							setChecked(target, nodeEl, false);
						}
					}
				}
			}
		}
	}
	;
	function loadData(target, ul, data, isAppend) {
		var state = $.data(target, "tree");
		var opts = state.options;
		var treenode = $(ul).prevAll("div.tree-node:first");
		data = opts.loadFilter.call(target, data, treenode[0]);
		var node = addID(target, "domId", treenode.attr("id"));
		if (!isAppend) {
			node ? node.children = data : state.data = data;
			$(ul).empty();
		} else {
			if (node) {
				node.children ? node.children = node.children.concat(data) : node.children = data;
			} else {
				state.data = state.data.concat(data);
			}
		}
		opts.view.render.call(opts.view, target, ul, data);
		if (opts.dnd) {
			enableDnd(target);
		}
		if (node) {
			update(target, node);
		}
		var unCheckedNodes = [];
		var checkedNodes = [];
		for (var i = 0; i < data.length; i++) {
			var depth = data[i];
			if (!depth.checked) {
				unCheckedNodes.push(depth);
			}
		}
		appendNodes(data, function(node) {
			if (node.checked) {
				checkedNodes.push(node);
			}
		});
		var checkState = opts.onCheck;
		opts.onCheck = function() {
		};
		if (unCheckedNodes.length) {
			setChecked(target, $("#" + unCheckedNodes[0].domId)[0], false);
		}
		for (var i = 0; i < checkedNodes.length; i++) {
			setChecked(target, $("#" + checkedNodes[i].domId)[0], true);
		}
		opts.onCheck = checkState;
		setTimeout(function() {
			changeTreeLine(target, target);
		}, 0);
		opts.onLoadSuccess.call(target, node, data);
	}
	;
	function changeTreeLine(target, ul, flag) {
		var opts = $.data(target, "tree").options;
		if (opts.lines) {
			$(target).addClass("tree-lines");
		} else {
			$(target).removeClass("tree-lines");
			return;
		}
		if (!flag) {
			flag = true;
			$(target).find("span.tree-indent").removeClass("tree-line tree-join tree-joinbottom");
			$(target).find("div.tree-node").removeClass("tree-node-last tree-root-first tree-root-one");
			var roots = $(target).tree("getRoots");
			if (roots.length > 1) {
				$(roots[0].target).addClass("tree-root-first");
			} else {
				if (roots.length == 1) {
					$(roots[0].target).addClass("tree-root-one");
				}
			}
		}
		$(ul).children("li").each(function() {
			var treenode = $(this).children("div.tree-node");
			var ul = treenode.next("ul");
			if (ul.length) {
				if ($(this).next().length) {
					treeLine(treenode);
				}
				changeTreeLine(target, ul, flag);
			} else {
				treeJoin(treenode);
			}
		});
		var treeNodeLast = $(ul).children("li:last").children("div.tree-node").addClass("tree-node-last");
		treeNodeLast.children("span.tree-join").removeClass("tree-join").addClass("tree-joinbottom");
		function treeJoin(treenode, obj) {
			var treeIcon = treenode.find("span.tree-icon");
			treeIcon.prev("span.tree-indent").addClass("tree-join");
		}
		;
		function treeLine(treenode) {
			var length = treenode.find("span.tree-indent, span.tree-hit").length;
			treenode.next().find("div.tree-node").each(function() {
				$(this).children("span:eq(" + (length - 1) + ")").addClass("tree-line");
			});
		}
		;
	}
	;
	function treeLoad(target, ul, ids, fn) {
		var opts = $.data(target, "tree").options;
		ids = $.extend({}, opts.queryParams, ids || {});
		var node = null;
		if (target != ul) {
			var nodes = $(ul).prev();
			node = getNode(target, nodes[0]);
		}
		if (opts.onBeforeLoad.call(target, node, ids) == false) {
			return;
		}
		var children = $(ul).prev().children("span.tree-folder");
		children.addClass("tree-loading");
		var flag = opts.loader.call(target, ids, function(nexts) {
			children.removeClass("tree-loading");
			loadData(target, ul, nexts);
			if (fn) {
				fn();
			}
		}, function() {
			children.removeClass("tree-loading");
			opts.onLoadError.apply(target, arguments);
			if (fn) {
				fn();
			}
		});
		if (flag == false) {
			children.removeClass("tree-loading");
		}
	}
	;
	function expand(target, parent, fn) {
		var opts = $.data(target, "tree").options;
		var hit = $(parent).children("span.tree-hit");
		if (hit.length == 0) {
			return;
		}
		if (hit.hasClass("tree-expanded")) {
			return;
		}
		var node = getNode(target, parent);
		if (opts.onBeforeExpand.call(target, node) == false) {
			return;
		}
		hit.removeClass("tree-collapsed tree-collapsed-hover").addClass("tree-expanded");
		hit.next().addClass("tree-folder-open");
		var ul = $(parent).next();
		if (ul.length) {
			if (opts.animate) {
				ul.slideDown("normal", function() {
					node.state = "open";
					opts.onExpand.call(target, node);
					if (fn) {
						fn();
					}
				});
			} else {
				ul.css("display", "block");
				node.state = "open";
				opts.onExpand.call(target, node);
				if (fn) {
					fn();
				}
			}
		} else {
			var displayUrl = $("<ul style=\"display:none\"></ul>").insertAfter(parent);
			treeLoad(target, displayUrl[0], {
				id : node.id
			}, function() {
				if (displayUrl.is(":empty")) {
					displayUrl.remove();
				}
				if (opts.animate) {
					displayUrl.slideDown("normal", function() {
						node.state = "open";
						opts.onExpand.call(target, node);
						if (fn) {
							fn();
						}
					});
				} else {
					displayUrl.css("display", "block");
					node.state = "open";
					opts.onExpand.call(target, node);
					if (fn) {
						fn();
					}
				}
			});
		}
	}
	;
	function collapse(target, nodes) {
		var opts = $.data(target, "tree").options;
		var hit = $(nodes).children("span.tree-hit");
		if (hit.length == 0) {
			return;
		}
		if (hit.hasClass("tree-collapsed")) {
			return;
		}
		var node = getNode(target, nodes);
		if (opts.onBeforeCollapse.call(target, node) == false) {
			return;
		}
		hit.removeClass("tree-expanded tree-expanded-hover").addClass("tree-collapsed");
		hit.next().removeClass("tree-folder-open");
		var ul = $(nodes).next();
		if (opts.animate) {
			ul.slideUp("normal", function() {
				node.state = "closed";
				opts.onCollapse.call(target, node);
			});
		} else {
			ul.css("display", "none");
			node.state = "closed";
			opts.onCollapse.call(target, node);
		}
	}
	;
	function toggle(target, node) {
		var hit = $(node).children("span.tree-hit");
		if (hit.length == 0) {
			return;
		}
		if (hit.hasClass("tree-expanded")) {
			collapse(target, node);
		} else {
			expand(target, node);
		}
	}
	;
	function expandAll(target, nodes) {
		var obj = getChildren(target, nodes);
		if (nodes) {
			obj.unshift(getNode(target, nodes));
		}
		for (var i = 0; i < obj.length; i++) {
			expand(target, obj[i].target);
		}
	}
	;
	function expandTo(target, data) {
		var ps = [];
		var p = getParent(target, data);
		while (p) {
			ps.unshift(p);
			p = getParent(target, p.target);
		}
		for (var i = 0; i < ps.length; i++) {
			expand(target, ps[i].target);
		}
	}
	;
	function scrollTo(target, node) {
		var c = $(target).parent();
		while (c[0].tagName != "BODY" && c.css("overflow-y") != "auto") {
			c = c.parent();
		}
		var n = $(node);
		var nTop = n.offset().top;
		if (c[0].tagName != "BODY") {
			var cTop = c.offset().top;
			if (nTop < cTop) {
				c.scrollTop(c.scrollTop() + nTop - cTop);
			} else {
				if (nTop + n.outerHeight() > cTop + c.outerHeight() - 18) {
					c.scrollTop(c.scrollTop() + nTop + n.outerHeight() - cTop - c.outerHeight() + 18);
				}
			}
		} else {
			c.scrollTop(nTop);
		}
	}
	;
	function collapseAll(target, data) {
		var children = getChildren(target, data);
		if (data) {
			children.unshift(getNode(target, data));
		}
		for (var i = 0; i < children.length; i++) {
			collapse(target, children[i].target);
		}
	}
	;
	function append(target, parent) {
		var node = $(parent.parent);
		var state = parent.data;
		if (!state) {
			return;
		}
		state = $.isArray(state) ? state : [ state ];
		if (!state.length) {
			return;
		}
		var ul;
		if (node.length == 0) {
			ul = $(target);
		} else {
			if (isLeaf(target, node[0])) {
				var treeIcon = node.find("span.tree-icon");
				treeIcon.removeClass("tree-file").addClass("tree-folder tree-folder-open");
				var hit = $("<span class=\"tree-hit tree-expanded\"></span>").insertBefore(treeIcon);
				if (hit.prev().length) {
					hit.prev().remove();
				}
			}
			ul = node.next();
			if (!ul.length) {
				ul = $("<ul></ul>").insertAfter(node);
			}
		}
		loadData(target, ul[0], state, true);
		setCheckBoxValue(target, ul.prev());
	}
	;
	function insert(target, node) {
		var ref = node.before || node.after;
		var parent = getParent(target, ref);
		var state = node.data;
		if (!state) {
			return;
		}
		state = $.isArray(state) ? state : [ state ];
		if (!state.length) {
			return;
		}
		append(target, {
			parent : (parent ? parent.target : null),
			data : state
		});
		var roots = parent ? parent.children : $(target).tree("getRoots");
		for (var i = 0; i < roots.length; i++) {
			if (roots[i].domId == $(ref).attr("id")) {
				for (var j = state.length - 1; j >= 0; j--) {
					roots.splice((node.before ? i : (i + 1)), 0, state[j]);
				}
				roots.splice(roots.length - state.length, state.length);
				break;
			}
		}
		var li = $();
		for (var i = 0; i < state.length; i++) {
			li = li.add($("#" + state[i].domId).parent());
		}
		if (node.before) {
			li.insertBefore($(ref).parent());
		} else {
			li.insertAfter($(ref).parent());
		}
	}
	;
	function remove(target, node) {
		var dnode = del(node);
		$(node).parent().remove();
		if (dnode) {
			if (!dnode.children || !dnode.children.length) {
				var t = $(dnode.target);
				t.find(".tree-icon").removeClass("tree-folder").addClass("tree-file");
				t.find(".tree-hit").remove();
				$("<span class=\"tree-indent\"></span>").prependTo(t);
				t.next().remove();
			}
			update(target, dnode);
			setCheckBoxValue(target, dnode.target);
		}
		changeTreeLine(target, target);
		function del(n) {
			var id = $(n).attr("id");
			var parent = getParent(target, n);
			var cc = parent ? parent.children : $.data(target, "tree").data;
			for (var i = 0; i < cc.length; i++) {
				if (cc[i].domId == id) {
					cc.splice(i, 1);
					break;
				}
			}
			return parent;
		}
		;
	}
	;
	function update(target, node) {
		var opts = $.data(target, "tree").options;
		var t = $(node.target);
		var node = getNode(target, node.target);
		var checkedNode = node.checked;
		if (node.iconCls) {
			t.find(".tree-icon").removeClass(node.iconCls);
		}
		$.extend(node, node);
		t.find(".tree-title").html(opts.formatter.call(target, node));
		if (node.iconCls) {
			t.find(".tree-icon").addClass(node.iconCls);
		}
		if (checkedNode != node.checked) {
			setChecked(target, node.target, node.checked);
		}
	}
	;
	function getRoot(target, nodeEl) {
		if (nodeEl) {
			var p = getParent(target, nodeEl);
			while (p) {
				nodeEl = p.target;
				p = getParent(target, nodeEl);
			}
			return getNode(target, nodeEl);
		} else {
			var roots = getRoots(target);
			return roots.length ? roots[0] : null;
		}
	}
	;
	function getRoots(target) {
		var nodes = $.data(target, "tree").data;
		for (var i = 0; i < nodes.length; i++) {
			isChecked(nodes[i]);
		}
		return nodes;
	}
	;
	function getChildren(target, nodes) {
		var results = [];
		var n = getNode(target, nodes);
		var node = n ? n.children : $.data(target, "tree").data;
		appendNodes(node, function(dom) {
			results.push(isChecked(dom));
		});
		return results;
	}
	;
	function getParent(target, data) {
		var p = $(data).closest("ul").prevAll("div.tree-node:first");
		return getNode(target, p[0]);
	}
	;
	function getChecked(target, data) {
		data = data || "checked";
		if (!$.isArray(data)) {
			data = [ data ];
		}
		var tempNodes = [];
		for (var i = 0; i < data.length; i++) {
			var s = data[i];
			if (s == "checked") {
				tempNodes.push("span.tree-checkbox1");
			} else {
				if (s == "unchecked") {
					tempNodes.push("span.tree-checkbox0");
				} else {
					if (s == "indeterminate") {
						tempNodes.push("span.tree-checkbox2");
					}
				}
			}
		}
		var nodes = [];
		$(target).find(tempNodes.join(",")).each(function() {
			var parent = $(this).parent();
			nodes.push(getNode(target, parent[0]));
		});
		return nodes;
	}
	;
	function getSelected(target) {
		var treeNodeSelected = $(target).find("div.tree-node-selected");
		return treeNodeSelected.length ? getNode(target, treeNodeSelected[0]) : null;
	}
	;
	function getData(target, data) {
		var node = getNode(target, data);
		if (node && node.children) {
			appendNodes(node.children, function(dom) {
				isChecked(dom);
			});
		}
		return node;
	}
	;
	function getNode(target, data) {
		return addID(target, "domId", $(data).attr("id"));
	}
	;
	function find(target, id) {
		return addID(target, "id", id);
	}
	;
	function addID(target, i, node) {
		var state = $.data(target, "tree").data;
		var result = null;
		appendNodes(state, function(data) {
			if (data[i] == node) {
				result = isChecked(data);
				return false;
			}
		});
		return result;
	}
	;
	function isChecked(dom) {
		var d = $("#" + dom.domId);
		dom.target = d[0];
		dom.checked = d.find(".tree-checkbox").hasClass("tree-checkbox1");
		return dom;
	}
	;
	function appendNodes(target, fn) {
		var nodes = [];
		for (var i = 0; i < target.length; i++) {
			nodes.push(target[i]);
		}
		while (nodes.length) {
			var node = nodes.shift();
			if (fn(node) == false) {
				return;
			}
			if (node.children) {
				for (var i = node.children.length - 1; i >= 0; i--) {
					nodes.unshift(node.children[i]);
				}
			}
		}
	}
	;
	function select(target, data) {
		var opts = $.data(target, "tree").options;
		var node = getNode(target, data);
		if (opts.onBeforeSelect.call(target, node) == false) {
			return;
		}
		$(target).find("div.tree-node-selected").removeClass("tree-node-selected");
		$(data).addClass("tree-node-selected");
		opts.onSelect.call(target, node);
	}
	;
	function isLeaf(target, data) {
		return $(data).children("span.tree-hit").length == 0;
	}
	;
	function beginEdit(target, data) {
		var opts = $.data(target, "tree").options;
		var node = getNode(target, data);
		if (opts.onBeforeEdit.call(target, node) == false) {
			return;
		}
		$(data).css("position", "relative");
		var nt = $(data).find(".tree-title");
		var outerWidth = nt.outerWidth();
		nt.empty();
		var treeEdit = $("<input class=\"tree-editor\">").appendTo(nt);
		treeEdit.val(node.text).focus();
		treeEdit.width(outerWidth + 20);
		treeEdit.height(document.compatMode == "CSS1Compat" ? (18 - (treeEdit.outerHeight() - treeEdit.height())) : 18);
		treeEdit.bind("click", function(e) {
			return false;
		}).bind("mousedown", function(e) {
			e.stopPropagation();
		}).bind("mousemove", function(e) {
			e.stopPropagation();
		}).bind("keydown", function(e) {
			if (e.keyCode == 13) {
				endEdit(target, data);
				return false;
			} else {
				if (e.keyCode == 27) {
					cancelEdit(target, data);
					return false;
				}
			}
		}).bind("blur", function(e) {
			e.stopPropagation();
			endEdit(target, data);
		});
	}
	;
	function endEdit(target, data) {
		var opts = $.data(target, "tree").options;
		$(data).css("position", "");
		var treeEditor = $(data).find("input.tree-editor");
		var val = treeEditor.val();
		treeEditor.remove();
		var node = getNode(target, data);
		node.text = val;
		update(target, node);
		opts.onAfterEdit.call(target, node);
	}
	;
	function cancelEdit(target, nodeEl) {
		var opts = $.data(target, "tree").options;
		$(nodeEl).css("position", "");
		$(nodeEl).find("input.tree-editor").remove();
		var node = getNode(target, nodeEl);
		update(target, node);
		opts.onCancelEdit.call(target, node);
	}
	;
	$.fn.tree = function(options, param) {
		if (typeof options == "string") {
			return $.fn.tree.methods[options](this, param);
		}
		var options = options || {};
		return this.each(function() {
			var state = $.data(this, "tree");
			var opts;
			if (state) {
				opts = $.extend(state.options, options);
				state.options = opts;
			} else {
				opts = $.extend({}, $.fn.tree.defaults, $.fn.tree.parseOptions(this), options);
				$.data(this, "tree", {
					options : opts,
					tree : wrapTree(this),
					data : []
				});
				var data = $.fn.tree.parseData(this);
				if (data.length) {
					loadData(this, this, data);
				}
			}
			bindEvents(this);
			if (opts.data) {
				loadData(this, this, $.extend(true, [], opts.data));
			}
			treeLoad(this, this);
		});
	};
	$.fn.tree.methods = {
		options : function(jq) {
			return $.data(jq[0], "tree").options;
		},
		loadData : function(jq, data) {
			return jq.each(function() {
				loadData(this, this, data);
			});
		},
		getNode : function(jq, target) {
			return getNode(jq[0], target);
		},
		getData : function(jq, target) {
			return getData(jq[0], target);
		},
		reload : function(jq, target) {
			return jq.each(function() {
				if (target) {
					var target = $(target);
					var hit = target.children("span.tree-hit");
					hit.removeClass("tree-expanded tree-expanded-hover").addClass("tree-collapsed");
					target.next().remove();
					expand(this, target);
				} else {
					$(this).empty();
					treeLoad(this, this);
				}
			});
		},
		getRoot : function(jq, node) {
			return getRoot(jq[0], node);
		},
		getRoots : function(jq) {
			return getRoots(jq[0]);
		},
		getParent : function(jq, target) {
			return getParent(jq[0], target);
		},
		getChildren : function(jq, target) {
			return getChildren(jq[0], target);
		},
		getChecked : function(jq, state) {
			return getChecked(jq[0], state);
		},
		getSelected : function(jq) {
			return getSelected(jq[0]);
		},
		isLeaf : function(jq, target) {
			return isLeaf(jq[0], target);
		},
		find : function(jq, id) {
			return find(jq[0], id);
		},
		select : function(jq, target) {
			return jq.each(function() {
				select(this, target);
			});
		},
		check : function(jq, target) {
			return jq.each(function() {
				setChecked(this, target, true);
			});
		},
		uncheck : function(jq, target) {
			return jq.each(function() {
				setChecked(this, target, false);
			});
		},
		collapse : function(jq, target) {
			return jq.each(function() {
				collapse(this, target);
			});
		},
		expand : function(jq, target) {
			return jq.each(function() {
				expand(this, target);
			});
		},
		collapseAll : function(jq, target) {
			return jq.each(function() {
				collapseAll(this, target);
			});
		},
		expandAll : function(jq, target) {
			return jq.each(function() {
				expandAll(this, target);
			});
		},
		expandTo : function(jq, target) {
			return jq.each(function() {
				expandTo(this, target);
			});
		},
		scrollTo : function(jq, target) {
			return jq.each(function() {
				scrollTo(this, target);
			});
		},
		toggle : function(jq, target) {
			return jq.each(function() {
				toggle(this, target);
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
		remove : function(jq, target) {
			return jq.each(function() {
				remove(this, target);
			});
		},
		pop : function(jq, target) {
			var node = jq.tree("getData", target);
			jq.tree("remove", target);
			return node;
		},
		update : function(jq, param) {
			return jq.each(function() {
				update(this, param);
			});
		},
		enableDnd : function(jq) {
			return jq.each(function() {
				enableDnd(this);
			});
		},
		disableDnd : function(jq) {
			return jq.each(function() {
				disableDnd(this);
			});
		},
		beginEdit : function(jq, target) {
			return jq.each(function() {
				beginEdit(this, target);
			});
		},
		endEdit : function(jq, target) {
			return jq.each(function() {
				endEdit(this, target);
			});
		},
		cancelEdit : function(jq, target) {
			return jq.each(function() {
				cancelEdit(this, target);
			});
		}
	};
	$.fn.tree.parseOptions = function(target) {
		var t = $(target);
		return $.extend({}, $.parser.parseOptions(target, [ "url", "method", {
			checkbox : "boolean",
			cascadeCheck : "boolean",
			onlyLeafCheck : "boolean"
		}, {
			animate : "boolean",
			lines : "boolean",
			dnd : "boolean"
		} ]));
	};
	$.fn.tree.parseData = function(target) {
		var data = [];
		parseTree(data, $(target));
		return data;
		function parseTree(aa, tree) {
			tree.children("li").each(function() {
				var node = $(this);
				var item = $.extend({}, $.parser.parseOptions(this, [ "id", "iconCls", "state" ]), {
					checked : (node.attr("checked") ? true : undefined)
				});
				item.text = node.children("span").html();
				if (!item.text) {
					item.text = node.html();
				}
				var urls = node.children("ul");
				if (urls.length) {
					item.children = [];
					parseTree(item.children, urls);
				}
				aa.push(item);
			});
		}
		;
	};
	var count = 1;
	var view = {
		render : function(target, ul, data) {
			var opts = $.data(target, "tree").options;
			var length = $(ul).prev("div.tree-node").find("span.tree-indent, span.tree-hit").length;
			var cc = init(length, data);
			$(ul).append(cc.join(""));
			function init(target, nodes) {
				var cc = [];
				for (var i = 0; i < nodes.length; i++) {
					var item = nodes[i];
					if (item.state != "open" && item.state != "closed") {
						item.state = "open";
					}
					item.domId = "_easyui_tree_" + count++;
					cc.push("<li>");
					cc.push("<div id=\"" + item.domId + "\" class=\"tree-node\">");
					for (var j = 0; j < target; j++) {
						cc.push("<span class=\"tree-indent\"></span>");
					}
					var flag = false;
					if (item.state == "closed") {
						cc.push("<span class=\"tree-hit tree-collapsed\"></span>");
						cc.push("<span class=\"tree-icon tree-folder " + (item.iconCls ? item.iconCls : "") + "\"></span>");
					} else {
						if (item.children && item.children.length) {
							cc.push("<span class=\"tree-hit tree-expanded\"></span>");
							cc.push("<span class=\"tree-icon tree-folder tree-folder-open " + (item.iconCls ? item.iconCls : "") + "\"></span>");
						} else {
							cc.push("<span class=\"tree-indent\"></span>");
							cc.push("<span class=\"tree-icon tree-file " + (item.iconCls ? item.iconCls : "") + "\"></span>");
							flag = true;
						}
					}
					if (opts.checkbox) {
						if ((!opts.onlyLeafCheck) || flag) {
							cc.push("<span class=\"tree-checkbox tree-checkbox0\"></span>");
						}
					}
					cc.push("<span class=\"tree-title\">" + opts.formatter.call(target, item) + "</span>");
					cc.push("</div>");
					if (item.children && item.children.length) {
						var tmp = init(target + 1, item.children);
						cc.push("<ul style=\"display:" + (item.state == "closed" ? "none" : "block") + "\">");
						cc = cc.concat(tmp);
						cc.push("</ul>");
					}
					cc.push("</li>");
				}
				return cc;
			}
			;
		}
	};
	$.fn.tree.defaults = {
		url : null,
		method : "post",
		animate : false,
		checkbox : false,
		cascadeCheck : true,
		onlyLeafCheck : false,
		lines : false,
		dnd : false,
		data : null,
		queryParams : {},
		formatter : function(node) {
			return node.text;
		},
		loader : function(param, success, error) {
			var opts = $(this).tree("options");
			if (!opts.url) {
				return false;
			}
			$.ajax({
				type : opts.method,
				url : opts.url,
				data : param,
				dataType : "json",
				success : function(data) {
					success(data);
				},
				error : function() {
					error.apply(this, arguments);
				}
			});
		},
		loadFilter : function(data, parent) {
			return data;
		},
		view : view,
		onBeforeLoad : function(node, param) {
		},
		onLoadSuccess : function(node, data) {
		},
		onLoadError : function() {
		},
		onClick : function(node) {
		},
		onDblClick : function(node) {
		},
		onBeforeExpand : function(node) {
		},
		onExpand : function(node) {
		},
		onBeforeCollapse : function(node) {
		},
		onCollapse : function(node) {
		},
		onBeforeCheck : function(node, checked) {
		},
		onCheck : function(node, checked) {
		},
		onBeforeSelect : function(node) {
		},
		onSelect : function(node) {
		},
		onContextMenu : function(e, node) {
		},
		onBeforeDrag : function(node) {
		},
		onStartDrag : function(node) {
		},
		onStopDrag : function(node) {
		},
		onDragEnter : function(target, source) {
		},
		onDragOver : function(target, source) {
		},
		onDragLeave : function(target, source) {
		},
		onBeforeDrop : function(target, source, point) {
		},
		onDrop : function(target, source, point) {
		},
		onBeforeEdit : function(node) {
		},
		onAfterEdit : function(node) {
		},
		onCancelEdit : function(node) {
		}
	};
})(jQuery);
