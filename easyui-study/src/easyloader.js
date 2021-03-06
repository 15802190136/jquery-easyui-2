(function(){
var modules = {
  parser:{
    js:'jquery.parser.js'
  },
  draggable:{
    js:'jquery.draggable.js'
  },
  droppable:{
    js:'jquery.droppable.js'
  },
  resizable:{
    js:'jquery.resizable.js'
  },
  panel: {
    js:'jquery.panel.js',
    css:'panel.css'
  },
  tooltip: {
    js:'jquery.tooltip.js',
    css:'tooltip.css'
  }
}
var queues = {};
function loadSingle(name, callback){
  queues[name] = 'loading';
  
  var module = modules[name];
  var jsStatus = 'loading';
  var cssStatus = (easyloader.css && module['css']) ? 'loading' : 'loaded';
  var url;
  if (easyloader.css && module['css']){
    if (/^http/i.test(module['css']))
      url = module['css'];
    else
      url = easyloader.base + 'css/'+ module['css'];
    loadCss(url, function(){
      cssStatus = 'loaded';
      if (jsStatus == 'loaded' && cssStatus == 'loaded')
        finish();
    });
  }
  
  if (/^http/i.test(module['js']))
    url = module['js'];
  else
    url = easyloader.base + 'src/' + module['js'];
  loadJs(url, function(){
    jsStatus = 'loaded';
    if (jsStatus == 'loaded' && cssStatus == 'loaded')
      finish();
  });
  
  function finish(){
    queues[name] = 'loaded';
    easyloader.onProgress(name);
    if (callback)
      callback();
  }
}
function loadModule(name, callback){
  var mm = [];
  var doLoad = false;
  var time = 0;
  if (typeof name == 'string'){
    add(name);
  } else {
    for(var i=0; i<name.length; i++){
      add(name[i]);
    }
  }
  loadMm();
  function add(name){
    if (!modules[name]) return;
    var d = modules[name]['dependencies'];
    if (d){
      for(var i=0; i<d.length; i++){
        add(d[i]);
      }
    }
    mm.push(name);
  }
  
  function loadMm(){
    if (mm.length){
      var m = mm[0];  // the first module
      if (!queues[m]){
        doLoad = true;
        loadSingle(m, function(){
          mm.shift();
          loadMm();
        });
      } else if (queues[m] == 'loaded'){
        mm.shift();
        loadMm();
      } else {
        if (time < easyloader.timeout){
          time += 10;
          setTimeout(arguments.callee, 10);
        }
      }
    }else{
      finish();
    }
  }
  function finish(){
    if (callback) 
      callback();
    easyloader.onLoad(name);
  }
}
function loadCss(url, callback){
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.media = 'screen';
  link.href = url;
  document.getElementsByTagName('head')[0].appendChild(link);
  if (callback)
    callback.call(link);
}
function loadJs(url, callback){
  var done = false;
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.language = 'javascript';
  script.src = url;
  script.onload = script.onreadystatechange = function(){
    if (!done && (!script.readyState || script.readyState == 'loaded' || script.readyState == 'complete')){
      done = true;
      script.onload = script.onreadystatechange = null;
      if (callback)
        callback.call(script);
    }
  }
  document.getElementsByTagName("head")[0].appendChild(script);
}
easyloader = {
  base:"../",
  modules:modules,
  css:true,
  timeout:2000,
  load: function(name, callback){
    loadModule(name, callback);
  },
  onProgress: function(name){},
  onLoad: function(name){}
}
window.using = easyloader.load;
if (window.jQuery){
  jQuery(function(){
    easyloader.load('parser', function(){
      jQuery.parser.parse();
    });
  });
}

})();