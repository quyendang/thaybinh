(() => {
    const table = document.querySelector(".lesson-table");
    if (!table) return;

    const shareShell = document.querySelector(".share-shell");
    const lessonId = table.dataset.lessonId;
    const storagePrefix = `fasteng:share:${lessonId}`;
    const hiddenWordsKey = `${storagePrefix}:hidden-words`;
    const formatKey = `${storagePrefix}:copy-format`;
    const studyKey = `${storagePrefix}:study-state`;
    const coverKey = "fasteng:share:cover"; // shared by every lesson, like the FastENG web app
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
    let covered = new Set(readStorage(coverKey, []).filter((column) => !hiddenColumns.has(column)));

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

    function appendAudioButton(container, word) {
        const button = makeAudioButton(word);
        if (button) container.append(button);
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

    // Numbers follow what is on screen: 1..n over the picked words, in the current (maybe shuffled) order.
    function renumber() {
        selectedRows().forEach((row, i) => {
            const n = String(i + 1);
            row.dataset.index = n;
            row.cells[0].textContent = n;
            const mobileIndex = document.querySelector(`.mobile-word-item[data-row-key="${CSS.escape(row.dataset.rowKey)}"] .mobile-word-index`);
            if (mobileIndex) mobileIndex.textContent = n;
        });
    }

    function updateVisibleCount() {
        renumber();
        const label = document.querySelector("#visible-word-count");
        if (label) label.textContent = `${selectedRows().length} từ đang hiển thị`;
        const badge = document.querySelector("#pick-badge");
        const off = getRows().length - selectedRows().length;
        if (badge) { badge.textContent = off; badge.hidden = off === 0; }
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

    function copyLessonInfo(includeGroup) {
        const lessonName = document.querySelector("#lesson-title")?.textContent?.trim() || "";
        const groupName = document.querySelector(".share-workspace")?.dataset.groupName?.trim() || "";
        const values = includeGroup ? [groupName, lessonName, window.location.href] : [lessonName, window.location.href];
        copyText(values.join(","), includeGroup ? "Thông tin nhóm và bài học đã được sao chép." : "Thông tin bài học đã được sao chép.");
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

    // A covered column is tape over each cell; a tap lifts one cell, a second tap covers it again.
    function applyCover() {
        document.querySelectorAll("[data-col]").forEach((node) => {
            const on = covered.has(Number(node.dataset.col));
            node.classList.toggle("is-covered", on);
            node.classList.remove("is-lifted");
            if (on) { node.tabIndex = 0; node.setAttribute("role", "button"); } else { node.removeAttribute("tabindex"); node.removeAttribute("role"); }
        });
        document.querySelectorAll("[data-cover]").forEach((button) => {
            const column = Number(button.dataset.cover);
            button.disabled = hiddenColumns.has(column);
            button.setAttribute("aria-pressed", String(covered.has(column)));
        });
    }

    function toggleCover(column) {
        covered.has(column) ? covered.delete(column) : covered.add(column);
        writeStorage(coverKey, [...covered]);
        applyCover();
    }

    function liftCell(node) {
        node.classList.toggle("is-covered");
        node.classList.toggle("is-lifted");
    }

    function shuffleRows() {
        const order = getRows().map((row) => row.dataset.rowKey);
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        const mobileList = document.querySelector(".lesson-mobile-list");
        const byKey = (parent, key) => parent.querySelector(`[data-row-key="${CSS.escape(key)}"]`);
        order.forEach((key) => {
            table.tBodies[0].append(byKey(table.tBodies[0], key));
            if (mobileList) mobileList.append(byKey(mobileList, key));
        });
        renumber();
        showToast("Đã xáo trộn thứ tự từ.");
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

    // ── Print & PDF ──────────────────────────────────────────────────────────
    // One layout plan (columns, widths, font size, pages) feeds all three outputs: Cmd/Ctrl+P, the
    // "In" button and the PDF download. Units are mm; A4 portrait with 8mm margins.
    const MM = 2800 / 210; // canvas px per mm; 2800 x 3959 px is exactly A4 in html2pdf
    const PAGE_H = 3959 / MM;
    const MARGIN = 8;
    const CW = 210 - 2 * MARGIN;
    const CH = PAGE_H - 2 * MARGIN; // the PDF page number sits inside the bottom margin
    const PT = 25.4 / 72; // mm per point
    const PAD_X = 1.4;
    const PAD_Y = 0.9;
    const LINE = 1.3;
    const WRITE_H = 7; // row height that leaves room to write by hand
    const KEY_FS = 8.5;
    const PRINT_COLS = [
        { col: 1, label: "Word", key: "word", weight: "700" },
        { col: 2, label: "Type", key: "typeShort" },
        { col: 3, label: "IPA", key: "ipa", mono: true },
        { col: 4, label: "Meaning", key: "meaning" },
        { col: 5, label: "Example", key: "example" },
        { col: 6, label: "Vietnamese", key: "translate" },
    ];
    const measureCtx = document.createElement("canvas").getContext("2d");
    const lockedColumns = () => new Set([...hiddenColumns, ...printHiddenColumns]);
    const fontPx = (sizePt, weight = "400", mono = false) =>
        `${weight} ${sizePt * PT * MM}px ${mono ? '"IBM Plex Mono", ui-monospace, monospace' : 'Manrope, "Segoe UI", sans-serif'}`;
    const textMm = (ctx, text) => ctx.measureText(text).width / MM;
    const lessonTitle = () => {
        const group = document.querySelector(".share-workspace")?.dataset.groupName || "";
        const name = document.querySelector("#lesson-title")?.textContent?.trim() || "FastENG lesson";
        return { group, name, full: [group, name].filter(Boolean).join(" · ") };
    };

    // Type uses data-type-short, rendered by the server's short_type filter, so print matches the table.
    const cellText = (row, c) => (row.dataset[c.key] || "").trim();

    // Word wrap; a token wider than the column breaks by character.
    function wrapLines(ctx, text, maxMm) {
        const lines = [];
        let line = "";
        for (let piece of String(text).split(/\s+/).filter(Boolean)) {
            const joined = line ? `${line} ${piece}` : piece;
            if (textMm(ctx, joined) <= maxMm) { line = joined; continue; }
            if (line) lines.push(line);
            while (piece.length > 1 && textMm(ctx, piece) > maxMm) {
                let cut = piece.length - 1;
                while (cut > 1 && textMm(ctx, piece.slice(0, cut)) > maxMm) cut--;
                lines.push(piece.slice(0, cut));
                piece = piece.slice(cut);
            }
            line = piece;
        }
        if (line) lines.push(line);
        return lines;
    }

    // Column widths like a browser's auto table layout: every column gets its longest word, then the
    // free width goes to the columns that still wrap, in proportion to how much they would need.
    function fitWidths(specs, k, avail) {
        // +0.8mm slack: the browser's text metrics and rounding differ slightly from the canvas measure.
        const min = specs.map((s) => s.min * k + 2 * PAD_X + 0.8);
        const max = specs.map((s) => s.max * k + 2 * PAD_X + 0.8);
        const sum = (list) => list.reduce((a, b) => a + b, 0);
        const free = avail - sum(min);
        if (free <= 0) return min.map((w) => w * avail / sum(min));
        const need = max.map((w, i) => w - min[i]);
        if (free >= sum(need)) return max.map((w) => w * avail / sum(max));
        return min.map((w, i) => w + free * need[i] / sum(need));
    }

    function paginate(heights, firstCap, restCap) {
        const pages = [];
        let start = 0;
        let used = 0;
        heights.forEach((h, i) => {
            const cap = pages.length ? restCap : firstCap;
            if (i > start && used + h > cap) { pages.push([start, i]); start = i; used = 0; }
            used += h;
        });
        if (heights.length) pages.push([start, heights.length]);
        return pages;
    }

    const HEADER_H = 7.5; // title line on the first page only

    /** blankCols: columns printed empty for students; answerCols: columns shown on the answer key. */
    function printPlan(blankCols, answerCols) {
        const rows = selectedRows();
        const locked = lockedColumns();
        const cols = PRINT_COLS.filter((c) => rows.some((row) => cellText(row, c)));
        const blank = new Set(cols.filter((c) => locked.has(c.col) || blankCols.has(c.col)).map((c) => c.col));
        const answers = blank.size ? cols.filter((c) => answerCols.has(c.col) && !locked.has(c.col)) : [];

        // Text widths at 10pt, scaled linearly for other sizes.
        const specs = cols.map((c) => {
            measureCtx.font = fontPx(10, c.weight, c.mono);
            let min = 0;
            let max = 0;
            for (const row of rows) {
                const text = cellText(row, c);
                max = Math.max(max, textMm(measureCtx, text));
                for (const token of text.split(/\s+/)) min = Math.max(min, textMm(measureCtx, token));
            }
            measureCtx.font = fontPx(8, "700");
            const head = textMm(measureCtx, c.label.toUpperCase());
            if (blank.has(c.col)) {
                // Room to write: about the answer's own length, never a sliver.
                min = Math.max(min, 16, head);
                max = Math.max(max, 24, head);
            }
            return { ...c, min: Math.max(min, head), max: Math.max(max, head) };
        });

        const layoutAt = (fs) => {
            const k = fs / 10;
            measureCtx.font = fontPx(fs * 0.85, "400", true);
            const numW = textMm(measureCtx, String(rows.length)) + 2 * PAD_X + 0.8;
            const widths = fitWidths(specs, k, CW - numW);
            const lineH = fs * PT * LINE;
            const cells = rows.map((row) => specs.map((c, i) => {
                if (blank.has(c.col)) return [];
                measureCtx.font = fontPx(fs, c.weight, c.mono);
                return wrapLines(measureCtx, cellText(row, c), widths[i] - 2 * PAD_X);
            }));
            const heights = cells.map((lines) => Math.max(blank.size ? WRITE_H : 0, Math.max(1, ...lines.map((l) => l.length)) * lineH + 2 * PAD_Y));
            const headH = fs * 0.8 * PT * LINE + 2 * PAD_Y;
            const pages = paginate(heights, CH - HEADER_H - headH, CH - headH);
            return { fs, numW, widths, lineH, headH, cells, heights, pages };
        };

        // Fewest pages first, then the largest font that still fits in that many pages.
        let best = layoutAt(8);
        for (let fs = 11; fs > 8; fs -= 0.5) {
            const candidate = layoutAt(fs);
            if (candidate.pages.length <= best.pages.length) { best = candidate; break; }
        }

        // Answer key: numbered items flowing down three columns per page.
        const keyPages = [];
        if (answers.length) {
            measureCtx.font = fontPx(KEY_FS);
            const colW = (CW - 2 * 5) / 3;
            const lineH = KEY_FS * PT * LINE;
            let page = [];
            let column = 0;
            let y = 0;
            const top = 9;
            rows.forEach((row, i) => {
                const text = `${i + 1}. ${answers.map((c) => cellText(row, c)).filter(Boolean).join(" – ")}`;
                const lines = wrapLines(measureCtx, text, colW);
                const h = lines.length * lineH + 0.6;
                if (y + h > CH - (keyPages.length ? 0 : top)) {
                    column += 1;
                    y = 0;
                    if (column === 3) { keyPages.push(page); page = []; column = 0; }
                }
                page.push({ x: column * (colW + 5), y, lines });
                y += h;
            });
            keyPages.push(page);
        }

        return { rows, cols: specs, blank, answers, keyPages, title: lessonTitle(), ...best, total: best.pages.length + keyPages.length };
    }

    // ── Print DOM (Cmd/Ctrl+P and the "In" button). Same widths and font size as the PDF. ──
    function renderPrintDoc(plan) {
        document.querySelector(".print-doc")?.remove();
        const doc = element("div", "print-doc");
        doc.setAttribute("aria-hidden", "true");
        doc.style.setProperty("--fs", `${plan.fs}pt`);
        const head = element("header", "pd-head");
        head.append(element("h1", "", plan.title.full));
        const tableNode = element("table", `pd-table${plan.blank.size ? " has-blank" : ""}`);
        const colgroup = element("colgroup");
        [plan.numW, ...plan.widths].forEach((w) => {
            const col = element("col");
            col.style.width = `${(w / CW) * 100}%`;
            colgroup.append(col);
        });
        const headRow = element("tr");
        headRow.append(element("th", "pd-n", "#"), ...plan.cols.map((c) => element("th", "", c.label)));
        const thead = element("thead");
        thead.append(headRow);
        const tbody = element("tbody");
        plan.rows.forEach((row, i) => {
            const tr = element("tr");
            tr.append(element("td", "pd-n", String(i + 1)));
            plan.cols.forEach((c) => tr.append(element("td", `pd-${c.key}`, plan.blank.has(c.col) ? "" : cellText(row, c))));
            tbody.append(tr);
        });
        tableNode.append(colgroup, thead, tbody);
        doc.append(head, tableNode);
        if (plan.answers.length) {
            const key = element("section", "pd-key");
            const list = element("ol");
            plan.rows.forEach((row) => list.append(element("li", "", plan.answers.map((c) => cellText(row, c)).filter(Boolean).join(" – "))));
            key.append(element("h2", "", `Đáp án · ${plan.title.full}`), list);
            doc.append(key);
        }
        document.body.append(doc);
    }

    // Cmd/Ctrl+P prints the visible words with covered columns blank and no answer key.
    // The "In" button renders its own plan first and skips this once.
    let printPrepared = false;
    window.addEventListener("beforeprint", () => {
        if (printPrepared) { printPrepared = false; return; }
        renderPrintDoc(printPlan(covered, new Set()));
    });

    function printPlanNow(plan) {
        if (!plan.rows.length) return showToast("Không có từ đang hiển thị để in.", true);
        renderPrintDoc(plan);
        printPrepared = true;
        window.print();
    }

    // ── PDF download: the same plan drawn on A4 canvases ──
    function drawPdfPage(plan, pageIndex) {
        const canvas = document.createElement("canvas");
        canvas.width = 2800;
        canvas.height = 3959;
        const ctx = canvas.getContext("2d");
        const px = (mm) => mm * MM;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textBaseline = "top";
        let y = MARGIN;
        const tablePages = plan.pages.length;

        ctx.fillStyle = "#000000";
        ctx.font = fontPx(7);
        ctx.textAlign = "right";
        ctx.fillText(`${pageIndex + 1} / ${plan.total}`, px(210 - MARGIN), px(PAGE_H - MARGIN + 3));
        ctx.textAlign = "left";

        if (pageIndex >= tablePages) {
            const keyIndex = pageIndex - tablePages;
            if (keyIndex === 0) {
                ctx.fillStyle = "#000000";
                ctx.font = fontPx(12, "700");
                ctx.fillText(`Đáp án · ${plan.title.full}`, px(MARGIN), px(y));
                y += 9;
            }
            ctx.fillStyle = "#000000";
            ctx.font = fontPx(KEY_FS);
            const lineH = KEY_FS * PT * LINE;
            for (const item of plan.keyPages[keyIndex]) {
                item.lines.forEach((line, i) => ctx.fillText(line, px(MARGIN + item.x), px(y + item.y + i * lineH)));
            }
            return canvas;
        }

        if (pageIndex === 0) {
            ctx.fillStyle = "#000000";
            ctx.font = fontPx(13, "700");
            ctx.fillText(plan.title.full, px(MARGIN), px(y));
            y += HEADER_H;
        }

        const widths = [plan.numW, ...plan.widths];
        const xs = widths.reduce((list, w) => [...list, list[list.length - 1] + w], [MARGIN]);
        const rule = (x1, y1, x2, y2, color, width) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = px(width);
            ctx.beginPath();
            ctx.moveTo(px(x1), px(y1));
            ctx.lineTo(px(x2), px(y2));
            ctx.stroke();
        };

        ctx.fillStyle = "#000000";
        ctx.font = fontPx(plan.fs * 0.8, "700");
        ["#", ...plan.cols.map((c) => c.label.toUpperCase())].forEach((label, i) => ctx.fillText(label, px(xs[i] + PAD_X), px(y + PAD_Y)));
        rule(MARGIN, y + plan.headH, MARGIN + CW, y + plan.headH, "#000000", 0.25);
        y += plan.headH;

        const tableTop = y - plan.headH;
        const [start, end] = plan.pages[pageIndex];
        for (let r = start; r < end; r++) {
            const h = plan.heights[r];
            ctx.fillStyle = "#000000";
            ctx.font = fontPx(plan.fs * 0.85, "400", true);
            ctx.fillText(String(r + 1), px(xs[0] + PAD_X), px(y + PAD_Y + 0.2));
            plan.cols.forEach((c, i) => {
                ctx.fillStyle = "#000000";
                ctx.font = fontPx(plan.fs, c.weight, c.mono);
                plan.cells[r][i].forEach((line, l) => ctx.fillText(line, px(xs[i + 1] + PAD_X), px(y + PAD_Y + l * plan.lineH)));
            });
            rule(MARGIN, y + h, MARGIN + CW, y + h, "#000000", 0.1);
            y += h;
        }
        // Worksheets get column rules so each blank reads as a box to write in.
        if (plan.blank.size) xs.slice(1, -1).forEach((x) => rule(x, tableTop, x, y, "#000000", 0.1));
        return canvas;
    }

    function pdfFilename(groupName, lessonName) {
        const safePart = (value) => String(value || "").replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
        const parts = [safePart(groupName), safePart(lessonName)].filter(Boolean);
        return `${parts.join(" - ") || "fasteng-lesson"}.pdf`;
    }

    // Pages go in as JPEG: the browser encodes it natively and jsPDF embeds it as is (~50ms a page),
    // while PNG makes jsPDF re-compress every pixel in JavaScript (~2.5s a page). 0.95 keeps text crisp.
    const PDF_JPEG_QUALITY = 0.95;

    async function appendPdfPage(pdf, canvas) {
        if (pdf) {
            pdf.addPage();
            pdf.addImage(canvas.toDataURL("image/jpeg", PDF_JPEG_QUALITY), "JPEG", 0, 0, 595.28, 841.89);
            canvas.width = 1;
            canvas.height = 1;
            return pdf;
        }

        // html2pdf bundles jsPDF but intentionally does not expose it as a browser global.
        // Initialising the first page through its Worker gives us that same local PDF instance,
        // then later pages can be appended without ever reading the responsive lesson table.
        const worker = window.html2pdf().set({
            margin: 0,
            image: { type: "jpeg", quality: PDF_JPEG_QUALITY },
            jsPDF: { unit: "pt", format: "a4", orientation: "portrait", compress: true },
        }).from(canvas, "canvas").toPdf();
        const generatedPdf = await worker.get("pdf");
        canvas.width = 1;
        canvas.height = 1;
        return generatedPdf;
    }

    async function downloadPdf(plan) {
        if (typeof window.html2pdf !== "function") {
            showToast("Không thể tải trình tạo PDF. Hãy tải lại trang rồi thử lại.", true);
            return;
        }
        if (!plan.rows.length) return showToast("Không có từ đang hiển thị để tạo PDF.", true);
        try {
            showToast("Đang tạo PDF…");
            let pdf;
            for (let i = 0; i < plan.total; i++) pdf = await appendPdfPage(pdf, drawPdfPage(plan, i));
            pdf.save(pdfFilename(plan.title.group, plan.title.name));
            showToast("PDF đã được tải xuống.");
        } catch {
            showToast("Không thể tạo PDF trên thiết bị này.", true);
        }
    }

    // ── Print options dialog (the PDF button) ──
    const checkedColumns = (group) => new Set([...pdfOptionsDialog.querySelectorAll(`[data-print-group="${group}"] input:checked`)].map((input) => Number(input.value)));
    const dialogPlan = () => printPlan(checkedColumns("blank"), checkedColumns("answer"));

    function updatePrintEstimate() {
        const blankSet = checkedColumns("blank");
        pdfOptionsDialog.querySelector('[data-print-group="answer"]').disabled = !blankSet.size;
        const plan = dialogPlan();
        const parts = [`${plan.rows.length} từ`, `${plan.pages.length} trang bảng`];
        if (plan.keyPages.length) parts.push(`${plan.keyPages.length} trang đáp án`);
        parts.push(`chữ ${plan.fs}pt`);
        pdfOptionsDialog.querySelector("#pdf-estimate").textContent = `A4 lề hẹp · ${parts.join(" · ")}`;
    }

    function openPrintDialog(trigger) {
        const locked = lockedColumns();
        const blank = new Set([...locked, ...covered]);
        pdfOptionsDialog.querySelectorAll('[data-print-group="blank"] input').forEach((input) => {
            const column = Number(input.value);
            input.checked = blank.has(column);
            input.disabled = locked.has(column);
            input.parentElement.title = input.disabled ? "Cột này đã được ẩn bởi link chia sẻ." : "";
        });
        pdfOptionsDialog.querySelectorAll('[data-print-group="answer"] input').forEach((input) => {
            const column = Number(input.value);
            input.checked = blank.has(column) && !locked.has(column);
            input.disabled = locked.has(column);
        });
        openDialog(pdfOptionsDialog, trigger);
        document.fonts?.ready.then(updatePrintEstimate) ?? updatePrintEstimate();
    }
    pdfOptionsDialog.addEventListener("change", updatePrintEstimate);

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
        const speech = window.speechSynthesis;
        const wasPlaying = activeAudioButton === button && button.classList.contains("is-playing");
        activeAudio?.pause();
        speech?.cancel();
        activeAudioButton?.classList.remove("is-playing");
        if (wasPlaying) return;
        // No recording (e.g. Vietnamese without trans_voice): read the text with the device's own voice.
        if (!source && button.dataset.speak && speech) {
            const utterance = new SpeechSynthesisUtterance(button.dataset.speak);
            utterance.lang = button.dataset.speakLang || "vi-VN";
            utterance.voice = speech.getVoices().find((voice) => voice.lang.replace("_", "-").startsWith(utterance.lang.slice(0, 2))) || null;
            utterance.onend = utterance.onerror = () => button.classList.remove("is-playing");
            activeAudio = null;
            activeAudioButton = button;
            button.classList.add("is-playing");
            speech.speak(utterance);
            return;
        }
        if (!source) return showToast("Từ này chưa có audio.", true);
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

    function playFlashAudio() {
        const word = activeWord();
        if (!word?.voice) return showToast("Từ này chưa có audio.", true);
        const visibleButton = flashContent.querySelector("[data-audio-src]");
        if (visibleButton?.dataset.audioSrc === word.voice) return playAudio(visibleButton);
        const audioTrigger = document.createElement("button");
        audioTrigger.dataset.audioSrc = word.voice;
        playAudio(audioTrigger);
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
        const card = element("article", `flash-card${studyState.revealed ? " is-revealed" : ""}`);
        const cardHeader = element("div", "flash-card-header");
        cardHeader.append(element("span", "flash-card-kicker", studyState.direction === "vi-to-en" ? "Tiếng Việt → English" : "English → Tiếng Việt"));
        const directionButton = makeButton("Đổi chiều", "toggle-direction", "button button-quiet study-direction-button");
        directionButton.disabled = !reverseAvailable;
        if (!reverseAvailable) directionButton.title = "Lesson này chưa có phần tiếng Việt để đổi chiều.";
        cardHeader.append(directionButton);
        card.append(cardHeader);

        const stage = element("div", `flash-card-stage is-${studyMotion}${studyState.revealed ? " is-revealed" : ""}`);
        const prompt = element("div", "flash-card-prompt");
        const promptText = studyState.direction === "vi-to-en" ? word.translate : word.word;
        prompt.append(element("p", "flash-prompt", promptText));
        if (studyState.direction === "en-to-meaning") {
            appendLexicalMeta(prompt, word, "flash-lexical-meta");
            if (fieldVisible(1)) appendAudioButton(prompt, word);
        }
        const hasVietnameseAnswer = studyState.direction === "en-to-meaning" && fieldVisible(6) && Boolean(word.translate);
        if (hasVietnameseAnswer) appendFlashContext(prompt, word);
        stage.append(prompt);

        // Keep this slot mounted before and after reveal so the card shell never changes height.
        const answerSlot = element("div", "flash-answer-slot");
        answerSlot.setAttribute("aria-live", "polite");
        answerSlot.setAttribute("aria-atomic", "true");
        if (!studyState.revealed) {
            answerSlot.append(element("p", "flash-hint", hasVietnameseAnswer ? "Hãy đoán nghĩa tiếng Việt trước khi mở." : "Tự trả lời trước khi lật đáp án."));
        } else {
            const answer = element("div", "flash-card-answer");
            if (studyState.direction === "vi-to-en") {
                answer.append(element("p", "study-detail-label", "English"), element("p", "flash-answer-word", word.word));
                appendLexicalMeta(answer, word, "flash-answer-meta");
                if (fieldVisible(1)) appendAudioButton(answer, word);
            }
            if (hasVietnameseAnswer) {
                appendDetail(answer, "Tiếng Việt", word.translate, "study-detail-reveal");
            } else {
                if (fieldVisible(4)) appendDetail(answer, "Meaning", word.meaning, "study-detail-primary");
                if (studyState.direction === "en-to-meaning" && fieldVisible(6)) appendDetail(answer, "Tiếng Việt", word.translate, "study-detail-reveal");
                if (fieldVisible(5)) appendDetail(answer, "Example", word.example, "study-detail-example");
            }
            answerSlot.append(answer);
        }
        stage.append(answerSlot);
        card.append(stage);

        const footer = element("footer", "flash-card-footer study-actions");
        if (!studyState.revealed) {
            footer.append(makeButton(hasVietnameseAnswer ? "Xem nghĩa tiếng Việt" : "Lật đáp án", "flip-card", "button button-primary flash-flip-button"));
        } else {
            footer.classList.add("flash-rating-actions");
            footer.append(makeButton("Quay lại", "mark-again", "button button-quiet"), makeButton("Tiếp theo", "mark-known", "button button-primary"));
        }
        card.append(footer);
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
        if (fieldVisible(1)) appendAudioButton(slide, word);
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
        shareShell?.classList.add("is-study-open");
        studyStartButton.hidden = true;
        studyStartButton?.setAttribute("aria-expanded", "true");
        requestAnimationFrame(() => {
            studyWorkspace.scrollIntoView({
                block: "start",
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            });
        });
    }

    function exitStudy() {
        if (resumeDialog?.open) resumeDialog.close();
        saveStudyState();
        studyWorkspace.hidden = true;
        shareShell?.classList.remove("is-study-open");
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
        flashContent.querySelector('[data-action="flip-card"], [data-action="restart-study"]')?.focus();
    }

    function markAgain() {
        const key = studyState.queue.shift();
        if (key) studyState.queue.push(key);
        studyState.revealed = false;
        studyMotion = "forward";
        renderStudy();
        flashContent.querySelector('[data-action="flip-card"], [data-action="restart-study"]')?.focus();
    }

    function revealFlashCard() {
        if (!studyState || studyState.revealed) return;
        studyState.revealed = true;
        studyMotion = "reveal";
        renderStudy();
        flashContent.querySelector('[data-action="mark-again"]')?.focus();
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
        if (action === "flip-card") revealFlashCard();
        if (action === "mark-known") markKnown();
        if (action === "mark-again") markAgain();
        if (action === "previous-slide") changeSlide(-1);
        if (action === "next-slide") changeSlide(1);
        if (action === "download-pdf") openPrintDialog(button);
        if (action === "confirm-download-pdf") {
            const plan = dialogPlan();
            closeDialog(pdfOptionsDialog);
            downloadPdf(plan);
        }
        if (action === "print-sheet") {
            const plan = dialogPlan();
            closeDialog(pdfOptionsDialog);
            printPlanNow(plan);
        }
        if (action === "open-copy") { if (parentDialog) parentDialog.close(); openCopyDialog(button); }
        if (action === "open-selection") { if (parentDialog) parentDialog.close(); openSelectionDialog(button); }
        if (action === "save-selection") saveSelection();
        if (action === "reset-selection") { resetSelection(); if (parentDialog) parentDialog.close(); }
        if (action === "close-dialog") closeDialog(button.closest("dialog"));
        if (action === "shuffle") shuffleRows();
        if (action === "toggle-cover") toggleCover(Number(button.dataset.cover));
    });

    document.addEventListener("click", (event) => {
        const cell = event.target.closest("[data-col].is-covered, [data-col].is-lifted");
        if (cell && !event.target.closest("button")) liftCell(cell);
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
        if (event.target.matches("[data-col][tabindex]") && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            liftCell(event.target);
            return;
        }

        if (event.ctrlKey && !event.metaKey && !event.altKey) {
            const shortcuts = {
                w: () => copyFormat("2-t-5-[7]", "Word + Meaning + Vietnamese"),
                q: () => copyFormat("2-t-5", "Word + Meaning"),
                e: () => openCopyDialog(),
                h: () => openDialog(shortcutDialog, triggerForShortcut()),
                y: () => copyLessonInfo(false),
                u: () => copyLessonInfo(true),
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

        if (studyWorkspace.hidden || !studyState) return;
        if (studyState.mode === "flash") {
            if (event.repeat) return;
            if (event.key === "Enter") {
                event.preventDefault();
                playFlashAudio();
                return;
            }
            if (event.key === " ") {
                event.preventDefault();
                revealFlashCard();
                return;
            }
            if (!studyState.revealed) return;
            if (event.key === "ArrowRight") {
                event.preventDefault();
                markKnown();
                return;
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                markAgain();
                return;
            }
        }
        if (studyState?.mode === "slide" && event.key === "ArrowLeft") { event.preventDefault(); changeSlide(-1); }
        if (studyState?.mode === "slide" && event.key === "ArrowRight") { event.preventDefault(); changeSlide(1); }
    });

    restoreSelection();
    applyCover();
})();
