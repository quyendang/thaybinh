(() => {
    "use strict";
    const root = document.querySelector(".landing");
    if (!root) return;
    const toggle = root.querySelector(".nav-toggle");
    const links = root.querySelector(".nav-links");
    const languageSwitch = root.querySelector(".language-switch");
    const languageButtons = root.querySelectorAll("[data-set-language]");

    const closeMenu = () => {
        links?.classList.remove("is-open");
        toggle?.setAttribute("aria-expanded", "false");
    };
    const setLanguage = (language) => {
        if (language !== "vi" && language !== "en") return;
        root.dataset.language = language;
        document.documentElement.lang = language;
        document.title = "Learning Trajectory Architect · Thay Binh EdTech";
        languageButtons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.setLanguage === language));
        });
        root.querySelectorAll("[data-label-vi][data-label-en]").forEach((element) => {
            element.setAttribute("aria-label", element.dataset[language === "vi" ? "labelVi" : "labelEn"]);
        });
        root.querySelectorAll("[data-alt-vi][data-alt-en]").forEach((element) => {
            element.alt = element.dataset[language === "vi" ? "altVi" : "altEn"];
        });
        closeMenu();
    };
    // A new key discards the previous automatically saved Vietnamese default.
    // Only an explicit choice is saved; fresh visits are English-first.
    const languagePreference = "thaybinh.home.language.v2";
    let language = "en";
    try {
        const saved = localStorage.getItem(languagePreference);
        if (saved === "vi" || saved === "en") language = saved;
    } catch { /* The page works when storage is unavailable. */ }
    setLanguage(language);
    if (languageSwitch) languageSwitch.hidden = false;
    if (toggle) toggle.hidden = false;
    root.dataset.menuReady = "true";
    languageButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const choice = button.dataset.setLanguage;
            setLanguage(choice);
            try { localStorage.setItem(languagePreference, choice); } catch { /* Preferences are optional. */ }
        });
    });
    toggle?.addEventListener("click", () => {
        const isOpen = links?.classList.toggle("is-open") ?? false;
        toggle.setAttribute("aria-expanded", String(isOpen));
    });
    links?.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle?.getAttribute("aria-expanded") === "true") {
            closeMenu();
            toggle.focus();
        }
    });
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".site-nav")) closeMenu();
    });
    const desktop = window.matchMedia("(min-width: 761px)");
    desktop.addEventListener("change", closeMenu);

    const agentButtons = root.querySelectorAll("[data-agent]");
    const agentPanels = root.querySelectorAll(".agent-explanation");
    const selectAgent = (key) => {
        agentButtons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.agent === key));
        });
        agentPanels.forEach((panel) => { panel.hidden = panel.id !== `agent-${key}`; });
    };
    if (agentButtons.length) {
        selectAgent("profile");
        agentButtons.forEach((button) => {
            button.addEventListener("click", () => selectAgent(button.dataset.agent));
        });
    }
})();
