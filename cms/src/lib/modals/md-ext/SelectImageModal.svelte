<script>
    import { backend } from '$stores';
    import { onMount, createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let mediaFiles = [];
    let selected;

    $: updateEntries($backend);

    async function updateEntries(placeholder) {
        const files = await $backend?.getMediaFiles();
        mediaFiles = files || [];
    }

    function select(media) {
        selected = media;
    }

    function confirm() {
        const resp = {
            img: selected
        };

        dispatch('selectimg', resp);
    }

    function cancel(event) {
        if(event.currentTarget !== event.target) return;

        dispatch('selectimg', {});
    }

    onMount(() => {
        const { body } = document;
        body.classList.add('contain-scroll');

        return () => {
            body.classList.remove('contain-scroll');
        };
    });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog open on:click={cancel}>
    <article>
        <header>Select Image</header>

        <div class="images">
            {#each mediaFiles as media (media.name)}
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="img-container" class:selected={selected === media}
                    on:click={() => select(media)}>
                    <img src={media.url_preview} alt="" loading="lazy" />
                    <small>{media.name}</small>
                </div>
            {/each}
        </div>

        <footer>
            <button class="secondary" on:click|preventDefault={cancel}>Cancel</button>
            <button disabled={!selected} on:click|preventDefault={confirm}>Select</button>
        </footer>
    </article>
</dialog>

<style>
    .images {
        max-height: 50vh;
        overflow-y: auto;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.15rem;
    }

    .img-container {
        width: 9.5rem;
        height: 9.5rem;
        border-radius: 0.25rem;
        background-color: #161616;
        position: relative;
        cursor: pointer;
        overflow: hidden;
    }

    .img-container img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .img-container small {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        text-align: center;
        padding: 0.25rem;
        background-image: linear-gradient(transparent, #161616);
    }

    .selected {
        outline: 2px solid var(--pico-contrast);
    }

    footer {
        display: flex;
        justify-content: end;
        gap: 0.5rem;
    }

    footer button {
        width: unset;
        margin: 0;
    }

    @media (min-width: 720px) {
        .images {
            min-width: 40vw;
        }  
    }
</style>
