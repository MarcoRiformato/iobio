
class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach((summary) =>
      summary.addEventListener('click', this.onSummaryClick.bind(this))
    );
    this.querySelectorAll(
      'button:not(.localization-selector):not(.country-selector__close-button):not(.country-filter__reset-button)'
    ).forEach((button) => button.addEventListener('click', this.onCloseButtonClick.bind(this)));

    // Manual Backdrop Click Listener
    const backdrop = this.querySelector('.menu-drawer__backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent accidental clicks passing through
        this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary'));
      });
    }
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary'))
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    console.log('MenuDrawer: onSummaryClick triggered');
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest('.has-submenu');
    const isOpen = detailsElement.hasAttribute('open');
    console.log('MenuDrawer: details open status:', isOpen);
    console.log('MenuDrawer: mainDetailsToggle:', this.mainDetailsToggle);
    console.log('MenuDrawer: clicked details:', detailsElement);
    console.log('MenuDrawer: match?', this.mainDetailsToggle === detailsElement);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
      summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);

      if (window.matchMedia('(max-width: 990px)')) {
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
      }
    } else {
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        summaryElement.setAttribute('aria-expanded', true);
        parentMenuElement && parentMenuElement.classList.add('submenu-open');
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    console.log('HeaderDrawer: openMenuDrawer called');
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle.querySelectorAll('details').forEach((details) => {
      details.removeAttribute('open');
      details.classList.remove('menu-opening');
    });
    this.mainDetailsToggle.querySelectorAll('.submenu-open').forEach((submenu) => {
      submenu.classList.remove('submenu-open');
    });
    document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);

    if (event instanceof KeyboardEvent) elementToFocus?.setAttribute('aria-expanded', false);
  }

  onFocusOut() {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement))
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest('.submenu-open');
    parentMenuElement && parentMenuElement.classList.remove('submenu-open');
    detailsElement.classList.remove('menu-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus(detailsElement.querySelector('summary'));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector('.section-header') || document.querySelector('.header') || document.querySelector('header-component');
    this.borderOffset =
      this.borderOffset || (this.closest('.header-wrapper') && this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0);
    const headerBottom = this.header ? this.header.getBoundingClientRect().bottom : 0;
    document.documentElement.style.setProperty(
      '--header-bottom-position',
      `${parseInt(headerBottom - this.borderOffset)}px`
    );
    this.header?.classList.add('menu-open');
    this.mainDetailsToggle.setAttribute('open', '');

    summaryElement.setAttribute('aria-expanded', true);
    window.addEventListener('resize', this.onResize);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    if (!elementToFocus) return;

    // Let the CSS animation handle the closing, then remove the open attribute
    setTimeout(() => {
      super.closeMenuDrawer(event, elementToFocus);
      this.header.classList.remove('menu-open');
      window.removeEventListener('resize', this.onResize);
    }, 350); // Wait for CSS animation to complete
  }

  onResize = () => {
    this.header &&
      document.documentElement.style.setProperty(
        '--header-bottom-position',
        `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`
      );
    document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
  };
}

customElements.define('header-drawer', HeaderDrawer);

function trapFocus(element, elementToFocus = element) {
  const focusableElements = Array.from(
    element.querySelectorAll(
      'summary, a[href], button:enabled, [tabindex]:not([tabindex^="-"]), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe'
    )
  );
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];
  const trapFocusHandler = (event) => {
    if (event.code.toUpperCase() !== 'TAB') return;

    if (event.shiftKey) {
      if (document.activeElement === firstFocusableElement && event.target === lastFocusableElement) {
        // do nothing
      } else if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableElement && event.target === firstFocusableElement) {
        // do nothing
      } else if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        event.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', trapFocusHandler);

  // remove previous event listener
  if (window.trapFocusHandler) {
    element.removeEventListener('keydown', window.trapFocusHandler);
  }
  window.trapFocusHandler = trapFocusHandler;

  if (elementToFocus) elementToFocus.focus();
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', (event) => {
    if (event.target !== undefined && event.target !== null && !elementToFocus.contains(event.target)) {
      elementToFocus.focus();
    }
  });

  if (elementToFocus) elementToFocus.focus();
}
