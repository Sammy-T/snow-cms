<script>
    import ArrowLeft from '$assets/arrow-left.svg?raw';
    import { selectedCollection, editingEntry, draftEntry, backend } from '$stores';
    import { getContext, onMount } from 'svelte';
    import { parseFormEntry } from '$lib/util';

    const formState = getContext('formState');
    const submitted = getContext('submitted');

    let draftChanged = $state(false);

    let editing = $state($state.snapshot($editingEntry));
    let draft = $state($state.snapshot($draftEntry));

    $effect(() => {
        if($editingEntry !== editing || $draftEntry !== draft) onDraft();
    });

    async function onDraft() {
        const { entryForm } = formState;

        if(!entryForm) return;

        draftChanged = !(await areEntriesEqual());

        editing = $editingEntry;
        draft = $draftEntry;
    }

    async function areEntriesEqual(entryForm) {
        if(!$editingEntry) return false;

        const formData = new FormData(entryForm);

        for(const [key, value] of formData) {
            const field = $selectedCollection.fields.find(f => f.name === key);
            
            const entryValueRaw = $editingEntry?.fields[field.name] ?? $editingEntry[field.name];
            const parsedValueRaw = await parseFormEntry(field, value, $backend);
            
            let entryValue;
            let parsedValue;
            
            switch(field.widget) {
                case 'datetime':
                    entryValue = new Date(entryValueRaw).getTime();
                    parsedValue = parsedValueRaw.getTime();
                    break;
                
                case 'markdown':
                    // Trim the values and normalize the line endings.
                    entryValue = entryValueRaw.trim().replaceAll('\r\n', '\n');
                    parsedValue = parsedValueRaw.trim().replaceAll('\r\n', '\n');
                    break;

                case 'hidden':
                    switch(field.type) {
                        case 'datetime-local':
                        case 'date':
                        case 'time':
                            entryValue = new Date(entryValueRaw).getTime();
                            parsedValue = parsedValueRaw.getTime();
                            break;
                        
                        default:
                            entryValue = entryValueRaw;
                            parsedValue = parsedValueRaw;
                            break;
                    }
                    break;
                
                default:
                    entryValue = entryValueRaw;
                    parsedValue = parsedValueRaw;
                    break;
            }
            
            if(entryValue !== parsedValue) return false;
        }

        return true;
    }

    /**
     * @param {Event} event
     */
    function onBackNav(event) {
        event.preventDefault();

        history.back()
    }

    onMount(() => {
    });
</script>

<nav>
    <ul>
        <li>
            <!-- Back Navigation -->
            <a href="##back" onclick={onBackNav}>
                {@html ArrowLeft}
            </a>
        </li>
    </ul>

    <ul>
        <!-- Entry Path -->
        <li>{$selectedCollection?.label} <span>/</span> {$editingEntry?.fields.title || 'New File'}</li>
    </ul>

    <ul>
        <li>
            {#await $submitted}
                <button form="entry-data" disabled>Save</button>
            {:then result} 
                <button form="entry-data" disabled={!draftChanged}>Save</button>
            {:catch err}
                <button form="entry-data" disabled={!draftChanged}>Save</button>
            {/await}
        </li>
    </ul>
</nav>

<style>
    li span {
        color: var(--pico-muted-color);
    }

    a:hover {
        background-color: var(--pico-secondary-focus);
    }
</style>
