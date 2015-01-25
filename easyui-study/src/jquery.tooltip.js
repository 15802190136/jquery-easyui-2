;(function($) {
$.fn.tooltip = function(options, param) {
  if (typeof options == "string") {
    return $.fn.tooltip.methods[options](this, param);
  }
  options = options || {};
  return this.each(function() {
    var state = $.data(this, "tooltip");
    if (state) {
      $.extend(state.options, options);
    } else {
      $.data(this, "tooltip", {
        options : $.extend({}, $.fn.tooltip.defaults, $.fn.tooltip.parseOptions(this), options)
      });
      init(this);
    }
    bindEvents(this);
    update(this);
  });
}
$.fn.tooltip.defaults = {
  position : "bottom",
  content : null,
  trackMouse : false,
  deltaX : 0,deltaY : 0,
  showDelay : 200,hideDelay : 100,
  onShow : function(e) {
  },
  onHide : function(e) {
  },
  onUpdate : function(content) {
  },
  onPosition : function(left, top) {
  },
  onDestroy : function() {
  }
}
$.fn.tooltip.parseOptions = function(target){
  var t = $(target);
  var options = $.extend({}, $.parser.parseOptions(target,["position", "showEvent", "hideEvent", "content",{
      trackMouse : "boolean",
      deltaX : "number",deltaY : "number",
      showDelay : "number",hideDelay : "number"
    }]), {
      _title : t.attr("title")
    });
  t.attr("title", "");
  if (!options.content)
    options.content = options._title;
  return options;
}
function init(target){
  $(target).addClass('tooltip-f')
}
function bindEvents(target){
  var opts = $.data(target, "tooltip").options;
  $(target).unbind(".tooltip").bind("mouseenter.tooltip", function(e) {
    $(target).tooltip("show", e);
  }).bind("mouseleave.tooltip", function(e) {
    $(target).tooltip("hide", e);
  }).bind("mousemove.tooltip", function(e) {
    if (opts.trackMouse) {
      opts.trackMouseX = e.pageX;
      opts.trackMouseY = e.pageY;
      $(target).tooltip("reposition");
    }
  })
}
function show(target,e){
  var state = $.data(target, "tooltip");
  var opts = state.options;
  var tip = state.tip;
  if(!tip){
    tip = $("<div tabindex='-1' class='tooltip'>" + 
        "<div class='tooltip-content'></div>" + 
        "<div class='tooltip-arrow-outer'></div>" + 
        "<div class='tooltip-arrow'></div>" + 
      "</div>").appendTo("body");
    state.tip = tip;
    update(target)
  }
  deleteDelay(target)
  state.showTimer = setTimeout(function() {
    $(target).tooltip("reposition");
    tip.show()
    opts.onShow.call(target, e);
    var bc = "border-" + opts.position + "-color";
    var $tooltipArrowOuter = tip.children(".tooltip-arrow-outer")
    var $tooltipArrow = tip.children(".tooltip-arrow")
    var $arrow = tip.children(".tooltip-arrow-outer,.tooltip-arrow")
    $tooltipArrowOuter.add($tooltipArrow).css({
      borderTopColor : "",
      borderBottomColor : "",
      borderLeftColor : "",
      borderRightColor : ""
    });
    $tooltipArrowOuter.css(bc, tip.css(bc));
    $tooltipArrow.css(bc, tip.css("backgroundColor"));
  }, opts.showDelay)
}
function hide(target,e){
  var state = $.data(target, "tooltip");
  if(state && state.tip){
    deleteDelay(target)
    state.hideTimer = setTimeout(function() {
      state.tip.hide();
      state.options.onHide.call(target, e);
    }, state.options.hideDelay);
  }
}
function update(target,content){
  var state = $.data(target, "tooltip");
  var opts = state.options;
  if(content) opts.content = content
  if (!state.tip) return;
  state.tip.children(".tooltip-content").html(opts.content);
}
function reposition(target){
  var state = $.data(target, "tooltip");
  var t = $(target);
  var opts = state.options;
  var tip = state.tip;
  var xy = {
    left : -100000,
    top : -100000
  };
  if(!state || !state.tip) return
  if (t.is(":visible")) {
    xy = setPosition(opts.position);
    if (opts.position == "top" && xy.top < 0) {
      xy = setPosition(opts.position);
    }else{
      if ((opts.position == "bottom") 
        && (xy.top + tip._outerHeight() > 
          $(window)._outerHeight() + $(document).scrollTop())){
        xy = setPosition("top");  
      }
    }
    if (xy.left < 0) {
      if (opts.position == "left") {
        xy = setPosition("right");
      }else{
        $(target).tooltip("arrow").css("left", tip._outerWidth() / 2 + xy.left);
        xy.left = 0;
      }
    }else{
      if (xy.left + tip._outerWidth() > 
        $(window)._outerWidth() + $(document)._scrollLeft()) {
        if (opts.position == "right") {
          xy = setPosition("left");
        }else{
          var left = xy.left;
          xy.left = $(window)._outerWidth() + $(document)._scrollLeft() - tip._outerWidth();
          $(target).tooltip("arrow").css("left", tip._outerWidth() / 2 - (xy.left - left));
        } 
      }
    }
  }
  tip.css({
    left : xy.left,
    top : xy.top,
    zIndex : opts.zIndex
  });
  function setPosition(position){
    opts.position = position || "bottom";
    tip.removeClass("tooltip-top tooltip-bottom tooltip-left tooltip-right").addClass("tooltip-" + opts.position);
    var left,top,_t;
    if (opts.trackMouse) {
      _t = $();
      left = opts.trackMouseX + opts.deltaX;
      top = opts.trackMouseY + opts.deltaY;
    }else{
      _t = $(target);
      left = _t.offset().left + opts.deltaX;
      top = _t.offset().top + opts.deltaY;
    }
    switch(opts.position){
      case "right":
        left += _t._outerWidth() + 12 + (opts.trackMouse ? 12 : 0);
        top -= (tip._outerHeight() - _t._outerHeight()) / 2;
        break;
      case "left":
        left -= tip._outerWidth() + 12 + (opts.trackMouse ? 12 : 0);
        top -= (tip._outerHeight() - _t._outerHeight()) / 2;
        break;
      case "top":
        left -= (tip._outerWidth() - _t._outerWidth()) / 2;
        top -= tip._outerHeight() + 12 + (opts.trackMouse ? 12 : 0);
        break;
      case "bottom":
        left -= (tip._outerWidth() - _t._outerWidth()) / 2;
        top += _t._outerHeight() + 12 + (opts.trackMouse ? 12 : 0);
        break;
    }
    return {
      left : left,
      top : top
    };
  }
}
function deleteDelay(target){
  var state = $.data(target, "tooltip");
  if (state.showTimer) {
    clearTimeout(state.showTimer);
    state.showTimer = null;
  }
  if (state.hideTimer) {
    clearTimeout(state.hideTimer);
    state.hideTimer = null;
  }  
}
function destroy(target){
  var state = $.data(target, "tooltip");
  if (state) {
    deleteDelay(target);
    var opts = state.options;
    if (state.tip)
      state.tip.remove();
    if (opts._title)
      $(target).attr("title", opts._title);
    $.removeData(target, "tooltip");
    $(target).unbind(".tooltip").removeClass("tooltip-f");
    opts.onDestroy.call(target);
  }
}
$.fn.tooltip.methods = {
  options : function(jq) {
    return $.data(jq[0], "tooltip").options;
  },
  tip : function(jq) {
    return $.data(jq[0], "tooltip").tip;
  },
  arrow : function(jq) {
    return jq.tooltip("tip").children(".tooltip-arrow-outer,.tooltip-arrow");
  },
  show : function(jq, e) {
    return jq.each(function() {
      show(this, e);
    });
  },
  hide : function(jq, e) {
    return jq.each(function() {
      hide(this, e);
    });
  },
  update : function(jq, content) {
    return jq.each(function() {
      update(this, content);
    });
  },
  reposition : function(jq) {
    return jq.each(function() {
      reposition(this);
    });
  },
  destroy : function(jq) {
    return jq.each(function() {
      destroy(this);
    });
  }  
}
})(jQuery);