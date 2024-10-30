<script>
    import Warning from '$lib/toasts/Warning.svelte';
    import local from '$lib/backends/local';
    import github from '$lib/backends/github';
    import { backend, config } from '$lib/stores';
    import { loadCustomBackend } from '$lib/util';

    let backendName = $derived(($config?.local_backend) ? 'local' : $config?.backend?.name);

    let backendInit = $state();
    let loadingBackend = $state();
    let loginConfig = $state();

    /** @type {Promise<any>}*/
    let loading = $state(null);

    let attempts = $state(2);

    $effect(() => {
        if(backendName && !backendInit) initBackend();
    });

    /**
     * @param {Event} event
     */
    async function submitLogin(event) {
        event.preventDefault();

        try {
            // @ts-ignore
            const formData = new FormData(event.target);

            loading = loginConfig.action(formData);
        } catch(error) {
            console.error('Error logging in.', error);
        }
    }

    async function initBackend() {
        try {
            if(attempts <= 0) return;

            if(!backendName) throw new Error('Missing backend name');
            
            switch(backendName) {
                case 'local':
                    backendInit = local.init();
                    break;
                
                case 'github':
                    backendInit = github.init();
                    break;
                
                case 'custom':
                    backendInit = loadCustomBackend(config, backend);
                    break;
                
                default:
                    throw new Error(`Unsupported backend: ${backendName}`);
            }

            loadingBackend = await backendInit;

            if(loadingBackend.getLoginConfig) loginConfig = await loadingBackend.getLoginConfig();
        } catch(error) {
            console.error('Error initializing backend.', error);

            attempts--;
            console.log('Re-trying init. Attempts left ', attempts);

            initBackend();
        }
    }
</script>

<dialog open>
    <article>
        <header>
            <h3>{loginConfig?.title ?? 'Log in'}</h3>
        </header>

        <p>{loginConfig?.message ?? 'Log in to continue.'}</p>

        <form id="login" onsubmit={submitLogin}>
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

{#await backendInit catch error}
    <Warning msg="Error initializing backend." details={error.message} />
{/await}

{#await loading catch error}
    <Warning msg="Error logging in." details={error.message} />
{/await}
