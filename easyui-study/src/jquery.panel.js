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
    doHeader(this)
    doFooter(this)
    setBorder(this)
    if (opts.doSize == true) {
      setSize(this)
    }
    openPanel(this)
  })
}
$.fn.panel.parseOptions = function(target){
  return $.extend({},$.parser.parseOptions(target, ["id", "width", "height", "left", "top", "title"]));    
}
$.fn.panel.defaults = {fit: false,border: true,collapsed:true,cls:"window",loadingMessage: "Loading..."};
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
      openPanel(this, param);
    });
  },
  close: function(jq, param) {
    return jq.each(function() {
      closePanel(this, param);
    });
  },
  resize: function(jq, param) {
    return jq.each(function() {
      setSize(this, param);
    });
  },
  move: function(jq, param) {
    return jq.each(function() {
      movePanel(this, param);
    });
  },
  maximize: function(jq) {
    return jq.each(function() {
      maximizePanel(this);
    });
  },
  minimize: function(jq) {
    return jq.each(function() {
      minimizePanel(this);
    });
  },
  restore: function(jq) {
    return jq.each(function() {
      restorePanel(this);
    });
  },
  collapse: function(jq, param) {
    return jq.each(function() {
      collapsePanel(this, param);
    });
  },
  expand: function(jq, param) {
    return jq.each(function() {
      expandPanel(this, param);
    });
  }
}
wrapPanel = function(target){
  $(target).addClass("panel-body")._size("clear");
  var panel = $("<div class='panel'></div>").insertBefore(target);
  panel[0].appendChild(target);
  var pbody = panel.children("div.panel-body");
  return panel;    
}
doHeader = function(target){
  var state = $.data(target, "panel");
  var panel = state.panel;
  $("<div class='panel-header'></div>").prependTo(panel)
  panel.children("div.panel-body").removeClass("panel-body-noheader")
}
doFooter = function(target){
  var state = $.data(target, "panel");
  var panel = state.panel;
  $("<div class='panel-footer'></div>").appendTo(panel) 
}
setBorder = function(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  var pheader = panel.children("div.panel-header");
  var pbody = panel.children("div.panel-body");
  var pfooter = panel.children("div.panel-footer");
  panel.addClass(opts.cls);
  if(opts.border){
    pheader.removeClass("panel-header-noborder");
    pbody.removeClass("panel-body-noborder");
    pfooter.removeClass("panel-footer-noborder");
  }else{
    pheader.addClass("panel-header-noborder");
    pbody.addClass("panel-body-noborder");
    pfooter.addClass("panel-footer-noborder");    
  }    
}
setSize = function(target,param){
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
      left: param.left,
      top: param.top
    });
  }
  panel._size(opts);
  pheader.add(pbody)._outerWidth(panel.width());
  pbody._outerHeight(panel.height()-pheader._outerHeight()-pfooter._outerHeight())
  panel.css({
    height: "",
    minHeight: "",
    maxHeight: "",
    left:opts.left,
    top:opts.top
  })
}
loadData = function(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  var pbody = panel.children("div.panel-body");
  pbody.html($("<div class='panel-loading'></div>").html(opts.loadingMessage));
}
openPanel = function(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  var cb = function(){
    if (opts.collapsed == true) {
      collapsePanel(target)
    }
    if (!opts.collapsed){
      loadData(target)
    }
  }
  panel.show(400, cb);
}
movePanel = function(target,param){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  if (param) {
    if (param.left != null) {
      opts.left = param.left;
    }
    if (param.top != null) {
      opts.top = param.top;
    }
  }
  panel.css({
    left:opts.left,
    top:opts.top
  })
}
closePanel = function(target){
  var state = $.data(target, "panel");
  var panel = state.panel;
  var cb = function(){}
  //panel.slideUp(400, cb);
  //panel.fadeOut(400, cb);
  panel.hide(0, cb);
}
collapsePanel = function(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  var pbody = panel.children("div.panel-body");
  var cb = function(){
    opts.collapsed = true;
  }
  //pbody.slideUp("normal",cb);
  pbody.hide(0,cb)
}
expandPanel = function(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var panel = state.panel;
  var pbody = panel.children("div.panel-body");
  var cb = function(){
    opts.collapsed = false;
  }
  //pbody.slideDown("normal",cb);
  pbody.show(0,cb)
  loadData(target);
}
maximizePanel = function(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var original = state.original;
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
  setSize(target,opts);
}
restorePanel = function(target){
  var state = $.data(target, "panel");
  var opts = state.options;
  var original = state.original;
  $.extend(opts, original);
  setSize(target);
  original = null;   
}
minimizePanel = function(target){
  var state = $.data(target, "panel");
  var panel = state.panel;
  panel._size("unfit")
  panel.hide()
}

})(jQuery);