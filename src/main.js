$(document).ready(function () {
  // =============================
  // Application State Management
  // =============================

  let tasks = JSON.parse(sessionStorage.getItem("todos")) || [];

  let currentTag = {
    label: "شخصی",
    icon: "bi-person-fill",
    color: "text-blue-500",
  };

  // =============================
  // 1. Initial Setup
  // =============================

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  $("#date-display").text(new Date().toLocaleDateString("fa-IR", options));

  // =============================
  // 2. Session Size Helper
  // =============================

  function updateSessionInfo() {
    const json = sessionStorage.getItem("todos") || "";
    const bytes = new Blob([json]).size;
    const kb = (bytes / 1024).toFixed(2);

    $("#sessionSize").text(`${kb} کیلوبایت`);
    $("#sessionItems").text(tasks.length.toLocaleString("fa-IR"));
  }

  // =============================
  // 3. Custom Confirm Modal
  // =============================

  function customConfirm(message, onConfirm) {
    $("#customConfirmModal").remove();

    const modal = $(`
      <div id="customConfirmModal" class="fixed inset-0 z-[300] flex items-center justify-center p-4" style="background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);">
        <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
          <div class="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <i class="bi bi-exclamation-triangle text-2xl text-red-500"></i>
          </div>
          <h3 class="text-lg font-black text-slate-800 mb-2">هشدار</h3>
          <p class="text-sm text-gray-500 mb-6">${message}</p>
          <div class="flex gap-3">
            <button id="confirmCancel" class="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all">
              انصراف
            </button>
            <button id="confirmOk" class="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-all">
              تأیید و حذف
            </button>
          </div>
        </div>
      </div>
    `);

    $("body").append(modal);

    gsap.from("#customConfirmModal > div", {
      scale: 0.7,
      opacity: 0,
      duration: 0.25,
      ease: "back.out(1.5)",
    });

    function closeModal() {
      gsap.to("#customConfirmModal", {
        opacity: 0,
        duration: 0.15,
        onComplete: () => $("#customConfirmModal").remove(),
      });
    }

    $("#confirmCancel, #customConfirmModal").on("click", function (e) {
      if (e.target === this || $(this).is("#confirmCancel")) {
        closeModal();
      }
    });

    $("#confirmOk").on("click", function () {
      closeModal();
      if (onConfirm) onConfirm();
    });
  }

  // =============================
  // 4. Clear Session
  // =============================

  $("#clearSessionBtn").on("click", function () {
    if (tasks.length === 0) return;

    customConfirm(
      "آیا از پاک‌سازی کامل سشن اطمینان دارید؟ همه وظایف برای همیشه حذف خواهند شد.",
      () => {
        tasks = [];
        sessionStorage.removeItem("todos");
        renderTasks();
        updateSessionInfo();
      },
    );
  });

  // =============================
  // 5. Image Export
  // =============================

  window.exportTaskAsImage = function (id) {
    const task = tasks.find((t) => t.id == id);
    if (!task) return;

    // ابعاد ثابت
    const W = 500;
    const P = 20; // padding
    let y = P + 10;

    // محاسبه ارتفاع
    let descLines = [];
    if (task.desc && task.desc.trim() !== "") {
      descLines = wrapText(task.desc, W - P * 2 - 40);
    }
    const H = 100 + descLines.length * 22 + 20;

    const canvas = document.createElement("canvas");
    canvas.width = W * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);

    // پس‌زمینه
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // حاشیه کارت
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    roundRect(ctx, 8, 8, W - 16, H - 16, 8);

    // چک‌باکس
    const cbX = P;
    const cbY = y;
    const cbS = 18;

    ctx.fillStyle = task.completed ? "#1a2a44" : "#ffffff";
    ctx.strokeStyle = task.completed ? "#1a2a44" : "#d1d5db";
    ctx.lineWidth = 2;
    roundRect(ctx, cbX, cbY, cbS, cbS, 4);
    ctx.fill();
    ctx.stroke();

    if (task.completed) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✓", cbX + cbS / 2, cbY + cbS / 2);
    }

    // عنوان
    const titleX = cbX + cbS + 12;
    const titleY = cbY + 14;

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "500 14px system-ui";

    if (task.completed) {
      ctx.fillStyle = "#d1d5db";
      const titleWidth = ctx.measureText(task.title).width;
      ctx.fillText(task.title, titleX, titleY);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(titleX, titleY + 7);
      ctx.lineTo(titleX + titleWidth, titleY + 7);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#374151";
      ctx.fillText(task.title, titleX, titleY);
    }

    // تگ
    const titleWidth = ctx.measureText(task.title).width;
    const tagX = titleX + titleWidth + 8;
    const tagY = titleY;

    ctx.font = "700 9px system-ui";
    const tagW = ctx.measureText(task.tagLabel).width + 12;
    ctx.fillStyle = "#f3f4f6";
    roundRect(ctx, tagX, tagY, tagW, 18, 4);
    ctx.fill();
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(task.tagLabel, tagX + 6, tagY + 3);

    // آیکون دوربین
    ctx.fillStyle = "#c5a059";
    ctx.font = "13px system-ui";
    ctx.textAlign = "right";
    ctx.fillText("📷", W - P, titleY + 2);

    y = cbY + cbS + 16;

    // توضیحات
    if (descLines.length > 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "12px system-ui";
      ctx.textAlign = "left";

      descLines.forEach((line, i) => {
        ctx.fillText(line, titleX, y + i * 22);
      });

      y += descLines.length * 22 + 8;
    }

    // خط جداکننده واترمارک
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(P, y);
    ctx.lineTo(W - P, y);
    ctx.stroke();

    y += 10;

    // واترمارک
    ctx.fillStyle = "#c5a059";
    ctx.font = "700 10px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("وظیفه من", P + 4, y + 6);

    ctx.fillStyle = "#d1d5db";
    ctx.textAlign = "right";
    ctx.fillText(window.location.hostname || "localhost", W - P - 4, y + 6);

    // خروجی
    canvas.toBlob(function (blob) {
      if (!blob) return;
      const imageUrl = URL.createObjectURL(blob);
      showImagePopup(imageUrl, `وظیفه-${task.title.slice(0, 20)}.png`, blob);
    }, "image/png");
  };

  // کمکی: شکستن متن
  function wrapText(text, maxWidth) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = "12px system-ui";

    const words = text.split(" ");
    const lines = [];
    let line = "";

    words.forEach((word) => {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxWidth) {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = test;
      }
    });
    lines.push(line.trim());
    return lines;
  }

  // کمکی: escape HTML
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // کمکی: گرد کردن گوشه‌ها
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // پاپ‌آپ عکس
  function showImagePopup(imageUrl, fileName, blob) {
    $("#imagePopup").remove();

    const popup = $(`
      <div id="imagePopup" class="fixed inset-0 z-[200] flex items-center justify-center p-4" style="background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 class="text-lg font-black text-slate-800">پیش‌نمایش تصویر</h3>
            <button id="closePopup" class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="p-4 bg-gray-50 flex items-center justify-center">
            <img src="${imageUrl}" alt="پیش‌نمایش" class="max-w-full rounded-lg shadow-md border" style="max-height: 400px;" />
          </div>
          <div class="p-4 flex gap-3">
            <button id="downloadImage" class="flex-1 bg-[#1a2a44] hover:bg-[#1a2a44]/90 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <i class="bi bi-download"></i> دانلود عکس
            </button>
            <button id="shareImage" class="flex-1 bg-gradient-to-r from-[#c5a059] to-[#d4a76a] hover:opacity-90 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <i class="bi bi-share"></i> اشتراک‌گذاری
            </button>
          </div>
        </div>
      </div>
    `);

    $("body").append(popup);

    gsap.from("#imagePopup > div", {
      scale: 0.8,
      opacity: 0,
      duration: 0.3,
      ease: "back.out(1.5)",
    });

    function closePopup() {
      gsap.to("#imagePopup", {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          $("#imagePopup").remove();
          URL.revokeObjectURL(imageUrl);
          $(document).off("keydown.popup");
        },
      });
    }

    $("#closePopup, #imagePopup").on("click", function (e) {
      if (e.target === this || $(this).is("#closePopup")) closePopup();
    });

    $(document).on("keydown.popup", function (e) {
      if (e.key === "Escape") closePopup();
    });

    $("#downloadImage").on("click", function () {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      const btn = $(this);
      const orig = btn.html();
      btn
        .html('<i class="bi bi-check-lg"></i> ذخیره شد!')
        .addClass("bg-green-600");
      setTimeout(() => btn.html(orig).removeClass("bg-green-600"), 1500);
    });

    $("#shareImage").on("click", async function () {
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "وظیفه من" });
        } catch (e) {}
      } else {
        const btn = $(this);
        const orig = btn.html();
        btn.html('<i class="bi bi-check-lg"></i> لینک کپی شد');
        setTimeout(() => btn.html(orig), 2000);
      }
    });
  }

  // =============================
  // 6. Custom UI Interactions
  // =============================

  $("#dropdownTrigger").on("click", (e) => {
    e.stopPropagation();
    $("#customDropdown").fadeToggle(150);
  });

  $(".tag-opt").on("click", function () {
    currentTag = {
      label: $(this).data("val"),
      icon: $(this).data("icon"),
      color: $(this).data("color"),
    };

    $("#selectedLabel").text(currentTag.label);
    $("#selectedIcon").attr(
      "class",
      `bi ${currentTag.icon} ${currentTag.color}`,
    );
    $("#customDropdown").hide();
  });

  $(document).on("click", () => $("#customDropdown").hide());

  // =============================
  // 7. Render Tasks
  // =============================

  function renderTasks() {
    const $list = $("#taskList").empty();
    $("#task-count").text(
      `درحال پردازش: ${tasks.length.toLocaleString("fa-IR")}`,
    );
    updateSessionInfo();

    tasks.forEach((task) => {
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
            }" onclick="toggleComplete('${task.id}')">
              <i class="bi bi-check text-white text-xs ${task.completed ? "" : "hidden"}"></i>
            </div>
            <div class="flex-grow flex items-center gap-3">
              <span class="text-sm font-medium ${
                task.completed ? "text-gray-300 line-through" : "text-slate-700"
              }">${task.title}</span>
              <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-400 opacity-60">${task.tagLabel}</span>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <button onclick="exportTaskAsImage('${task.id}')" class="p-1 text-gray-400 hover:text-[#c5a059] transition-colors" title="ذخیره به‌عنوان عکس">
                <i class="bi bi-camera text-xs"></i>
              </button>
              ${hasDesc ? `<button onclick="toggleDetails('${task.id}')" class="p-1 text-gray-400 hover:text-[#1a2a44]"><i class="bi bi-chevron-down text-xs"></i></button>` : ""}
              <button onclick="deleteTask('${task.id}')" class="p-1 text-gray-400 hover:text-red-500"><i class="bi bi-x-lg text-xs"></i></button>
            </div>
          </div>
          <div class="details hidden pr-14 pl-4 py-2 text-xs text-slate-400 border-r border-gray-100 mt-1">${task.desc || ""}</div>
        </div>
      `);

      $list.append($item);
    });

    initDragAndDrop();
  }

  // =============================
  // 8. Drag & Drop Logic
  // =============================

  function initDragAndDrop() {
    const list = document.getElementById("taskList");
    let draggedItem = null;

    $(".task-card").on("dragstart", function () {
      draggedItem = this;
      setTimeout(() => $(this).addClass("dragging"), 0);
    });

    $(".task-card").on("dragend", function () {
      $(this).removeClass("dragging");
      const newOrder = [];
      $(".task-card").each(function () {
        newOrder.push(tasks.find((t) => t.id == $(this).data("id")));
      });
      tasks = newOrder;
      sessionStorage.setItem("todos", JSON.stringify(tasks));
      updateSessionInfo();
    });

    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement == null) list.appendChild(draggedItem);
      else list.insertBefore(draggedItem, afterElement);
    });
  }

  function getDragAfterElement(container, y) {
    const elements = [
      ...container.querySelectorAll(".task-card:not(.dragging)"),
    ];
    return elements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset)
          return { offset, element: child };
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element;
  }

  // =============================
  // 9. Public API
  // =============================

  window.addTask = () => {
    const title = $("#taskInput").val().trim();
    const desc = $("#taskDescInput").val().trim();
    if (!title) {
      gsap.to("#inputBox", { x: 5, repeat: 5, yoyo: true, duration: 0.05 });
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
      gsap.from(".task-card:first", { opacity: 0, y: -20, duration: 0.4 });
    }, 300);
  };

  window.toggleComplete = (id) => {
    const task = tasks.find((t) => t.id == id);
    if (task) {
      task.completed = !task.completed;
      sessionStorage.setItem("todos", JSON.stringify(tasks));
      renderTasks();
    }
  };

  window.deleteTask = (id) => {
    tasks = tasks.filter((t) => t.id != id);
    sessionStorage.setItem("todos", JSON.stringify(tasks));
    renderTasks();
  };

  window.toggleDetails = (id) => {
    $(`.task-card[data-id="${id}"] .details`).slideToggle(200);
  };

  $("#taskInput").on("keypress", (e) => {
    if (e.which === 13) window.addTask();
  });
  $("#addBtn").on("click", window.addTask);

  // =============================
  // 10. Preloader
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
