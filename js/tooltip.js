// Exporting the Tooltip class to be used in other modules
export class Tooltip {
    // Object to hold references to DOM elements associated with the tooltip
    DOM = {
        el: null, // The main tooltip element
        bg: null, // The background element of the tooltip
        content: null, // The content container inside the tooltip
        contentTitle: null, // The title element inside the tooltip content
        contentDescription: null, // The description element inside the tooltip content
        cells: null, // The individual cell elements that make up the background
    };
    rows; // Number of rows in the tooltip background grid
    cols; // Number of columns in the tooltip background grid
    isOpen = false; // State flag indicating whether the tooltip is open
    tl; // GSAP timeline for animations

    /**
     * Creates an instance of Tooltip.
     * @param {HTMLElement} DOM_el - The main DOM element for the tooltip.
     */
    constructor(DOM_el) {
        // Initialize DOM references
        this.DOM.el = DOM_el;
        this.DOM.bg = this.DOM.el.querySelector('.tooltip__bg');
        this.DOM.content = this.DOM.el.querySelector('.tooltip__content');
        this.DOM.contentTitle = this.DOM.content.querySelector('.tooltip__content-title');
        this.DOM.contentDescription = this.DOM.content.querySelector('.tooltip__content-desc');

        // Read rows and columns from data attributes or default to 4
        this.rows = parseInt(this.DOM.el.dataset.rows, 10) || 4;
        this.cols = parseInt(this.DOM.el.dataset.cols, 10) || 4;

        // Create the grid layout for the tooltip background
        this.#layout();
    }

    /**
     * Calculates the optimal tooltip position based on the event's coordinates.
     * @param {MouseEvent} event - The mouse event that triggers tooltip positioning.
     * @returns {Object} The calculated position for the tooltip.
     */
    calculateTooltipPosition(event) {
        // Get the mouse position from the event
        const { clientX, clientY } = event;

        // Get the scroll position of the page
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Get the viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Assuming the tooltip element is available in the scope, get its dimensions
        const tooltipWidth = this.DOM.el.offsetWidth;
        const tooltipHeight = this.DOM.el.offsetHeight;

        // Initialize the position object with the mouse coordinates plus the scroll offset
        let position = { left: clientX + scrollLeft, top: clientY + scrollTop };

        // Adjust the left position if the tooltip goes beyond the right edge of the viewport
        if (clientX + tooltipWidth > viewportWidth) {
            position.left = clientX - tooltipWidth + scrollLeft;
        }

        // Adjust the top position if the tooltip goes beyond the bottom edge of the viewport
        if (clientY + tooltipHeight > viewportHeight) {
            position.top = clientY - tooltipHeight + scrollTop;
        }

        // Adjust the left position if the tooltip goes beyond the left edge of the viewport
        if (position.left < scrollLeft) {
            position.left = scrollLeft;
        }

        // Adjust the top position if the tooltip goes beyond the top edge of the viewport
        if (position.top < scrollTop) {
            position.top = scrollTop;
        }

        return position;
    }

    /**
     * Updates the tooltip's position on the screen.
     * @param {MouseEvent} event - The mouse event that triggers tooltip repositioning.
     */
    updatePosition(event) {
        const position = this.calculateTooltipPosition(event);
        this.DOM.el.style.left = `${position.left}px`;
        this.DOM.el.style.top = `${position.top}px`;
    }

    /**
     * Creates the grid layout for the tooltip's background.
     * @private
     */
    #layout() {
        let strHTML = '';
        
