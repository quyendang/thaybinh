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
        document.title = language === "en"
            ? "Thay Binh EdTech · Education technology built in Vietnam"
            : "Thay Binh EdTech · Công nghệ cho giáo dục";
        languageButtons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.setLanguage === language));
        });
        root.querySelectorAll("[data-label-vi][data-label-en]").forEach((element) => {
            element.setAttribute("aria-label", element.dataset[language === "vi" ? "labelVi" : "labelEn"]);
        });
        closeMenu();
        try { localStorage.setItem("thaybinh.home.language", language); } catch { /* Preferences are optional. */ }
    };
    let language = "vi";
    try {
        const saved = localStorage.getItem("thaybinh.home.language");
        if (saved === "vi" || saved === "en") language = saved;
    } catch { /* The page works when storage is unavailable. */ }
    setLanguage(language);
    if (languageSwitch) languageSwitch.hidden = false;
    if (toggle) toggle.hidden = false;
    languageButtons.forEach((button) => {
        button.addEventListener("click", () => setLanguage(button.dataset.setLanguage));
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
})();
