;(function($){
$.fn.menu = function(options, param){
  if (typeof options == 'string')
    return $.fn.menu.methods[options](this, param);
  
  options = options || {};
  return this.each(function(){
    var state = $.data(this, 'menu');
    if (state){
      $.extend(state.options, options);
    } else {
      state = $.data(this, 'menu', {
        options: $.extend({}, $.fn.menu.defaults, $.fn.menu.parseOptions(this), options)
      });
      init(this);
    }
    $(this).css({
      left: state.options.left,
      top: state.options.top
    });
  });
};
$.fn.menu.defaults = {   
  zIndex : 110000,
  left : 0,top : 0,
  alignTo : null,align : 'left',
  minWidth : 120,
  duration : 100,
  hideOnUnhover : true,
  onShow : function() {},
  onHide : function() {},
  onClick : function(item) {}
}
$.fn.menu.parseOptions = function(target){
  return $.extend({},$.parser.parseOptions(target, [{
    minWidth : 'number',
    duration : 'number',
    hideOnUnhover : 'boolean'    
  }]));
}
function init(target){
  var t = $(target)
  var menus;
  t.appendTo('body');
  t.addClass('menu-top');

  $(document).unbind('.menu').bind('mousedown.menu', function(e) {
    var m = $(e.target).closest('div.menu,div.combo-p');
    if (m.length) return
    $('body>div.menu-top:visible').menu('hide');
  });

  menus = splitMenu(target,t);
  for (var i = 0; i < menus.length; i++) {
    createMenu(target,menus[i]);
  }
}
function splitMenu(target,menu) {
  var menus = [];
  var submenu,mm
  menu.addClass('menu');
  menus.push(menu);
  if (!menu.hasClass('menu-content')) {
    menu.children('div').each(function() {
      submenu = $(this).children('div');
      if (submenu.length) {
        submenu.insertAfter(target);
        this.submenu = submenu; // point to the sub menu
        mm = splitMenu(target,submenu);
        menus = menus.concat(mm);
      }
    });
  }
  return menus;
}
function createMenu(target,menu) {
  var wh = $.parser.parseOptions(menu[0], [ 'width', 'height' ]);
  var item,itemOpts,text
  menu[0].originalHeight = wh.height || 0;
  if (menu.hasClass('menu-content')) {
    menu[0].originalWidth = wh.width || menu._outerWidth();
  } else {
    menu[0].originalWidth = wh.width || 0;
    menu.children('div').each(function() {
      item = $(this);
      itemOpts = $.extend({}, $.parser.parseOptions(this, [ 'name', 'iconCls', 'href', {
        separator : 'boolean'
      }]), {
        disabled : (item.attr('disabled') ? true : undefined)
      });
      if (itemOpts.separator)
        item.addClass('menu-sep');
      if (!item.hasClass('menu-sep')) {
        item[0].itemName = itemOpts.name || '';
        item[0].itemHref = itemOpts.href || '';

        text = item.addClass('menu-item').html();
        item.empty().append($('<div class="menu-text"></div>').html(text));
        if (itemOpts.iconCls)
          $('<div class="menu-icon"></div>').addClass(itemOpts.iconCls).appendTo(item);
        if (itemOpts.disabled)
          setDisabled(target,item[0], true);
        if (item[0].submenu)
          $('<div class="menu-rightarrow"></div>').appendTo(item);

        bindMenuItemEvent(target,item);
      }
    });
    $('<div class="menu-line"></div>').prependTo(menu);
  }
  setMenuSize(target,menu);
  menu.hide();
  bindMenuEvent(target,menu);
}
function setDisabled(target,itemEl,disabled) {
  var t = $(itemEl);
  if (!t.hasClass('menu-item')) return
  if (disabled) {
    t.addClass('menu-item-disabled');
    if (itemEl.onclick) {
      itemEl.onclick1 = itemEl.onclick;
      itemEl.onclick = null;
    }
  } else {
    t.removeClass('menu-item-disabled');
    if (itemEl.onclick1) {
      itemEl.onclick = itemEl.onclick1;
      itemEl.onclick1 = null;
    }
  }
}
function setMenuSize(target,menu) {
  var opts = $.data(target, 'menu').options;
  var style = menu.attr('style') || '';
  var el,width,height,at,h1,h2,lineHeight
  menu.css({
    display : 'block',
    left : -10000,
    height : 'auto',
    overflow : 'hidden'
  });

  el = menu[0];
  width = el.originalWidth || 0;
  if (!width) {
    width = 0;
    menu.find('div.menu-text').each(function() {
      if (width < $(this)._outerWidth())
        width = $(this)._outerWidth();
      $(this).closest('div.menu-item')._outerHeight($(this)._outerHeight() + 2);
    });
    width += 40;
  }

  width = Math.max(width, opts.minWidth);
  height = el.originalHeight || 0;
  if (!height) {
    height = menu.outerHeight();
    if (menu.hasClass('menu-top') && opts.alignTo) {
      at = $(opts.alignTo);
      h1 = at.offset().top - $(document).scrollTop();
      h2 = $(window)._outerHeight() + $(document).scrollTop() - at.offset().top - at._outerHeight();
      height = Math.min(height, Math.max(h1, h2));
    } else if (height > $(window)._outerHeight()) {
      height = $(window).height();
      style += ';overflow:auto';
    } else {
      style += ';overflow:hidden';
    }
  }
  lineHeight = Math.max(el.originalHeight, menu.outerHeight()) - 2;
  menu._outerWidth(width)._outerHeight(height);
  menu.children('div.menu-line')._outerHeight(lineHeight);

  style += ';width:' + el.style.width + ';height:' + el.style.height;
  menu.attr('style', style);
}
function bindMenuEvent(target,menu) {
  var state = $.data(target, 'menu').options;
  menu.unbind('.menu').bind('mouseenter.menu', function() {
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
  }).bind('mouseleave.menu', function() {
    if ($.data(target, 'menu').options.hideOnUnhover) {
      state.timer = setTimeout(function() {
        hideAll(target);
      }, $.data(target, 'menu').options.duration);
    }
  });
}
function bindMenuItemEvent(target,item){
  if (!item.hasClass('menu-item')) return
  item.unbind('.menu');
  item.bind('click.menu', function() {
    if ($(this).hasClass('menu-item-disabled'))
      return;
    if (!this.submenu) {
      hideAll(target);
      var href = this.itemHref;
      if (href)
        location.href = href;
    }
    var item = $(target).menu('getItem', this);
    $.data(target, 'menu').options.onClick.call(target, item);
  }).bind('mouseenter.menu', function(e) {
    item.siblings().each(function() {
      if (this.submenu)
        hideMenu(this.submenu);
      $(this).removeClass('menu-active');
    });
    item.addClass('menu-active');

    if ($(this).hasClass('menu-item-disabled')) {
      item.addClass('menu-active-disabled');
      return;
    }

    var submenu = item[0].submenu;
    if (submenu) {
      $(target).menu('show', {
        menu: submenu,
        parent: item
      });
    }
  }).bind('mouseleave.menu', function(e) {
    item.removeClass('menu-active menu-active-disabled');
    var submenu = item[0].submenu;
    if (submenu) {
      if (e.pageX >= parseInt(submenu.css('left')))
        item.addClass('menu-active');
      else
        hideMenu(submenu);
    } else {
      item.removeClass('menu-active');
    }
  });
}
function hideAll(target) {
  var t = $(target);
  var state = $.data(target, 'menu');
  if (state){
    if (t.is(':visible')) {
      hideMenu(t);
      state.options.onHide.call(target);
    }
  }
  return false;
}
function hideMenu(menu) {
  if (!menu) return;
  hideit(menu);
  menu.find('div.menu-item').each(function() {
    if (this.submenu)
      hideMenu(this.submenu);
    $(this).removeClass('menu-active');
  });
}
function hideit(m){
  m.stop(true, true);
  if (m[0].shadow)
    m[0].shadow.hide();
  m.hide();  
}
function showMenu(target,param){
  var left,top,menu,opts,at,parent;
  param = param || {};
  menu = $(param.menu || target);
  $(target).menu('resize', menu[0]);
  if (menu.hasClass('menu-top')) {
    opts = $.data(target, 'menu').options;
    $.extend(opts, param);
    left = opts.left;
    top = opts.top;
    if (opts.alignTo) {
      at = $(opts.alignTo);
      left = at.offset().left;
      top = at.offset().top + at._outerHeight();
      if (opts.align == 'right')
        left += at.outerWidth() - menu.outerWidth();
    }
    if (left + menu.outerWidth() > $(window)._outerWidth() + $(document)._scrollLeft())
      left = $(window)._outerWidth() + $(document).scrollLeft() - menu.outerWidth() - 5;
    if (left < 0)
      left = 0;
    top = _fixTop(menu,top,opts.alignTo);
  } else {
    parent = param.parent;
    left = parent.offset().left + parent.outerWidth() - 2;
    if (left + menu.outerWidth() + 5 > $(window)._outerWidth() + $(document).scrollLeft())
      left = parent.offset().left - menu.outerWidth() + 2;
    top = _fixTop(menu,parent.offset().top - 3);
  }  
  menu.css({
    left : left,
    top : top
  });
  menu.show(0, function() {
    if (!menu[0].shadow)
      menu[0].shadow = $('<div class="menu-shadow"></div>').insertAfter(menu);
    menu[0].shadow.css({
      display : 'block',
      zIndex : $.fn.menu.defaults.zIndex++,
      left : menu.css('left'),
      top : menu.css('top'),
      width : menu.outerWidth(),
      height : menu.outerHeight()
    });
    menu.css('z-index', $.fn.menu.defaults.zIndex++);
    if (menu.hasClass('menu-top'))
      $.data(target, 'menu').options.onShow.call(menu[0]);
  });
}
function _fixTop(menu,top,alignTo) {
  if (top + menu.outerHeight() > $(window)._outerHeight() + $(document).scrollTop()) {
    if (alignTo)
      top = $(alignTo).offset().top - menu._outerHeight();
    else
      top = $(window)._outerHeight() + $(document).scrollTop() - menu.outerHeight();
  }
  if (top < 0)
    top = 0;
  return top;
}

$.fn.menu.methods = {
  options : function(jq) {
    return $.data(jq[0], 'menu').options;
  },
  show : function(jq, pos) {
    return jq.each(function() {
      showMenu(this, pos);
    });
  },
  hide : function(jq) {
    return jq.each(function() {
      hideAll(this);
    });
  },
  destroy : function(jq) {
    return jq.each(function() {
      destroyMenu(this);
    });
  },
  setText : function(jq, param) {
    return jq.each(function() {
      $(param.target).children('div.menu-text').html(param.text);
    });
  },
  setIcon : function(jq, param) {
    return jq.each(function() {
      $(param.target).children('div.menu-icon').remove();
      if (param.iconCls) {
        $('<div class="menu-icon"></div>').addClass(param.iconCls).appendTo(param.target);
      }
    });
  },
  getItem : function(jq, itemEl) {
    var t = $(itemEl);
    var item = {
      target : itemEl,
      id : t.attr('id'),
      text : $.trim(t.children('div.menu-text').html()),
      disabled : t.hasClass('menu-item-disabled'),
      name : itemEl.itemName,
      href : itemEl.itemHref,
      onclick : itemEl.onclick
    }
    var icon = t.children('div.menu-icon');
    if (icon.length) {
      var cc = [];
      var aa = icon.attr('class').split(' ');
      for (var i = 0; i < aa.length; i++) {
        if (aa[i] != 'menu-icon')
          cc.push(aa[i]);
      }
      item.iconCls = cc.join(' ');
    }
    return item;
  },
  findItem : function(jq, text) {
    return findItem(jq[0], text);
  },
  appendItem : function(jq, param) {
    return jq.each(function() {
      appendItem(this, param);
    });
  },
  removeItem : function(jq, itemEl) {
    return jq.each(function() {
      removeItem(this, itemEl);
    });
  },
  enableItem : function(jq, itemEl) {
    return jq.each(function() {
      setDisabled(this, itemEl, false);
    });
  },
  disableItem : function(jq, itemEl) {
    return jq.each(function() {
      setDisabled(this, itemEl, true);
    });
  },
  showItem : function(jq, itemEl) {
    return jq.each(function() {
      setVisible(this, itemEl, true);
    });
  },
  hideItem : function(jq, itemEl) {
    return jq.each(function() {
      setVisible(this, itemEl, false);
    });
  },
  resize : function(jq, menuEl) {
    return jq.each(function() {
      setMenuSize(this, $(menuEl));
    });
  }
};
})(jQuery)