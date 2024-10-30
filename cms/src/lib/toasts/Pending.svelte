<script>
    /**
     * @typedef {Object} Props
     * @property {String} msg
     */

    /** @type {Props} */
    let { msg } = $props();
</script>

<div class="toast">
    <div aria-busy="true"></div>

    {#if msg}
        <div>{msg}</div>
    {/if}
</div>
