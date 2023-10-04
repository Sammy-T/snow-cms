<script>
    import alert from '$assets/alert.svg?raw';

    export let msg;
    export let details;
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
