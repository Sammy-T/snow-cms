<script>
    import EntryItem from './EntryItem.svelte';
    import Pending from '$lib/toasts/Pending.svelte';
    import Warning from '$lib/toasts/Warning.svelte';
    import trashCan from '$assets/trash-can-outline.svg?raw';
    import pencil from '$assets/pencil.svg?raw';
    import { selectedCollection, editingEntry, draftEntry, backend, cmsActions } from '$stores';
    import { writable } from 'svelte/store';
    import { setContext } from 'svelte';

    const selectedEntries = writable([]);
    setContext('selectedEntries', selectedEntries);
    
    let getFilesResp;
    let deleteAction;
    let entries = [];
    
    $: updateEntries([$backend, $selectedCollection]);

    async function updateEntries(placeholder) {
        try{
            getFilesResp = $backend?.getFiles($selectedCollection?.name);
            entries = await getFilesResp || [];
        } catch(error) {
            // There's already a catch and re-throw in the backend
        }
    }

    function newFile() {
        $editingEntry = null;
        $draftEntry = {};
        window.location.hash = '#/editor';
    }

    async function deleteFiles() {
        try{
            await $backend.deleteFiles($selectedEntries);
            
            // If there's a custom 'on delete' action defined, call it on a successful delete.
            if($cmsActions?.onDelete) {
                deleteAction = $cmsActions.onDelete($selectedEntries);
                await deleteAction;
            }

            $selectedEntries = [];
            updateEntries();
        } catch(error) {
            console.error('Error deleting files', error);
        }
    }
</script>

<main>
    <header>
        {$selectedCollection?.label || ''}

        <div id="listActions">
            <button class="outline" disabled={$selectedEntries.length === 0} on:click={deleteFiles}>
                {@html trashCan}Delete
            </button>

            <button on:click={newFile}>
                {@html pencil}New
            </button>
        </div>
    </header>

    {#if entries.length === 0}
        <div id="empty">
            <p>This collection has no entries.</p>
            <button on:click={newFile}>{@html pencil}Create New Entry</button>
        </div>
    {:else}
        <div id="items">
            {#each entries as entry (entry.name)}
                <EntryItem {entry} />
            {/each}
        </div>
    {/if}

    {#await getFilesResp}
        <Pending msg="Loading" />
    {:catch error}
        <Warning msg="Error getting entries" details={error.message} />
    {/await}

    {#await deleteAction catch error}
        <Warning msg="'On delete' event action failed" details={error.message} />
    {/await}
</main>

<style>
    main {
        border: var(--pico-border-width) solid var(--pico-muted-border-color);
        display: flex;
        flex-direction: column;
    }

    header {
        padding: calc(var(--pico-spacing) * 0.5) var(--pico-spacing);
        border-bottom: var(--pico-border-width) solid var(--pico-muted-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    #listActions {
        display: flex;
        gap: 0.4rem;
    }

    button {
        width: auto;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    #empty {
        flex-grow: 1;
        padding: var(--pico-spacing);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    #items {
        padding: calc(var(--pico-spacing) * 0.5) var(--pico-spacing);
        border: var(--pico-border-width) solid var(--pico-muted-border-color);
        flex-grow: 1;
    }

    @media (min-width: 720px) {
        main {
            flex-grow: 1;
        }

        #items {
            overflow-y: auto;
        }
    }
</style>
