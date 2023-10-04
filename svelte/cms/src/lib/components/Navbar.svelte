<script>
    import textBoxMult from '$assets/text-box-multiple.svg?raw';
    import folderMultImage from '$assets/folder-multipe-image.svg?raw';
    import logout from '$assets/logout.svg?raw';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function selectView(event) {        
        const view = new URL(event.currentTarget.href).hash.replaceAll('#', '');
        dispatch('selectview', view);
        
        // Clear focus from the selected link
        // so the tooltip doesn't remain visible.
        event.currentTarget.blur();
    }
</script>

<nav>
    <ul>
        <li>
            <a href="##posts" data-tooltip="Posts" data-placement="bottom" 
                on:click|preventDefault={selectView}>
                {@html textBoxMult}
            </a>
        </li>
        <li>
            <a href="##media" data-tooltip="Media Files" data-placement="bottom" 
                on:click|preventDefault={selectView}>
                {@html folderMultImage}
            </a>
        </li>
    </ul>

    <ul>
        <!-- svelte-ignore a11y-invalid-attribute -->
        <li>
            <a href="#" class="secondary" data-tooltip="Logout"  data-placement="bottom">
                {@html logout}
            </a>
        </li>
    </ul>
</nav>
