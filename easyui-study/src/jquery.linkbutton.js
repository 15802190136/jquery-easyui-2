;(function($){
$.fn.linkbutton = function(options, param){
  if (typeof options == 'string')
    return $.fn.linkbutton.methods[options](this, param);
  
  options = options || {};
  return this.each(function(){
    var state = $.data(this, 'linkbutton');
    if (state){
      $.extend(state.options, options);
    } else {
      $.data(this, 'linkbutton', {
        options: $.extend({}, $.fn.linkbutton.defaults, $.fn.linkbutton.parseOptions(this), options)
      });
      $(this).removeAttr('disabled');
      $(this).bind('_resize', function(e, force){
        if ($(this).hasClass('easyui-fluid') || force)
          setSize(this);
        return false;
      });
    }
    createButton(this);
    setSize(this);
  });  
}
$.fn.linkbutton.defaults = {
  id: null,
  disabled: false,
  toggle: true,
  selected: false,
  text: '',
  iconCls: null,
  size: 'small',  // small,large
  onClick: function(){}
}
$.fn.linkbutton.parseOptions = function(target){
  var t = $(target)
  return $.extend({},$.parser.parseOptions(target,['id','iconCls','size',{toggle:'boolean',selected:'boolean'}]),{ 
    disabled: (t.attr('disabled') ? true : undefined),
    text: $.trim(t.html()),
    iconCls: (t.attr('icon') || t.attr('iconCls'))
  })
}
function createButton(target){
  var opts = $.data(target, 'linkbutton').options;
  var t = $(target).empty();
  t.empty().addClass('l-btn').removeClass('l-btn-selected');
  t.removeClass('l-btn-small l-btn-medium l-btn-large').addClass('l-btn-'+opts.size);
  if (opts.selected)
    t.addClass('l-btn-selected');
  t.attr('id', opts.id || '');

  var inner = $('<span class="l-btn-left"></span>').appendTo(t);
  if (opts.text)
    $('<span class="l-btn-text"></span>').html(opts.text).appendTo(inner);
  else
    $('<span class="l-btn-text l-btn-empty">&nbsp;</span>').appendTo(inner);
  if (opts.iconCls){
    $('<span class="l-btn-icon">&nbsp;</span>').addClass(opts.iconCls).appendTo(inner);
    inner.addClass('l-btn-icon-left');
  }
  t.unbind('.linkbutton').bind('click.linkbutton',function(){
    if (!opts.disabled){
      if (opts.toggle){
        if (opts.selected)
          $(this).linkbutton('unselect');
        else
          $(this).linkbutton('select');
      }
      opts.onClick.call(this);
    }
  })
  setSelected(target,opts.selected)
  setDisabled(target,opts.disabled)
}
function setSelected(target,selected){
  var state = $.data(target, 'linkbutton');
  var t = $(target);
  var opts = state.options;
  if (selected){
    t.addClass('l-btn-selected');
    opts.selected = true;
  } else {
    t.removeClass('l-btn-selected');
    opts.selected = false;
  }
}
function setDisabled(target,disabled){
  var state = $.data(target, 'linkbutton');
  var t = $(target);
  var opts = state.options;
  t.removeClass('l-btn-disabled');
  if (disabled){
    opts.disabled = true;
    var href = t.attr('href');
    if (href){
      state.href = href;
      t.attr('href', 'javascript:void(0)');
    }
    if (target.onclick){
      state.onclick = target.onclick;
      target.onclick = null;
    }
    t.addClass('l-btn-disabled');
  } else {
    opts.disabled = false;
    if (state.href)
      t.attr('href', state.href);
    if (state.onclick)
      target.onclick = state.onclick;
  }
}
function setSize(target,param){
  var state = $.data(target, 'linkbutton');
  var t = $(target);
  var opts = state.options;
  if (param)
    $.extend(opts, param);
  if (opts.width || opts.height || opts.fit){
    var parent = btn.parent();
    var isVisible = btn.is(':visible');
    if (!isVisible){
      var spacer = $('<div style="display:none"></div>').insertBefore(target);
      var style = {
        position: btn.css('position'),
        display: btn.css('display'),
        left: btn.css('left')
      }
      btn.appendTo('body');
      btn.css({
        position: 'absolute',
        display: 'inline-block',
        left: -20000
      })
    }
    btn._size(opts, parent);
    $inner.css('margin-top', 0);
    $inner.css('margin-top', parseInt((btn.height()-$inner.height())/2)+'px');
    if (!isVisible){
      btn.insertAfter(spacer);
      btn.css(style);
      spacer.remove();
    }
  }
}
$.fn.linkbutton.methods = {
  options: function(jq){
    return $.data(jq[0], 'linkbutton').options;
  },
  resize: function(jq, param){
    return jq.each(function(){
      setSize(this, param);
    });
  },
  enable: function(jq){
    return jq.each(function(){
      setDisabled(this, false);
    });
  },
  disable: function(jq){
    return jq.each(function(){
      setDisabled(this, true);
    });
  },
  select: function(jq){
    return jq.each(function(){
      setSelected(this, true);
    });
  },
  unselect: function(jq){
    return jq.each(function(){
      setSelected(this, false);
    });
  }
};
})(jQuery);