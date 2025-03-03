<script>
    import { draftEntry, selectedCollection, editingEntry, loadedWidgets } from '$stores';
    import { onMount } from 'svelte';

    /**
     * @typedef {Object} Props
     * @property {String} name
     * @property {String} label
     * @property {Boolean} checked
     * @property {Boolean} required
     */

    /** @type {Props} */
    let {
        name,
        label,
        checked = false,
        required = false,
    } = $props();

    function updateDraft() {
        const draft = { ...$draftEntry }; // Copy the object

        // Update the draft with the label or the updated value
        if(checked == null) {
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

        $loadedWidgets = $loadedWidgets + 1;
    }

    onMount(() => {
        init();
    });
</script>

<label class="editorInput" for={name}>
    {label}
    
    <!-- Attach the checkbox to the 'ignore' form to prevent duplicate data on the 'entry' form -->
    <input type="checkbox" role="switch" id={name} {name} form="ignore" bind:checked 
        onchange={updateDraft} {required} />
    
    <!-- 
        Bind the checkbox value to a hidden input since the checkbox value isn't included in the form data when not checked. 
    -->
    <input type="hidden" id={name} {name} value={checked} {required} />
</label>
