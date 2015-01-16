/**
 * jQuery EasyUI 1.4.1
 *
 * Copyright (c) 2009-2014 www.jeasyui.com. All rights reserved.
 *
 * Licensed under the GPL license: http://www.gnu.org/licenses/gpl.txt
 * To use it on other terms please contact us at info@jeasyui.com
 *
 */
(function($) {
  $.fn._remove = function() {
    return this.each(function() {
      $(this).remove();
      try {
        this.outerHTML = "";
      } catch (err) {}
    });
  };

  function removeNode(node) {
    node._remove();
  };

  function setSize(target, param) {
    var state = $.data(target, "panel");
    var options = state.options;
    var panel = state.panel;
    var pheader = panel.children("div.panel-header");
    var pbody = panel.children("div.panel-body");
    var pfooter = panel.children("div.panel-footer");
    if (param) {
      $.extend(options, {
        width: param.width,
        height: param.height,
        minWidth: param.minWidth,
        maxWidth: param.maxWidth,
        minHeight: param.minHeight,
        maxHeight: param.maxHeight,
        left: param.left,
        top: param.top
      });
    }
    panel._size(options);
    pheader.add(pbody)._outerWidth(panel.width());
    if (!isNaN(parseInt(options.height))) {
      pbody._outerHeight(panel.height() - pheader._outerHeight() - pfooter._outerHeight());
    } else {
      pbody.css("height", "");
      var minHeight = $.parser.parseValue("minHeight", options.minHeight, panel.parent());
      var maxHeight = $.parser.parseValue("maxHeight", options.maxHeight, panel.parent());
      var height = pheader._outerHeight() + pfooter._outerHeight() + panel._outerHeight() - panel.height();
      pbody._size("minHeight", minHeight ? (minHeight - height) : "");
      pbody._size("maxHeight", maxHeight ? (maxHeight - height) : "");
    }
    panel.css({
      height: "",
      minHeight: "",
      maxHeight: "",
      left: options.left,
      top: options.top
    });
    options.onResize.apply(target, [options.width, options.height]);
    $(target).panel("doLayout");
  };

  function movePanel(target, param) {
    var options = $.data(target, "panel").options;
    var panel = $.data(target, "panel").panel;
    if (param) {
      if (param.left != null) {
        options.left = param.left;
      }
      if (param.top != null) {
        options.top = param.top;
      }
    }
    panel.css({
      left: options.left,
      top: options.top
    });
    options.onMove.apply(target, [options.left, options.top]);
  };

  function wrapPanel(target) {
    $(target).addClass("panel-body")._size("clear");
    var panel = $("<div class=\"panel\"></div>").insertBefore(target);
    panel[0].appendChild(target);
    panel.bind("_resize", function(e, force) {
      if ($(this).hasClass("easyui-fluid") || force) {
        setSize(target);
      }
      return false;
    });
    return panel;
  };

  function addHeader(target) {
    var state = $.data(target, "panel");
    var options = state.options;
    var panel = state.panel;
    panel.css(options.style);
    panel.addClass(options.cls);
    initPanelTool();
    initPanelFooter();
    var pheader = $(target).panel("header");
    var pbody = $(target).panel("body");
    var pfooter = $(target).siblings("div.panel-footer");
    if (options.border) {
      pheader.removeClass("panel-header-noborder");
      pbody.removeClass("panel-body-noborder");
      pfooter.removeClass("panel-footer-noborder");
    } else {
      pheader.addClass("panel-header-noborder");
      pbody.addClass("panel-body-noborder");
      pfooter.addClass("panel-footer-noborder");
    }
    pheader.addClass(options.headerCls);
    pbody.addClass(options.bodyCls);
    $(target).attr("id", options.id || "");
    if (options.content) {
      $(target).panel("clear");
      $(target).html(options.content);
      $.parser.parse($(target));
    }

    function initPanelTool() {
      if (options.tools && typeof options.tools == "string") {
        panel.find(">div.panel-header>div.panel-tool .panel-tool-a").appendTo(options.tools);
      }
      removeNode(panel.children("div.panel-header"));
      if (options.title && !options.noheader) {
        var pheader = $("<div class=\"panel-header\"></div>").prependTo(panel);
        var ptitle = $("<div class=\"panel-title\"></div>").html(options.title).appendTo(pheader);
        if (options.iconCls) {
          ptitle.addClass("panel-with-icon");
          $("<div class=\"panel-icon\"></div>").addClass(options.iconCls).appendTo(pheader);
        }
        var ptool = $("<div class=\"panel-tool\"></div>").appendTo(pheader);
        ptool.bind("click", function(e) {
          e.stopPropagation();
        });
        if (options.tools) {
          if ($.isArray(options.tools)) {
            for (var i = 0; i < options.tools.length; i++) {
              var t = $("<a href=\"javascript:void(0)\"></a>").addClass(options.tools[i].iconCls).appendTo(ptool);
              if (options.tools[i].handler) {
                t.bind("click", eval(options.tools[i].handler));
              }
            }
          } else {
            $(options.tools).children().each(function() {
              $(this).addClass($(this).attr("iconCls")).addClass("panel-tool-a").appendTo(ptool);
            });
          }
        }
        if (options.collapsible) {
          $("<a class=\"panel-tool-collapse\" href=\"javascript:void(0)\"></a>").appendTo(ptool).bind("click", function() {
            if (options.collapsed == true) {
              expandPanel(target, true);
            } else {
              collapsePanel(target, true);
            }
            return false;
          });
        }
        if (options.minimizable) {
          $("<a class=\"panel-tool-min\" href=\"javascript:void(0)\"></a>").appendTo(ptool).bind("click", function() {
            minimizePanel(target);
            return false;
          });
        }
        if (options.maximizable) {
          $("<a class=\"panel-tool-max\" href=\"javascript:void(0)\"></a>").appendTo(ptool).bind("click", function() {
            if (options.maximized == true) {
              restorePanel(target);
            } else {
              maximizePanel(target);
            }
            return false;
          });
        }
        if (options.closable) {
          $("<a class=\"panel-tool-close\" href=\"javascript:void(0)\"></a>").appendTo(ptool).bind("click", function() {
            closePanel(target);
            return false;
          });
        }
        panel.children("div.panel-body").removeClass("panel-body-noheader");
      } else {
        panel.children("div.panel-body").addClass("panel-body-noheader");
      }
    };

    function initPanelFooter() {
      if (options.footer) {
        $(options.footer).addClass("panel-footer").appendTo(panel);
        $(target).addClass("panel-body-nobottom");
      } else {
        panel.children("div.panel-footer").remove();
        $(target).removeClass("panel-body-nobottom");
      }
    };
  };

  function refresh(target, queryParams) {
    var state = $.data(target, "panel");
    var options = state.options;
    if (queryParams) {
      options.queryParams = queryParams;
    }
    if (!options.href) {
      return;
    }
    if (!state.isLoaded || !options.cache) {
      var queryParams = $.extend({}, options.queryParams);
      if (options.onBeforeLoad.call(target, queryParams) == false) {
        return;
      }
      state.isLoaded = false;
      $(target).panel("clear");
      if (options.loadingMessage) {
        $(target).html($("<div class=\"panel-loading\"></div>").html(options.loadingMessage));
      }
      options.loader.call(target, queryParams, function(data) {
        var result = options.extractor.call(target, data);
        $(target).html(result);
        $.parser.parse($(target));
        options.onLoad.apply(target, arguments);
        state.isLoaded = true;
      }, function() {
        options.onLoadError.apply(target, arguments);
      });
    }
  };

  function clear(target) {
    var t = $(target);
    t.find(".combo-f").each(function() {
      $(this).combo("destroy");
    });
    t.find(".m-btn").each(function() {
      $(this).menubutton("destroy");
    });
    t.find(".s-btn").each(function() {
      $(this).splitbutton("destroy");
    });
    t.find(".tooltip-f").each(function() {
      $(this).tooltip("destroy");
    });
    t.children("div").each(function() {
      $(this)._size("unfit");
    });
    t.empty();
  };

  function setLayout(target) {
    $(target).panel("doLayout", true);
  };

  function openPanel(target, param) {
    var options = $.data(target, "panel").options;
    var panel = $.data(target, "panel").panel;
    if (param != true) {
      if (options.onBeforeOpen.call(target) == false) {
        return;
      }
    }
    panel.stop(true, true);
    if ($.isFunction(options.openAnimation)) {
      options.openAnimation.call(target, cb);
    } else {
      switch (options.openAnimation) {
        case "slide":
          panel.slideDown(options.openDuration, cb);
          break;
        case "fade":
          panel.fadeIn(options.openDuration, cb);
          break;
        case "show":
          panel.show(options.openDuration, cb);
          break;
        default:
          panel.show();
          cb();
      }
    }

    function cb() {
      options.closed = false;
      options.minimized = false;
      var prestore = panel.children("div.panel-header").find("a.panel-tool-restore");
      if (prestore.length) {
        options.maximized = true;
      }
      options.onOpen.call(target);
      if (options.maximized == true) {
        options.maximized = false;
        maximizePanel(target);
      }
      if (options.collapsed == true) {
        options.collapsed = false;
        collapsePanel(target);
      }
      if (!options.collapsed) {
        refresh(target);
        setLayout(target);
      }
    };
  };

  function closePanel(target, forceClose) {
    var opts = $.data(target, "panel").options;
    var panel = $.data(target, "panel").panel;
    if (forceClose != true) {
      if (opts.onBeforeClose.call(target) == false) {
        return;
      }
    }
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
          panel.hide();
          cb();
      }
    }

    function cb() {
      opts.closed = true;
      opts.onClose.call(target);
    };
  };

  function destroyPanel(target, forceDestroy) {
    var state = $.data(target, "panel");
    var opts = state.options;
    var panel = state.panel;
    if (forceDestroy != true) {
      if (opts.onBeforeDestroy.call(target) == false) {
        return;
      }
    }
    $(target).panel("clear").panel("clear", "footer");
    removeNode(panel);
    opts.onDestroy.call(target);
  };

  function collapsePanel(target, animate) {
    var opts = $.data(target, "panel").options;
    var panel = $.data(target, "panel").panel;
    var body = panel.children("div.panel-body");
    var tool = panel.children("div.panel-header").find("a.panel-tool-collapse");
    if (opts.collapsed == true) {
      return;
    }
    body.stop(true, true);
    if (opts.onBeforeCollapse.call(target) == false) {
      return;
    }
    tool.addClass("panel-tool-expand");
    if (animate == true) {
      body.slideUp("normal", function() {
        opts.collapsed = true;
        opts.onCollapse.call(target);
      });
    } else {
      body.hide();
      opts.collapsed = true;
      opts.onCollapse.call(target);
    }
  };

  function expandPanel(target, animate) {
    var opts = $.data(target, "panel").options;
    var panel = $.data(target, "panel").panel;
    var body = panel.children("div.panel-body");
    var tool = panel.children("div.panel-header").find("a.panel-tool-collapse");
    if (opts.collapsed == false) {
      return;
    }
    body.stop(true, true);
    if (opts.onBeforeExpand.call(target) == false) {
      return;
    }
    tool.removeClass("panel-tool-expand");
    if (animate == true) {
      body.slideDown("normal", function() {
        opts.collapsed = false;
        opts.onExpand.call(target);
        refresh(target);
        setLayout(target);
      });
    } else {
      body.show();
      opts.collapsed = false;
      opts.onExpand.call(target);
      refresh(target);
      setLayout(target);
    }
  };

  function maximizePanel(target) {
    var opts = $.data(target, "panel").options;
    var panel = $.data(target, "panel").panel;
    var tool = panel.children("div.panel-header").find("a.panel-tool-max");
    if (opts.maximized == true) {
      return;
    }
    tool.addClass("panel-tool-restore");
    if (!$.data(target, "panel").original) {
      $.data(target, "panel").original = {
        width: opts.width,
        height: opts.height,
        left: opts.left,
        top: opts.top,
        fit: opts.fit
      };
    }
    opts.left = 0;
    opts.top = 0;
    opts.fit = true;
    setSize(target);
    opts.minimized = false;
    opts.maximized = true;
    opts.onMaximize.call(target);
  };

  function minimizePanel(target) {
    var opts = $.data(target, "panel").options;
    var panel = $.data(target, "panel").panel;
    panel._size("unfit");
    panel.hide();
    opts.minimized = true;
    opts.maximized = false;
    opts.onMinimize.call(target);
  };

  function restorePanel(target) {
    var opts = $.data(target, "panel").options;
    var panel = $.data(target, "panel").panel;
    var tool = panel.children("div.panel-header").find("a.panel-tool-max");
    if (opts.maximized == false) {
      return;
    }
    panel.show();
    tool.removeClass("panel-tool-restore");
    $.extend(opts, $.data(target, "panel").original);
    setSize(target);
    opts.minimized = false;
    opts.maximized = false;
    $.data(target, "panel").original = null;
    opts.onRestore.call(target);
  };

  function setTitle(target, title) {
    $.data(target, "panel").options.title = title;
    $(target).panel("header").find("div.panel-title").html(title);
  };
  var timer = null;
  $(window).unbind(".panel").bind("resize.panel", function() {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function() {
      var layout = $("body.layout");
      if (layout.length) {
        layout.layout("resize");
        $("body").children(".easyui-fluid:visible").trigger("_resize");
      } else {
        $("body").panel("doLayout");
      }
      timer = null;
    }, 100);
  });
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
        state.isLoaded = false;
      } else {
        opts = $.extend({}, $.fn.panel.defaults, $.fn.panel.parseOptions(this), options);
        $(this).attr("title", "");
        state = $.data(this, "panel", {
          options: opts,
          panel: wrapPanel(this),
          isLoaded: false
        });
      }
      addHeader(this);
      if (opts.doSize == true) {
        state.panel.css("display", "block");
        setSize(this);
      }
      if (opts.closed == true || opts.minimized == true) {
        state.panel.hide();
      } else {
        openPanel(this);
      }
    });
  };
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
    setTitle: function(jq, param) {
      return jq.each(function() {
        setTitle(this, param);
      });
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
    destroy: function(jq, param) {
      return jq.each(function() {
        destroyPanel(this, param);
      });
    },
    clear: function(jq, param) {
      return jq.each(function() {
        clear(param == "footer" ? $(this).panel("footer") : this);
      });
    },
    refresh: function(jq, param) {
      return jq.each(function() {
        var state = $.data(this, "panel");
        state.isLoaded = false;
        if (param) {
          if (typeof param == "string") {
            state.options.href = param;
          } else {
            state.options.queryParams = param;
          }
        }
        refresh(this);
      });
    },
    resize: function(jq, param) {
      return jq.each(function() {
        setSize(this, param);
      });
    },
    doLayout: function(jq, all) {
      return jq.each(function() {
        doLayout2(this, "body");
        doLayout2($(this).siblings("div.panel-footer")[0], "footer");

        function doLayout2(jq2, bodyOrFooter) {
          if (!jq2) {
            return;
          }
          var flag = jq2 == $("body")[0];
          var s = $(jq2).find("div.panel:visible,div.accordion:visible,div.tabs-container:visible,div.layout:visible,.easyui-fluid:visible").filter(function(index, el) {
            var p = $(el).parents("div.panel-" + bodyOrFooter + ":first");
            return flag ? p.length == 0 : p[0] == jq2;
          });
          s.trigger("_resize", [all || false]);
        };
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
  };
  $.fn.panel.parseOptions = function(target) {
    var t = $(target);
    return $.extend({}, $.parser.parseOptions(target, ["id", "width", "height", "left", "top", "title", "iconCls", "cls", "headerCls", "bodyCls", "tools", "href", "method", {
      cache: "boolean",
      fit: "boolean",
      border: "boolean",
      noheader: "boolean"
    }, {
      collapsible: "boolean",
      minimizable: "boolean",
      maximizable: "boolean"
    }, {
      closable: "boolean",
      collapsed: "boolean",
      minimized: "boolean",
      maximized: "boolean",
      closed: "boolean"
    }, "openAnimation", "closeAnimation", {
      openDuration: "number",
      closeDuration: "number"
    }, ]), {
      loadingMessage: (t.attr("loadingMessage") != undefined ? t.attr("loadingMessage") : undefined)
    });
  };
  $.fn.panel.defaults = {
    id: null,
    title: null,
    iconCls: null,
    width: "auto",
    height: "auto",
    left: null,
    top: null,
    cls: null,
    headerCls: null,
    bodyCls: null,
    style: {},
    href: null,
    cache: true,
    fit: false,
    border: true,
    doSize: true,
    noheader: false,
    content: null,
    collapsible: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    collapsed: false,
    minimized: false,
    maximized: false,
    closed: false,
    openAnimation: false,
    openDuration: 400,
    closeAnimation: false,
    closeDuration: 400,
    tools: null,
    footer: null,
    queryParams: {},
    method: "get",
    href: null,
    loadingMessage: "Loading...",
    loader: function(param, success, error) {
      var opts = $(this).panel("options");
      if (!opts.href) {
        return false;
      }
      $.ajax({
        type: opts.method,
        url: opts.href,
        cache: false,
        data: param,
        dataType: "html",
        success: function(data) {
          success(data);
        },
        error: function() {
          error.apply(this, arguments);
        }
      });
    },
    extractor: function(data) {
      var patterns = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
      var matchers = patterns.exec(data);
      if (matchers) {
        return matchers[1];
      } else {
        return data;
      }
    },
    onBeforeLoad: function(param) {},
    onLoad: function() {},
    onLoadError: function() {},
    onBeforeOpen: function() {},
    onOpen: function() {},
    onBeforeClose: function() {},
    onClose: function() {},
    onBeforeDestroy: function() {},
    onDestroy: function() {},
    onResize: function(width, height) {},
    onMove: function(left, top) {},
    onMaximize: function() {},
    onRestore: function() {},
    onMinimize: function() {},
    onBeforeCollapse: function() {},
    onBeforeExpand: function() {},
    onCollapse: function() {},
    onExpand: function() {}
  };
})(jQuery);