<script>
    import local from '$lib/backends/local';
    import { onMount } from 'svelte';

    let selected;

    function selectDirectory() {
        selected = local.selectDirectory();
    }

    onMount(() => {
        local.init();
    });
</script>

<dialog open>
    <article>
        <h3>Local Backend Enabled</h3>

        <p>Select the local project directory to continue.</p>

        <footer>
            {#await selected}
                <div aria-busy="true"></div>
            {:then resp} 
                <button class="contrast" on:click={selectDirectory}>
                    Select Project Directory
                </button>
            {/await}
        </footer>
    </article>
</dialog>
