"use strict";

const addSessionStorage = (key, value) =>
  sessionStorage.setItem(key, JSON.stringify(value));

const createDomEl = (elTag, classNames, attributes = {}, content = "") => {
  const el = document.createElement(elTag);
  el.classList.add(...classNames);

  for (const key in attributes) {
    el.setAttribute(key, attributes[key]);
  }
  el.innerHTML = content;

  return el;
};

const getCurrentDate = function () {
  const todayUnformatted = new Date();
  const day = todayUnformatted.getDate();
  const month = todayUnformatted.getMonth() + 1;
  const year = todayUnformatted.getFullYear();
  let currentDate = `${year}-${month < 10 ? "0" + month : month}-${
    day < 10 ? "0" + day : day
  }T00:00`;
  newTaskDeadline.min = currentDate;

  return currentDate;
};

let tasksArr = JSON.parse(sessionStorage.getItem("tasks")) || [];

const newTaskForm = document.querySelector(".new-task-form");
const newTaskInput = document.querySelector(".new-task-input");
const newTaskDeadline = document.querySelector(".new-task-deadline");

newTaskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const taskObj = {
    desc: e.target.elements.desc.value,
    deadline: e.target.elements.deadline.value || "",
    done: false,
    createdAt: new Date().getTime(),
  };

  tasksArr.push(taskObj);

  addSessionStorage("tasks", tasksArr);

  e.target.reset();

  newTaskInput.focus();

  displayTasks();
});

window.addEventListener("load", () => {
  newTaskInput.focus();
  getCurrentDate();
  doSort();
  displayTasks();
});

function displayTasks() {
  const taskList = document.querySelector(".task-list");
  taskList.innerHTML = "";

  tasksArr.forEach((taskObj) => {
    const taskItem = createDomEl("div", ["task"], {});

    const taskDesc = createDomEl("p", ["task-desc"], {}, taskObj.desc);

    const taskDelete = createDomEl("button", ["delete-btn"], {
      title: "Delete task",
    });
    const taskDeleteImg = createDomEl("img", ["delete-icon"], {
      src: "./assets/icons/delete-icon.svg",
    });

    const taskCheckbox = createDomEl("input", ["task-checkbox"], {
      type: "checkbox",
      title: "Check task as done/undone",
    });
    taskObj.done ? taskCheckbox.setAttribute("checked", "") : "";
    taskObj.done ? taskItem.classList.add("task-done") : "";

    const taskTimeLeft = createDomEl("p", ["time-left"]);
    const presentTime = new Date().getTime();
    const deadlineTime = new Date(taskObj.deadline).getTime();
    const timeLeftInMilisec = deadlineTime - presentTime;
    const timeLeftInMin = timeLeftInMilisec / 1000 / 60;
    const leftDays = Math.floor(timeLeftInMin / 60 / 24);
    const leftHours = Math.floor((timeLeftInMin - leftDays * 24 * 60) / 60);
    const leftMin = Math.floor(
      timeLeftInMin - leftDays * 24 * 60 - leftHours * 60
    );

    if (taskObj.deadline !== "") {
      taskTimeLeft.innerText = `Time left ${leftDays < 0 ? 0 : leftDays} ${
        leftDays === 1 ? "day" : "days"
      } ${leftHours} hr ${leftMin} min`;
    }

    taskDelete.appendChild(taskDeleteImg);

    taskItem.append(taskCheckbox, taskDesc, taskTimeLeft, taskDelete);

    let sortingInputValue = document.querySelector(".sort").value;
    !taskObj.done && sortingInputValue === "recently-added"
      ? taskList.prepend(taskItem)
      : taskList.append(taskItem);

    taskCheckbox.addEventListener("click", function (e) {
      taskObj.done = e.target.checked;

      if (taskObj.done) {
        taskItem.classList.add("task-done");
        taskCheckbox.setAttribute("checked", "");
        taskList.append(taskItem);
      } else {
        taskItem.classList.remove("task-done");
        taskCheckbox.removeAttribute("checked", "");
        taskList.prepend(taskItem);
      }
      addSessionStorage("tasks", tasksArr);
    });

    taskDelete.addEventListener("click", (e) => {
      if (!taskObj.done) return;
      showModal("Are you sure you want to remove the item?");
    });

    function showModal(text) {
      const modalContainer = document.querySelector(".modal-container");
      modalContainer.classList.add("modal-bg");

      const modal = createDomEl("div", ["modal"]);
      const modalText = createDomEl("p", ["modal-text"], {}, text);
      const modalBtns = createDomEl("div", ["modal-btns"]);
      const confirmBtn = createDomEl(
        "button",
        ["confirm-btn", "btn", "btn-black"],
        {},
        "OK"
      );
      const cancelBtn = createDomEl(
        "button",
        ["cancel-btn", "btn", "btn-gray"],
        {},
        "Cancel"
      );

      modalBtns.append(confirmBtn, cancelBtn);

      modal.append(modalText, modalBtns);

      modalContainer.appendChild(modal);

      confirmBtn.addEventListener("click", (e) => {
        modalContainer.removeChild(modal);
        modalContainer.classList.remove("modal-bg");

        tasksArr = tasksArr.filter((t) => t != taskObj);
        addSessionStorage("tasks", tasksArr);
        displayTasks();
        newTaskInput.focus();
      });

      cancelBtn.addEventListener("click", (e) => {
        modalContainer.removeChild(modal);
        modalContainer.classList.remove("modal-bg");
        newTaskInput.focus();
      });
    }
  });
}

const doSort = function () {
  const sortingInput = document.querySelector(".sort");
  let sortingInputValue = document.querySelector(".sort").value;

  tasksArr.sort(doSortByDate);
  addSessionStorage("tasks", tasksArr);
  displayTasks();

  sortingInput.addEventListener("change", (e) => {
    sortingInputValue = sortingInput.value;

    if (sortingInputValue === "recently-added") {
      tasksArr.sort(doSortByDate);
    } else if (sortingInputValue === "deadline") {
      tasksArr.sort(doSortByDeadline);
    } else if (sortingInputValue === "recently-completed") {
      doSortByCompletion();
    }

    addSessionStorage("tasks", tasksArr);
    displayTasks();
  });

  function doSortByDate(a, b) {
    if (a.createdAt > b.createdAt) {
      return 1;
    } else if (b.createdAt > a.createdAt) {
      return -1;
    } else {
      return 0;
    }
  }

  function doSortByDeadline(a, b) {
    if (new Date(a.deadline).getTime() < new Date(b.deadline).getTime()) {
      return 1;
    } else if (
      new Date(b.deadline).getTime() < new Date(a.deadline).getTime()
    ) {
      return -1;
    } else {
      return 0;
    }
  }

  function doSortByCompletion() {
    const completedTasks = tasksArr.filter((taskObj) => taskObj.done);
    const uncompletedTasks = tasksArr.filter((taskObj) => !taskObj.done);
    tasksArr = [...completedTasks, ...uncompletedTasks];

    return tasksArr;
  }
};
