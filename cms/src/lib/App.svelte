<script>
    import Dashboard from '$lib/pages/Dashboard.svelte';
    import Editor from '$lib/pages/Editor.svelte';
    import LoginModal from './modals/LoginModal.svelte';
    import { onMount } from 'svelte';
    import { backend } from '$stores';

    const pages = {
        '': Dashboard,
        'editor': Editor
    };

    let CurrentPage = $state();

    function updateCurrentPage() {
        const hash = window.location.hash.replace(/#\/?/, '');
        const page = pages[hash];

        if(!page) {
            console.warn(`Page not found: ${hash}`);
            window.location.hash = ''; // Redirect to dashboard
        } else {
            CurrentPage = page;
        }
    }

    onMount(() => {
        updateCurrentPage();
    });
</script>

<svelte:window onhashchange={updateCurrentPage} />

<CurrentPage />

{#if !$backend}
    <LoginModal />
{/if}
