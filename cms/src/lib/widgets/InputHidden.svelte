<script>
    import { draftEntry, editingEntry, loadedWidgets } from '$stores';
    import { onMount } from 'svelte';
    import { formatDateTimeValue } from '$lib/util';

    /**
     * @typedef {Object} Props
     * @property {String} name
     * @property {String} type
     * @property {String} value
     */

    /** @type {Props} */
    let {
        name,
        type,
        value,
    } = $props();

    function updateDraft() {
        const draft = { ...$draftEntry }; // Copy the store object

        draft[name] = value;

        $draftEntry = draft; // Update the store
    }

    async function init() {
        if($editingEntry?.fields[name]) {
            switch(type) {
                case 'datetime-local':
                case 'date':
                case 'time':
                    value = formatDateTimeValue(type, new Date($editingEntry.fields[name]));
                    break;

                default:
                    value = $editingEntry.fields[name];
                    break;
            }
        } else if(!value) {
            // If there's no default value provided, set a value based on type.
            switch(type) {
                case 'datetime-local':
                case 'date':
                case 'time':
                    value = formatDateTimeValue(type, new Date());
                    break;

                case 'boolean':
                    value = 'false';
                    break;
            }
        }

        updateDraft();

        $loadedWidgets = $loadedWidgets + 1;
    }

    onMount(() => {
        init();
    });
</script>

<input type="hidden" id={name} {name} bind:value />
