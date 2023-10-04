<script>
    import { draftEntry, editingEntry } from '$stores';
    import { onMount } from 'svelte';
    import { formatDateTimeValue } from '$util';

    export let name;
    export let label;
    export let type = 'datetime-local';
    export let value = formatDateTimeValue(type, new Date());
    export let required = true;

    $: updateDraft(value);

    function updateDraft(updatedValue) {
        const draft = { ...$draftEntry }; // Copy the store object

        draft[name] = updatedValue;

        $draftEntry = draft; // Update the store
    }

    async function init() {
        if(!$editingEntry) return;

        const fields = $editingEntry.fields;
        value = formatDateTimeValue(type, new Date(fields[name]));
    }

    onMount(() => {
        init();
    });
</script>

<label class="editorInput" for={name}>
    {label}

    {#if type === 'time'}
        <input type="time" id={name} {name} bind:value {required} />
    {:else if type === 'date'}
        <input type="date" id={name} {name} bind:value {required} />
    {:else}
        <input type="datetime-local" id={name} {name} bind:value {required} />
    {/if}
</label>
