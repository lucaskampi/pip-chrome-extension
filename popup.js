document.getElementById('pip').addEventListener('click', async ()=>{
  try{
    chrome.runtime.sendMessage({action:'trigger-pip-active-tab'}, (resp)=>{
      if(chrome.runtime.lastError){
        alert('Error: ' + chrome.runtime.lastError.message);
        return;
      }
      if(!resp || !resp.success) alert('PiP failed: ' + (resp && resp.error));
    });
  }catch(e){
    alert('Error: ' + e.message);
  }
});
