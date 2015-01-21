(function($) {
$.fn.resizable = function(options, param){
  if (typeof options == 'string'){
    return $.fn.resizable.methods[options](this, param);
  }
  return this.each(function(){
    var opts = null;
    var state = $.data(this, 'resizable');
    if (state) {
      $(this).unbind('.resizable');
      opts = $.extend(state.options, options || {});
    }else{
      opts = $.extend({}, $.fn.resizable.defaults, $.fn.resizable.parseOptions(this), options || {});
      $.data(this, 'resizable', {
        options:opts
      });
    }

    if (opts.disabled == true) {
      return;
    }
    bindEvents(this)
  })
}
$.fn.resizable.defaults = {
  disabled:false,
  handles:'n, e, s, w, ne, se, sw, nw, all',
  minWidth: 10,minHeight: 10,
  maxWidth: 10000,maxHeight: 10000,
  edge:5
}
$.fn.resizable.isResizing = false;
$.fn.resizable.parseOptions = function(target){
  var t = $(target);
  return $.extend({},
      $.parser.parseOptions(target, [
        'handles',{minWidth:'number',minHeight:'number',maxWidth:'number',maxHeight:'number',edge:'number'}
      ]), {
    disabled: (t.attr('disabled') ? true : undefined)
  })
}
function bindEvents(target){
  var t = $(target);
  t.bind('mousemove.resizable',{target:target},function(e){
    if ($.fn.resizable.isResizing) return
    var dir = getDirection(e);
    if (dir == '')
      $(e.data.target).css('cursor', '');
    else
      $(e.data.target).css('cursor', dir + '-resize');
  }).bind('mouseleave.resizable',{target:target},function(e){
    $(e.data.target).css('cursor', '');
  }).bind('mousedown.resizable',{target:target},function(e){
    var dir = getDirection(e);
    var t = $(e.data.target);
    if (dir == '') return;

    function getCssValue(css) {
      var val = parseInt(t.css(css));
      if (isNaN(val))
        return 0;
      else
        return val; 
    }
    var data = {
      target: e.data.target,
      dir: dir,
      startLeft: getCssValue('left'),
      startTop: getCssValue('top'),
      left: getCssValue('left'),
      top: getCssValue('top'),
      startX: e.pageX,
      startY: e.pageY,
      startWidth: t.outerWidth(),
      startHeight: t.outerHeight(),
      width: t.outerWidth(),
      height: t.outerHeight(),
      deltaWidth: t.outerWidth() - t.width(),
      deltaHeight: t.outerHeight() - t.height()
    }
    $(document).bind('mousedown.resizable', data, doDown);
    $(document).bind('mousemove.resizable', data, doMove);
    $(document).bind('mouseup.resizable', data, doUp);
    $('body').css('cursor', dir+'-resize');
  })
}
function getDirection(e){
  var t = $(e.data.target);
  var opts = $.data(e.data.target,"resizable").options;
  var dir = '';
  var offset = t.offset();
  var width = t.outerWidth();
  var height = t.outerHeight();
  var edge = opts.edge;
  if (e.pageY > offset.top && e.pageY < offset.top + edge)
    dir += 'n';
  else if (e.pageY < offset.top + height && e.pageY > offset.top + height - edge)
    dir += 's';
  if (e.pageX > offset.left && e.pageX < offset.left + edge)
    dir += 'w';
  else if (e.pageX < offset.left + width && e.pageX > offset.left + width - edge)
    dir += 'e';
  
  var handles = opts.handles.split(',');
  for(var i=0; i<handles.length; i++) {
    var handle = handles[i].replace(/(^\s*)|(\s*$)/g, '');
    if (handle == 'all' || handle == dir)
      return dir;
  }
  return '';
}
function doDown(e){
  $.fn.resizable.isResizing = true;
  return false;
}
function doMove(e){
  resize(e);
  applySize(e);
  return false;  
}
function doUp(e){
  $.fn.resizable.isResizing = false;
  resize(e, true);
  applySize(e);
  $(document).unbind('.resizable');
  $('body').css('cursor','');
  return false;
}
function resize(e){
  var resizeData = e.data;
  var opts = $.data(resizeData.target, 'resizable').options;
  //右
  if (resizeData.dir.indexOf('e') != -1) {
    var width = resizeData.startWidth + e.pageX - resizeData.startX;
    width = Math.min(
      Math.max(width, opts.minWidth),
      opts.maxWidth
    );
    resizeData.width = width;
  }
  //下
  if (resizeData.dir.indexOf('s') != -1) {
    var height = resizeData.startHeight + e.pageY - resizeData.startY;
    height = Math.min(
      Math.max(height, opts.minHeight),
      opts.maxHeight
    );
    resizeData.height = height;
  }
  //左
  if (resizeData.dir.indexOf('w') != -1) {
    var width = resizeData.startWidth - e.pageX + resizeData.startX;
    width = Math.min(
      Math.max(width, opts.minWidth),
      opts.maxWidth
    );
    resizeData.width = width;
    resizeData.left = resizeData.startLeft + resizeData.startWidth - resizeData.width;    
  }
  //上
  if (resizeData.dir.indexOf('n') != -1) {
    var height = resizeData.startHeight - e.pageY + resizeData.startY;
    height = Math.min(
      Math.max(height, opts.minHeight),
      opts.maxHeight
    );
    resizeData.height = height;
    resizeData.top = resizeData.startTop + resizeData.startHeight - resizeData.height;
  }
}
function applySize(e){
  var resizeData = e.data;
  var t = $(resizeData.target);
  t.css({
    left: resizeData.left,
    top: resizeData.top
  });
  if (t.outerWidth() != resizeData.width){t._outerWidth(resizeData.width)}
  if (t.outerHeight() != resizeData.height){t._outerHeight(resizeData.height)}  
}  
})(jQuery);