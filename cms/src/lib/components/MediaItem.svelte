<script>
    import { getContext } from 'svelte';

    const selectedMediaFiles = getContext('selectedMediaFiles');

    export let media;

    function onCheckChanged(event) {
        if(event.target.checked) {
            $selectedMediaFiles = [...$selectedMediaFiles, media];
        } else {
            $selectedMediaFiles = $selectedMediaFiles.filter(e => e !== media);
        }
    }
</script>

<div>
    <input type="checkbox" name="media-select" on:change={onCheckChanged} />
    <img src={media.url_preview} alt={media.alt} loading="lazy" />
    <small>{media.name}</small>
</div>

<style>
    div {
        width: 12rem;
        height: 12rem;
        position: relative;
        border: 1px solid var(--muted-border-color);
        border-radius: 0.4rem;
        overflow: hidden;
    }

    input {
        position: absolute;
        top: 0.75rem;
        left: 0.75rem;
        opacity: 0.75;
    }

    small {
        display: block;
        position: absolute;
        width: 100%;
        bottom: 0;
        text-align: center;
        margin: 0;
        padding: 0.5rem;
        background-image: linear-gradient(transparent, #161616);
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
</style>
