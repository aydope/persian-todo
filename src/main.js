$(document).ready(function () {
  // =============================
  // Application State Management
  // =============================

  let tasks = JSON.parse(sessionStorage.getItem("todos")) || [];
  let deletedTask = null;
  let deletedTaskIndex = null;
  let undoTimeout = null;
  let currentFilter = "همه";
  let currentSearch = "";
  let currentTheme = "modern"; // modern, achaemenid, sassanid

  let currentTag = {
    label: "شخصی",
    icon: "bi-person-fill",
    color: "text-blue-500",
  };

  // =============================
  // 1. Quotes Data
  // =============================

  const quotes = [
    { text: "هنر برتر از گوهر آمد پدید", author: "فردوسی" },
    { text: "توانا بود هر که دانا بود", author: "فردوسی" },
    { text: "مباش در پی آزار و هر چه خواهی کن", author: "سعدی" },
    { text: "بنی آدم اعضای یکدیگرند", author: "سعدی" },
    { text: "پندار نیک، گفتار نیک، کردار نیک", author: "زرتشت" },
    { text: "کار امروز را به فردا میفکن", author: "بزرگمهر" },
    { text: "خرد، روشنایی جان است", author: "کوروش بزرگ" },
    { text: "از تو حرکت، از خدا برکت", author: "مولانا" },
    { text: "هیچ چیز در دنیا ارزشمندتر از دانش نیست", author: "ابن سینا" },
    { text: "شادی، کلید سلامت تن و روان است", author: "ابوعلی سینا" },
    {
      text: "آنچه را نمی‌خواهی به تو کنند، به دیگران مکن",
      author: "کوروش بزرگ",
    },
    { text: "صبر، تلخ است اما میوه شیرین دارد", author: "سعدی" },
  ];

  function getDailyQuote() {
    const today = new Date().toDateString();
    const stored = sessionStorage.getItem("dailyQuote");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) return parsed.quote;
    }
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    sessionStorage.setItem(
      "dailyQuote",
      JSON.stringify({ date: today, quote }),
    );
    return quote;
  }

  // =============================
  // 2. Initial Setup
  // =============================

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  $("#date-display").text(new Date().toLocaleDateString("fa-IR", options));

  const dailyQuote = getDailyQuote();
  $("#dailyQuoteText").text(`«${dailyQuote.text}»`);
  $("#dailyQuoteAuthor").text(`ـ ${dailyQuote.author}`);

  // =============================
  // 3. Theme System
  // =============================

  const themes = {
    modern: {
      name: "مدرن",
      icon: "bi-lightbulb",
      colors: {
        bg: "#f8fafc",
        card: "#ffffff",
        primary: "#1a2a44",
        accent: "#c5a059",
        text: "#334155",
        muted: "#94a3b8",
        border: "#e2e8f0",
      },
    },
    achaemenid: {
      name: "هخامنشی",
      icon: "bi-shield-shaded",
      colors: {
        bg: "#fdf6e3",
        card: "#faf3dd",
        primary: "#8b6914",
        accent: "#d4a017",
        text: "#5c4a1e",
        muted: "#b8973e",
        border: "#e6d5a8",
      },
    },
    sassanid: {
      name: "ساسانی",
      icon: "bi-gem",
      colors: {
        bg: "#1a0a2e",
        card: "#2d1b4e",
        primary: "#c9a84c",
        accent: "#e8c84c",
        text: "#e8dcc8",
        muted: "#9b87b8",
        border: "#4a3570",
      },
    },
  };

  function applyTheme(themeName) {
    currentTheme = themeName;
    const theme = themes[themeName];
    const colors = theme.colors;

    document.documentElement.style.setProperty("--bg-color", colors.bg);
    document.documentElement.style.setProperty("--card-color", colors.card);
    document.documentElement.style.setProperty(
      "--primary-color",
      colors.primary,
    );
    document.documentElement.style.setProperty("--accent-color", colors.accent);
    document.documentElement.style.setProperty("--text-color", colors.text);
    document.documentElement.style.setProperty("--muted-color", colors.muted);
    document.documentElement.style.setProperty("--border-color", colors.border);

    $("body").css("background-color", colors.bg);
    $("body").css("color", colors.text);

    // Update theme selector
    $("#themeSelector span").text(theme.name);
    $("#themeSelector i").attr("class", `bi ${theme.icon}`);

    sessionStorage.setItem("theme", themeName);
    renderTasks();
  }

  // Load saved theme
  const savedTheme = sessionStorage.getItem("theme") || "modern";
  applyTheme(savedTheme);

  // Theme switcher
  $("#themeSelector").on("click", function () {
    const themes = ["modern", "achaemenid", "sassanid"];
    const current = themes.indexOf(currentTheme);
    const next = themes[(current + 1) % themes.length];
    applyTheme(next);

    gsap.from("body", {
      opacity: 0.8,
      duration: 0.3,
    });
  });

  // =============================
  // 4. Session Size Helper
  // =============================

  function updateSessionInfo() {
    const json = sessionStorage.getItem("todos") || "";
    const bytes = new Blob([json]).size;
    const kb = (bytes / 1024).toFixed(2);

    $("#sessionSize").text(`${kb} KB`);
    $("#sessionItems").text(tasks.length.toLocaleString("fa-IR"));
  }

  // =============================
  // 5. Custom Confirm Modal
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
              تأیید
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
      if (e.target === this || $(this).is("#confirmCancel")) closeModal();
    });

    $("#confirmOk").on("click", function () {
      closeModal();
      if (onConfirm) onConfirm();
    });
  }

  // =============================
  // 6. Clear Session
  // =============================

  $("#clearSessionBtn").on("click", function () {
    if (tasks.length === 0) return;
    customConfirm(
      "آیا از پاک‌سازی کامل حافظه اطمینان دارید؟ همه وظایف برای همیشه حذف خواهند شد.",
      () => {
        tasks = [];
        deletedTask = null;
        sessionStorage.removeItem("todos");
        renderTasks();
        updateSessionInfo();
      },
    );
  });

  // =============================
  // 7. Backup & Restore
  // =============================

  $("#backupBtn").on("click", function () {
    const backup = {
      tasks: tasks,
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    };
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${new Date().toLocaleDateString("fa-IR").replace(/\//g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    gsap.from("#backupBtn", {
      scale: 1.2,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
    });
  });

  $("#restoreInput").on("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const backup = JSON.parse(event.target.result);
        if (backup.tasks && Array.isArray(backup.tasks)) {
          customConfirm(
            `فایل پشتیبان شامل ${backup.tasks.length} وظیفه است. جایگزین وظایف فعلی شود؟`,
            () => {
              tasks = backup.tasks;
              sessionStorage.setItem("todos", JSON.stringify(tasks));
              renderTasks();
              updateSessionInfo();
            },
          );
        } else {
          alert("فایل پشتیبان نامعتبر است.");
        }
      } catch (err) {
        alert("خطا در خواندن فایل پشتیبان.");
      }
    };
    reader.readAsText(file);
    this.value = "";
  });

  // =============================
  // 8. Image Export
  // =============================

  window.exportTaskAsImage = function (id) {
    const task = tasks.find((t) => t.id == id);
    if (!task) return;

    const W = 500;
    const P = 20;
    let y = P + 10;

    let allDescLines = [];
    if (task.desc && task.desc.trim() !== "") {
      allDescLines = wrapText(task.desc, W - P * 2 - 40);
    }
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach((st) => {
        allDescLines.push(`○ ${st.title} ${st.completed ? "✓" : ""}`);
      });
    }
    const H = 120 + allDescLines.length * 22 + 20;

    const canvas = document.createElement("canvas");
    canvas.width = W * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    roundRect(ctx, 8, 8, W - 16, H - 16, 8);

    // Checkbox
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

    // Title
    const titleX = cbX + cbS + 12;
    const titleY = cbY + 14;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "500 14px system-ui";
    if (task.completed) {
      ctx.fillStyle = "#d1d5db";
      ctx.fillText(task.title, titleX, titleY);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(titleX, titleY + 7);
      ctx.lineTo(titleX + ctx.measureText(task.title).width, titleY + 7);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#374151";
      ctx.fillText(task.title, titleX, titleY);
    }

    // Tag
    const titleWidth = ctx.measureText(task.title).width;
    const tagX = titleX + titleWidth + 8;
    ctx.font = "700 9px system-ui";
    const tagW = ctx.measureText(task.tagLabel).width + 12;
    ctx.fillStyle = "#f3f4f6";
    roundRect(ctx, tagX, titleY, tagW, 18, 4);
    ctx.fill();
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(task.tagLabel, tagX + 6, titleY + 3);

    // Pin
    if (task.pinned) {
      ctx.fillStyle = "#ef4444";
      ctx.font = "12px system-ui";
      ctx.fillText("📌", tagX + tagW + 6, titleY + 2);
    }

    // Camera icon
    ctx.fillStyle = "#c5a059";
    ctx.font = "13px system-ui";
    ctx.textAlign = "right";
    ctx.fillText("📷", W - P, titleY + 2);

    y = cbY + cbS + 16;

    // Description & Subtasks
    if (allDescLines.length > 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "12px system-ui";
      ctx.textAlign = "left";
      allDescLines.forEach((line, i) => {
        ctx.fillText(line, titleX, y + i * 22);
      });
      y += allDescLines.length * 22 + 8;
    }

    // Watermark
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(P, y);
    ctx.lineTo(W - P, y);
    ctx.stroke();
    y += 10;
    ctx.fillStyle = "#c5a059";
    ctx.font = "700 10px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("وظیفه من", P + 4, y + 6);
    ctx.fillStyle = "#d1d5db";
    ctx.textAlign = "right";
    ctx.fillText(window.location.hostname || "localhost", W - P - 4, y + 6);

    canvas.toBlob(function (blob) {
      if (!blob) return;
      const imageUrl = URL.createObjectURL(blob);
      showImagePopup(imageUrl, `task-${task.title.slice(0, 20)}.png`, blob);
    }, "image/png");
  };

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

  function showImagePopup(imageUrl, fileName, blob) {
    $("#imagePopup").remove();

    const popup = $(`
      <div id="imagePopup" class="fixed inset-0 z-[200] flex items-center justify-center p-4" style="background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 class="text-lg font-black text-slate-800">پیش‌نمایش</h3>
            <button id="closePopup" class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="p-4 bg-gray-50 flex items-center justify-center">
            <img src="${imageUrl}" alt="preview" class="max-w-full rounded-lg shadow-md border" style="max-height: 400px;" />
          </div>
          <div class="p-4 flex gap-3">
            <button id="downloadImage" class="flex-1 bg-[#1a2a44] text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <i class="bi bi-download"></i> دانلود
            </button>
            <button id="shareImage" class="flex-1 bg-gradient-to-r from-[#c5a059] to-[#d4a76a] text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <i class="bi bi-share"></i> اشتراک
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
      a.click();
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
  // 9. Filter & Search
  // =============================

  function getFilteredTasks() {
    let filtered = [...tasks];

    // Filter - درست شدن تطابق مقادیر فارسی
    if (currentFilter === "انجام شده") {
      filtered = filtered.filter((t) => t.completed);
    } else if (currentFilter === "فعال") {
      filtered = filtered.filter((t) => !t.completed);
    } else if (currentFilter === "شخصی") {
      filtered = filtered.filter((t) => t.tagLabel === "شخصی");
    } else if (currentFilter === "کاری") {
      filtered = filtered.filter((t) => t.tagLabel === "کاری");
    } else if (currentFilter === "ضروری") {
      filtered = filtered.filter((t) => t.tagLabel === "ضروری");
    }
    // "همه" = بدون فیلتر

    // Search
    if (currentSearch.trim() !== "") {
      const search = currentSearch.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          (t.desc && t.desc.toLowerCase().includes(search)) ||
          t.tagLabel.toLowerCase().includes(search),
      );
    }

    // Pinned first
    filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    return filtered;
  }

  $("#searchInput").on("input", function () {
    currentSearch = $(this).val();
    renderTasks();
  });

  $(".filter-btn").on("click", function () {
    currentFilter = $(this).data("filter");

    // ظاهر دکمه‌ها
    $(".filter-btn")
      .removeClass("bg-[#1a2a44] text-white")
      .addClass("bg-gray-100 text-gray-600");
    $(this)
      .addClass("bg-[#1a2a44] text-white")
      .removeClass("bg-gray-100 text-gray-600");

    renderTasks();
  });

  // =============================
  // 10. Custom UI Interactions
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
  // 11. Render Tasks
  // =============================

  function renderTasks() {
    const $list = $("#taskList").empty();
    const filtered = getFilteredTasks();

    $("#task-count").text(
      `${filtered.length.toLocaleString("fa-IR")} / ${tasks.length.toLocaleString("fa-IR")}`,
    );
    updateSessionInfo();

    if (filtered.length === 0) {
      $list.append(`
        <div class="text-center py-16 text-gray-300">
          <i class="bi bi-inbox text-5xl block mb-4"></i>
          <p class="text-sm">هیچ وظیفه‌ای یافت نشد</p>
        </div>
      `);
      return;
    }

    filtered.forEach((task) => {
      const hasDesc = task.desc && task.desc.trim() !== "";
      const hasSubtasks = task.subtasks && task.subtasks.length > 0;
      const completedSubtasks = task.subtasks
        ? task.subtasks.filter((st) => st.completed).length
        : 0;

      const $item = $(`
        <div class="task-card group p-3 rounded-lg flex flex-col gap-2 ${task.pinned ? "border-[#c5a059]" : ""}"
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
            <div class="flex-grow flex items-center gap-3 min-w-0">
              ${task.pinned ? '<i class="bi bi-pin-angle-fill text-red-500 text-xs"></i>' : ""}
              <span class="text-sm font-medium truncate ${
                task.completed ? "text-gray-300 line-through" : "text-slate-700"
              }">${task.title}</span>
              <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-400 opacity-60 whitespace-nowrap">${task.tagLabel}</span>
              ${hasSubtasks ? `<span class="text-[9px] text-gray-400">${completedSubtasks}/${task.subtasks.length}</span>` : ""}
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <button onclick="pinTask('${task.id}')" class="p-1 text-gray-400 hover:text-red-500" title="پین">
                <i class="bi bi-pin${task.pinned ? "-fill text-red-500" : ""} text-xs"></i>
              </button>
              <button onclick="exportTaskAsImage('${task.id}')" class="p-1 text-gray-400 hover:text-[#c5a059]" title="عکس">
                <i class="bi bi-camera text-xs"></i>
              </button>
              ${hasDesc || hasSubtasks ? `<button onclick="toggleDetails('${task.id}')" class="p-1 text-gray-400 hover:text-[#1a2a44]"><i class="bi bi-chevron-down text-xs"></i></button>` : ""}
              <button onclick="deleteTask('${task.id}')" class="p-1 text-gray-400 hover:text-red-500"><i class="bi bi-x-lg text-xs"></i></button>
            </div>
          </div>
          <div class="details hidden pr-14 pl-4 py-2 text-xs text-slate-400 border-r border-gray-100 mt-1 flex flex-col gap-2">
            ${task.desc ? `<p>${task.desc}</p>` : ""}
            ${
              hasSubtasks
                ? `
              <div class="subtasks space-y-1">
                ${task.subtasks
                  .map(
                    (st) => `
                  <div class="flex items-center gap-2 ${st.completed ? "opacity-50" : ""}">
                    <div class="cursor-pointer w-4 h-4 rounded border ${st.completed ? "bg-[#1a2a44] border-[#1a2a44]" : "border-gray-300"}" onclick="toggleSubtask('${task.id}', '${st.id}')">
                      ${st.completed ? '<i class="bi bi-check text-white text-[8px] flex items-center justify-center"></i>' : ""}
                    </div>
                    <span class="${st.completed ? "line-through" : ""}">${st.title}</span>
                    <button onclick="deleteSubtask('${task.id}', '${st.id}')" class="text-gray-300 hover:text-red-400 ml-auto"><i class="bi bi-x text-xs"></i></button>
                  </div>
                `,
                  )
                  .join("")}
                <div class="flex items-center gap-2 mt-2">
                  <input type="text" class="subtask-input text-xs border-b border-gray-200 outline-none bg-transparent flex-grow" placeholder="زیروظیفه جدید..." data-task-id="${task.id}" />
                  <button class="add-subtask-btn text-[#c5a059] text-xs font-bold" data-task-id="${task.id}">+</button>
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `);

      $list.append($item);
    });

    initDragAndDrop();
    initSubtaskListeners();
  }

  function initSubtaskListeners() {
    $(".subtask-input").on("keypress", function (e) {
      if (e.which === 13) {
        const taskId = $(this).data("task-id");
        const title = $(this).val().trim();
        if (title) addSubtask(taskId, title);
        $(this).val("");
      }
    });

    $(".add-subtask-btn").on("click", function () {
      const taskId = $(this).data("task-id");
      const input = $(`.subtask-input[data-task-id="${taskId}"]`);
      const title = input.val().trim();
      if (title) addSubtask(taskId, title);
      input.val("");
    });
  }

  function addSubtask(taskId, title) {
    const task = tasks.find((t) => t.id == taskId);
    if (!task) return;
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({ id: Date.now(), title, completed: false });
    sessionStorage.setItem("todos", JSON.stringify(tasks));
    renderTasks();
  }

  window.toggleSubtask = function (taskId, subtaskId) {
    const task = tasks.find((t) => t.id == taskId);
    if (!task || !task.subtasks) return;
    const subtask = task.subtasks.find((st) => st.id == subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      sessionStorage.setItem("todos", JSON.stringify(tasks));
      renderTasks();
    }
  };

  window.deleteSubtask = function (taskId, subtaskId) {
    const task = tasks.find((t) => t.id == taskId);
    if (!task || !task.subtasks) return;
    task.subtasks = task.subtasks.filter((st) => st.id != subtaskId);
    sessionStorage.setItem("todos", JSON.stringify(tasks));
    renderTasks();
  };

  // =============================
  // 12. Undo System
  // =============================

  function showUndoBar() {
    $("#undoBar").remove();
    const bar = $(`
      <div id="undoBar" class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[150] bg-[#1a2a44] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4 text-sm font-bold">
        <span>وظیفه حذف شد</span>
        <button id="undoBtn" class="text-[#c5a059] hover:text-yellow-300 transition-colors">↩ برگشت</button>
        <button id="dismissUndo" class="text-gray-400 hover:text-white"><i class="bi bi-x"></i></button>
      </div>
    `);
    $("body").append(bar);
    gsap.from("#undoBar", {
      y: 50,
      opacity: 0,
      duration: 0.3,
      ease: "back.out(1.5)",
    });

    $("#undoBtn").on("click", function () {
      if (deletedTask !== null) {
        tasks.splice(deletedTaskIndex, 0, deletedTask);
        sessionStorage.setItem("todos", JSON.stringify(tasks));
        deletedTask = null;
        deletedTaskIndex = null;
        renderTasks();
      }
      closeUndoBar();
    });

    $("#dismissUndo").on("click", closeUndoBar);

    if (undoTimeout) clearTimeout(undoTimeout);
    undoTimeout = setTimeout(closeUndoBar, 5000);
  }

  function closeUndoBar() {
    gsap.to("#undoBar", {
      y: 50,
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        $("#undoBar").remove();
        deletedTask = null;
        deletedTaskIndex = null;
      },
    });
  }

  // =============================
  // 13. Drag & Drop
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
        return offset < 0 && offset > closest.offset
          ? { offset, element: child }
          : closest;
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element;
  }

  // =============================
  // 14. Public API
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
      const newTask = {
        id: Date.now(),
        title,
        desc,
        tagLabel: currentTag.label,
        tagIcon: currentTag.icon,
        completed: false,
        pinned: false,
        subtasks: [],
      };
      tasks.unshift(newTask);
      sessionStorage.setItem("todos", JSON.stringify(tasks));
      renderTasks();
      $("#taskInput, #taskDescInput").val("");
      $("#btnLoader").addClass("hidden");
      gsap.from(".task-card:first", {
        opacity: 0,
        y: -30,
        duration: 0.5,
        ease: "back.out(1.5)",
      });
    }, 200);
  };

  window.toggleComplete = (id) => {
    const task = tasks.find((t) => t.id == id);
    if (task) {
      task.completed = !task.completed;
      sessionStorage.setItem("todos", JSON.stringify(tasks));
      renderTasks();
      if (task.completed) {
        gsap.from(`.task-card[data-id="${id}"]`, {
          scale: 1.05,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
        });
      }
    }
  };

  window.pinTask = (id) => {
    const task = tasks.find((t) => t.id == id);
    if (task) {
      task.pinned = !task.pinned;
      sessionStorage.setItem("todos", JSON.stringify(tasks));
      renderTasks();
    }
  };

  window.deleteTask = (id) => {
    const index = tasks.findIndex((t) => t.id == id);
    if (index !== -1) {
      deletedTask = tasks[index];
      deletedTaskIndex = index;
      tasks.splice(index, 1);
      sessionStorage.setItem("todos", JSON.stringify(tasks));
      renderTasks();
      showUndoBar();
    }
  };

  window.toggleDetails = (id) => {
    const details = $(`.task-card[data-id="${id}"] .details`);
    details.slideToggle(200);
    if (details.is(":visible")) {
      initSubtaskListeners();
    }
  };

  $("#taskInput").on("keypress", (e) => {
    if (e.which === 13) window.addTask();
  });
  $("#addBtn").on("click", window.addTask);

  // =============================
  // 15. Preloader
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
  }, 1000);
});
