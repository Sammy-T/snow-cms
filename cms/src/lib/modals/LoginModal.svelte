<script>
    import local from '$lib/backends/local';
    import github from '$lib/backends/github';
    import { backend, config } from '$lib/stores';
    import { loadCustomBackend } from '$lib/util';

    $: backendName = ($config?.local_backend) ? 'local' : $config?.backend?.name;

    let loadingBackend;
    let loginConfig;

    let loading;

    $: if($config) initBackend();

    async function submitLogin(event) {
        try {
            const formData = new FormData(event.target);

            loading = loginConfig.action(formData);
        } catch(error) {
            console.error('Unable to submit login.', error);
        }
    }

    async function initBackend() {
        try {
            if(!backendName) throw new Error('Missing backend name');
            
            switch(backendName) {
                case 'local':
                    loadingBackend = await local.init();
                    break;
                
                case 'github':
                    loadingBackend = await github.init();
                    break;
                
                case 'custom':
                    loadingBackend = await loadCustomBackend(config, backend);
                    break;
                
                default:
                    throw new Error(`Unsupported backend: ${backendName}`);
            }

            if(loadingBackend.getLoginConfig) loginConfig = await loadingBackend.getLoginConfig();
        } catch(error) {
            console.error('Unable to init backend.', error);
        }
    }
</script>

<dialog open>
    <article>
        <header>
            <h3>{loginConfig?.title ?? 'Log in'}</h3>
        </header>

        <p>{loginConfig?.message ?? 'Log in to continue.'}</p>

        <form id="login" on:submit|preventDefault={submitLogin}>
            {#if loginConfig?.fields}
                {@const fields = Object.entries(loginConfig.fields)}

                {#each fields as field (field[0])}
                    {@const [name, type] = field}

                    <input {type} {name} placeholder={name} autocomplete="on" required />
                {/each}
            {/if}
        </form>

        <footer>
            {#await loading}
                <div aria-busy="true"></div>
            {:then resp} 
                <button form="login">
                    {loginConfig?.button ?? 'Log in'}
                </button>
            {/await}
        </footer>
    </article>
</dialog>
