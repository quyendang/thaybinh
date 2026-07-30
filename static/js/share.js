(() => {
    const table = document.querySelector(".lesson-table");
    if (!table) return;

    const lessonId = table.dataset.lessonId;
    const storagePrefix = `fasteng:share:${lessonId}`;
    const hiddenWordsKey = `${storagePrefix}:hidden-words`;
    const formatKey = `${storagePrefix}:copy-format`;
    const toast = document.querySelector("#toast");
    const copyDialog = document.querySelector("#copy-dialog");
    const selectionDialog = document.querySelector("#selection-dialog");
    const toolPanel = document.querySelector("#lesson-tools");
    let activeAudio = null;
    let activeAudioButton = null;
    let toastTimer = null;
    let lastTrigger = null;

    const getRows = () => [...table.tBodies[0].rows];
    const readStorage = (key, fallback) => {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    };
    const writeStorage = (key, value) => {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { showToast("Trình duyệt không thể lưu tùy chọn này.", true); }
    };
    const showToast = (message, isError = false) => {
        toast.textContent = message;
        toast.classList.toggle("is-error", isError);
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    };
    const openDialog = (dialog, trigger) => {
        lastTrigger = trigger;
        if (dialog?.showModal) dialog.showModal();
    };
    const closeDialog = (dialog) => {
        if (dialog?.open) dialog.close();
        lastTrigger?.focus();
    };
    const selectedRows = () => getRows().filter((row) => !row.classList.contains("is-user-hidden"));

    function restoreSelection() {
        const hiddenKeys = new Set(readStorage(hiddenWordsKey, []));
        getRows().forEach((row) => row.classList.toggle("is-user-hidden", hiddenKeys.has(row.dataset.rowKey)));
        updateVisibleCount();
    }

    function updateVisibleCount() {
        const label = document.querySelector("#visible-word-count");
        if (label) label.textContent = `${selectedRows().length} từ đang hiển thị`;
    }

    async function copyText(text, successMessage) {
        if (!text.trim()) return showToast("Không có nội dung để sao chép.", true);
        try {
            if (navigator.clipboard?.writeText && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const area = document.createElement("textarea");
                area.value = text;
                area.className = "visually-hidden";
                document.body.append(area);
                area.select();
                if (!document.execCommand("copy")) throw new Error("Copy failed");
                area.remove();
            }
            showToast(successMessage);
        } catch {
            showToast("Không thể sao chép. Hãy kiểm tra quyền clipboard của trình duyệt.", true);
        }
    }

    function rowValue(row, column) {
        const values = {
            1: row.dataset.index || "",
            2: row.dataset.word || "",
            3: row.dataset.type || "",
            4: row.dataset.ipa || "",
            5: row.dataset.meaning || "",
            6: row.dataset.example || "",
            7: row.dataset.translate || "",
        };
        return values[column] || "";
    }

    function formatRow(row, format) {
        const normalized = format
            .replace(/\(\s*-\s*(\d+)\s*-\s*\)/g, "($1)")
            .replace(/\[\s*-\s*(\d+)\s*-\s*\]/g, "[$1]");
        const parts = normalized.match(/\(\d+\)|\[\d+\]|\d+|t/g) || [];
        return parts.map((part) => {
            if (part === "t") return "\t";
            const wrapped = part.match(/^([\[(])(\d+)[\])]?$/);
            if (wrapped) {
                const value = rowValue(row, Number(wrapped[2]));
                return wrapped[1] === "(" ? `(${value})` : `[${value}]`;
            }
            return /^\d+$/.test(part) ? rowValue(row, Number(part)) : "";
        }).join("");
    }

    function copyFormat(format, label) {
        const text = selectedRows().map((row) => formatRow(row, format)).filter(Boolean).join("\n");
        writeStorage(formatKey, format);
        copyText(text, `${label} đã được sao chép.`);
    }

    function buildSelectionDialog() {
        const list = selectionDialog.querySelector("#selection-list");
        const hiddenKeys = new Set(readStorage(hiddenWordsKey, []));
        list.replaceChildren(...getRows().map((row, index) => {
            const item = document.createElement("div");
            item.className = "selection-item";
            const input = document.createElement("input");
            input.type = "checkbox";
            input.id = `word-choice-${index}`;
            input.dataset.rowKey = row.dataset.rowKey;
            input.checked = !hiddenKeys.has(row.dataset.rowKey);
            const label = document.createElement("label");
            label.htmlFor = input.id;
            const word = document.createElement("strong");
            word.textContent = row.dataset.word || "Từ chưa có tên";
            const meaning = document.createElement("span");
            meaning.textContent = row.dataset.meaning || "Chưa có nghĩa";
            label.append(word, meaning);
            item.append(input, label);
            return item;
        }));
    }

    function saveSelection() {
        const hidden = [...selectionDialog.querySelectorAll("input[type=checkbox]")]
            .filter((input) => !input.checked)
            .map((input) => input.dataset.rowKey);
        writeStorage(hiddenWordsKey, hidden);
        restoreSelection();
        closeDialog(selectionDialog);
        showToast("Danh sách từ hiển thị đã được cập nhật.");
    }

    function resetSelection() {
        writeStorage(hiddenWordsKey, []);
        restoreSelection();
        showToast("Đã khôi phục toàn bộ từ trong bài học.");
    }

    function toggleTools() {
        if (!toolPanel) return;
        const shouldOpen = toolPanel.hidden;
        toolPanel.hidden = !shouldOpen;
        if (shouldOpen) {
            toolPanel.querySelector("button")?.focus();
            showToast("Đã mở công cụ bài học. Nhấn Alt + Shift + M để ẩn.");
        } else {
            document.querySelector("#lesson-title")?.focus();
            showToast("Đã ẩn công cụ bài học.");
        }
    }

    function playAudio(button) {
        const source = button.dataset.audioSrc;
        if (!source) return showToast("Từ này chưa có audio.", true);
        if (activeAudioButton === button && activeAudio && !activeAudio.paused) {
            activeAudio.pause();
            return;
        }
        activeAudio?.pause();
        activeAudioButton?.classList.remove("is-playing");
        const url = /^https?:\/\//i.test(source) ? source : `data:audio/mp3;base64,${source}`;
        activeAudio = new Audio(url);
        activeAudioButton = button;
        button.classList.add("is-playing");
        activeAudio.addEventListener("ended", () => button.classList.remove("is-playing"), { once: true });
        activeAudio.addEventListener("error", () => {
            button.classList.remove("is-playing");
            showToast("Không thể phát audio cho từ này.", true);
        }, { once: true });
        activeAudio.play().catch(() => showToast("Trình duyệt đã chặn phát audio.", true));
    }

    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action], [data-audio-src], [data-format]");
        if (!button) return;
        const { action, format } = button.dataset;
        if (button.dataset.audioSrc !== undefined) return playAudio(button);
        const parentDialog = button.closest("dialog");
        if (format) {
            copyFormat(format, button.dataset.formatLabel || "Nội dung");
            if (parentDialog) closeDialog(parentDialog);
            return;
        }
        if (action === "print") { if (parentDialog) parentDialog.close(); window.print(); }
        if (action === "copy-basic") { copyFormat("2-t-5", "Word + Meaning"); if (parentDialog) parentDialog.close(); }
        if (action === "copy-vietnamese") { copyFormat("2-t-5-[7]", "Word + Meaning + Vietnamese"); if (parentDialog) parentDialog.close(); }
        if (action === "open-copy") { if (parentDialog) parentDialog.close(); openDialog(copyDialog, button); }
        if (action === "open-selection") { if (parentDialog) parentDialog.close(); buildSelectionDialog(); openDialog(selectionDialog, button); }
        if (action === "save-selection") saveSelection();
        if (action === "reset-selection") { resetSelection(); if (parentDialog) parentDialog.close(); }
        if (action === "close-dialog") closeDialog(button.closest("dialog"));
    });

    document.querySelector("#custom-format-copy")?.addEventListener("click", () => {
        const input = document.querySelector("#custom-format-input");
        const format = input.value.trim();
        if (!format) return showToast("Hãy nhập format sao chép.", true);
        copyFormat(format, "Format tùy chỉnh");
        closeDialog(copyDialog);
    });

    document.querySelector("#select-all")?.addEventListener("click", () => {
        selectionDialog.querySelectorAll("input[type=checkbox]").forEach((input) => { input.checked = true; });
    });
    document.querySelector("#deselect-all")?.addEventListener("click", () => {
        selectionDialog.querySelectorAll("input[type=checkbox]").forEach((input) => { input.checked = false; });
    });
    document.querySelector("#custom-format-input").value = readStorage(formatKey, "1-t-4-t-5");

    document.addEventListener("keydown", (event) => {
        if (!(event.altKey && event.shiftKey) || event.metaKey || event.ctrlKey) return;
        const key = event.key.toLowerCase();
        if (key === "m") {
            if (document.querySelector("dialog[open]")) return;
            event.preventDefault();
            toggleTools();
            return;
        }
        const shortcuts = { "1": "copy-basic", "2": "copy-vietnamese", p: "print", s: "open-selection" };
        if (!shortcuts[key]) return;
        event.preventDefault();
        document.querySelector(`[data-action="${shortcuts[key]}"]`)?.click();
    });

    restoreSelection();
})();
