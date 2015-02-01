(function($) {
/*    
    var state = $.data(target, "panel");
    var opts = state.options;
    var panel = state.panel;
    var original = state.original;
    var pheader = panel.children("div.panel-header");
    var pbody = panel.children("div.panel-body");
    var pfooter = panel.children("div.panel-footer");
*/
$.fn._remove = function() {
  return this.each(function() {
    $(this).remove();
    try {
      this.outerHTML = "";
    } catch (err) {
    }
  });
};
$.fn.panel = function(options, param) {
  if (typeof options == "string") {
    return $.fn.panel.methods[options](this, param);
  }
  options = options || {};
  return this.each(function() {
    var state = $.data(this, "panel");
    var opts;
    if (state) {
      opts = $.extend(state.options, options);
    }else{
      opts = $.extend({}, $.fn.panel.defaults, $.fn.panel.parseOptions(this), options);
      state = $.data(this, "panel", {
        options: opts,
        panel: wrapPanel(this)
      });
    }
    addHeader(this)
    if (opts.doSize == true) {
      state.panel.css("display", "block");
      resize(this)
    }
    if (opts.closed == true || opts.minimized == true) {
      state.panel.hide();
    }else{
      open(this);
    }
  })
}
$.fn.panel.defaults = {
  fit: false,border: true,noheader : false,
  cls:null,iconCls : null,headerCls : null,bodyCls : null,
  collapsible : false,minimizable : false,maximizable : false,closable : false,
  doSize : true,collapsed:false,minimized : false,maximized : false,closed : false,
  tools : null,footer : null,
  href : null,loadingMessage: "Loading...",
  openAnimation : false,openDuration : 400,closeAnimation : false,closeDuration : 400,
  style : {},
  onBeforeLoad : function(param) {},onLoad : function() {},onLoadError : function() {},
  onBeforeOpen : function() {},onOpen : function() {},
  onBeforeClose : function() {},onClose : function() {},
  onBeforeDestroy : function() {},onDestroy : function() {},
  onResize : function(width, height) {},onMove : function(left, top) {},onMaximize : function() {},onRestore : function() {},onMinimize : function() {},
  onBeforeCollapse : function() {},onBeforeExpand : function() {},onCollapse : function() {},onExpand : function() {}
};
$.fn.panel.parseOptions = function(target){
  return $.extend({},$.parser.parseOptions(target, ["id", "width", "height", "left", "top", "title",
    "iconCls", "cls", "headerCls", "bodyCls",
    {collapsible : "boolean",minimizable : "boolean",maximizable : "boolean",closable : "boolean"},
    {collapsed : "boolean",minimized : "boolean",maximized : "boolean",closed : "boolean"},
    "openAnimation", "closeAnimation", {
      openDuration : "number",
      closeDuration : "number"
    }
  ]));
}
function remove(panel) {
  panel._remove();
}
function wrapPanel(target){
  $(target).addClass("panel-body")._size("clear");
  var panel = $("<div class='panel'></div>").insertBefore(target);
  panel[0].appendChild(target);
  return panel;    
}
function initPanelTool(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  remove(panel.children("div.panel-header"));
  if (opts.title && !opts.noheader) {
    var pheader = $("<div class='panel-header'></div>").prependTo(panel);
    var ptitle = $("<div class='panel-title'></div>").html(opts.title).appendTo(pheader);
    if (opts.iconCls) {
      ptitle.addClass("panel-with-icon");
      $("<div class='panel-icon'></div>").addClass(opts.iconCls).appendTo(pheader);
    }
    var ptool = $("<div class='panel-tool'></div>").appendTo(pheader);
    ptool.bind("click", function(e) {
      e.stopPropagation();
    });
    if (opts.tools) {
      if ($.isArray(opts.tools)) {
        for (var i = 0; i < opts.tools.length; i++) {
          var t = $("<a href='javascript:void(0)'></a>").addClass(opts.tools[i].iconCls).appendTo(ptool);
          if (opts.tools[i].handler)
            t.bind("click", eval(opts.tools[i].handler));
        }
      }else{
        $(opts.tools).children().each(function() {
          $(this).addClass($(this).attr("iconCls")).addClass("panel-tool-a").appendTo(ptool);
        });        
      }
    }
    if (opts.collapsible) {
      $("<a class='panel-tool-collapse' href='javascript:void(0)'></a>").appendTo(ptool).bind("click", function() {
        if (opts.collapsed == true)
          expand(target, true);
        else
          collapse(target, true);
        return false;
      });      
    }
    if (opts.minimizable) {
      $("<a class='panel-tool-min' href='javascript:void(0)'></a>").appendTo(ptool).bind("click", function() {
        minimize(target);
        return false;
      });      
    }
    if (opts.maximizable) {
      $("<a class='panel-tool-max' href='javascript:void(0)'></a>").appendTo(ptool).bind("click", function() {
        if (opts.maximized == true)
          restore(target);
        else
          maximize(target);
        return false;
      });
    }
    if (opts.closable) {
      $("<a class='panel-tool-close' href='javascript:void(0)'></a>").appendTo(ptool).bind("click", function() {
        close(target);
        return false;
      });
    }    
    panel.children("div.panel-body").removeClass("panel-body-noheader")
  }else{
    panel.children("div.panel-body").addClass("panel-body-noheader");
  }
}
function initPanelFooter(target){
  var state = $.data(target, "panel");
  var panel = state.panel;
  var opts = state.options;
  if (opts.footer) {
    $(opts.footer).addClass("panel-footer").appendTo(panel);
    $(target).addClass("panel-body-nobottom");
  }else{
    panel.children("div.panel-footer").remove();
    $(target).removeClass("panel-body-nobottom");
  }
}
function addHeader(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  //panel.css(opts.style);
  panel.addClass(opts.cls);  
  initPanelTool(target)
  initPanelFooter(target)
  var pheader = panel.children("div.panel-header");
  var pbody = panel.children("div.panel-body");
  var pfooter = panel.children("div.panel-footer");
  if(opts.border){
    pheader.removeClass("panel-header-noborder");
    pbody.removeClass("panel-body-noborder");
    pfooter.removeClass("panel-footer-noborder");
  }else{
    pheader.addClass("panel-header-noborder");
    pbody.addClass("panel-body-noborder");
    pfooter.addClass("panel-footer-noborder");    
  } 
  pheader.addClass(opts.headerCls);  
  pbody.addClass(opts.bodyCls); 
  $(target).attr("id", opts.id || "");
}
function resize(target,param){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel; 
  var pheader = panel.children("div.panel-header");
  var pbody = panel.children("div.panel-body");
  var pfooter = panel.children("div.panel-footer");   
  if(param){
    $.extend(opts,{
      width: param.width,
      height: param.height,
      minWidth : param.minWidth,
      maxWidth : param.maxWidth,
      minHeight : param.minHeight,
      maxHeight : param.maxHeight,
      left: param.left,
      top: param.top
    });
  }
  panel._size(opts);
  pheader.add(pbody)._outerWidth(panel.width());
  if (!isNaN(parseInt(opts.height))) {
    pbody._outerHeight(panel.height()-pheader._outerHeight()-pfooter._outerHeight())
  }else{
    pbody.css("height", "");
    var minHeight = $.parser.parseValue("minHeight", opts.minHeight, panel.parent());
    var maxHeight = $.parser.parseValue("maxHeight", opts.maxHeight, panel.parent());
    var outerHeight = pheader._outerHeight() + pfooter._outerHeight() + panel._outerHeight() - panel.height();
    pbody._size("minHeight", minHeight ? (minHeight - outerHeight) : "");
    pbody._size("maxHeight", maxHeight ? (maxHeight - outerHeight) : "");
  }
  panel.css({
    height: "",
    minHeight: "",
    maxHeight: "",
    left:opts.left,
    top:opts.top
  })
  opts.onResize.apply(target, [ opts.width, opts.height ]);
}
function refresh(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  var pbody = panel.children("div.panel-body");
  if (!opts.href) return;
  pbody.html($("<div class='panel-loading'></div>").html(opts.loadingMessage));
}
function open(target,forceOpen){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  if (forceOpen != true)
    if (opts.onBeforeOpen.call(target) == false) return;
  panel.stop(true, true);
  if ($.isFunction(opts.openAnimation)) {
    opts.openAnimation.call(target, cb);
  } else {
    switch (opts.openAnimation) {
    case "slide":
      panel.slideDown(opts.openDuration, cb);
      break;
    case "fade":
      panel.fadeIn(opts.openDuration, cb);
      break;
    case "show":
      panel.show(opts.openDuration, cb);
      break;
    default:
      panel.show();
      cb();
    }
  }
  function cb(){
    opts.closed = false;
    opts.minimized = false;
    opts.onOpen.call(target);
    if (opts.maximized == true) {
      opts.maximized = false;
      maximize(target);
    }
    if (opts.collapsed == true) {
      opts.collapsed = false;
      collapse(target)
    }
    if (!opts.collapsed)
      refresh(target)
  }
}
function move(target,param){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  if (param) {
    if (param.left != null)
      opts.left = param.left;
    if (param.top != null)
      opts.top = param.top;
  }
  panel.css({
    left:opts.left,
    top:opts.top
  })
}
function close(target,forceClose){
  var state = $.data(target, "panel");
  var panel = state.panel;
  var opts = state.options;
  if (forceClose != true)
    if (opts.onBeforeClose.call(target) == false) return;
  panel.stop(true, true);
  panel._size("unfit");
  if ($.isFunction(opts.closeAnimation)) {
    opts.closeAnimation.call(target, cb);
  } else {
    switch (opts.closeAnimation) {
    case "slide":
      panel.slideUp(opts.closeDuration, cb);
      break;
    case "fade":
      panel.fadeOut(opts.closeDuration, cb);
      break;
    case "hide":
      panel.hide(opts.closeDuration, cb);
      break;
    default:
      panel.hide(0, cb);
    }
  }  
  function cb(){
    opts.closed = true;
    opts.onClose.call(target);
  }
}
function collapse(target,animate){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  var toolCollapse = panel.children("div.panel-header").find("a.panel-tool-collapse");
  var pbody = panel.children("div.panel-body");
  if (opts.collapsed == true) return;
  pbody.stop(true, true);
  if (opts.onBeforeCollapse.call(target) == false) return;
  toolCollapse.addClass("panel-tool-expand");
  if (animate == true) 
    pbody.slideUp("normal", cb);
  else 
    pbody.hide(0,cb);
  function cb(){
    opts.collapsed = true;
    opts.onCollapse.call(target);
  }
}
function expand(target,animate){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  var pbody = panel.children("div.panel-body");
  var toolCollapse = panel.children("div.panel-header").find("a.panel-tool-collapse");
  if (opts.collapsed == false) return;
  pbody.stop(true, true);
  if (opts.onBeforeExpand.call(target) == false) return;
  toolCollapse.removeClass("panel-tool-expand");
  if (animate == true)
    pbody.slideDown("normal", cb);
  else
    pbody.show(0,cb);
  function cb(){
    opts.collapsed = false;
    opts.onExpand.call(target);
    refresh(target);
  }
}
function maximize(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var original = state.original;
  var panel = state.panel;
  var toolMax = panel.children("div.panel-header").find("a.panel-tool-max");
  if(opts.maximized==true) return;
  toolMax.addClass("panel-tool-restore");
  if(!original){
    $.data(target, "panel").original = {
      width: opts.width,
      height: opts.height,
      left: opts.left,
      top: opts.top,
      fit: opts.fit
    }      
  }
  opts.left = 0;
  opts.top = 0;
  opts.fit = true;
  resize(target,opts);
  opts.minimized = false;
  opts.maximized = true;
  opts.onMaximize.call(target);
}
function restore(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var original = state.original;
  var panel = state.panel;
  var toolMax = panel.children("div.panel-header").find("a.panel-tool-max");
  if(opts.maximized==false) return;
  panel.show();
  toolMax.removeClass("panel-tool-restore");
  $.extend(opts, original);
  resize(target);
  opts.minimized = false;
  opts.maximized = false;
  state.original = null;
  opts.onRestore.call(target);
}
function minimize(target){
  var state = $.data(target, "panel");
  var panel = state.panel;
  var opts = state.options;
  panel._size("unfit")
  panel.hide()
  opts.minimized = true;
  opts.maximized = false;
  opts.onMinimize.call(target);
}

$.fn.panel.methods = {
  options: function(jq) {
    return $.data(jq[0], "panel").options;
  },
  panel: function(jq) {
    return $.data(jq[0], "panel").panel;
  },
  header: function(jq) {
    return $.data(jq[0], "panel").panel.find(">div.panel-header");
  },
  footer: function(jq) {
    return jq.panel("panel").children(".panel-footer");
  },
  body: function(jq) {
    return $.data(jq[0], "panel").panel.find(">div.panel-body");
  },
  open: function(jq, param) {
    return jq.each(function() {
      open(this, param);
    });
  },
  close: function(jq, param) {
    return jq.each(function() {
      close(this, param);
    });
  },
  resize: function(jq, param) {
    return jq.each(function() {
      resize(this, param);
    });
  },
  move: function(jq, param) {
    return jq.each(function() {
      move(this, param);
    });
  },
  maximize: function(jq) {
    return jq.each(function() {
      maximize(this);
    });
  },
  minimize: function(jq) {
    return jq.each(function() {
      minimize(this);
    });
  },
  restore: function(jq) {
    return jq.each(function() {
      restore(this);
    });
  },
  collapse: function(jq, param) {
    return jq.each(function() {
      collapse(this, param);
    });
  },
  expand: function(jq, param) {
    return jq.each(function() {
      expand(this, param);
    });
  }
}

})(jQuery);