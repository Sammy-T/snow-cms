<script>
    import alert from '$assets/alert.svg?raw';

    /**
     * @typedef {Object} Props
     * @property {String} msg
     * @property {String} details
     */

    /** @type {Props} */
    let { msg, details } = $props();
</script>

<div class="toast warning">
    {@html alert}

    <details>
        <summary>{msg}</summary>
        {details}
    </details>
</div>

<style>
    details {
        margin: 0;
        padding: 0.15rem;
    }
</style>
