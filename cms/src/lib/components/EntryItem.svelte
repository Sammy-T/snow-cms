<script>
    import { draftEntry, editingEntry } from '$stores';
    import { getContext } from 'svelte';
    import dayjs from 'dayjs';

    /**
     * @typedef {Object} Props
     * @property {Object} entry
     */

    /** @type {Props} */
    let { entry } = $props();

    let entryStatus = (entry.fields.draft) ? 'draft' : 'published';
    let entryDate = dayjs(entry.fields.date).format('MM/DD/YY');

    const selectedEntries = getContext('selectedEntries');

    /**
     * @param {Event} event
     */
    function onCheckChanged(event) {
        // @ts-ignore
        if(event.target.checked) {
            $selectedEntries = [...$selectedEntries, entry];
        } else {
            $selectedEntries = $selectedEntries.filter(e => e !== entry);
        }
    }

    function onItemClick() {
        $draftEntry = {};
        $editingEntry = entry;
    }
</script>

<div class="item">
    <input type="checkbox" name="entry-select" onchange={onCheckChanged} />

    <a href="#editor" class="entry-info" onclick={onItemClick}>
        <div class="entry-name">{entry.fields.title}</div>
        <div class="entry-status">{entryStatus}</div>
        <div class="entry-date">{entryDate}</div>
    </a>
</div>

<style>
    .item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        border-bottom: 1px solid var(--pico-secondary-focus);
    }

    .item:hover {
        background-color: var(--pico-table-row-stripped-background-color);
    }

    a {
        text-decoration: none;
    }

    a:hover, a:focus, a:active {
        text-decoration: none;
        background-color: unset;
    }

    .entry-info {
        flex-grow: 1;
    }

    @media (min-width: 720px) {
        .item {
            align-items: end;
        }

        .entry-info {
            display: flex;
            justify-content: space-between;
        }
        
        .entry-info > div {
            width: 30%;
        }

        .entry-status {
            text-align: center;
        }
        
        .entry-date {
            text-align: end;
        }
    }
</style>
