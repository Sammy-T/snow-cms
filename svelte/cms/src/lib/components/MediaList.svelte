<script>
    import MediaItem from './MediaItem.svelte';
    import Pending from '$lib/toasts/Pending.svelte';
    import Warning from '$lib/toasts/Warning.svelte';
    import trashCan from '$assets/trash-can-outline.svg?raw';
    import fileUpload from '$assets/file-upload.svg?raw';
    import { backend } from '$stores';
    import { writable } from 'svelte/store';
    import { setContext } from 'svelte';

    const selectedMediaFiles = writable([]);
    setContext('selectedMediaFiles', selectedMediaFiles);

    let getFilesResp;
    let mediaFiles = [];

    $: updateEntries($backend);

    async function updateEntries(placeholder) {
        try {
            getFilesResp = $backend?.getMediaFiles();
            mediaFiles = await getFilesResp || [];
        } catch(error) {
            // There's already a catch and re-throw in the backend
        }
    }

    async function uploadFile() {
        await $backend.uploadMediaFile();
        updateEntries();
    }

    async function deleteFiles() {
        try{
            await $backend.deleteFiles($selectedMediaFiles);
            $selectedMediaFiles = [];
            updateEntries();
        } catch(error) {
            console.error('Error deleting files', error);
        }
    }
</script>

<main>
    <header>
        Media Files
        <div id="listActions">
            <button class="outline" disabled={$selectedMediaFiles.length === 0} 
                on:click={deleteFiles}>
                {@html trashCan}Delete
            </button>

            <button on:click={uploadFile}>
                {@html fileUpload}Upload
            </button>
        </div>
    </header>

    {#if mediaFiles.length === 0}
        <div id="empty">
            <p>No files found.</p>
            <button on:click={uploadFile}>{@html fileUpload}Upload a File</button>
        </div>
    {:else}
        <div id="items">
            {#each mediaFiles as media (media.name)}
                <MediaItem {media} />
            {/each}
        </div>
    {/if}

    {#await getFilesResp}
        <Pending msg="Loading" />
    {:catch error}
        <Warning msg="Error getting entries" details={error.message} />
    {/await}
</main>

<style>
    main {
        border: var(--border-width) solid var(--muted-border-color);
        display: flex;
        flex-direction: column;
    }

    header {
        padding: calc(var(--spacing) * 0.5) var(--spacing);
        border-bottom: var(--border-width) solid var(--muted-border-color);
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
        padding: var(--spacing);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    #items {
        padding: var(--spacing);
        border: var(--border-width) solid var(--muted-border-color);
        flex-grow: 1;
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    @media (min-width: 720px) {
        main {
            flex-grow: 1;
        }

        #items {
            overflow-y: auto;
            justify-content: flex-start;
        }
    }
</style>
