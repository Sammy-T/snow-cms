<script>
    import { draftEntry, selectedCollection, editingEntry } from '$stores';
    import { onMount } from 'svelte';

    export let name;
    export let label;
    export let multiline = false;
    export let required = true;
    export let value = '';

    function updateDraft() {
        const draft = { ...$draftEntry }; // Copy the object

        // Update the draft with the label or the updated value
        if(!value) {
            draft[name] = $selectedCollection?.fields.find(f => f.name === name).label;
        } else {
            draft[name] = value;
        }

        $draftEntry = draft; // Update the store
    }

    async function init() {
        if($editingEntry){
            value = (name === 'body') ? $editingEntry.body : $editingEntry.fields[name];
        }

        updateDraft();
    }

    onMount(() => {
        init();
    });
</script>

<label class="editorInput" for={name}>
    {label}
    
    {#if !multiline}
        <input type="text" id={name} {name} bind:value on:input={updateDraft} {required} />
    {:else}
        <textarea id={name} {name} {required} bind:value on:input={updateDraft}></textarea>
    {/if}
</label>
