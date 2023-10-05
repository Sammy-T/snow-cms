<script>
    import { draftEntry, editingEntry } from '$stores';
    import { onMount } from 'svelte';
    import { formatDateTimeValue } from '$util';

    export let name;
    export let label;
    export let type = 'datetime-local';
    export let value = formatDateTimeValue(type, new Date());
    export let required = true;

    function updateDraft() {
        const draft = { ...$draftEntry }; // Copy the store object

        draft[name] = value;

        $draftEntry = draft; // Update the store
    }

    async function init() {
        if($editingEntry) {
            const fields = $editingEntry.fields;
            value = formatDateTimeValue(type, new Date(fields[name]));
        }

        updateDraft();
    }

    onMount(() => {
        init();
    });
</script>

<label class="editorInput" for={name}>
    {label}

    {#if type === 'time'}
        <input type="time" id={name} {name} bind:value on:input={updateDraft} {required} />
    {:else if type === 'date'}
        <input type="date" id={name} {name} bind:value on:input={updateDraft} {required} />
    {:else}
        <input type="datetime-local" id={name} {name} bind:value on:input={updateDraft} {required} />
    {/if}
</label>
