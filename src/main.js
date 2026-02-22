$(document).ready(function () {
  // =============================
  // Application State Management
  // =============================

  // Load tasks from sessionStorage (session-scoped persistence)
  // Fallback to empty array if no stored data exists
  let tasks = JSON.parse(sessionStorage.getItem("todos")) || [];

  // Currently selected tag metadata for new tasks
  let currentTag = {
    label: "شخصی",
    icon: "bi-person-fill",
    color: "text-blue-500",
  };

  // =============================
  // 1. Initial Setup
  // =============================

  // Render current date in Persian locale format
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  $("#date-display").text(new Date().toLocaleDateString("fa-IR", options));

  // =============================
  // 2. Custom UI Interactions
  // =============================

  $("#dropdownTrigger").on("click", (e) => {
    e.stopPropagation();
    $("#customDropdown").fadeToggle(150);
  });

  $(".tag-opt").on("click", function () {
    // Update selected tag state
    currentTag = {
      label: $(this).data("val"),
      icon: $(this).data("icon"),
      color: $(this).data("color"),
    };

    // Reflect selection in UI
    $("#selectedLabel").text(currentTag.label);
    $("#selectedIcon").attr(
      "class",
      `bi ${currentTag.icon} ${currentTag.color}`,
    );

    $("#customDropdown").hide();
  });

  // Close dropdown when clicking outside
  $(document).on("click", () => $("#customDropdown").hide());

  // =============================
  // 3. Render Tasks (Single Source of Truth)
  // =============================

  // Responsible for full UI re-render based on current state
  function renderTasks() {
    const $list = $("#taskList").empty();

    // Update task counter
    $("#task-count").text(
      `درحال پردازش: ${tasks.length.toLocaleString("fa-IR")}`,
    );

    tasks.forEach((task) => {
      // Determine whether task has a non-empty description
      const hasDesc = task.desc && task.desc.trim() !== "";

      const $item = $(`
          <div class="task-card group p-3 rounded-lg flex flex-col gap-2 imperial-border"
               draggable="true" data-id="${task.id}">
            <div class="flex items-center gap-3">

              <div class="handle opacity-0 group-hover:opacity-100 text-gray-300 cursor-grab transition-all">
                <i class="bi bi-grip-vertical text-xl"></i>
              </div>

              <div class="cursor-pointer flex items-center justify-center w-5 h-5 rounded border-2 ${
                task.completed
                  ? "bg-[#1a2a44] border-[#1a2a44]"
                  : "border-gray-200"
              }"
                   onclick="toggleComplete('${task.id}')">
                <i class="bi bi-check text-white text-xs ${
                  task.completed ? "" : "hidden"
                }"></i>
              </div>

              <div class="flex-grow flex items-center gap-3">
                <span class="text-sm font-medium ${
                  task.completed
                    ? "text-gray-300 line-through"
                    : "text-slate-700"
                }">${task.title}</span>

                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-400 opacity-60">
                  ${task.tagLabel}
                </span>
              </div>

              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                ${
                  hasDesc
                    ? `<button onclick="toggleDetails('${task.id}')" class="p-1 text-gray-400 hover:text-[#1a2a44]">
                        <i class="bi bi-chevron-down text-xs"></i>
                       </button>`
                    : ""
                }

                <button onclick="deleteTask('${task.id}')" class="p-1 text-gray-400 hover:text-red-500">
                  <i class="bi bi-x-lg text-xs"></i>
                </button>
              </div>
            </div>

            <div class="details hidden pr-14 pl-4 py-2 text-xs text-slate-400 border-r border-gray-100 mt-1">
              ${task.desc}
            </div>
          </div>
        `);

      $list.append($item);
    });

    initDragAndDrop();
  }

  // =============================
  // 4. Drag & Drop Logic
  // =============================

  // Initializes drag behavior and reconciles DOM order with state
  function initDragAndDrop() {
    const list = document.getElementById("taskList");
    let draggedItem = null;

    $(".task-card").on("dragstart", function () {
      draggedItem = this;
      setTimeout(() => $(this).addClass("dragging"), 0);
    });

    $(".task-card").on("dragend", function () {
      $(this).removeClass("dragging");

      // Rebuild tasks array based on new DOM order
      // Ensures UI order and state remain consistent
      const newOrder = [];

      $(".task-card").each(function () {
        const id = $(this).data("id");
        newOrder.push(tasks.find((t) => t.id == id));
      });

      tasks = newOrder;
      sessionStorage.setItem("todos", JSON.stringify(tasks));
    });

    list.addEventListener("dragover", (e) => {
      e.preventDefault();

      const afterElement = getDragAfterElement(list, e.clientY);

      if (afterElement == null) list.appendChild(draggedItem);
      else list.insertBefore(draggedItem, afterElement);
    });
  }

  // Determine correct insertion point during drag operation
  function getDragAfterElement(container, y) {
    const elements = [
      ...container.querySelectorAll(".task-card:not(.dragging)"),
    ];

    return elements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset)
          return { offset: offset, element: child };
        else return closest;
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element;
  }

  // =============================
  // Public API (Global Handlers)
  // =============================

  // Add new task → validate → persist → re-render
  window.addTask = () => {
    const title = $("#taskInput").val().trim();
    const desc = $("#taskDescInput").val().trim();

    if (!title) {
      gsap.to("#inputBox", {
        x: 5,
        repeat: 5,
        yoyo: true,
        duration: 0.05,
      });
      return;
    }

    $("#btnLoader").removeClass("hidden");

    setTimeout(() => {
      tasks.unshift({
        id: Date.now(),
        title,
        desc,
        tagLabel: currentTag.label,
        tagIcon: currentTag.icon,
        completed: false,
      });

      sessionStorage.setItem("todos", JSON.stringify(tasks));

      renderTasks();

      $("#taskInput, #taskDescInput").val("");
      $("#btnLoader").addClass("hidden");

      gsap.from(".task-card:first", {
        opacity: 0,
        y: -20,
        duration: 0.4,
      });
    }, 300);
  };

  // Toggle completion status and re-render
  window.toggleComplete = (id) => {
    const task = tasks.find((t) => t.id == id);
    task.completed = !task.completed;

    sessionStorage.setItem("todos", JSON.stringify(tasks));
    renderTasks();
  };

  // Delete task by id → persist → re-render
  window.deleteTask = (id) => {
    tasks = tasks.filter((t) => t.id != id);
    sessionStorage.setItem("todos", JSON.stringify(tasks));
    renderTasks();
  };

  // Toggle task description visibility
  window.toggleDetails = (id) => {
    $(`.task-card[data-id="${id}"] .details`).slideToggle(200);
  };

  // Keyboard shortcut (Enter key)
  $("#taskInput").on("keypress", (e) => {
    if (e.which === 13) window.addTask();
  });

  $("#addBtn").on("click", window.addTask);

  // =============================
  // Initial Preloader Animation
  // =============================

  setTimeout(() => {
    gsap.to("#preloader", {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        $("#preloader").remove();
        renderTasks();
      },
    });
  }, 1200);
});
