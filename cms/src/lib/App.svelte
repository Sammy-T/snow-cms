<script>
    import Dashboard from '$lib/pages/Dashboard.svelte';
    import Editor from '$lib/pages/Editor.svelte';
    import LocalBackendModal from '$lib/modals/LocalBackendModal.svelte';
    import { onMount } from 'svelte';
    import { config, backend } from '$stores';
    import { loadCustomBackend } from '$util';

    const pages = {
        '': Dashboard,
        'editor': Editor
    };

    let currentPage;

    $: if(!$backend && !$config?.local_backend && $config?.backend?.name === 'custom') {
        loadCustomBackend(config, backend);
    }

    function updateCurrentPage() {
        const hash = window.location.hash.replace(/#\/?/, '');
        const page = pages[hash];

        if(!page) {
            console.warn(`Page not found: ${hash}`);
            window.location.hash = ''; // Redirect to dashboard
        } else {
            currentPage = page;
        }
    }

    onMount(() => {
        updateCurrentPage();
    });
</script>

<svelte:window on:hashchange={updateCurrentPage} />

<svelte:component this={currentPage} />

{#if !$backend && $config?.local_backend }
    <LocalBackendModal />
{/if}
