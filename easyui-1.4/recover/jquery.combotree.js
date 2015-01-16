(function($) {
	function init(target) {
		var state = $.data(target, "combotree");
		var opts = state.options;
		var tree = state.tree;
		$(target).addClass("combotree-f");
		$(target).combo(opts);
		var panel = $(target).combo("panel");
		if (!tree) {
			tree = $("<ul></ul>").appendTo(panel);
			$.data(target, "combotree").tree = tree;
		}
		tree.tree($.extend({}, opts, {
			checkbox : opts.multiple,
			onLoadSuccess : function(node, data) {
				var values = $(target).combotree("getValues");
				if (opts.multiple) {
					var checkedNodes = tree.tree("getChecked");
					for (var i = 0; i < checkedNodes.length; i++) {
						var id = checkedNodes[i].id;
						(function() {
							for (var i = 0; i < values.length; i++) {
								if (id == values[i]) {
									return;
								}
							}
							values.push(id);
						})();
					}
				}
				$(target).combotree("setValues", values);
				opts.onLoadSuccess.call(this, node, data);
			},
			onClick : function(node) {
				if (opts.multiple) {
					$(this).tree(node.checked ? "uncheck" : "check", node.target);
				} else {
					$(target).combo("hidePanel");
				}
				select(target);
				opts.onClick.call(this, node);
			},
			onCheck : function(node, checked) {
				select(target);
				opts.onCheck.call(this, node, checked);
			}
		}));
	}
	;
	function select(target) {
		var state = $.data(target, "combotree");
		var opts = state.options;
		var tree = state.tree;
		var vv = [], ss = [];
		if (opts.multiple) {
			var checkedNode = tree.tree("getChecked");
			for (var i = 0; i < checkedNode.length; i++) {
				vv.push(checkedNode[i].id);
				ss.push(checkedNode[i].text);
			}
		} else {
			var selectedNode = tree.tree("getSelected");
			if (selectedNode) {
				vv.push(selectedNode.id);
				ss.push(selectedNode.text);
			}
		}
		$(target).combo("setValues", vv).combo("setText", ss.join(opts.separator));
	}
	;
	function setValues(target, values) {
		var state = $.data(target, "combotree");
		var opts = state.options;
		var tree = state.tree;
		var treeOpts = tree.tree("options");
		var onCheck = treeOpts.onCheck;
		var onSelect = treeOpts.onSelect;
		treeOpts.onCheck = treeOpts.onSelect = function() {
		};
		tree.find("span.tree-checkbox").addClass("tree-checkbox0").removeClass("tree-checkbox1 tree-checkbox2");
		if (!$.isArray(values)) {
			values = values.split(opts.separator);
		}
		for (var i = 0; i < values.length; i++) {
			var treeNode = tree.tree("find", values[i]);
			if (treeNode) {
				tree.tree("check", treeNode.target);
				tree.tree("select", treeNode.target);
			}
		}
		treeOpts.onCheck = onCheck;
		treeOpts.onSelect = onSelect;
		select(target);
	}
	;
	$.fn.combotree = function(options, param) {
		if (typeof options == "string") {
			var method = $.fn.combotree.methods[options];
			if (method) {
				return method(this, param);
			} else {
				return this.combo(options, param);
			}
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "combotree");
			if (state) {
				$.extend(state.options, options);
			} else {
				$.data(this, "combotree", {
					options : $.extend({}, $.fn.combotree.defaults, $.fn.combotree.parseOptions(this), options)
				});
			}
			init(this);
		});
	};
	$.fn.combotree.methods = {
		options : function(jq) {
			var opts = jq.combo("options");
			return $.extend($.data(jq[0], "combotree").options, {
				width : opts.width,
				height : opts.height,
				originalValue : opts.originalValue,
				disabled : opts.disabled,
				readonly : opts.readonly
			});
		},
		clone : function(jq, combotreeObj) {
			var t = jq.combo("clone", combotreeObj);
			t.data("combotree", {
				options : $.extend(true, {}, jq.combotree("options")),
				tree : jq.combotree("tree")
			});
			return t;
		},
		tree : function(jq) {
			return $.data(jq[0], "combotree").tree;
		},
		loadData : function(jq, data) {
			return jq.each(function() {
				var opts = $.data(this, "combotree").options;
				opts.data = data;
				var tree = $.data(this, "combotree").tree;
				tree.tree("loadData", data);
			});
		},
		reload : function(jq, url) {
			return jq.each(function() {
				var opts = $.data(this, "combotree").options;
				var tree = $.data(this, "combotree").tree;
				if (url) {
					opts.url = url;
				}
				tree.tree({
					url : opts.url
				});
			});
		},
		setValues : function(jq, values) {
			return jq.each(function() {
				setValues(this, values);
			});
		},
		setValue : function(jq, value) {
			return jq.each(function() {
				setValues(this, [ value ]);
			});
		},
		clear : function(jq) {
			return jq.each(function() {
				var tree = $.data(this, "combotree").tree;
				tree.find("div.tree-node-selected").removeClass("tree-node-selected");
				var cc = tree.tree("getChecked");
				for (var i = 0; i < cc.length; i++) {
					tree.tree("uncheck", cc[i].target);
				}
				$(this).combo("clear");
			});
		},
		reset : function(jq) {
			return jq.each(function() {
				var opts = $(this).combotree("options");
				if (opts.multiple) {
					$(this).combotree("setValues", opts.originalValue);
				} else {
					$(this).combotree("setValue", opts.originalValue);
				}
			});
		}
	};
	$.fn.combotree.parseOptions = function(target) {
		return $.extend({}, $.fn.combo.parseOptions(target), $.fn.tree.parseOptions(target));
	};
	$.fn.combotree.defaults = $.extend({}, $.fn.combo.defaults, $.fn.tree.defaults, {
		editable : false
	});
})(jQuery);
