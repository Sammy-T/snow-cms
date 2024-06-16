<script>
    import textBoxEdit from '$assets/text-box-edit.svg?raw';
    import { config, selectedCollection } from '$stores';

    export let name;
    export let label;

    $: selected = $selectedCollection?.name === name ? 'selected' : '';

    function selectCollection() {
        $selectedCollection = $config.collections.find(collection => collection.name === name);
    }
</script>

<li>
    <a href="##placeholder" class="collectionNav" class:selected
        on:click|preventDefault={selectCollection}>
            {@html textBoxEdit}{label}
    </a>
</li>

<style>
    li {
        padding: 0;
    }

    a {
        padding: 0.25rem;
        border-radius: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        text-decoration: none;
    }

    a:hover {
        background-color: var(--pico-secondary-focus);
    }

    a:hover, a:focus, a:active {
        text-decoration: none;
    }

    .selected {
        background-color: var(--pico-secondary-focus);
    }

    @media (min-width: 720px) {
        a {
            width: 10rem;
        }
    }
</style>
