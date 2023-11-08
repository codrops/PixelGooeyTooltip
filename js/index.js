// Importing the Tooltip class from the tooltip.js file to be used for creating tooltip instances.
import { Tooltip } from './tooltip.js';

// Selecting all elements with the class 'trigger' which will activate tooltips on mouse events.
const triggers = document.querySelectorAll('.trigger');

// Helper function to determine if the device supports touch events
const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

// Determine if we should use touch events instead of mouse events
const useTouchEvents = isTouchDevice();

// Define the event names based on the device capabilities
const startEvent = useTouchEvents ? 'touchstart' : 'mouseenter';
const moveEvent = useTouchEvents ? 'touchmove' : 'mousemove';
const endEvent = useTouchEvents ? 'touchend' : 'mouseleave';

// Creating an array of Tooltip instances by mapping over each trigger element.
const tooltips = Array.from(triggers).map(trigger => {
    const tooltipEl = document.getElementById(trigger.dataset.tooltip);
    return tooltipEl ? new Tooltip(tooltipEl) : null;
});

// Add event listeners for each trigger
triggers.forEach((trigger, index) => {
    const tooltip = tooltips[index];
    if (!tooltip) return;

    let showTimeout, hideTimeout;

    // Start event to show or update the tooltip
    trigger.addEventListener(startEvent, event => {
        clearTimeout(hideTimeout);
        showTimeout = setTimeout(() => {
            if (useTouchEvents) event.preventDefault();
            const touchEvent = useTouchEvents ? event.touches[0] : event;

            if (!tooltip.isOpen) {
                tooltip.updatePosition(touchEvent);
                tooltip.toggle(trigger.dataset.effect, touchEvent);
            }
        }, 40); // Delay before showing the tooltip
    });

    // Move event to update the tooltip position
    trigger.addEventListener(moveEvent, event => {
        if (useTouchEvents) event.preventDefault();
        const touchEvent = useTouchEvents ? event.touches[0] : event;

        if (tooltip.isOpen) {
            tooltip.updatePosition(touchEvent);
        }
    });

    // End event to hide the tooltip
    trigger.addEventListener(endEvent, event => {
        clearTimeout(showTimeout);
        hideTimeout = setTimeout(() => {
            if (tooltip.isOpen) {
                tooltip.toggle(trigger.dataset.effect, event);
            }
        }, 40); // Delay before hiding the tooltip
    });
});