        // Create the grid of cells as a string
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // Add a div for each cell to the string
                strHTML += '<div></div>';
            }
        }

        // Set the innerHTML of the background element in one operation
        this.DOM.bg.innerHTML = strHTML;
        
        // Set the CSS variables on the tooltip element
        this.DOM.el.style.setProperty('--tt-columns', this.cols);
        this.DOM.el.style.setProperty('--tt-rows', this.rows);

        this.DOM.cells =  [...this.DOM.bg.querySelectorAll('div')];
    }

    /**
     * Toggles the tooltip's visibility and triggers the animation effect.
     * @param {string} effectType - The type of animation effect to apply.
     * @param {MouseEvent} event - The mouse event associated with the toggle action.
     */
    toggle(effectType, event) {
        // Toggle the state
        this.isOpen = !this.isOpen;

        // Logic to close the tooltip
        // This would be the reverse of the open animation
        this.#animateCells(effectType, event);
    }

    /**
     * Animates the tooltip cells based on the specified effect type.
     * @private
     * @param {string} effectType - The type of animation effect to apply.
     * @param {MouseEvent} event - The mouse event associated with the animation.
     */
    #animateCells(effectType, event) {
        // Determine the animation based on effectType
        // Construct the method name based on the effectType
        const methodName = `animate${effectType.charAt(0).toUpperCase() + effectType.slice(1)}`;
        // Check if the method exists
        if (typeof this[methodName] === 'function') {
            // Call the dynamically determined method
            this[methodName](event);
        } else {
            // Handle the case where the method does not exist
            console.warn(`Animation effect '${effectType}' is not defined.`);
        }
    }

    /**
     * Creates a default GSAP timeline for animations, with optional parameters to override defaults.
     * @param {Object} [options={}] - Optional parameters to override default timeline settings.
     * @param {number} [options.duration=0.1] - Duration of the animation.
     * @param {string} [options.ease='expo'] - Easing function for the animation.
     * @returns {GSAPTimeline} The GSAP timeline object for animations.
     */
    createDefaultTimeline({ duration = 0.1, ease = 'expo' } = {}) {
        if ( this.tl ) { 
            this.tl.kill();
        }

        return gsap.timeline({
            defaults: {
                duration, // use the duration passed in, or default to 0.1
                ease      // use the ease passed in, or default to 'expo'
            },
            onStart: () => {
                if ( this.isOpen ) {
                    gsap.set(this.DOM.el, {zIndex: 99999});
                    this.DOM.el.classList.add('tooltip--show');
                }
                else {
                    gsap.set(this.DOM.el, {zIndex: 0});
                }
            },
            onComplete: () => {
                if ( !this.isOpen ) {
                    this.DOM.el.classList.remove('tooltip--show');
                }
            }
        });
    }

    /**
     * Animates the content of the tooltip, including title and description.
     */
    animateTooltipContent() {
        this.tl.fromTo([this.DOM.contentTitle, this.DOM.contentDescription], {
            opacity: this.isOpen ? 0 : 1
        }, {
            duration: 0.2,
            opacity: this.isOpen ? 1 : 0,
            stagger: this.isOpen ? 0.2 : 0
        }, this.isOpen ? 0.4 : 0)

        .add(() => {
            this.DOM.contentTitle.classList[this.isOpen ? 'add' : 'remove']('glitch');
        }, this.isOpen ? 0.8 : 0)
        .add(() => {
            this.DOM.contentDescription.classList[this.isOpen ? 'add' : 'remove']('glitch');
        }, this.isOpen ? 1 : 0)
    }

    /**
     * Specific animation effects applied to the tooltip cells and content
     */
    animateEffect1(event) {
        
        this.tl = this.createDefaultTimeline();
        
        // Get the mouse position from the event
        const mousePosition = { x: event.clientX, y: event.clientY };
        // Calculate the maximum distance as the diagonal of the page
        const pageWidth = document.documentElement.scrollWidth;
        const pageHeight = document.documentElement.scrollHeight;
        const maximumDistance = Math.sqrt(pageWidth * pageWidth + pageHeight * pageHeight);

        // Define the maximum delay you want to apply to any cell
        const maximumDelay = 1.8;

        // Calculate the delay for each cell based on its distance from the mouse position
        this.DOM.cells.forEach(cell => {
            // Get the position of the cell
            const cellRect = cell.getBoundingClientRect();
            const cellPosition = { x: cellRect.left, y: cellRect.top };

            // Calculate the distance from the cell to the mouse position
            const distance = Math.sqrt(Math.pow(cellPosition.x - mousePosition.x, 2) + Math.pow(cellPosition.y - mousePosition.y, 2));

            // Convert distance to a delay, for example by inverting and scaling the distance
            // This is where you can get creative with how the distance affects the delay
            const delay = (distance / maximumDistance) * maximumDelay;

            // Apply the animation with the calculated delay
            if ( this.isOpen ) {
                this.tl.fromTo(cell, {
                    opacity: 0
                }, {
                    opacity: 1,
                    delay: delay, // Use the calculated delay here
                }, 0);
            }
            else {
                this.tl.to(cell, {
                    opacity: 0,
                    delay: delay, // Use the calculated delay here
                }, 0);
            }
        });

        this.animateTooltipContent();
    }

    /**
     * Specific animation effects applied to the tooltip cells and content
     */
    animateEffect2() {

        this.tl = this.createDefaultTimeline();

        if ( this.isOpen ) {
            this.tl.fromTo(this.DOM.cells, {
                opacity: 0,
                scale: 0
            }, {
                opacity: 1,
                scale: 1,
                stagger: {
                    each: 0.02,
                    from: 'start'
                }
            }, 0);
        }
        else {
            this.tl.to(this.DOM.cells, {
                opacity: 0,
                scale: 0,
                stagger: {
                    each: 0.02,
                    from: 'end'
                }
            }, 0);
        }
        
        this.animateTooltipContent();

    }
    
    /**
     * Specific animation effects applied to the tooltip cells and content
     */
    animateEffect3() {

        this.tl = this.createDefaultTimeline();

        if ( this.isOpen ) {
            this.tl.fromTo(this.DOM.cells, {
                opacity: 0,
                scale: 0,
                yPercent: () => gsap.utils.random(-200,200)
            }, {
                opacity: 1,
                scale: 1,
                yPercent: 0,
                stagger: {
                    each: 0.03,
                    from: 'center',
                    grid: 'auto'
                }
            }, 0);
        }
        else {
            this.tl.to(this.DOM.cells, {
                opacity: 0,
                scale: 0,
                yPercent: () => gsap.utils.random(-200,200),
                stagger: {
                    each: 0.03,
                    from: 'center',
                    grid: 'auto'
                }
            }, 0);
        }

        this.animateTooltipContent();

    }

    /**
     * Specific animation effects applied to the tooltip cells and content
     */
    animateEffect4() {

        this.tl = this.createDefaultTimeline();

        if ( this.isOpen ) {
            this.tl.fromTo(this.DOM.cells, {
                opacity: 0,
                scaleX: 0.8,
                xPercent: () => gsap.utils.random(-200,200)
            }, {
                opacity: 1,
                scaleX: 1,
                xPercent: 0,
                stagger: {
                    each: 0.02,
                    from: 'random',
                    grid: 'auto'
                }
            }, 0);
        }
        else {
            this.tl.to(this.DOM.cells, {
                opacity: 0,
                scaleX: 0.8,
                xPercent: () => gsap.utils.random(-200,200),
                stagger: {
                    each: 0.02,
                    from: 'random',
                    grid: 'auto'
                }
            }, 0);
        }

        this.animateTooltipContent();

    }

    /**
     * Specific animation effects applied to the tooltip cells and content
     */
    animateEffect5() {
        
        this.tl = this.createDefaultTimeline();

        if ( this.isOpen ) {
            this.tl.fromTo(this.DOM.cells, {
                opacity: 0,
                scale: 0
            }, {
                opacity: 1,
                scale: 1,
                stagger: {
                    each: 0.02,
                    from: 'center',
                    grid: 'auto'
                }
            }, 0);
        }
        else {
            this.tl.to(this.DOM.cells, {
                opacity: 0,
                scale: 0,
                stagger: {
                    each: 0.02,
                    from: 'edges',
                    grid: 'auto'
                }
            }, 0);
        }

        this.animateTooltipContent();

    }

    /**
     * Applies a gooey animation effect to the tooltip cells and animates the content.
     * @param {MouseEvent} event - The mouse event associated with the animation.
     */
    animateEffect6() {

        this.DOM.bg.style.filter = 'url(#gooey)';

        this.tl = this.createDefaultTimeline({
            duration: 0.9,
            ease: 'expo'
        });

        if ( this.isOpen ) {
            this.tl.fromTo(this.DOM.cells, {
                opacity: 0,
                scale: 0.3
            }, {
                opacity: 1,
                scale: 1,
                stagger: {
                    each: 0.08,
                    from: 'random',
                    grid: 'auto'
                }
            }, 0);
        }
        else {
            this.tl.to(this.DOM.cells, {
                opacity: 0,
                scale: 0.3,
                stagger: {
                    each: 0.04,
                    from: 'random',
                    grid: 'auto'
                }
            }, 0);
        }

        this.animateTooltipContent();

    }
}