$.parser = {
  parseValue: function(property, value, parent, delta){
    delta = delta || 0;
    var v = $.trim(String(value||''));
    var endchar = v.substr(v.length-1, 1);
    if (endchar == '%'){
      v = parseInt(v.substr(0, v.length-1));
      if (property.toLowerCase().indexOf('width') >= 0){
        v = Math.floor((parent.width()-delta) * v / 100.0);
      } else {
        v = Math.floor((parent.height()-delta) * v / 100.0);
      }
    } else {
      v = parseInt(v) || undefined;
    }
    return v;
  },
  parseOptions: function(target, properties){
    var t = $(target);
    var options = {};
    var s = $.trim(t.attr('data-options'));
    if (s){
      if (s.substring(0, 1) != '{'){
        s = '{' + s + '}';
      }
      options = (new Function('return ' + s))();
    }
    $.map(['width','height','left','top','minWidth','maxWidth','minHeight','maxHeight'], function(p){
      var pv = $.trim(target.style[p] || '');
      if (pv){
        if (pv.indexOf('%') == -1){
          pv = parseInt(pv) || undefined;
        }
        options[p] = pv;
      }
    });
      
    if (properties){
      var opts = {};
      for(var i=0; i<properties.length; i++){
        var pp = properties[i];
        if (typeof pp == 'string'){
          opts[pp] = t.attr(pp);
        } else {
          for(var name in pp){
            var type = pp[name];
            if (type == 'boolean'){
              opts[name] = t.attr(name) ? (t.attr(name) == 'true') : undefined;
            } else if (type == 'number'){
              opts[name] = t.attr(name)=='0' ? 0 : parseFloat(t.attr(name)) || undefined;
            }
          }
        }
      }
      $.extend(options, opts);
    }
    return options;
  }
}
$.fn._size = function(options, parent){
  if (typeof options == 'string'){
    if (options == 'clear'){
      return this.each(function(){
        $(this).css({width:'',minWidth:'',maxWidth:'',height:'',minHeight:'',maxHeight:''});
      });
    } else if (options == 'fit'){
      return this.each(function(){
        _fit(this, this.tagName=='BODY' ? $('body') : $(this).parent(), true);
      });
    } else if (options == 'unfit'){
      return this.each(function(){
        _fit(this, $(this).parent(), false);
      });
    } else {
      if (parent == undefined){
        //_css(target,property) options-string
        return _css(this[0], options);
      } else {
        return this.each(function(){
          //_css(target,property,value) options-string parent-string||int
          _css(this, options, parent);
        });
      }
    }
  } else {
    return this.each(function(){
      parent = parent || $(this).parent();
      $.extend(options, _fit(this, parent, options.fit)||{});
      var r1 = _setSize(this, 'width', parent, options);
      var r2 = _setSize(this, 'height', parent, options);
      if (r1 || r2){
        $(this).addClass('easyui-fluid');
      } else {
        $(this).removeClass('easyui-fluid');
      }
    });
  }
  function _fit(target, parent, fit){
    if (!parent.length){return false;}
    var t = $(target)[0];
    var p = parent[0];
    var fcount = p.fcount || 0;
    if (fit){
      if (!t.fitted){
        t.fitted = true;
        p.fcount = fcount + 1;
        $(p).addClass('panel-noscroll');
        if (p.tagName == 'BODY'){
          $('html').addClass('panel-fit');
        }
      }
      return {
        width: ($(p).width()||1),
        height: ($(p).height()||1)
      };
    } else {
      if (t.fitted){
        t.fitted = false;
        p.fcount = fcount - 1;
        if (p.fcount == 0){
          $(p).removeClass('panel-noscroll');
          if (p.tagName == 'BODY'){
            $('html').removeClass('panel-fit');
          }
        }
      }
      return false;
    }
  }
  function _setSize(target, property, parent, options){
    var t = $(target);
    var p = property;
    var p1 = p.substr(0,1).toUpperCase() + p.substr(1);
    var min = $.parser.parseValue('min'+p1, options['min'+p1], parent);// || 0;
    var max = $.parser.parseValue('max'+p1, options['max'+p1], parent);// || 99999;
    var val = $.parser.parseValue(p, options[p], parent);
    var fluid = (String(options[p]||'').indexOf('%') >= 0 ? true : false);
    
    if (!isNaN(val)){
      var v = Math.min(Math.max(val, min||0), max||99999);
      if (!fluid){
        options[p] = v;
      }
      t._size('min'+p1, '');
      t._size('max'+p1, '');
      t._size(p, v);
    } else {
      t._size(p, '');
      t._size('min'+p1, min);
      t._size('max'+p1, max);
    }
    return fluid || options.fit;
  }
  /*
  property:string(minWidth,width,maxWidth,minHeight,height,maxHeight)
  value:string||int
  _css(target,string)
  _css(target,string,"")
  _css(target,string,int)
  */
  function _css(target, property, value){
    var t = $(target);
    if (value == undefined){
      //property-string(_css(target,string))
      value = parseInt(target.style[property]);
      if (isNaN(value)){return undefined;}
      if ($._boxModel){
        //value+padding+border
        value += getDeltaSize();
      }
      return value;
    } else if (value === ''){
      //_css(target,string,"")
      t.css(property, '');
    } else {
      //_css(target,string,int)
      if ($._boxModel){
        //value+padding+border
        value -= getDeltaSize();
        if (value < 0){value = 0;}
      }
      t.css(property, value+'px');
    }
    //padding+boder
    function getDeltaSize(){
      if (property.toLowerCase().indexOf('width') >= 0){
        return t.outerWidth() - t.width();
      } else {
        return t.outerHeight() - t.height();
      }
    }
  }
}
$.fn._outerHeight = function(height){
  if (height == undefined){
    if (this[0] == window){
      return this.height() || document.body.clientHeight;
    }
    return this.outerHeight()||0;
  }
  return this._size('height', height);
};
$.fn._outerWidth = function(width){
  if (width == undefined){
    if (this[0] == window){
      return this.width() || document.body.clientWidth;
    }
    return this.outerWidth()||0;
  }
  return this._size('width', width);
};
$.fn._scrollLeft = function(left){
  if (left == undefined){
    return this.scrollLeft();
  } else {
    return this.each(function(){$(this).scrollLeft(left)});
  }  
}
$.fn._propAttr = $.fn.prop || $.fn.attr;
$(function(){
  var d = $('<div style="position:absolute;top:-1000px;width:100px;height:100px;padding:5px"></div>').appendTo('body');
  $._boxModel = d.outerWidth()!=100;
  d.remove();
});