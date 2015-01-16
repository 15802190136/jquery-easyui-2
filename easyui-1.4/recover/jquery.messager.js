(function($) {
	function init(el, type, speed, timeout) {
		var win = $(el).window("window");
		if (!win) {
			return;
		}
		switch (type) {
		case null:
			win.show();
			break;
		case "slide":
			win.slideDown(speed);
			break;
		case "fade":
			win.fadeIn(speed);
			break;
		case "show":
			win.show(speed);
			break;
		}
		var timer = null;
		if (timeout > 0) {
			timer = setTimeout(function() {
				hide(el, type, speed);
			}, timeout);
		}
		win.hover(function() {
			if (timer) {
				clearTimeout(timer);
			}
		}, function() {
			if (timeout > 0) {
				timer = setTimeout(function() {
					hide(el, type, speed);
				}, timeout);
			}
		});
	}
	;
	function hide(el, type, speed) {
		if (el.locked == true) {
			return;
		}
		el.locked = true;
		var win = $(el).window("window");
		if (!win) {
			return;
		}
		switch (type) {
		case null:
			win.hide();
			break;
		case "slide":
			win.slideUp(speed);
			break;
		case "fade":
			win.fadeOut(speed);
			break;
		case "show":
			win.hide(speed);
			break;
		}
		setTimeout(function() {
			$(el).window("destroy");
		}, speed);
	}
	;
	function show(options) {
		var opts = $.extend({}, $.fn.window.defaults, {
			collapsible : false,
			minimizable : false,
			maximizable : false,
			shadow : false,
			draggable : false,
			resizable : false,
			closed : true,
			style : {
				left : "",
				top : "",
				right : 0,
				zIndex : $.fn.window.defaults.zIndex++,
				bottom : -document.body.scrollTop - document.documentElement.scrollTop
			},
			onBeforeOpen : function() {
				init(this, opts.showType, opts.showSpeed, opts.timeout);
				return false;
			},
			onBeforeClose : function() {
				hide(this, opts.showType, opts.showSpeed);
				return false;
			}
		}, {
			title : "",
			width : 250,
			height : 100,
			showType : "slide",
			showSpeed : 600,
			msg : "",
			timeout : 4000
		}, options);
		opts.style.zIndex = $.fn.window.defaults.zIndex++;
		var messagerBody = $("<div class=\"messager-body\"></div>").html(opts.msg).appendTo("body");
		messagerBody.window(opts);
		messagerBody.window("window").css(opts.style);
		messagerBody.window("open");
		return messagerBody;
	}
	;
	function createDialog(title, content, buttons) {
		var win = $("<div class=\"messager-body\"></div>").appendTo("body");
		win.append(content);
		if (buttons) {
			var tb = $("<div class=\"messager-button\"></div>").appendTo(win);
			for ( var index in buttons) {
				$("<a></a>").attr("href", "javascript:void(0)").text(index).css("margin-left", 10).bind("click", eval(buttons[index])).appendTo(tb).linkbutton();
			}
		}
		win.window({
			title : title,
			noheader : (title ? false : true),
			width : 300,
			height : "auto",
			modal : true,
			collapsible : false,
			minimizable : false,
			maximizable : false,
			resizable : false,
			onClose : function() {
				setTimeout(function() {
					win.window("destroy");
				}, 100);
			}
		});
		win.window("window").addClass("messager-window");
		win.children("div.messager-button").children("a:first").focus();
		return win;
	}
	;
	$.messager = {
		show : function(options) {
			return show(options);
		},
		alert : function(title, msg, icon, fn) {
			var content = "<div>" + msg + "</div>";
			switch (icon) {
			case "error":
				content = "<div class=\"messager-icon messager-error\"></div>" + content;
				break;
			case "info":
				content = "<div class=\"messager-icon messager-info\"></div>" + content;
				break;
			case "question":
				content = "<div class=\"messager-icon messager-question\"></div>" + content;
				break;
			case "warning":
				content = "<div class=\"messager-icon messager-warning\"></div>" + content;
				break;
			}
			content += "<div style=\"clear:both;\"/>";
			var buttons = {};
			buttons[$.messager.defaults.ok] = function() {
				win.window("close");
				if (fn) {
					fn();
					return false;
				}
			};
			var win = createDialog(title, content, buttons);
			return win;
		},
		confirm : function(title, msg, fn) {
			var content = "<div class=\"messager-icon messager-question\"></div>" + "<div>" + msg + "</div>" + "<div style=\"clear:both;\"/>";
			var buttons = {};
			buttons[$.messager.defaults.ok] = function() {
				win.window("close");
				if (fn) {
					fn(true);
					return false;
				}
			};
			buttons[$.messager.defaults.cancel] = function() {
				win.window("close");
				if (fn) {
					fn(false);
					return false;
				}
			};
			var win = createDialog(title, content, buttons);
			return win;
		},
		prompt : function(title, msg, fn) {
			var content = "<div class=\"messager-icon messager-question\"></div>" + "<div>" + msg + "</div>" + "<br/>" + "<div style=\"clear:both;\"/>" + "<div><input class=\"messager-input\" type=\"text\"/></div>";
			var buttons = {};
			buttons[$.messager.defaults.ok] = function() {
				win.window("close");
				if (fn) {
					fn($(".messager-input", win).val());
					return false;
				}
			};
			buttons[$.messager.defaults.cancel] = function() {
				win.window("close");
				if (fn) {
					fn();
					return false;
				}
			};
			var win = createDialog(title, content, buttons);
			win.children("input.messager-input").focus();
			return win;
		},
		progress : function(options) {
			var methods = {
				bar : function() {
					return $("body>div.messager-window").find("div.messager-p-bar");
				},
				close : function() {
					var win = $("body>div.messager-window>div.messager-body:has(div.messager-progress)");
					if (win.length) {
						win.window("close");
					}
				}
			};
			if (typeof options == "string") {
				var method = methods[options];
				return method();
			}
			var opts = $.extend({
				title : "",
				msg : "",
				text : undefined,
				interval : 300
			}, options || {});
			var progressMsg = "<div class=\"messager-progress\"><div class=\"messager-p-msg\"></div><div class=\"messager-p-bar\"></div></div>";
			var win = createDialog(opts.title, progressMsg, null);
			win.find("div.messager-p-msg").html(opts.msg);
			var bar = win.find("div.messager-p-bar");
			bar.progressbar({
				text : opts.text
			});
			win.window({
				closable : false,
				onClose : function() {
					if (this.timer) {
						clearInterval(this.timer);
					}
					$(this).window("destroy");
				}
			});
			if (opts.interval) {
				win[0].timer = setInterval(function() {
					var v = bar.progressbar("getValue");
					v += 10;
					if (v > 100) {
						v = 0;
					}
					bar.progressbar("setValue", v);
				}, opts.interval);
			}
			return win;
		}
	};
	$.messager.defaults = {
		ok : "Ok",
		cancel : "Cancel"
	};
})(jQuery);
