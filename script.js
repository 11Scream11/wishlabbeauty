document.addEventListener('DOMContentLoaded', () => {
    // Анимация появления текста
    const content = document.querySelector('.hero__content');
    if (content) {
        content.style.opacity = "0";
        content.style.transform = "translateY(20px)";

        setTimeout(() => {
            content.style.transition = "all 1s ease";
            content.style.opacity = "1";
            content.style.transform = "translateY(0)";
        }, 200);
    }

    initPriceSlider();
    initMobileMenu();
    initCookieBanner();
});

function initPriceSlider() {
    const slider = document.querySelector('[data-price-slider]');
    if (!slider) return;

    const panels = Array.from(slider.querySelectorAll('[data-price-panel]'));
    if (!panels.length) return;

    const tabsWrap = document.querySelector('.price__tabs');
    const board = document.querySelector('.price__board');
    const tabs = Array.from(document.querySelectorAll('[data-price-tab]'));
    const indicator = tabsWrap ? tabsWrap.querySelector('.price__tab-indicator') : null;
    const prevButton = document.querySelector('[data-price-prev]');
    const nextButton = document.querySelector('[data-price-next]');

    let currentIndex = 0;
    let isProgrammaticScroll = false;
    let rafId = null;
    let programmaticRaf = null;
    let programmaticTarget = null;

    const updateIndicator = (options = {}) => {
        if (!indicator || !tabsWrap || !tabs[currentIndex]) return;
        const activeTab = tabs[currentIndex];
        const left = activeTab.offsetLeft;
        const width = activeTab.offsetWidth;
        if (options.instant) {
            indicator.style.transition = 'none';
        }
        indicator.style.width = `${width}px`;
        indicator.style.transform = `translateX(${left}px)`;
        if (options.instant) {
            window.requestAnimationFrame(() => {
                indicator.style.transition = '';
            });
        }

        const styles = getComputedStyle(activeTab);
        const surface = styles.getPropertyValue('--tab-surface').trim();
        if (surface && board) {
            board.style.setProperty('--price-surface', surface);
        }
    };

    const setActive = (nextIndex, options = {}) => {
        const shouldScroll = options.scroll !== false;
        const prevIndex = currentIndex;
        currentIndex = Math.max(0, Math.min(nextIndex, panels.length - 1));

        tabs.forEach((tab, index) => {
            const isActive = index === currentIndex;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        const shouldInstant = Boolean(options.instantIndicator);
        updateIndicator({ instant: shouldInstant });
        if (board && panels[currentIndex]) {
            const tabsHeight = tabsWrap ? tabsWrap.getBoundingClientRect().height : 0;
            const panelHeight = panels[currentIndex].scrollHeight;
            board.style.height = `${tabsHeight + panelHeight + 26}px`;
        }

        if (shouldScroll) {
            const targetLeft = panels[currentIndex].offsetLeft;
            isProgrammaticScroll = true;
            programmaticTarget = targetLeft;
            slider.scrollTo({
                left: targetLeft,
                behavior: 'smooth'
            });

            if (programmaticRaf) window.cancelAnimationFrame(programmaticRaf);
            const startTime = window.performance.now();
            const maxDuration = 1200;
            const tick = () => {
                const diff = Math.abs(slider.scrollLeft - targetLeft);
                if (diff < 1 || window.performance.now() - startTime > maxDuration) {
                    isProgrammaticScroll = false;
                    programmaticTarget = null;
                    programmaticRaf = null;
                    return;
                }
                programmaticRaf = window.requestAnimationFrame(tick);
            };
            programmaticRaf = window.requestAnimationFrame(tick);
        }
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const index = Number(tab.dataset.priceTab);
            if (!Number.isNaN(index)) setActive(index);
        });
    });


    if (prevButton) {
        prevButton.addEventListener('click', () => {
            const nextIndex = (currentIndex - 1 + panels.length) % panels.length;
            const isWrap = currentIndex === 0 && nextIndex === panels.length - 1;
            setActive(nextIndex, { instantIndicator: isWrap });
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const nextIndex = (currentIndex + 1) % panels.length;
            const isWrap = currentIndex === panels.length - 1 && nextIndex === 0;
            setActive(nextIndex, { instantIndicator: isWrap });
        });
    }

    slider.addEventListener('scroll', () => {
        if (isProgrammaticScroll) return;

        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = window.requestAnimationFrame(() => {
            let nearestIndex = 0;
            let minDistance = Number.POSITIVE_INFINITY;

            panels.forEach((panel, index) => {
                const distance = Math.abs(panel.offsetLeft - slider.scrollLeft);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            });

            if (nearestIndex !== currentIndex) {
                setActive(nearestIndex, { scroll: false });
            }
        });
    });

    window.addEventListener('resize', () => {
        slider.scrollTo({
            left: panels[currentIndex].offsetLeft,
            behavior: 'auto'
        });
        updateIndicator();
        if (board && panels[currentIndex]) {
            const tabsHeight = tabsWrap ? tabsWrap.getBoundingClientRect().height : 0;
            const panelHeight = panels[currentIndex].scrollHeight;
            board.style.height = `${tabsHeight + panelHeight + 26}px`;
        }
    });

    setActive(0, { scroll: false });
}

function initMobileMenu() {
    const header = document.querySelector('.site-header');
    const burger = document.querySelector('.site-header__burger');
    const mobileMenu = document.querySelector('.site-header__mobile');
    if (!header || !burger || !mobileMenu) return;

    const updateHeaderState = () => {
        const threshold = header.offsetHeight || 0;
        header.classList.toggle('is-scrolled', window.scrollY > threshold);
    };

    const closeMenu = () => {
        header.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
    };

    burger.addEventListener('click', () => {
        const isOpen = header.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        document.body.classList.toggle('no-scroll', isOpen);
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 991) closeMenu();
    });

    window.addEventListener('scroll', updateHeaderState, { passive: true });
    updateHeaderState();
}

function initCookieBanner() {
    const banner = document.querySelector('[data-cookie-banner]');
    if (!banner) return;

    const acceptButton = banner.querySelector('[data-cookie-accept]');
    const storageKey = 'beautylab_cookie_consent_v1';

    const readStorage = () => {
        try {
            return localStorage.getItem(storageKey);
        } catch (error) {
            return null;
        }
    };

    const writeStorage = (value) => {
        try {
            localStorage.setItem(storageKey, value);
        } catch (error) {
            // ignore storage errors
        }
    };

    const showBanner = () => {
        banner.classList.add('is-visible');
        banner.setAttribute('aria-hidden', 'false');
    };

    const hideBanner = () => {
        banner.classList.remove('is-visible');
        banner.setAttribute('aria-hidden', 'true');
    };

    if (readStorage() === 'accepted') {
        hideBanner();
        return;
    }

    window.setTimeout(showBanner, 600);

    if (acceptButton) {
        acceptButton.addEventListener('click', () => {
            writeStorage('accepted');
            hideBanner();
        });
    }
}
