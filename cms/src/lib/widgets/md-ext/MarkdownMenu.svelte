<script>
    import bold from '$assets/format-bold.svg?raw';
    import italic from '$assets/format-italic.svg?raw';
    import listBulleted from '$assets/format-list-bulleted.svg?raw';
    import listNumbered from '$assets/format-list-numbered.svg?raw';
    import horizontalRule from '$assets/horizontal-rule.svg?raw';
    import quote from '$assets/format-quote-close.svg?raw';
    import link from '$assets/link.svg?raw';
    import image from '$assets/image.svg?raw';
    import { createEventDispatcher, onMount } from 'svelte';

    const dispatch = createEventDispatcher();

    let textTypeSelect;
    let mdEditor;

    const textTypes = initTextTypes();

    const actions = [
        { name: 'bold', icon: bold },
        { name: 'italic', icon: italic },
        { name: 'listBulleted', icon: listBulleted },
        { name: 'listNumbered', icon: listNumbered },
        { name: 'quote', icon: quote },
        { name: 'horizontalRule', icon: horizontalRule },
        { name: 'link', icon: link },
        { name: 'image', icon: image }
    ];

    function actionClicked(event) {
        const { action } = event.currentTarget.dataset;
        dispatch('menuaction', action);
    }

    function onTypeSelected(event) {
        const type = event.currentTarget.value;
        dispatch('menutexttype', type);
    }

    function onSelectionChange() {
        const selection = document.getSelection();
        const selectedEl = selection.focusNode?.parentElement;

        if(!mdEditor.contains(selectedEl)) return;

        const { localName } = selectedEl;

        switch(localName) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                textTypeSelect.value = parseInt(localName.split('').at(-1));
                break;

            default:
                textTypeSelect.value = 'p';
                break;
        }
    }

    function initTextTypes() {
        const types = [];

        for(let i = 0; i <= 6; i++) {
            let textType;
            
            if(i === 0) {
                textType = { title: 'Normal', value: 'p' };
            } else {
                textType = { title: `Heading ${i}`, value: i };
            }
            
            types.push(textType);
        }

        return types;
    }

    onMount(() => {
        mdEditor = document.querySelector('#md-editor');
    });
</script>

<svelte:document on:selectionchange={onSelectionChange} />

<div class="editor-menu">
    <select name="text-type" form="ignore" bind:this={textTypeSelect} on:change={onTypeSelected}>
        {#each textTypes as type}
            <option value={type.value}>{type.title}</option>
        {/each}
    </select>

    {#each actions as action}
        <button class="secondary" data-action={action.name} on:click|preventDefault={actionClicked}>
            {@html action.icon}
        </button>
    {/each}
</div>

<style>
    .editor-menu {
        display: flex;
        gap: 0.25rem;
        overflow-x: hidden;
    }

    .editor-menu > * {
        width: auto;
        padding: 0.25rem;
    }

    .editor-menu * {
        font-size: calc(var(--pico-font-size) * 0.75);
        margin: 0;
    }

    .editor-menu select {
        padding: 0.25rem 0.5rem;
        padding-right: 1.15rem;
        background-position: center right 0.15rem;
    }

    .editor-menu button {
        display: flex;
        align-items: center;
        background-color: unset;
        border: unset;
        color: var(--pico-contrast);
    }

    .editor-menu button:hover {
        background-color: var(--pico-secondary-focus);
    }
</style>
