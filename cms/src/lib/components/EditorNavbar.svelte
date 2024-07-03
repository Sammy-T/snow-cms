<script>
    import ArrowLeft from '$assets/arrow-left.svg?raw';
    import { selectedCollection, editingEntry, draftEntry, backend } from '$stores';
    import { getContext, onMount } from 'svelte';
    import { parseFormEntry } from '$lib/util';

    let entryForm;
    let draftChanged = false;

    const submitted = getContext('submitted');

    $: onDraft([$editingEntry, $draftEntry]);

    async function onDraft(placeholder) {
        if(!entryForm) return;

        draftChanged = !(await areEntriesEqual());
    }

    async function areEntriesEqual() {
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

    function onBackNav() {
        history.back()
    }

    onMount(() => {
        entryForm = document.querySelector('#entry-data');
    });
</script>

<nav>
    <ul>
        <li>
            <!-- Back Navigation -->
            <a href="##placeholder" on:click|preventDefault={onBackNav}>
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
