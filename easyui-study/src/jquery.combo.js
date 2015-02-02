;(function($) {
$.fn.combo = function(options, param) {
  if (typeof options == "string") {
    var method = $.fn.combo.methods[options];
    if (method)
      return method(this, param);
    else
      return this.textbox(options, param);
  }
  options = options || {};
  return this.each(function() {
    var state = $.data(this, "combo");
    if (state) {
      $.extend(state.options, options);
      if (options.value != undefined)
        state.options.originalValue = options.value;
    } else {
      state = $.data(this, "combo", {
        options : $.extend({}, $.fn.combo.defaults, $.fn.combo.parseOptions(this), options),
        previousText : ""
      });
      state.options.originalValue = state.options.value;
    }
    resize(this);
    initValue(this);
  });
};
$.fn.combo.defaults = $.extend({}, $.fn.textbox.defaults, {
  inputEvents : {
    click : close,
    keydown : keydown,
    paste : keydown,
    drop : keydown
  },
  panelWidth : null,
  panelHeight : 200,
  panelMinWidth : null,
  panelMaxWidth : null,
  panelMinHeight : null,
  panelMaxHeight : null,
  panelAlign : "left",
  multiple : false,
  selectOnNavigation : true,
  separator : ",",
  hasDownArrow : true,
  delay : 200,
  keyHandler : {
    up : function(e) {},
    down : function(e) {},
    left : function(e) {},
    right : function(e) {},
    enter : function(e) {},
    query : function(q, e) {}
  },
  onShowPanel : function() {},
  onHidePanel : function() {},
  onChange : function(newValue, oldValue) {}  
})
$.fn.combo.parseOptions = function(target){
  var t = $(target)
  return $.extend({},$.fn.textbox.parseOptions(target),
  $.parser.parseOptions(target, ["separator", "panelAlign",{
      panelWidth : "number",
      hasDownArrow : "boolean",
      delay : "number",
      selectOnNavigation : "boolean"
    }, {
      panelMinWidth : "number",panelMaxWidth : "number",
      panelMinHeight : "number",panelMaxHeight : "number"
    }]), {
    panelHeight : (t.attr("panelHeight") == "auto" ? "auto" : parseInt(t.attr("panelHeight")) || undefined),
    multiple : (t.attr("multiple") ? true : undefined)
  });
}
function resize(target) {
  var combo = $.data(target, "combo");
  var t = $(target);
  var opts = combo.options;
  var icon
  if (!combo.panel) {
    combo.panel = $("<div class='combo-panel'></div>").appendTo("body");
    combo.panel.panel({
      minWidth : opts.panelMinWidth,maxWidth : opts.panelMaxWidth,
      minHeight : opts.panelMinHeight,maxHeight : opts.panelMaxHeight,
      doSize : false,
      closed : true,
      cls : "combo-p",
      style : {
        position : "absolute",
        zIndex : 10
      },
      onOpen : function() {
        var comboTarget = $(this).panel("options").comboTarget;
        var combo = $.data(comboTarget, "combo");
        if (combo)
          combo.options.onShowPanel.call(comboTarget);
      },
      onBeforeClose : function() {
        onBeforeClose(this);
      },
      onClose : function() {
        var comboTarget = $(this).panel("options").comboTarget;
        var combo = $.data(comboTarget, "combo");
        if (combo)
          combo.options.onHidePanel();
      }
    });
  }
  icon = $.extend(true, [], opts.icons);
  if (opts.hasDownArrow) {
    icon.push({
      iconCls : "combo-arrow",
      handler : function(e) {
        visible(e.data.target);
      }
    });
  }
  t.addClass("combo-f").textbox($.extend({}, opts, {
    icons : icon,
    onChange : function() {}
  }));
  t.attr("comboName", t.attr("textboxName"));
  combo.combo = t.next();
  combo.combo.addClass("combo");
}
function initValue(target){
  var opts = $.data(target, "combo").options;
  var fn = opts.onChange;
  opts.onChange = function() {};
  if (opts.multiple)
    setValues(target,opts.value ? opts.value : []);
  else
    setValue(target,opts.value);
  opts.onChange = fn;
}
function setValues(target,text) {
  var state = $.data(target, "combo");
  var t = $(target);
  var opts = state.options;
  var combo = state.combo;
  var comboText,comboName,obj
  if (!$.isArray(text))
    text = text.split(opts.separator);
  comboText = getValues(target);
  combo.find(".textbox-value").remove();
  comboName = t.attr("textboxName") || "";
  for (var i = 0; i < text.length; i++) {
    obj = $("<input type='hidden' class='textbox-value'>").appendTo(combo);
    obj.attr("name", comboName);
    if (opts.disabled)
      obj.attr("disabled", "disabled");
    obj.val(text[i]);
  }
  var fn = (function() {
    var a1,a2
    if (comboText.length != text.length)
      return true;
    a1 = $.extend(true, [], comboText);
    a2 = $.extend(true, [], text);
    a1.sort();
    a2.sort();
    for (var i = 0; i < a1.length; i++) {
      if (a1[i] != a2[i])
        return true;
    }
    return false;
  })();
  if (fn) {
    if (opts.multiple)
      opts.onChange.call(target, text, comboText);
    else
      opts.onChange.call(target, text[0], comboText[0]);
  }
}
function getValues(target){
  var comboText = [];
  var combo = $.data(target, "combo").combo;
  combo.find(".textbox-value").each(function() {
    comboText.push($(this).val());
  });
  return comboText;
}
function setValue(target,value) {
  setValues(target,[value]);
}
function getValue(target) {
  var values = getValues(target);
  return values[0];
}
function setText(target,text){
  var state = $.data(target, "combo");
  var comboText = $(target).textbox("getText");
  if (comboText != text) {
    $(target).textbox("setText", text);
    state.previousText = text;
  }
}
function destroy(){
  var opts = state_opts;
  var p = state_panel;
  if (p.is(":visible"))
    p.panel("close");
  if (!opts.cloned)
    p.panel("destroy");
  t.textbox("destroy");
}
function options(){
  var options = t.textbox("options");
  return $.extend(state_opts, {
    width : options.width,
    height : options.height,
    disabled : options.disabled,
    readonly : options.readonly
  });
}
function visible(target){
  var panel = $.data(target, "combo").panel;
  var t = $(target);
  var p
  if (panel.is(":visible")) {
    hidePanel(target);
  } else {
    p = t.closest("div.combo-panel");
    $("div.combo-panel:visible").not(panel).not(p).panel("close");
    $(target).combo("showPanel");
  }
  $(target).combo("textbox").focus(); 
}
function showPanel(target){
  var state = $.data(target, "combo");
  var combo = state.combo;
  var panel = state.panel;
  var opts = $(target).combo("options");
  var panelOpts = panel.panel("options");
  panelOpts.comboTarget = target;
  if (panelOpts.closed) {
    panel.panel("panel").show().css({
      zIndex : ($.fn.menu ? $.fn.menu.defaults.zIndex++ : $.fn.window.defaults.zIndex++),
      left : -999999
    });
    panel.panel("resize", {
      width : (opts.panelWidth ? opts.panelWidth : combo._outerWidth()),
      height : opts.panelHeight
    });
    panel.panel("panel").hide();
    panel.panel("open");
  }
  (function() {
    if (panel.is(":visible")) {
      panel.panel("move", {
        left : getOffsetLeft(target),
        top : getOffsetTop(target)
      });
      setTimeout(arguments.callee, 200);
    }
  })();
}
function getOffsetLeft(target){
  var state = $.data(target, "combo");
  var combo = state.combo;
  var panel = state.panel;
  var opts = $(target).combo("options");
  var panelOpts = panel.panel("options");
  var left = combo.offset().left;
  if (opts.panelAlign == "right")
    left += combo._outerWidth() - panel._outerWidth();
  if (left + panel._outerWidth() > $(window)._outerWidth() + $(document).scrollLeft())
    left = $(window)._outerWidth() + $(document).scrollLeft() - panel._outerWidth();
  if (left < 0)
    left = 0;
  return left;
}
function getOffsetTop(target){
  var state = $.data(target, "combo");
  var combo = state.combo;
  var panel = state.panel;
  var top = combo.offset().top + combo._outerHeight();
  if (top + panel._outerHeight() > $(window)._outerHeight() + $(document).scrollTop())
    top = combo.offset().top - panel._outerHeight();
  if (top < $(document).scrollTop())
    top = combo.offset().top + combo._outerHeight();
  return top;
}
function hidePanel(target){
  var panel = $.data(target, "combo").panel;
  panel.panel("close");
}
function clear(target){
  var state = $.data(target, "combo");
  var opts = state.options;
  var combo = state.combo;
  $(target).textbox("clear");
  if (opts.multiple)
    combo.find(".textbox-value").remove();
  else
    combo.find(".textbox-value").val("");
}
function onBeforeClose(target){
  $(target).find(".combo-f").each(function() {
    var p = $(this).combo("panel");
    if (p.is(":visible"))
      p.panel("close");
  });
}
function close(e){
  var target = e.data.target;
  var state = $.data(target, "combo");
  var opts = state.options;
  var panel = state.panel;
  var p
  if (!opts.editable) {
    visible(target);
  } else {
    p = $(target).closest("div.combo-panel");
    $("div.combo-panel:visible").not(panel).not(p).panel("close");
  }
}
function keydown(e){
  var target = e.data.target;
  var t = $(target);
  var combo = t.data("combo");
  var opts = t.combo("options");
  switch (e.keyCode) {
  case 38:
    opts.keyHandler.up.call(target, e);
    break;
  case 40:
    opts.keyHandler.down.call(target, e);
    break;
  case 37:
    opts.keyHandler.left.call(target, e);
    break;
  case 39:
    opts.keyHandler.right.call(target, e);
    break;
  case 13:
    e.preventDefault();
    opts.keyHandler.enter.call(target, e);
    return false;
  case 9:
  case 27:
    hidePanel(target);
    break;
  default:
    if (opts.editable) {
      if (combo.timer)
        clearTimeout(combo.timer);
      combo.timer = setTimeout(function() {
        var q = t.textbox("getText");
        if (combo.previousText != q) {
          combo.previousText = q;
          t.combo("showPanel");
          opts.keyHandler.query.call(target, q, e);
          t.combo("validate");
        }
      }, opts.delay);
    }
  }
}
$.fn.combo.methods = {
  options : function(jq) {
    var options = jq.textbox("options");
    return $.extend($.data(jq[0], "combo").options, {
      width : options.width,
      height : options.height,
      disabled : options.disabled,
      readonly : options.readonly
    });
  },
  cloneFrom : function(jq, cloneObj) {
    return jq.each(function() {
      $(this).textbox("cloneFrom", cloneObj);
      $.data(this, "combo", {
        options : $.extend(true, {
          cloned : true
        }, $(cloneObj).combo("options")),
        combo : $(this).next(),
        panel : $(cloneObj).combo("panel")
      });
      $(this).addClass("combo-f").attr("comboName", $(this).attr("textboxName"));
    });
  },
  panel : function(jq) {
    return $.data(jq[0], "combo").panel;
  },
  destroy : function(jq) {
    return jq.each(function() {
      destroy(this);
    });
  },
  showPanel : function(jq) {
    return jq.each(function() {
      showPanel(this);
    });
  },
  hidePanel : function(jq) {
    return jq.each(function() {
      hidePanel(this);
    });
  },
  clear : function(jq) {
    return jq.each(function() {
      clear(this);
    });
  },
  reset : function(jq) {
    return jq.each(function() {
      var opts = $.data(this, "combo").options;
      if (opts.multiple) {
        $(this).combo("setValues", opts.originalValue);
      } else {
        $(this).combo("setValue", opts.originalValue);
      }
    });
  },
  setText : function(jq, text) {
    return jq.each(function() {
      setText(this, text);
    });
  },
  getValues : function(jq) {
    return getValues(jq[0]);
  },
  setValues : function(jq, values) {
    return jq.each(function() {
      setValues(this, values);
    });
  },
  getValue : function(jq) {
    return getValue(jq[0]);
  },
  setValue : function(jq, value) {
    return jq.each(function() {
      setValue(this, value);
    });
  }
};
})(jQuery);