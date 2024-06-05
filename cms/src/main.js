/**
 * @param {HTMLSlotElement} slot
 */
async function addComponent(slot) {
    try {
        const module = await import(`./lib/${slot.name}.svelte`);
        const Component = module.default;

        new Component({
            target: slot
        });
    } catch(err) {
        console.error(err);
    }
}

const slots = document.querySelectorAll('slot');
slots.forEach(slot => addComponent(slot));