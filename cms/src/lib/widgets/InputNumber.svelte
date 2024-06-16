<script>
    import { draftEntry, editingEntry } from '$stores';
    import { onMount } from 'svelte';

    export let name;
    export let label;
    export let value;
    export let step;
    export let min;
    export let max;
    export let required = true;

    function updateDraft() {
        const draft = { ...$draftEntry }; // Copy the store object

        draft[name] = value;

        $draftEntry = draft; // Update the store
    }

    async function init() {
        if($editingEntry){
            value = $editingEntry.fields[name];
        }

        updateDraft();
    }

    onMount(() => {
        init();
    });
</script>

<label class="editorInput" for={name}>
    {label}

    <input type="number" id={name} {name} {step} {min} {max} bind:value on:input={updateDraft} {required} />
</label>
