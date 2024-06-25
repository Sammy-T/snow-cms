<script>
    import textBoxMult from '$assets/text-box-multiple.svg?raw';
    import folderMultImage from '$assets/folder-multipe-image.svg?raw';
    import logoutIc from '$assets/logout.svg?raw';
    import { backend, cmsActions } from '$lib/stores';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function selectView(event) {        
        const view = new URL(event.currentTarget.href).hash.replaceAll('#', '');
        dispatch('selectview', view);
        
        // Clear focus from the selected link
        // so the tooltip doesn't remain visible.
        event.currentTarget.blur();
    }

    async function logout() {
        // If there's a custom 'on logout' action defined, use it.
        if($cmsActions?.onLogout) await $cmsActions.onLogout();

        // If there's a backend 'logout' function defined, use it.
        // Otherwise, fall back to 'back' navigation.
        ($backend?.logout) ? await $backend.logout() : history.back();
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
            <a href="##exit" class="secondary" data-tooltip="Exit"  data-placement="bottom"
                on:click|preventDefault={logout}>
                {@html logoutIc}
            </a>
        </li>
    </ul>
</nav>
