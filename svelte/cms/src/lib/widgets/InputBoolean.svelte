<script>
    import { draftEntry, selectedCollection, editingEntry } from '$stores';
    import { onMount } from 'svelte';

    export let name;
    export let label;
    export let checked = false;
    export let required = true;

    function updateDraft() {
        const draft = { ...$draftEntry }; // Copy the object

        // Update the draft with the label or the updated value
        if(checked === null) {
            draft[name] = $selectedCollection?.fields.find(f => f.name === name).default;
        } else {
            draft[name] = checked;
        }

        $draftEntry = draft; // Update the store
    }

    async function init() {
        if($editingEntry) {
            checked = $editingEntry.fields[name];
        }

        updateDraft();
    }

    onMount(() => {
        init();
    });
</script>

<label class="editorInput" for={name}>
    {label}
    
    <!-- Attach the checkbox to the 'ignore' form to prevent duplicate data on the 'entry' form -->
    <input type="checkbox" role="switch" id={name} {name} form="ignore" bind:checked 
        on:change={updateDraft} {required} />
    
    <!-- 
        Bind the checkbox value to a hidden input since the checkbox value isn't included in the form data when not checked. 
    -->
    <input type="hidden" id={name} {name} value={checked} {required} />
</label>
