(function($) {
	var index = 0;
	function init(target) {
		var state = $.data(target, "filebox");
		var opts = state.options;
		var id = "filebox_file_id_" + (++index);
		$(target).addClass("filebox-f").textbox($.extend({}, opts, {
			buttonText : opts.buttonText ? ("<label for=\"" + id + "\">" + opts.buttonText + "</label>") : ""
		}));
		$(target).textbox("textbox").attr("readonly", "readonly");
		state.filebox = $(target).next().addClass("filebox");
		state.filebox.find(".textbox-value").remove();
		opts.oldValue = "";
		var inputHtml = $("<input type=\"file\" class=\"textbox-value\">").appendTo(state.filebox);
		inputHtml.attr("id", id).attr("name", $(target).attr("textboxName") || "");
		inputHtml.change(function() {
			$(target).filebox("setText", this.value);
			opts.onChange.call(target, this.value, opts.oldValue);
			opts.oldValue = this.value;
		});
		var button = $(target).filebox("button");
		if (button.length) {
			if (button.linkbutton("options").disabled) {
				inputHtml.attr("disabled", "disabled");
			} else {
				inputHtml.removeAttr("disabled");
			}
		}
	}
	;
	$.fn.filebox = function(options, param) {
		if (typeof options == "string") {
			var method = $.fn.filebox.methods[options];
			if (method) {
				return method(this, param);
			} else {
				return this.textbox(options, param);
			}
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "filebox");
			if (state) {
				$.extend(state.options, options);
			} else {
				$.data(this, "filebox", {
					options : $.extend({}, $.fn.filebox.defaults, $.fn.filebox.parseOptions(this), options)
				});
			}
			init(this);
		});
	};
	$.fn.filebox.methods = {
		options : function(jq) {
			var opts = jq.textbox("options");
			return $.extend($.data(jq[0], "filebox").options, {
				width : opts.width,
				value : opts.value,
				originalValue : opts.originalValue,
				disabled : opts.disabled,
				readonly : opts.readonly
			});
		}
	};
	$.fn.filebox.parseOptions = function(target) {
		return $.extend({}, $.fn.textbox.parseOptions(target), {});
	};
	$.fn.filebox.defaults = $.extend({}, $.fn.textbox.defaults, {
		buttonIcon : null,
		buttonText : "Choose File",
		buttonAlign : "right",
		inputEvents : {}
	});
})(jQuery);
