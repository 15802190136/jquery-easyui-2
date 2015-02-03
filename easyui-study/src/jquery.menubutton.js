;(function($) {
$.fn.menubutton = function(options, param) {
  if (typeof options == "string") {
    var method = $.fn.menubutton.methods[options];
    if (method)
      return method(this, param);
    else
      return this.linkbutton(options, param);
  }
  options = options || {};
  return this.each(function() {
    var state = $.data(this, "menubutton");
    if (state) {
      $.extend(state.options, options);
    } else {
      $.data(this, "menubutton", {
        options : $.extend({}, $.fn.menubutton.defaults, $.fn.menubutton.parseOptions(this), options)
      });
      $(this).removeAttr("disabled");
    }
    init(this);
    setDisabled(this);
  });
}
$.fn.menubutton.defaults = $.extend({}, $.fn.linkbutton.defaults, {
  plain : true,
  menu : null,
  menuAlign : "left",
  duration : 100,
  cls : {
    btn1 : "m-btn-active",
    btn2 : "m-btn-plain-active",
    arrow : "m-btn-downarrow",
    trigger : "m-btn"
  }
})
$.fn.menubutton.parseOptions = function(target){
  return $.extend({},$.fn.linkbutton.parseOptions(target),$.parser.parseOptions(target, [ "menu", {
    plain : "boolean",
    duration : "number"
  }]));
}
function init(target){
  var t = $(target)
  var opts = $.data(target, "menubutton").options;
  var btnLeftObj,menuOpts,onShow,onHide
  t.linkbutton(opts);
  t.removeClass(opts.cls.btn1 + " " + opts.cls.btn2).addClass("m-btn");
  t.removeClass("m-btn-small m-btn-medium m-btn-large").addClass("m-btn-" + opts.size);
  btnLeftObj = t.find(".l-btn-left");
  $("<span></span>").addClass(opts.cls.arrow).appendTo(btnLeftObj);
  $("<span></span>").addClass("m-btn-line").appendTo(btnLeftObj);
  if (opts.menu) {
    $(opts.menu).menu({
      duration : opts.duration
    });
    menuOpts = $(opts.menu).menu("options");
    onShow = menuOpts.onShow;
    onHide = menuOpts.onHide;
    $.extend(menuOpts, {
      onShow : function() {
        var menuOpts = $(this).menu("options");
        var alignTo = $(menuOpts.alignTo);
        var opts = alignTo.menubutton("options");
        alignTo.addClass((opts.plain == true) ? opts.cls.btn2 : opts.cls.btn1);
        onShow.call(this);
      },
      onHide : function() {
        var menuOpts = $(this).menu("options");
        var alignTo = $(menuOpts.alignTo);
        var opts = alignTo.menubutton("options");
        alignTo.removeClass((opts.plain == true) ? opts.cls.btn2 : opts.cls.btn1);
        onHide.call(this);
      }
    });
  }
}
function setDisabled(target) {
  var opts = $.data(target, "menubutton").options;
  var btn = $(target);
  var t = btn.find("." + opts.cls.trigger);
  var timer = null;
  if (!t.length)
    t = btn;
    t.unbind(".menubutton");
    t.bind("click.menubutton", function() {
      if (!isDisabled(target)) {
        showMenu(target);
        return false;
      }
    }).bind("mouseenter.menubutton", function() {
      if (!isDisabled(target)) {
        timer = setTimeout(function() {
          showMenu(target);
        }, opts.duration);
        return false;
      }
    }).bind("mouseleave.menubutton", function() {
      if (timer)
        clearTimeout(timer);
      $(opts.menu).triggerHandler("mouseleave");
    });
}
function isDisabled(target) {
  return $(target).linkbutton("options").disabled;
}
function showMenu(target) {
  var btn = $(target);
  var opts = $.data(target, "menubutton").options;
  if (opts.disabled || !opts.menu) return;
  $("body>div.menu-top").menu("hide");
  var mm = $(opts.menu);
  if (mm.length) {
    mm.menu("options").alignTo = btn;
    mm.menu("show", {
      alignTo : btn,
      align : opts.menuAlign
    });
  }
  btn.blur();
}
$.fn.menubutton.methods = {
  options : function(jq) {
    var linkbuttonOpts = jq.linkbutton("options");
    return $.extend($.data(jq[0], "menubutton").options, {
      toggle : linkbuttonOpts.toggle,
      selected : linkbuttonOpts.selected,
      disabled : linkbuttonOpts.disabled
    });
  },
  destroy : function(jq) {
    return jq.each(function() {
      var opts = $(this).menubutton("options");
      if (opts.menu) {
        $(opts.menu).menu("destroy");
      }
      $(this).remove();
    });
  }
};
})(jQuery);