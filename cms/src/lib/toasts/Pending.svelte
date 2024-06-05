<script>
    export let msg = null;
</script>

<div class="toast">
    <div aria-busy="true"></div>

    {#if msg}
        <div>{msg}</div>
    {/if}
</div>
