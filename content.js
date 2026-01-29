(function(){
  try{
    if (document && document.documentElement) {
      if (document.documentElement.dataset && document.documentElement.dataset.pipHelperInjected === '1') return;
      document.documentElement.dataset.pipHelperInjected = '1';
    }
  }catch(e){}

  if (globalThis.__pipHelperInjected) return;
  globalThis.__pipHelperInjected = true;

  // Inject a page-context script to remove or neutralize disablePictureInPicture
  // This runs in the page JS context (not the content script isolated world)
  try{
    const pageScript = '(' + function(){
      try{
        function removeExisting(){
          try{ document.querySelectorAll('video[disablePictureInPicture]').forEach(v=>v.removeAttribute('disablePictureInPicture')); }catch(e){}
        }

        // Override the prototype property so reads return false and writes are ignored
        try{
          const desc = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'disablePictureInPicture');
          if(!desc || desc.configurable){
            Object.defineProperty(HTMLVideoElement.prototype, 'disablePictureInPicture', {
              configurable: true,
              get: function(){ return false; },
              set: function(_){ /* ignore attempts to set */ }
            });
          }
        }catch(e){}

        // Prevent scripts from adding the attribute via setAttribute
        try{
          const orig = Element.prototype.setAttribute;
          Element.prototype.setAttribute = function(name, value){
            if(name === 'disablePictureInPicture') return;
            return orig.apply(this, arguments);
          };
        }catch(e){}

        removeExisting();

        // Observe future additions and attribute changes
        try{
          const mo = new MutationObserver(muts=>{
            muts.forEach(m=>{
              if(m.type === 'attributes' && m.attributeName === 'disablePictureInPicture' && m.target && m.target.removeAttribute){
                try{ m.target.removeAttribute('disablePictureInPicture'); }catch(e){}
              }
              if(m.addedNodes && m.addedNodes.length){
                m.addedNodes.forEach(n=>{
                  try{
                    if(n.nodeType===1){
                      if(n.matches && n.matches('video') && n.hasAttribute && n.hasAttribute('disablePictureInPicture')) n.removeAttribute('disablePictureInPicture');
                      n.querySelectorAll && n.querySelectorAll('video[disablePictureInPicture]').forEach(v=>v.removeAttribute('disablePictureInPicture'));
                    }
                  }catch(e){}
                });
              }
            });
          });
          mo.observe(document, {childList:true, subtree:true, attributes:true, attributeFilter:['disablePictureInPicture']});
        }catch(e){}

      }catch(e){ console.error('pip-helper page script error', e); }
    } + ')();';

    const s = document.createElement('script');
    s.textContent = pageScript;
    (document.head||document.documentElement).appendChild(s);
    s.remove();
  }catch(e){ console.warn('pip-helper: failed injecting page script', e); }

  const PIP_BUTTON_CLASS = 'pip-helper-btn';
  const WRAPPER_CLASS = 'pip-helper-wrapper';

  function isProbablyDRM(video){
    try{
      if(typeof navigator.requestMediaKeySystemAccess === 'function') return true;
      if(video && (video.mediaKeys || video.webkitKeys)) return true;
    }catch(e){}
    return false;
  }

  function createButtonForVideo(video){
    if(!video || video.dataset.pipHelper) return;
    video.dataset.pipHelper = '1';

    console.info('PiP Helper: attaching to video', video, 'drm?', !!isProbablyDRM(video));

    const btn = document.createElement('button');
    btn.className = PIP_BUTTON_CLASS;
    btn.setAttribute('aria-label', 'Picture in Picture');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><rect x="14" y="15" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1.6" fill="currentColor"/></svg>';

    Object.assign(btn.style, {
      position: 'absolute',
      zIndex: 2147483647,
      right: '10px',
      bottom: '10px',
      padding: '6px 8px',
      background: 'rgba(0,0,0,0.75)',
      color: '#fff',
      opacity: '0.5',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      pointerEvents: 'auto'
    });

    const wrapper = document.createElement('div');
    wrapper.className = WRAPPER_CLASS;
    Object.assign(wrapper.style, {
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: 2147483646
    });

    wrapper.appendChild(btn);
    document.body.appendChild(wrapper);

    function place(){
      try{
        const rect = video.getBoundingClientRect();
        wrapper.style.top = (window.scrollY + rect.top) + 'px';
        wrapper.style.left = (window.scrollX + rect.left) + 'px';
        wrapper.style.width = rect.width + 'px';
        wrapper.style.height = rect.height + 'px';
        btn.style.pointerEvents = 'auto';
        btn.style.position = 'absolute';
        btn.style.right = '10px';
        btn.style.bottom = '10px';
      }catch(e){
        // video might be removed
      }
    }

    const ro = new ResizeObserver(place);
    try{ ro.observe(video); }catch(e){}

    const mo = new MutationObserver(place);
    try{ mo.observe(document.body, {attributes:true, childList:true, subtree:true}); }catch(e){}

    btn.addEventListener('click', async (e)=>{
      e.stopPropagation();
      try{
        // force-remove attribute and override per-element property to prevent re-adding
        try{ video.removeAttribute && video.removeAttribute('disablePictureInPicture'); }catch(e){}
        try{ Object.defineProperty(video, 'disablePictureInPicture', { configurable: true, get: () => false, set: () => {} }); }catch(e){}
        // small delay to allow page scripts to react
        await new Promise(r => setTimeout(r, 40));

        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        await video.requestPictureInPicture();
      }catch(err){
        console.warn('PiP failed', err);
        alert('PiP failed: ' + (err && err.message ? err.message : err));
      }
    });

    function cleanup(){
      try{ wrapper.remove(); }catch(e){}
      try{ ro.disconnect(); mo.disconnect(); }catch(e){}
      delete video.dataset.pipHelper;
    }

    video.addEventListener('emptied', cleanup);
    video.addEventListener('abort', cleanup);
    video.addEventListener('pause', ()=>{});
    // detect EME-encrypted playback
    video.addEventListener('encrypted', (ev)=>{
      console.info('PiP Helper: video emitted encrypted event (likely DRM):', ev);
    }, {once:true});

    place();
  }

  // Recursively search for video elements including shadow roots and same-origin iframes
  function findVideosRoot(root=document){
    const videos = [];
    try{
      if(root.querySelectorAll) root.querySelectorAll('video').forEach(v=>videos.push(v));
    }catch(e){}

    // shadow root search
    try{
      const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
      let node = treeWalker.currentNode;
      while(node){
        try{
          if(node.shadowRoot){
            node.shadowRoot.querySelectorAll('video').forEach(v=>videos.push(v));
          }
        }catch(e){}
        node = treeWalker.nextNode();
      }
    }catch(e){}

    // same-origin iframes
    try{
      const iframes = root.querySelectorAll('iframe');
      iframes.forEach(iframe=>{
        try{
          const doc = iframe.contentDocument;
          if(doc) findVideosRoot(doc).forEach(v=>videos.push(v));
        }catch(e){}
      });
    }catch(e){}

    return videos;
  }

  function findVideos(){
    const vids = findVideosRoot(document);
    vids.forEach(v=>{
      if(!v) return;
      if(v.readyState > 0) createButtonForVideo(v);
      else v.addEventListener('loadedmetadata', ()=>createButtonForVideo(v), {once:true});
    });
  }

  findVideos();

  const observer = new MutationObserver((mutations)=>{
    for(const m of mutations){
      if(m.addedNodes && m.addedNodes.length) findVideos();
    }
  });
  observer.observe(document.documentElement || document.body, {childList:true, subtree:true});

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
    if(msg && msg.action === 'trigger-pip'){
      const video = findVideosRoot(document)[0];
      if(!video){ sendResponse({success:false,error:'no-video'}); return; }
        (async ()=>{
          try{
            try{ video.removeAttribute && video.removeAttribute('disablePictureInPicture'); }catch(e){}
            try{ Object.defineProperty(video, 'disablePictureInPicture', { configurable: true, get: () => false, set: () => {} }); }catch(e){}
            await new Promise(r => setTimeout(r, 40));
            await video.requestPictureInPicture();
            sendResponse({success:true});
          }catch(e){ sendResponse({success:false,error:e && e.message}); }
        })();
      return true; // async response
    }
  });
})();
