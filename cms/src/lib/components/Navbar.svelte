<script>
    import textBoxMult from '$assets/text-box-multiple.svg?raw';
    import folderMultImage from '$assets/folder-multipe-image.svg?raw';
    import logoutIc from '$assets/logout.svg?raw';
    import { backend, cmsActions } from '$lib/stores';

    /**
     * @callback selectViewFunc
     * @param {String} view
     */

    /**
     * @typedef {Object} Props
     * @property {selectViewFunc} onselectview
     */

    /** @type {Props} */
    let { onselectview } = $props();

    /**
     * @param {Event} event
     */
    function selectView(event) {  
        event.preventDefault();
              
        // @ts-ignore
        const view = new URL(event.currentTarget.href).hash.replaceAll('#', '');
        onselectview(view);
        
        // Clear focus from the selected link
        // so the tooltip doesn't remain visible.
        // @ts-ignore
        event.currentTarget.blur();
    }

    /**
     * @param {Event} event
     */
    async function logout(event) {
        event.preventDefault();

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
            <a href="##posts" data-tooltip="Posts" data-placement="bottom" onclick={selectView}>
                {@html textBoxMult}
            </a>
        </li>
        <li>
            <a href="##media" data-tooltip="Media Files" data-placement="bottom" onclick={selectView}>
                {@html folderMultImage}
            </a>
        </li>
    </ul>

    <ul>
        <li>
            <a href="##exit" class="secondary" data-tooltip="Exit"  data-placement="bottom" onclick={logout}>
                {@html logoutIc}
            </a>
        </li>
    </ul>
</nav>
