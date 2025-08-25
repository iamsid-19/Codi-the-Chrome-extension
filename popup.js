


  const numOfQues = document.getElementById('totalQues')
  const timer = document.querySelector('#timer')
  const startBtn = document.querySelector('#start')
  const countdown = document.querySelector('#countdown')
  const stopBtn = document.querySelector('#stop')
  const welcomeMsg = document.querySelector('#welcomeMsg')
  const timerDisplay = document.querySelector('.timer-display')

  let timerInterval;

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateUI") {
      countdown.textContent = message.time;
    }
    if (message.action === "timerDone") {
      countdown.textContent = "00:00:00";
      alert("Time's up !");
      resetUI();
    }
  });
  // Reflect storage changes when popup is open (e.g., if background updates while popup hidden)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.timerInSec) {
      const seconds = changes.timerInSec.newValue;
      if (typeof seconds === 'number') {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        const formattedTime = String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        countdown.textContent = formattedTime;
        welcomeMsg.style.display = 'none';
        timerDisplay.style.display = 'block';
        stopBtn.style.display = 'block';
      } else {
        // timer removed
        resetUI();
      }
    }
  });
  function resetUI() {
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


  startBtn.addEventListener('click', () => {
    const timerValue = timer.value;
    const timerInHrs = parseInt(timerValue, 10)
    if (isNaN(timerInHrs) || timerInHrs === 0) {
      alert("please select the timer")
      return;
    }
    const questions = parseInt(numOfQues.value, 10);
    if (isNaN(questions) || questions === 0) {
      alert("Please select the number of challenges.");
      return;
    }

    chrome.storage.local.get(['timerInSec'], (data) => {
      if (data.timerInSec) {
        alert("A challenge is already running!");
        return;
      }
    })

    const checkboxes = document.querySelectorAll('input[name="difficulty"]:checked')
    const selected = [];
    checkboxes.forEach(checkbox => selected.push(checkbox.value));
    if (selected.length === 0) {
      alert("Please select a difficulty.");
      return;
    }

    let allProblems = [];
    selected.forEach(difficulty => {

      let key = difficulty.toLowerCase()
      if (problems[key]) {
        allProblems = allProblems.concat(problems[key])
      }
    })

    const problemsUrl = getRandomUrl(allProblems, questions);
    if (problemsUrl.length === 0) {
      alert("Not enough problems found for your selections.");
      return;
    }

    let timerInSec = timerValue * 3600;
    chrome.runtime.sendMessage({
      action: "timerStarted",
      timerInSec: timerInSec
    })
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
    // Ask background for current timer state without restarting it
    chrome.runtime.sendMessage({ action: 'getTimerState' }, (resp) => {
      if (resp && resp.running && resp.seconds > 0) {
        countdown.textContent = resp.formattedTime || '00:00:00';
        welcomeMsg.style.display = 'none';
        timerDisplay.style.display = 'block';
        stopBtn.style.display = 'block';
      } else {
        // Fallback check in case background not yet initialized response
        chrome.storage.local.get(['timerInSec'], (data) => {
          if (data.timerInSec) {
            welcomeMsg.style.display = 'none';
            timerDisplay.style.display = 'block';
            stopBtn.style.display = 'block';
          } else {
            resetUI();
          }
        })
      }
    });
  })
  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: "stopTimmer"
    })
    chrome.storage.local.remove('timerInSec')
    countdown.textContent = "00:00:00";
    resetUI();

  })

