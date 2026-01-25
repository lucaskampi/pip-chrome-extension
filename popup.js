document.getElementById('pip').addEventListener('click', async ()=>{
  try{
    const tabs = await chrome.tabs.query({active:true,currentWindow:true});
    if(!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {action:'trigger-pip'}, (resp)=>{
      if(chrome.runtime.lastError){
        alert('No content script or error: ' + chrome.runtime.lastError.message);
        return;
      }
      if(!resp || !resp.success) alert('PiP failed: ' + (resp && resp.error));
    });
  }catch(e){
    alert('Error: ' + e.message);
  }
});
