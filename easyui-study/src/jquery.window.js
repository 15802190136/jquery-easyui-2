;(function($){
$.fn.window = function(options, param){
  if (typeof options == 'string'){
    var method = $.fn.window.methods[options];
    if (method)
      return method(this, param);
    else
      return this.panel(options, param);
  }
  options = options || {};
  return this.each(function(){
    var state = $.data(this, 'window');
    if (state){
      $.extend(state.options, options);
    } else {
      state = $.data(this, 'window', {
        options: $.extend({}, $.fn.window.defaults, $.fn.window.parseOptions(this), options)
      });
      if (!state.options.inline)
        document.body.appendChild(this);
    }
    create(this);
    setProperties(this);
  });
}

$.fn.window.defaults = $.extend({}, $.fn.panel.defaults, {
  zIndex: 9000,
  draggable: true,resizable: true,
  shadow: true,modal: false,closed: false,
  inline: false,
  title: 'New Window',
  draggable: true,resizable: true,collapsible: true,minimizable: true,maximizable: true,closable: true
});

$.fn.window.parseOptions = function(target){
  return $.extend({},$.fn.panel.parseOptions(target),$.parser.parseOptions(target, [
    {draggable:'boolean',resizable:'boolean',shadow:'boolean',modal:'boolean',inline:'boolean'}
  ]));
}
function create(target){
  var state = $.data(target, 'window');
  var opts = state.options;
  var win = $(target).panel($.extend({}, state.options, {
    border: false,
    doSize: true,
    closed: true,
    cls: 'window',
    headerCls: 'window-header',
    bodyCls: 'window-body ' + (opts.noheader ? 'window-body-noheader' : ''),
    onBeforeDestroy: function(){
      if (opts.onBeforeDestroy.call(target) == false){return false;}
      if (state.shadow){state.shadow.remove();}
      if (state.mask){state.mask.remove();}
    },
    onClose: function(){
      if (state.shadow){state.shadow.hide();}
      if (state.mask){state.mask.hide();}
      opts.onClose.call(target);
    },
    onOpen: function(){
      if (state.mask){
        state.mask.css({
          display:'block',
          zIndex: $.fn.window.defaults.zIndex++
        });
      }
      if (state.shadow){
        state.shadow.css({
          display:'block',
          zIndex: $.fn.window.defaults.zIndex++,
          left: state.options.left,
          top: state.options.top,
          width: state.window._outerWidth(),
          height: state.window._outerHeight()
        });
      }
      state.window.css('z-index', $.fn.window.defaults.zIndex++);
      opts.onOpen.call(target);
    },
    onResize: function(width, height){
      var popts = $(this).panel('options');
      $.extend(opts, {
        width: popts.width,
        height: popts.height,
        left: popts.left,
        top: popts.top
      });
      if (state.shadow){
        state.shadow.css({
          left: opts.left,
          top: opts.top,
          width: state.window._outerWidth(),
          height: state.window._outerHeight()
        });
      }
      opts.onResize.call(target, width, height);
    },
    onMinimize: function(){
      if (state.shadow){state.shadow.hide();}
      if (state.mask){state.mask.hide();}
      opts.onMinimize.call(target);
    },
    onBeforeCollapse: function(){
      if (opts.onBeforeCollapse.call(target) == false){return false;}
      if (state.shadow){state.shadow.hide();}
    },
    onExpand: function(){
      if (state.shadow){state.shadow.show();}
      opts.onExpand.call(target);
    }
  }));
  state.window = win.panel('panel');
  createMask(target)
  createShadow(target)
  if (opts.left == null){hcenter(target);}
  if (opts.top == null){vcenter(target);}
  moveWindow(target);
  
  if (!opts.closed)
    win.window('open'); 
}
function createMask(target){
  var state = $.data(target, 'window');
  var opts = state.options;
  if (state.mask){state.mask.remove();}
  if (state.options.modal == true){
    state.mask = $('<div class="window-mask"></div>').insertAfter(state.window);
    state.mask.css({
      width: (opts.inline ? state.mask.parent().width() : getPageArea().width),
      height: (opts.inline ? state.mask.parent().height() : getPageArea().height),
      display: 'none'
    });
  } 
}
function createShadow(target){
  var state = $.data(target, 'window');
  var opts = state.options;
  if (state.shadow){state.shadow.remove();}
  if (opts.shadow == true){
    state.shadow = $('<div class="window-shadow"></div>').insertAfter(state.window);
    state.shadow.css({
      display: 'none'
    });
  }
}
function getPageArea(){
  if (document.compatMode == 'BackCompat') {
    return {
      width: Math.max(document.body.scrollWidth, document.body.clientWidth),
      height: Math.max(document.body.scrollHeight, document.body.clientHeight)
    }
  } else {
    return {
      width: Math.max(document.documentElement.scrollWidth, document.documentElement.clientWidth),
      height: Math.max(document.documentElement.scrollHeight, document.documentElement.clientHeight)
    }
  }  
}
function hcenter(target,tomove){
  var opts = $.data(target, 'window').options;
  var pp = $(target).window('panel');
  var width = pp._outerWidth();
  if (opts.inline){
    var parent = pp.parent();
    opts.left = Math.ceil((parent.width() - width) / 2 + parent.scrollLeft());
  } else {
    opts.left = Math.ceil(($(window)._outerWidth() - width) / 2 + $(document).scrollLeft());
  }
  if (tomove){moveWindow(target);}
}
function vcenter(target,tomove){
  var opts = $.data(target, 'window').options;
  var pp = $(target).window('panel');
  var height = pp._outerHeight();
  if (opts.inline){
    var parent = pp.parent();
    opts.top = Math.ceil((parent.height() - height) / 2 + parent.scrollTop());
  } else {
    opts.top = Math.ceil(($(window)._outerHeight() - height) / 2 + $(document).scrollTop());
  }
  if (tomove){moveWindow(target);}  
}
function moveWindow(target,param){
  var state = $.data(target, 'window');
  if (param){
    if (param.left != null) state.options.left = param.left;
    if (param.top != null) state.options.top = param.top;
  }
  $(target).panel('move', state.options);
  if (state.shadow){
    state.shadow.css({
      left: state.options.left,
      top: state.options.top
    });
  }  
}
function setProperties(target){
  var state = $.data(target, 'window');
  state.window.draggable({
    handle: '>div.panel-header>div.panel-title',
    disabled: state.options.draggable == false,
    onStartDrag: function(e){
      if (state.mask) 
        state.mask.css('z-index', $.fn.window.defaults.zIndex++);
      if (state.shadow) 
        state.shadow.css('z-index', $.fn.window.defaults.zIndex++);
      state.window.css('z-index', $.fn.window.defaults.zIndex++);
      if (!state.proxy)
        state.proxy = $('<div class="window-proxy"></div>').insertAfter(state.window);
      state.proxy.css({
        display:'none',
        zIndex: $.fn.window.defaults.zIndex++,
        left: e.data.left,
        top: e.data.top
      });
      state.proxy._outerWidth(state.window._outerWidth());
      state.proxy._outerHeight(state.window._outerHeight());
      setTimeout(function(){
        if (state.proxy) state.proxy.show();
      }, 500);
    },
    onDrag: function(e){
      state.proxy.css({
        display:'block',
        left: e.data.left,
        top: e.data.top
      });
      return false;      
    },
    onStopDrag: function(e){
      state.options.left = e.data.left;
      state.options.top = e.data.top;
      moveWindow(target);
      state.proxy.remove();
      state.proxy = null;      
    }
  })

  state.window.resizable({
    disabled: state.options.resizable == false,
    onStartResize:function(e){
      if (state.pmask) state.pmask.remove();
      state.pmask = $('<div class="window-proxy-mask"></div>').insertAfter(state.window);
      state.pmask.css({
        zIndex: $.fn.window.defaults.zIndex++,
        left: e.data.left,
        top: e.data.top,
        width: state.window._outerWidth(),
        height: state.window._outerHeight()
      });
      if (state.proxy){state.proxy.remove();}
      state.proxy = $('<div class="window-proxy"></div>').insertAfter(state.window);
      state.proxy.css({
        zIndex: $.fn.window.defaults.zIndex++,
        left: e.data.left,
        top: e.data.top
      });
      state.proxy._outerWidth(e.data.width)._outerHeight(e.data.height);
    },
    onResize: function(e){
      state.proxy.css({
        left: e.data.left,
        top: e.data.top
      });
      state.proxy._outerWidth(e.data.width);
      state.proxy._outerHeight(e.data.height);
      return false;
    },
    onStopResize: function(e){
      $(target).panel("resize",e.data);
      state.pmask.remove();
      state.pmask = null;
      state.proxy.remove();
      state.proxy = null;
    }
  })
}
$(window).resize(function(){
  $('body>div.window-mask').css({
    width: $(window)._outerWidth(),
    height: $(window)._outerHeight()
  });
  setTimeout(function(){
    $('body>div.window-mask').css({
      width: getPageArea().width,
      height: getPageArea().height
    });
  }, 50);
});

$.fn.window.methods = {
  options: function(jq){
    var popts = jq.panel('options');
    var wopts = $.data(jq[0], 'window').options;
    return $.extend(wopts, {
      closed: popts.closed,
      collapsed: popts.collapsed,
      minimized: popts.minimized,
      maximized: popts.maximized
    });
  },
  window: function(jq){
    return $.data(jq[0], 'window').window;
  },
  move: function(jq, param){
    return jq.each(function(){
      moveWindow(this, param);
    });
  },
  hcenter: function(jq){
    return jq.each(function(){
      hcenter(this, true);
    });
  },
  vcenter: function(jq){
    return jq.each(function(){
      vcenter(this, true);
    });
  },
  center: function(jq){
    return jq.each(function(){
      hcenter(this);
      vcenter(this);
      moveWindow(this);
    });
  }
};

})(jQuery)