<script>
    import { draftEntry, editingEntry, loadedWidgets } from '$stores';
    import { onMount } from 'svelte';

    /**
     * @typedef {Object} Props
     * @property {String} name
     * @property {String} label
     * @property {String} value
     * @property {String} step
     * @property {String} min
     * @property {String} max
     * @property {Boolean} required
     */

    /** @type {Props} */
    let {
        name,
        label,
        value,
        step,
        min,
        max,
        required = true,
    } = $props();

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

        $loadedWidgets = $loadedWidgets + 1;
    }

    onMount(() => {
        init();
    });
</script>

<label class="editorInput" for={name}>
    {label}

    <input type="number" id={name} {name} {step} {min} {max} bind:value oninput={updateDraft} {required} />
</label>
