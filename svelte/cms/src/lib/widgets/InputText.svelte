<script>
    import { draftEntry, selectedCollection, editingEntry } from '$stores';
    import { onMount } from 'svelte';

    export let name;
    export let label;
    export let multiline = false;
    export let required = true;
    export let value = '';

    $: updateDraft(value);

    function updateDraft(updatedValue) {
        const draft = { ...$draftEntry }; // Copy the object

        // Update the draft with the label or the updated value
        if(!updatedValue) {
            draft[name] = $selectedCollection?.fields.find(f => f.name === name).label;
        } else {
            draft[name] = updatedValue;
        }

        $draftEntry = draft; // Update the store
    }

    async function init() {
        if(!$editingEntry) return;

        value = (name === 'body') ? $editingEntry.body : $editingEntry.fields[name];
    }

    onMount(() => {
        init();
    });
</script>

<label class="editorInput" for={name}>
    {label}
    
    {#if !multiline}
        <input type="text" id={name} {name} bind:value {required} />
    {:else}
        <textarea id={name} {name} {required} bind:value></textarea>
    {/if}
</label>
