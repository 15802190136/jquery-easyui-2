;(function($) {
$.fn.draggable = function(options, param){
  if (typeof options == 'string'){
    return $.fn.draggable.methods[options](this, param);
  }
  return this.each(function(){
    var opts;
    var target = this;
    var state = $.data(this, 'draggable');
    if (state) {
      state.handle.unbind('.draggable');
      opts = $.extend(state.options, options);
    } else {
      opts = $.extend({}, $.fn.draggable.defaults, $.fn.draggable.parseOptions(this), options || {});
    }
    var handle = opts.handle ? (typeof opts.handle=='string' ? $(opts.handle, this) : opts.handle) : $(this);
    
    $.data(this, 'draggable', {
      options: opts,
      handle: handle
    });
    
    if (opts.disabled) {
      $(this).css('cursor', '');
      return;
    }
    function bindEvents(){
      handle.unbind('.draggable').bind('mousemove.draggable',{target:target},function(e){
        if ($.fn.draggable.isDragging) return
        if (checkArea(e))
          $(this).css('cursor', 'move');
        else
          $(this).css('cursor', '');
      }).bind('mouseleave.draggable',{target:target},function(e){
        $(this).css('cursor', '');
      }).bind('mousedown.draggable',{target:target},function(e){
        var t = $(e.data.target);
        var opts = $.data(e.data.target, 'draggable').options;
        if (checkArea(e) == false) return;
        $(this).css('cursor', '');
        var position = t.position();
        var offset = t.offset();
        var data = {
          target:e.data.target,
          startLeft: position.left,
          startTop: position.top,
          left: position.left,
          top: position.top,
          startX: e.pageX,
          startY: e.pageY,
          offsetWidth: (e.pageX - offset.left),
          offsetHeight: (e.pageY - offset.top),
          parent: t.parent()[0]
        };
        if (opts.onBeforeDrag.call(e.data.target, e) == false) return;
        $(document).bind('mousedown.draggable', data, doDown);
        $(document).bind('mousemove.draggable', data, doMove);
        $(document).bind('mouseup.draggable', data, doUp);
      });
    }
    bindEvents();
  });
}
$.fn.draggable.isDragging = false;
$.fn.draggable.defaults = {
  proxy:null,
  revert:false,
  deltaX:null,
  deltaY:null,
  handle: null,
  disabled: false,
  edge:0,
  onBeforeDrag: function(e){},
  onStartDrag: function(e){},
  onDrag: function(e){},
  onStopDrag: function(e){}
}
$.fn.draggable.parseOptions = function(target){
  var t = $(target);
  return $.extend({}, 
    $.parser.parseOptions(target, ['handle',{'revert':'boolean','deltaX':'number','deltaY':'number','edge':'number'}]), {
    disabled: (t.attr('disabled') ? true : undefined)
  });
}
function checkArea(e){
  var state = $.data(e.data.target, 'draggable');
  var handle = state.handle;
  var offset = $(handle).offset();
  var width = $(handle).outerWidth();
  var height = $(handle).outerHeight();
  var t = e.pageY - offset.top;
  var r = offset.left + width - e.pageX;
  var b = offset.top + height - e.pageY;
  var l = e.pageX - offset.left;
  return Math.min(t,r,b,l) > state.options.edge;
}
function doDown(e){
  var t = $(e.data.target)
  var state = $.data(e.data.target, 'draggable');
  var opts = state.options;
  var droppables = $(".droppable").filter(function(){
    return e.data.target != this;
  }).filter(function() {
    var accept = $.data(this,"droppable").options.accept;
    if(accept){
      return $(accept).filter(function(index) {
        return this == e.data.target;
      }).length>0;
    }else{
      return true;
    }
  });
  $.fn.draggable.isDragging = true
  state.droppables = droppables;
  var proxy = state.proxy;
  if (!proxy){
    if (opts.proxy){
      if (opts.proxy == 'clone')
        proxy = t.clone().insertAfter(e.data.target);
      else
        proxy = opts.proxy.call(e.data.target, e.data.target)
      state.proxy = proxy;
    }else{
      proxy = t;
    }
  }
  proxy.css('position', 'absolute');
  drag(e);
  applyDrag(e);
  opts.onStartDrag.call(e.data.target, e);
  return false;
}
function drag(e){
  var state = $.data(e.data.target,"draggable")
  var opts = state.options
  var dragData = e.data;
  var deltaX = opts.deltaX,deltaY = opts.deltaY
  var pageX = e.pageX,pageY = e.pageY
  var left = dragData.startLeft + pageX - dragData.startX;
  var top = dragData.startTop + pageY - dragData.startY;
  var offsetWidth = dragData.offsetWidth,offsetHeight = dragData.offsetHeight
  var proxy = state.proxy
  var parent = dragData.parent
  if(proxy){
    if (proxy.parent()[0] == document.body){
      if(opts.deltaX != null && opts.deltaX != undefined)
        left = e.pageX + opts.deltaX;
      else
        left = e.pageX - e.data.offsetWidth;
      if(opts.deltaY != null && opts.deltaY != undefined)
        top = e.pageY + opts.deltaY;
      else
        top = e.pageY - e.data.offsetHeight;
    }else{
      if (opts.deltaX != null && opts.deltaX != undefined)
        left += e.data.offsetWidth + opts.deltaX;
      if (opts.deltaY != null && opts.deltaY != undefined)
        top += e.data.offsetHeight + opts.deltaY;
    }
  }
  if (parent != document.body) {
    left += $(parent).scrollLeft();
    top += $(parent).scrollTop();
  }
  dragData.left = left;
  dragData.top = top;
}
function applyDrag(e){
  var state = $.data(e.data.target, 'draggable');
  var t = $(e.data.target)
  var proxy = state.proxy;
  if (!proxy) proxy = t;
  proxy.css({
    left:e.data.left,
    top:e.data.top
  });
  $('body').css('cursor', 'move');
}
function doMove(e){
  var source = e.data.target;
  var state = $.data(e.data.target, 'draggable');
  drag(e);
  if (state.options.onDrag.call(e.data.target, e) != false){
    applyDrag(e);
  }
  state.droppables.each(function(){
    var dropObj = $(this);
    if (dropObj.droppable('options').disabled) return;
    var p2 = dropObj.offset();
    if (e.pageX > p2.left && 
      e.pageX < p2.left + dropObj.outerWidth() && 
      e.pageY > p2.top && 
      e.pageY < p2.top + dropObj.outerHeight()){
      if (!this.entered){
        $(this).trigger('_dragenter', [source]);
        this.entered = true;
      }
      $(this).trigger('_dragover', [source]);
    }else{
      if (this.entered){
        $(this).trigger('_dragleave', [source]);
        this.entered = false;
      }
    }
  })
  return false;
}
function doUp(e){
  var t = $(e.data.target);
  var state = $.data(e.data.target, 'draggable');
  var opts = state.options;
  var proxy = state.proxy;
  $.fn.draggable.isDragging = false;
  doMove(e);
  if (opts.revert){
    if(checkDrop()==true){
      t.css({
        position:e.data.startPosition,
        left:e.data.startLeft,
        top:e.data.startTop
      });
    }else{
      if(proxy){
        var left, top;
        if (proxy.parent()[0] == document.body){
          left = e.data.startX - e.data.offsetWidth;
          top = e.data.startY - e.data.offsetHeight;        
        }else{
          left = e.data.startLeft;
          top = e.data.startTop;        
        }
        proxy.animate({
          left:left,
          top:top
        }, function(){
          removeProxy();
        });
      }else{
        t.animate({
          left:e.data.startLeft,
          top:e.data.startTop
        }, function(){
          t.css('position', e.data.startPosition);
        });
      }
    }
  }else{
    t.css({
      position:'absolute',
      left:e.data.left,
      top:e.data.top
    });
    checkDrop();
  }
  opts.onStopDrag.call(e.data.target, e);
  $(document).unbind('.draggable');
  setTimeout(function(){
    $('body').css('cursor','');
  },100);

  function removeProxy(){
    if (proxy){
      proxy.remove();
    }
    state.proxy = null;
  }
  function checkDrop(){
    var dropped = false;
    state.droppables.each(function(){
      var dropObj = $(this);
      if (dropObj.droppable('options').disabled) return;
      var p2 = dropObj.offset();
      if (e.pageX > p2.left && 
        e.pageX < p2.left + dropObj.outerWidth() && 
        e.pageY > p2.top && 
        e.pageY < p2.top + dropObj.outerHeight()){
        if (opts.revert){
          t.css({
            position:e.data.startPosition,
            left:e.data.startLeft,
            top:e.data.startTop
          });
        }
        $(this).trigger('_drop', [e.data.target]);
        removeProxy();
        dropped = true;
        this.entered = false;
        return false;
      }
    })
    if (!dropped && !opts.revert){
      removeProxy();
    }
    return dropped;
  }
  return false;
}
$.fn.draggable.methods = {
  options: function(jq){
    return $.data(jq[0], 'draggable').options;
  },
  proxy: function(jq){
    return $.data(jq[0], 'draggable').proxy;
  },
  enable: function(jq){
    return jq.each(function(){
      $(this).draggable({disabled:false});
    });
  },
  disable: function(jq){
    return jq.each(function(){
      $(this).draggable({disabled:true});
    });
  }  
}
})(jQuery); 