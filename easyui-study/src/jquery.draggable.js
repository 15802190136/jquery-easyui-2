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
    $.parser.parseOptions(target, ['handle',{'deltaX':'number','deltaY':'number','edge':'number'}]), {
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
  $.fn.draggable.isDragging = true
  t.css('position', 'absolute');
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
  var parent = dragData.parent
  if (parent != document.body) {
    left += $(parent).scrollLeft();
    top += $(parent).scrollTop();
  }
  dragData.left = left;
  dragData.top = top;
}
function applyDrag(e){
  var t = $(e.data.target)
  t.css({
    left:e.data.left,
    top:e.data.top
  });
  $('body').css('cursor', 'move');
}
function doMove(e){
  var state = $.data(e.data.target, 'draggable');
  drag(e);
  if (state.options.onDrag.call(e.data.target, e) != false){
    applyDrag(e);
  }
  return false;
}
function doUp(e){
  var t = $(e.data.target);
  var state = $.data(e.data.target, 'draggable');
  var opts = state.options;
  $.fn.draggable.isDragging = false;
  doMove(e);
  t.css({
    position:'absolute',
    left:e.data.left,
    top:e.data.top
  });
  opts.onStopDrag.call(e.data.target, e);
  $(document).unbind('.draggable');
  setTimeout(function(){
    $('body').css('cursor','');
  },100);
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