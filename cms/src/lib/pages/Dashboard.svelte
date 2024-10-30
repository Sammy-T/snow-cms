<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import CollectionNav from '$lib/components/CollectionNav.svelte';
    import EntryList from '$lib/components/EntryList.svelte';
    import MediaList from '$lib/components/MediaList.svelte';
    import { config, selectedCollection } from '$stores';

    let view = $state('posts');

    let collections = $derived($config?.collections);

    $effect(() => {
        if(!$selectedCollection) $selectedCollection = collections?.[0];
    });

    /**
     * @param {String} selected
     */
    function onSelectView(selected) {
        view = selected;
    }
</script>

<Navbar onselectview={onSelectView} />

<div id="dash" class="page">
    {#if view === 'posts'}
        <aside>
            <ul>
                {#if collections}
                    {#each collections as collection}
                        <CollectionNav {...collection} />
                    {/each}
                {/if}
            </ul>
        </aside>

        <EntryList />
    {:else if view === 'media'}
        <MediaList />
    {/if}
</div>

<style>
    aside {
        padding: var(--pico-spacing);
        border: var(--pico-border-width) solid var(--pico-muted-border-color);
    }

    ul {
        padding: 0;
    }

    @media (min-width: 720px) {
        #dash {
            display: flex;
            overflow-y: hidden;
        }   
    }
</style>
