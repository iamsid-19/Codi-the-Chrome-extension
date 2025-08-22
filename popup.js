


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
    chrome.storage.local.get(['timerInSec'], (data) => {
      if (data.timerInSec) {
        welcomeMsg.style.display = 'none';
        timerDisplay.style.display = 'block';
        stopBtn.style.display = 'block';
        chrome.runtime.sendMessage({
          action: "timerStarted",
          timerInSec: data.timerInSec
        })

      }
      else {
        resetUI();
      }
    })
  })
  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: "stopTimmer"
    })
    chrome.storage.local.remove('timerInSec')
    countdown.textContent = "00:00:00";
    resetUI();

  })

