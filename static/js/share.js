(() => {
    const table = document.querySelector(".lesson-table");
    if (!table) return;

    const lessonId = table.dataset.lessonId;
    const storagePrefix = `fasteng:share:${lessonId}`;
    const hiddenWordsKey = `${storagePrefix}:hidden-words`;
    const formatKey = `${storagePrefix}:copy-format`;
    const studyKey = `${storagePrefix}:study-state`;
    const hiddenColumns = new Set((table.dataset.hiddenColumns || "").split(",").filter(Boolean).map(Number));
    const printHiddenColumns = new Set((table.dataset.printHiddenColumns || "").split(",").filter(Boolean).map(Number));
    const toast = document.querySelector("#toast");
    const copyDialog = document.querySelector("#copy-dialog");
    const selectionDialog = document.querySelector("#selection-dialog");
    const pdfOptionsDialog = document.querySelector("#pdf-options-dialog");
    const shortcutDialog = document.querySelector("#shortcut-dialog");
    const resumeDialog = document.querySelector("#resume-dialog");
    const lessonList = document.querySelector("#lesson-list");
    const studyWorkspace = document.querySelector("#study-workspace");
    const flashContent = document.querySelector("#flash-content");
    const slideContent = document.querySelector("#slide-content");
    const studyProgress = document.querySelector("#study-progress");
    const studyStartButton = document.querySelector('[data-action="start-study"]');
    let activeAudio = null;
    let activeAudioButton = null;
    let toastTimer = null;
    let lastTrigger = null;
    let studyState = null;
    let studyMotion = "forward";
    let pShortcutCount = 0;
    let pShortcutStartedAt = 0;
    let pShortcutTimer = null;

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
    const fieldVisible = (column) => !hiddenColumns.has(column);

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function makeButton(label, action, className = "button") {
        const button = element("button", className, label);
        button.type = "button";
        button.dataset.action = action;
        return button;
    }

    function makeAudioButton(word) {
        if (!word.voice) return null;
        const button = element("button", "audio-button");
        button.type = "button";
        button.dataset.audioSrc = word.voice;
        button.setAttribute("aria-label", `Nghe phát âm từ ${word.word}`);
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("viewBox", "0 0 24 24");
        ["M11.25 5.25 6.75 9H3.75v6h3l4.5 3.75V5.25Z", "M15.75 8.25a5.25 5.25 0 0 1 0 7.5", "M18.75 5.25a9.5 9.5 0 0 1 0 13.5"].forEach((d) => {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", d);
            svg.append(path);
        });
        button.append(svg);
        return button;
    }

    function setRowVisibility(rowKey, hidden) {
        document.querySelectorAll(`[data-row-key="${CSS.escape(rowKey)}"]`).forEach((node) => {
            node.classList.toggle("is-user-hidden", hidden);
        });
    }

    function restoreSelection() {
        const hiddenKeys = new Set(readStorage(hiddenWordsKey, []));
        getRows().forEach((row) => setRowVisibility(row.dataset.rowKey, hiddenKeys.has(row.dataset.rowKey)));
        updateVisibleCount();
        if (!studyWorkspace.hidden && studyState) {
            studyState = normalizeStudyState(studyState);
            renderStudy();
        }
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
            const item = element("div", "selection-item");
            const input = document.createElement("input");
            input.type = "checkbox";
            input.id = `word-choice-${index}`;
            input.dataset.rowKey = row.dataset.rowKey;
            input.checked = !hiddenKeys.has(row.dataset.rowKey);
            const label = document.createElement("label");
            label.htmlFor = input.id;
            const word = element("strong", "", row.dataset.word || "Từ chưa có tên");
            const meaning = element("span", "", row.dataset.meaning || "Chưa có nghĩa");
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

    function triggerForShortcut() {
        return document.activeElement instanceof HTMLElement ? document.activeElement : studyStartButton;
    }

    function openSelectionDialog(trigger = triggerForShortcut()) {
        buildSelectionDialog();
        openDialog(selectionDialog, trigger);
    }

    function openCopyDialog(trigger = triggerForShortcut()) {
        openDialog(copyDialog, trigger);
    }

    function lockedPdfColumns() {
        return new Set([...hiddenColumns, ...printHiddenColumns]);
    }

    function buildPdfOptionsDialog() {
        const locked = lockedPdfColumns();
        pdfOptionsDialog.querySelectorAll("input[type=checkbox]").forEach((input) => {
            const column = Number(input.value);
            input.checked = locked.has(column);
            input.disabled = locked.has(column);
            input.parentElement.title = input.disabled ? "Cột này đã được ẩn bởi link chia sẻ." : "";
        });
    }

    function selectedPdfHiddenColumns() {
        return new Set([...lockedPdfColumns(), ...[...pdfOptionsDialog.querySelectorAll("input[type=checkbox]:checked")].map((input) => Number(input.value))]);
    }

    function pdfFilename(title) {
        const safeTitle = title.replace(/[\\/:*?"<>|]/g, "-").trim() || "fasteng-lesson";
        return `${safeTitle}.pdf`;
    }

    function wrapPdfText(context, value, maxWidth) {
        const text = String(value || "").trim();
        if (!text) return [];
        const lines = [];
        let current = "";
        for (const character of text) {
            const candidate = current + character;
            if (current && context.measureText(candidate).width > maxWidth) {
                lines.push(current.trimEnd());
                current = character === " " ? "" : character;
            } else {
                current = candidate;
            }
        }
        if (current.trim()) lines.push(current.trimEnd());
        return lines;
    }

    function createPdfCanvas(title, wordCount, pageNumber) {
        const canvas = document.createElement("canvas");
        canvas.width = 1400;
        // html2pdf rounds A4's printable height down to 1,979 px at this width.
        // Matching that exact raster size prevents it from adding a near-empty extra page.
        canvas.height = 1979;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#162033";
        context.font = '700 42px Manrope, "Segoe UI", sans-serif';
        context.fillText(title, 60, 82);
        context.fillStyle = "#667085";
        context.font = '500 18px "IBM Plex Mono", ui-monospace, monospace';
        context.fillText(`${wordCount} từ vựng · Trang ${pageNumber}`, 60, 116);
        context.fillStyle = "#2563eb";
        context.fillRect(60, 142, 1280, 3);
        return { canvas, context, y: 172 };
    }

    function drawPdfTableHeader(context, y, columns) {
        let x = 60;
        context.fillStyle = "#eef2f7";
        context.fillRect(x, y, 1280, 38);
        context.strokeStyle = "#cbd5e1";
        context.lineWidth = 1;
        context.font = '700 15px Manrope, "Segoe UI", sans-serif';
        context.fillStyle = "#162033";
        columns.forEach((column) => {
            context.strokeRect(x, y, column.width, 38);
            context.fillText(column.label, x + 8, y + 24);
            x += column.width;
        });
        return y + 38;
    }

    function drawPdfRow(context, y, cells, columns) {
        const lineHeight = 23;
        context.font = '500 17px Manrope, "Segoe UI", "PingFang SC", sans-serif';
        const lines = cells.map((cell, index) => wrapPdfText(context, cell, columns[index].width - 16));
        const rowHeight = Math.max(48, ...lines.map((cellLines) => cellLines.length * lineHeight + 18));
        let x = 60;
        context.strokeStyle = "#cbd5e1";
        context.lineWidth = 1;
        context.fillStyle = "#263247";
        columns.forEach((column, index) => {
            context.strokeRect(x, y, column.width, rowHeight);
            context.save();
            context.beginPath();
            context.rect(x + 6, y + 6, column.width - 12, rowHeight - 12);
            context.clip();
            lines[index].forEach((line, lineIndex) => {
                const textX = index === 0 ? x + (column.width - context.measureText(line).width) / 2 : x + 8;
                context.fillText(line, textX, y + 24 + lineIndex * lineHeight);
            });
            context.restore();
            x += column.width;
        });
        return rowHeight;
    }

    async function appendPdfPage(pdf, canvas) {
        if (pdf) {
            pdf.addPage();
            pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, 595.28, 841.89);
            return pdf;
        }

        // html2pdf bundles jsPDF but intentionally does not expose it as a browser global.
        // Initialising the first page through its Worker gives us that same local PDF instance,
        // then later pages can be appended without ever reading the responsive lesson table.
        const worker = window.html2pdf().set({
            margin: 0,
            image: { type: "jpeg", quality: 0.94 },
            jsPDF: { unit: "pt", format: "a4", orientation: "portrait", compress: true },
        }).from(canvas, "canvas").toPdf();
        return worker.get("pdf");
    }

    async function downloadPdf(hiddenPdfColumns = lockedPdfColumns()) {
        if (typeof window.html2pdf !== "function") {
            showToast("Không thể tải trình tạo PDF. Hãy tải lại trang rồi thử lại.", true);
            return;
        }
        try {
            showToast("Đang tạo PDF…");
            await document.fonts?.ready;
            const title = document.querySelector("#lesson-title")?.textContent?.trim() || "FastENG lesson";
            const rows = selectedRows();
            const columns = [
                { label: "#", width: 42, field: "index" },
                { label: "Word", width: 175, field: "word", hidden: 1 },
                { label: "Type", width: 110, field: "type", hidden: 2 },
                { label: "IPA", width: 170, field: "ipa", hidden: 3 },
                { label: "Meaning", width: 260, field: "meaning", hidden: 4 },
                { label: "Example", width: 270, field: "example", hidden: 5 },
                { label: "Vietnamese", width: 253, field: "translate", hidden: 6 },
            ];
            let pdf;
            let pageNumber = 1;
            let page = createPdfCanvas(title, rows.length, pageNumber);
            let y = drawPdfTableHeader(page.context, page.y, columns);
            for (const row of rows) {
                const cells = columns.map((column) => column.hidden && hiddenPdfColumns.has(column.hidden) ? "" : row.dataset[column.field] || "—");
                page.context.font = '500 17px Manrope, "Segoe UI", "PingFang SC", sans-serif';
                const rowHeight = Math.max(48, ...cells.map((cell, index) => wrapPdfText(page.context, cell, columns[index].width - 16).length * 23 + 18));
                if (y + rowHeight > page.canvas.height - 67) {
                    pdf = await appendPdfPage(pdf, page.canvas);
                    pageNumber += 1;
                    page = createPdfCanvas(title, rows.length, pageNumber);
                    y = drawPdfTableHeader(page.context, page.y, columns);
                }
                y += drawPdfRow(page.context, y, cells, columns);
            }
            pdf = await appendPdfPage(pdf, page.canvas);
            pdf.save(pdfFilename(title));
            showToast("PDF đã được tải xuống.");
        } catch {
            showToast("Không thể tạo PDF trên thiết bị này.", true);
        }
    }

    function resetPShortcut() {
        pShortcutCount = 0;
        pShortcutStartedAt = 0;
        clearTimeout(pShortcutTimer);
        pShortcutTimer = null;
    }

    function handlePShortcut() {
        const now = Date.now();
        if (!pShortcutStartedAt || now - pShortcutStartedAt > 1000) {
            resetPShortcut();
            pShortcutStartedAt = now;
        }
        pShortcutCount += 1;
        if (pShortcutCount === 4) {
            resetPShortcut();
            resetSelection();
            return;
        }
        clearTimeout(pShortcutTimer);
        pShortcutTimer = setTimeout(() => {
            if (pShortcutCount === 3) openSelectionDialog();
            resetPShortcut();
        }, Math.max(0, 1000 - (now - pShortcutStartedAt)));
    }

    function playAudio(button) {
        const source = button.dataset.audioSrc;
        if (!source) return showToast("Từ này chưa có audio.", true);
        if (activeAudioButton === button && activeAudio && !activeAudio.paused) {
            activeAudio.pause();
            button.classList.remove("is-playing");
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

    function studyWords() {
        return selectedRows().map((row) => ({
            key: row.dataset.rowKey,
            index: row.dataset.index,
            word: row.dataset.word || "",
            type: row.dataset.type || "",
            ipa: row.dataset.ipa || "",
            meaning: row.dataset.meaning || "",
            example: row.dataset.example || "",
            translate: row.dataset.translate || "",
            voice: row.dataset.wordVoice || "",
        }));
    }

    function canStudy() {
        const words = studyWords();
        return fieldVisible(1) && fieldVisible(4) && words.some((word) => word.word && word.meaning);
    }

    function newStudyState(direction = "en-to-meaning") {
        const keys = studyWords().map((word) => word.key);
        return {
            version: 1,
            mode: "flash",
            direction,
            queue: keys,
            known: [],
            slideIndex: 0,
            revealed: false,
            updatedAt: Date.now(),
        };
    }

    function normalizeStudyState(candidate) {
        const words = studyWords();
        const allowed = new Set(words.map((word) => word.key));
        const queue = Array.isArray(candidate?.queue) ? candidate.queue.filter((key) => allowed.has(key)) : [];
        const known = Array.isArray(candidate?.known) ? candidate.known.filter((key) => allowed.has(key) && !queue.includes(key)) : [];
        const direction = candidate?.direction === "vi-to-en" && fieldVisible(6) && words.some((word) => word.translate)
            ? "vi-to-en" : "en-to-meaning";
        return {
            version: 1,
            mode: candidate?.mode === "slide" ? "slide" : "flash",
            direction,
            queue,
            known,
            slideIndex: Math.max(0, Math.min(Number(candidate?.slideIndex) || 0, Math.max(words.length - 1, 0))),
            revealed: Boolean(candidate?.revealed),
            updatedAt: Number(candidate?.updatedAt) || Date.now(),
        };
    }

    function saveStudyState() {
        if (!studyState) return;
        studyState.updatedAt = Date.now();
        writeStorage(studyKey, studyState);
    }

    function activeWord() {
        const key = studyState?.queue?.[0];
        return studyWords().find((word) => word.key === key);
    }

    function appendDetail(container, label, value, className = "") {
        if (!value) return;
        const block = element("div", `study-detail ${className}`.trim());
        block.append(element("span", "study-detail-label", label), element("p", "", value));
        container.append(block);
    }

    function appendLexicalMeta(container, word, className = "") {
        const metadata = element("div", `lexical-meta ${className}`.trim());
        let hasMetadata = false;
        if (fieldVisible(2) && word.type) {
            metadata.append(element("span", "lexical-type", word.type));
            hasMetadata = true;
        }
        if (fieldVisible(3) && word.ipa) {
            metadata.append(element("span", "lexical-ipa", word.ipa));
            hasMetadata = true;
        }
        if (hasMetadata) container.append(metadata);
    }

    function appendFlashContext(container, word) {
        const context = element("div", "flash-card-context");
        if (fieldVisible(4)) appendDetail(context, "Meaning", word.meaning, "study-detail-primary");
        if (fieldVisible(5)) appendDetail(context, "Example", word.example, "study-detail-example");
        if (context.childElementCount) container.append(context);
    }

    function setModeTabs() {
        const mode = studyState?.mode || "flash";
        document.querySelectorAll("[data-study-mode]").forEach((tab) => {
            const selected = tab.dataset.studyMode === mode;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
        });
        document.querySelector("#flash-panel").hidden = mode !== "flash";
        document.querySelector("#slide-panel").hidden = mode !== "slide";
    }

    function updateStudyProgress() {
        if (!studyState) return;
        const total = studyWords().length;
        if (studyState.mode === "slide") {
            studyProgress.textContent = total ? `Slide ${studyState.slideIndex + 1} / ${total}` : "Không có từ để học";
            return;
        }
        const known = studyState.known.length;
        studyProgress.textContent = total ? `${known} / ${total} từ đã nhớ trong lượt này` : "Không có từ để học";
    }

    function renderFlash() {
        flashContent.replaceChildren();
        const words = studyWords();
        const word = activeWord();
        if (!word) {
            const done = element("section", "study-finish");
            done.append(
                element("p", "study-eyebrow", "Lượt học hoàn tất"),
                element("h3", "", "Bạn đã đi hết bộ thẻ."),
                element("p", "", "Hãy bắt đầu một lượt mới để ôn lại toàn bộ từ vựng."),
            );
            const actions = element("div", "study-actions");
            actions.append(makeButton("Học lại từ đầu", "restart-study", "button button-primary"), makeButton("Xem danh sách", "exit-study", "button"));
            done.append(actions);
            flashContent.append(done);
            return;
        }

        const reverseAvailable = fieldVisible(6) && words.some((item) => item.translate);
        const card = element("article", `flash-card is-${studyMotion}${studyState.revealed ? " is-revealed" : ""}`);
        const cardHeader = element("div", "flash-card-header");
        cardHeader.append(element("span", "flash-card-kicker", studyState.direction === "vi-to-en" ? "Tiếng Việt → English" : "English → Tiếng Việt"));
        const directionButton = makeButton("Đổi chiều", "toggle-direction", "button button-quiet study-direction-button");
        directionButton.disabled = !reverseAvailable;
        if (!reverseAvailable) directionButton.title = "Lesson này chưa có phần tiếng Việt để đổi chiều.";
        cardHeader.append(directionButton);
        card.append(cardHeader);

        const prompt = element("div", "flash-card-prompt");
        const promptText = studyState.direction === "vi-to-en" ? word.translate : word.word;
        prompt.append(element("p", "flash-prompt", promptText));
        if (studyState.direction === "en-to-meaning") {
            appendLexicalMeta(prompt, word, "flash-lexical-meta");
            if (fieldVisible(1)) prompt.append(makeAudioButton(word));
        }
        const hasVietnameseAnswer = studyState.direction === "en-to-meaning" && fieldVisible(6) && Boolean(word.translate);
        if (hasVietnameseAnswer) appendFlashContext(prompt, word);
        card.append(prompt);

        if (!studyState.revealed) {
            card.append(element("p", "flash-hint", hasVietnameseAnswer ? "Hãy đoán nghĩa tiếng Việt trước khi mở." : "Tự trả lời trước khi lật đáp án."));
            card.append(makeButton(hasVietnameseAnswer ? "Xem nghĩa tiếng Việt" : "Lật đáp án", "flip-card", "button button-primary flash-flip-button"));
        } else {
            const answer = element("div", "flash-card-answer");
            if (studyState.direction === "vi-to-en") {
                answer.append(element("p", "study-detail-label", "English"), element("p", "flash-answer-word", word.word));
                appendLexicalMeta(answer, word, "flash-answer-meta");
                if (fieldVisible(1)) answer.append(makeAudioButton(word));
            }
            if (hasVietnameseAnswer) {
                appendDetail(answer, "Tiếng Việt", word.translate, "study-detail-reveal");
            } else {
                if (fieldVisible(4)) appendDetail(answer, "Meaning", word.meaning, "study-detail-primary");
                if (studyState.direction === "en-to-meaning" && fieldVisible(6)) appendDetail(answer, "Tiếng Việt", word.translate, "study-detail-reveal");
                if (fieldVisible(5)) appendDetail(answer, "Example", word.example, "study-detail-example");
            }
            card.append(answer);
            const actions = element("div", "study-actions flash-rating-actions");
            actions.append(makeButton("Chưa nhớ", "mark-again", "button button-quiet"), makeButton("Đã nhớ", "mark-known", "button button-primary"));
            card.append(actions);
        }
        flashContent.append(card);
    }

    function renderSlide() {
        slideContent.replaceChildren();
        const words = studyWords();
        const word = words[studyState.slideIndex];
        if (!word) {
            slideContent.append(element("p", "study-empty", "Không có từ phù hợp với cấu hình link này."));
            return;
        }
        const slide = element("article", `study-slide is-${studyMotion}`);
        slide.append(element("span", "slide-index", String(word.index).padStart(2, "0")));
        if (fieldVisible(1)) {
            const title = element("h3", "slide-word", word.word);
            title.tabIndex = -1;
            slide.append(title);
        }
        appendLexicalMeta(slide, word, "slide-lexical-meta");
        if (fieldVisible(1)) slide.append(makeAudioButton(word));
        const details = element("div", "slide-details");
        if (fieldVisible(4)) appendDetail(details, "Meaning", word.meaning, "study-detail-primary");
        if (fieldVisible(6)) appendDetail(details, "Tiếng Việt", word.translate);
        if (fieldVisible(5)) appendDetail(details, "Example", word.example);
        slide.append(details);
        const controls = element("div", "slide-controls");
        const previous = makeButton("Trước", "previous-slide", "button button-quiet");
        previous.disabled = studyState.slideIndex === 0;
        const next = makeButton("Tiếp", "next-slide", "button button-primary");
        next.disabled = studyState.slideIndex >= words.length - 1;
        controls.append(previous, next);
        slide.append(controls);
        slideContent.append(slide);
    }

    function renderStudy() {
        if (!studyState) return;
        studyState = normalizeStudyState(studyState);
        setModeTabs();
        updateStudyProgress();
        renderFlash();
        renderSlide();
        saveStudyState();
    }

    function openStudyWorkspace() {
        lessonList.hidden = true;
        studyWorkspace.hidden = false;
        studyStartButton.hidden = true;
        studyStartButton?.setAttribute("aria-expanded", "true");
    }

    function exitStudy() {
        if (resumeDialog?.open) resumeDialog.close();
        saveStudyState();
        studyWorkspace.hidden = true;
        lessonList.hidden = false;
        studyStartButton.hidden = false;
        studyStartButton?.setAttribute("aria-expanded", "false");
        studyStartButton?.focus();
    }

    function startStudy(trigger) {
        if (!canStudy()) {
            showToast("Link chia sẻ này đang ẩn Word hoặc Meaning cần cho chế độ học.", true);
            return;
        }
        lastTrigger = trigger;
        const saved = normalizeStudyState(readStorage(studyKey, null));
        openStudyWorkspace();
        if (saved.queue.length) {
            studyState = saved;
            renderStudy();
            const total = studyWords().length;
            const learned = saved.known.length;
            document.querySelector("#resume-dialog-description").textContent = `${learned} / ${total} từ đã nhớ; còn ${saved.queue.length} từ trong lượt học.`;
            openDialog(resumeDialog, trigger);
            return;
        }
        studyState = newStudyState(saved.direction);
        renderStudy();
        flashContent.querySelector('[data-action="flip-card"]')?.focus();
    }

    function resumeStudy() {
        if (resumeDialog?.open) resumeDialog.close();
        renderStudy();
        const target = studyState.mode === "slide" ? slideContent.querySelector("button") : flashContent.querySelector("button");
        target?.focus();
    }

    function restartStudy() {
        const direction = studyState?.direction || "en-to-meaning";
        studyState = newStudyState(direction);
        studyMotion = "forward";
        if (resumeDialog?.open) resumeDialog.close();
        openStudyWorkspace();
        renderStudy();
        flashContent.querySelector('[data-action="flip-card"]')?.focus();
    }

    function markKnown() {
        const key = studyState.queue.shift();
        if (key && !studyState.known.includes(key)) studyState.known.push(key);
        studyState.revealed = false;
        studyMotion = "forward";
        renderStudy();
    }

    function markAgain() {
        const key = studyState.queue.shift();
        if (key) studyState.queue.push(key);
        studyState.revealed = false;
        studyMotion = "forward";
        renderStudy();
    }

    function changeSlide(delta) {
        const next = studyState.slideIndex + delta;
        const total = studyWords().length;
        studyState.slideIndex = Math.max(0, Math.min(next, total - 1));
        studyMotion = delta > 0 ? "forward" : "backward";
        renderStudy();
        slideContent.querySelector("h3")?.focus();
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
        if (action === "start-study") startStudy(button);
        if (action === "exit-study") exitStudy();
        if (action === "resume-study") resumeStudy();
        if (action === "restart-study") restartStudy();
        if (action === "set-study-mode") { studyState.mode = button.dataset.studyMode; studyMotion = "forward"; renderStudy(); }
        if (action === "toggle-direction") { studyState.direction = studyState.direction === "en-to-meaning" ? "vi-to-en" : "en-to-meaning"; studyState.revealed = false; studyMotion = "reveal"; renderStudy(); }
        if (action === "flip-card") { studyState.revealed = true; studyMotion = "reveal"; renderStudy(); flashContent.querySelector('[data-action="mark-again"]')?.focus(); }
        if (action === "mark-known") markKnown();
        if (action === "mark-again") markAgain();
        if (action === "previous-slide") changeSlide(-1);
        if (action === "next-slide") changeSlide(1);
        if (action === "download-pdf") {
            if (event.shiftKey) {
                buildPdfOptionsDialog();
                openDialog(pdfOptionsDialog, button);
            } else {
                downloadPdf();
            }
        }
        if (action === "confirm-download-pdf") {
            const hiddenPdfColumns = selectedPdfHiddenColumns();
            closeDialog(pdfOptionsDialog);
            downloadPdf(hiddenPdfColumns);
        }
        if (action === "open-copy") { if (parentDialog) parentDialog.close(); openCopyDialog(button); }
        if (action === "open-selection") { if (parentDialog) parentDialog.close(); openSelectionDialog(button); }
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
        const key = event.key.toLowerCase();
        const isTyping = event.target.matches("input, textarea, select, [contenteditable=true]");
        if (isTyping || document.querySelector("dialog[open]")) return;

        if (event.ctrlKey && !event.metaKey && !event.altKey) {
            const shortcuts = {
                w: () => copyFormat("2-t-5-[7]", "Word + Meaning + Vietnamese"),
                q: () => copyFormat("2-t-5", "Word + Meaning"),
                e: () => openCopyDialog(),
                h: () => openDialog(shortcutDialog, triggerForShortcut()),
            };
            if (shortcuts[key]) {
                event.preventDefault();
                shortcuts[key]();
                return;
            }
        }

        if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat && key === "p") {
            event.preventDefault();
            handlePShortcut();
            return;
        }

        if (studyWorkspace.hidden) return;
        if (studyState?.mode === "slide" && event.key === "ArrowLeft") { event.preventDefault(); changeSlide(-1); }
        if (studyState?.mode === "slide" && event.key === "ArrowRight") { event.preventDefault(); changeSlide(1); }
        if (studyState?.mode === "flash" && !studyState.revealed && [" ", "Enter"].includes(event.key) && !event.target.closest("button")) {
            event.preventDefault();
            studyState.revealed = true;
            studyMotion = "reveal";
            renderStudy();
        }
    });

    restoreSelection();
})();
