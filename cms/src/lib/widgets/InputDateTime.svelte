<script>
    import { draftEntry, editingEntry, loadedWidgets } from '$stores';
    import { onMount } from 'svelte';
    import { formatDateTimeValue } from '$util';

    /**
     * @typedef {Object} Props
     * @property {String} name
     * @property {String} label
     * @property {String} type
     * @property {String} value
     * @property {Boolean} required
     */

    /** @type {Props} */
    let {
        name,
        label,
        type = 'datetime-local',
        value = formatDateTimeValue(type, new Date()),
        required = true,
    } = $props();

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

        $loadedWidgets = $loadedWidgets + 1;
    }

    onMount(() => {
        init();
    });
</script>

<label class="editorInput" for={name}>
    {label}

    {#if type === 'time'}
        <input type="time" id={name} {name} bind:value oninput={updateDraft} {required} />
    {:else if type === 'date'}
        <input type="date" id={name} {name} bind:value oninput={updateDraft} {required} />
    {:else}
        <input type="datetime-local" id={name} {name} bind:value oninput={updateDraft} {required} />
    {/if}
</label>
