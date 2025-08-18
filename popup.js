


const numOfQues = document.getElementById('totalQues')
const timer = document.querySelector('#timer')
const startBtn = document.querySelector('#start')
const countdown = document.querySelector('#countdown')
const stopBtn = document.querySelector('#stop')
const welcomeMsg = document.querySelector('#welcomeMsg')
const timerDisplay = document.querySelector('.timer-display')
let isChallengeStart = false;
let timerInterval;

function resetUI() {
  isChallengeStart = false
  welcomeMsg.style.display = 'block';
  timerDisplay.style.display = 'none';
  stopBtn.style.display = 'none';
}
function getRandomUrl(allProblems, questions) {
  let urls = [];
  let tempArr = [...allProblems];
  for (let i = 0; i < questions; i++) {
    let index = Math.floor(Math.random() * tempArr.length);
    urls.push(tempArr[index]);
    tempArr.splice(index, 1);
  }
  return urls;

}
function handlingTimer(timerInSec) {

  if (timerInterval) {
    clearInterval(timerInterval)
  }
  let currentTimerInSec = timerInSec;
  const updateTimer = () => {
    const hours = Math.floor(currentTimerInSec / 3600);
    const mins = Math.floor((currentTimerInSec % 3600) / 60);
    const secs = currentTimerInSec % 60;
    const formattedTime = String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    countdown.textContent = formattedTime

    chrome.storage.local.set({
      timerInSec: currentTimerInSec
    })
    if (currentTimerInSec <= 0) {
      clearInterval(timerInterval)

      chrome.storage.local.remove('timerInSec');
      countdown.textContent = "00:00:00";
      alert("Time's up !")
      resetUI();
      return;
    } else {
      currentTimerInSec--;
    }
  }
  updateTimer(); // Call the function immediately to show the initial time
  timerInterval = setInterval(updateTimer, 1000)

}
startBtn.addEventListener('click', () => {
  const timerValue = timer.value;
  const timerInHrs = parseInt(timerValue, 10)
  if (isNaN(timerInHrs) || timerInHrs === 0) {
    alert("please select the timer")
    return;
  }

  if (isChallengeStart) {
    alert("A challenge is already running!")
    return;
  }
  const checkboxes = document.querySelectorAll('input[name="difficulty"]:checked')
  const selected = [];
  checkboxes.forEach(checkbox => selected.push(checkbox.value));
  if (selected.length === 0) {
        alert("Please select a difficulty.");
        return;
    }

  let allProblems =[];
  selected.forEach(difficulty=>{
    let key = difficulty.toLowerCase();
    
    if(problems[key])
    {
       allProblems =allProblems.concat(problems[key])
    }
  })
    const questions = parseInt(numOfQues.value, 10);
  const problemsUrl = getRandomUrl(allProblems, questions);
  if (problemsUrl.length === 0) {
    // Stop the function and tell the user what went wrong
    alert("Not enough problems found for your selections. Please try again with a different number or difficulty.");
    return; 
}

  let timerInSec = timerValue * 3600;
  handlingTimer(timerInSec)
  isChallengeStart = true;
  welcomeMsg.style.display = 'none';
  timerDisplay.style.display = 'block'
  stopBtn.style.display = 'block'
  chrome.storage.local.set({
    selected: selected,
    totalQuestions: questions,
    timerInitialValue: timerInHrs
  })

  if (questions > 0) {
    problemsUrl.forEach(problem => {
      chrome.tabs.create({ url: problem })
    })
  }


})
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['timerInSec'], (data) => {
    if (data.timerInSec) {
      handlingTimer(data.timerInSec)
      isChallengeStart = true;
      welcomeMsg.style.display = 'none';
      timerDisplay.style.display = 'block';
      stopBtn.style.display = 'block';

    }
    else {
      resetUI();
    }
  })
})
stopBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  chrome.storage.local.remove('timerInSec')
  countdown.textContent = "00:00:00";
  resetUI();

})
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if ((message.action === "startChallenge")) {
    console.log("Received message from LeetCode page to start the timer!");
  }
})
