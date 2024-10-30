<script>
    import { backend } from '$stores';
    import { onMount } from 'svelte';

    /**
     * @callback onSelectImgFunc
     * @param {Object} selected
     */

    /**
     * @typedef {Object} Props
     * @property {onSelectImgFunc} onselectimg
     */

    /** @type {Props} */
    let { onselectimg } = $props();

    let mediaFiles = $state([]);
    let selected = $state();

    async function updateEntries() {
        const files = await $backend?.getMediaFiles();
        mediaFiles = files || [];
    }

    function select(media) {
        selected = media;
    }

    /**
     * @param {Event} event
     */
    function confirm(event) {
        event.preventDefault();

        onselectimg(selected);
    }

    /**
     * @param {Event} event
     */
    function cancel(event) {
        event.preventDefault();

        if(event.currentTarget !== event.target) return;

        onselectimg(null);
    }

    onMount(() => {
        updateEntries();

        const { body } = document;

        body.classList.add('contain-scroll');

        return () => {
            body.classList.remove('contain-scroll');
        };
    });
</script>


<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog open onclick={cancel}>
    <article>
        <header>Select Image</header>

        <div class="images">
            {#each mediaFiles as media (media.name)}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="img-container" class:selected={selected === media} onclick={() => select(media)}>
                    <img src={media.url_preview} alt="" loading="lazy" crossorigin="use-credentials" />
                    <small>{media.name}</small>
                </div>
            {/each}
        </div>

        <footer>
            <button class="secondary" onclick={cancel}>Cancel</button>
            <button disabled={!selected} onclick={confirm}>Select</button>
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
