<script>
    import textBoxMult from '$assets/text-box-multiple.svg?raw';
    import folderMultImage from '$assets/folder-multipe-image.svg?raw';
    import logoutIc from '$assets/logout.svg?raw';
    import { cmsActions } from '$lib/stores';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function selectView(event) {        
        const view = new URL(event.currentTarget.href).hash.replaceAll('#', '');
        dispatch('selectview', view);
        
        // Clear focus from the selected link
        // so the tooltip doesn't remain visible.
        event.currentTarget.blur();
    }

    function logout() {
        // If there's a custom logout function defined, use it.
        // Otherwise, fall back to back navigation.
        ($cmsActions?.logout) ? $cmsActions.logout() : history.back();
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
        <li>
            <a href="##logout" class="secondary" data-tooltip="Logout"  data-placement="bottom"
                on:click|preventDefault={logout}>
                {@html logoutIc}
            </a>
        </li>
    </ul>
</nav>
