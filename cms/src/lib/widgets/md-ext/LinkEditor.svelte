<script>
    import { createEventDispatcher, onMount, afterUpdate } from 'svelte';

    const dispatch = createEventDispatcher();

    let show = false;

    let editor;
    let urlInput;

    export function toggleEditor() {
        const selection = document.getSelection();
        
        if(selection.focusNode.parentElement.localName === 'a'){
            dispatch('saveurl', {}); // Clear the link
            return;
        }else if(!show) {
            // Show the editor if there's a range selected
            const { startOffset, endOffset } = selection.getRangeAt(0);
            show = startOffset !== endOffset;
        } else {
            // Toggle the visibility and empty the input
            show = !show;
            urlInput.value = '';
        }
    }

    function onSave(event) {
        event.preventDefault();

        const url = urlInput.value;
        urlInput.value = '';

        show = false; // Hide the editor

        // Dispatch text and url info for the md editor
        dispatch('saveurl', { href: url });
    }

    function onSelectionChange() {
        if(!show) return; // Ignore events when not showing

        const selection = document.getSelection();
        const selectedEl = selection.focusNode;

        if(editor.contains(selectedEl)) return; // Ignore events on this editor

        // The event was outside the editor so we can hide it and clear the value.
        show = false;
        urlInput.value = '';

        // Dispatch null to restore selection without toggling a link.
        dispatch('saveurl', null);
    }

    onMount(() => {
        const linkForm = document.querySelector('#md-link-editor');
        linkForm.addEventListener('submit', onSave);

        return () => {
            linkForm.removeEventListener('submit', onSave);
        };
    });

    afterUpdate(() => {
        if(show) {
            urlInput.focus();
        }
    });
</script>

<svelte:document on:selectionchange={onSelectionChange} />

<div id="link-editor-container" style:visibility={show ? 'visible' : 'hidden' }>

    <div id="link-editor" bind:this={editor}>
        <div>Enter link:</div>

        <input bind:this={urlInput} form="md-link-editor" type="url" name="url"
            placeholder="https://example.com" required />

        <button class="secondary" form="md-link-editor" type="submit">
            Save
        </button>
    </div>

</div>

<style>
    #link-editor-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
    }

    #link-editor {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.25rem 0.5rem;
        background-color: var(--pico-muted-border-color);
        border-radius: 0.25rem;
        pointer-events: auto;
    }

    #link-editor > * {
        width: auto;
        margin: 0;
        padding: 0.25rem;
        font-size: calc(var(--pico-font-size) * 0.75);
    }

    #link-editor input {
        height: 2rem;
    }
</style>
