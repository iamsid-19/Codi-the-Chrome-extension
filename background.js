// let isPaused=false;
let timerInterval;
let currentTimerInSecGlobal = null;


// chrome.tabs.onActivated.addListener(async (activeInfo) => {
//   if(!timerInterval)
//   {
//     return;
//   }
  
//   let tab = await chrome.tabs.get(activeInfo.tabId)
  
//   if (tab.url && !tab.url.includes('https://leetcode.com/problems/')) {
//     clearInterval(timerInterval);
//     chrome.runtime.sendMessage({
//       action: "timerPaused"
//     })
//   }
//   else{
//     if(isPaused){
//       isPaused=false;
//      chrome.storage.local.get(['timerInSec'],(data)=>{
//       if(data.timerInSec){
//         handlingTimer(data.timerInSec);
//       }

//      })
//     }
//   }
// })
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "timerStarted") {
    handlingTimer(message.timerInSec)
  }
  if (message.action === "stopTimer") {
    clearInterval(timerInterval);
    currentTimerInSecGlobal = null;
    chrome.storage.local.remove('timerInSec');
  }
  if (message.action === "getTimerState") {
    const seconds = typeof currentTimerInSecGlobal === 'number' ? currentTimerInSecGlobal : 0;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const formattedTime = String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    sendResponse({ running: !!timerInterval, seconds, formattedTime });
    return true;
  }
  return true;
})




function handlingTimer(timerInSec) {

  // if(isPaused)
  // {
  //   return;
  // }
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  let currentTimerInSec = timerInSec;
  const updateTimer = () => {
    const hours = Math.floor(currentTimerInSec / 3600);
    const mins = Math.floor((currentTimerInSec % 3600) / 60);
    const secs = currentTimerInSec % 60;
    const formattedTime = String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    try{
    chrome.runtime.sendMessage({
      action: "updateUI",
      time: formattedTime
    })
  }
  catch(error){
    console.log("Popup closed, timer continues in background");
  }

    currentTimerInSecGlobal = currentTimerInSec;
    chrome.storage.local.set({
      timerInSec: currentTimerInSec
    })
    if (currentTimerInSec <= 0) {
      clearInterval(timerInterval)
      timerInterval = null;

      chrome.storage.local.remove('timerInSec');
      chrome.runtime.sendMessage({ action: "timerDone" })
    } else {
      currentTimerInSec--;
    }
  }
  updateTimer(); // Call the function immediately to show the initial time
  timerInterval = setInterval(updateTimer, 1000)

}
