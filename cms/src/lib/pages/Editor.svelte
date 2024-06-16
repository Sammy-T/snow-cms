<script>
    import EditorNavbar from '$lib/components/EditorNavbar.svelte';
    import InputBoolean from '$lib/widgets/InputBoolean.svelte';
    import InputDateTime from '$lib/widgets/InputDateTime.svelte';
    import InputText from '$lib/widgets/InputText.svelte';
    import InputNumber from '$lib/widgets/InputNumber.svelte';
    import InputMarkdown from '$lib/widgets/InputMarkdown.svelte';
    import InputHidden from '$lib/widgets/InputHidden.svelte';
    import Preview from '$lib/components/Preview.svelte';
    import Pending from '$lib/toasts/Pending.svelte';
    import Warning from '$lib/toasts/Warning.svelte';
    import { selectedCollection, editingEntry, backend, cmsActions } from '$stores';
    import { writable } from 'svelte/store';
    import { setContext } from 'svelte';
    import { constructDoc, parseFormEntry } from '$lib/util';

    const submitted = writable();
    setContext('submitted', submitted);

    let parsing;
    let saveAction;

    const editorInputs = {
        'string': InputText,
        'text': InputText,
        'datetime': InputDateTime,
        'boolean': InputBoolean,
        'number': InputNumber,
        'markdown': InputMarkdown,
        'hidden': InputHidden
    };

    async function onEntrySubmit(event) {
        const entryData = $editingEntry ? { ...$editingEntry } : { fields: {} };

        const formData = new FormData(event.target);
        
        for(const [key, value] of formData.entries()) {
            const field = $selectedCollection.fields.find(f => f.name === key);

            try {
                parsing = parseFormEntry(field, value, $backend)
                entryData.fields[key] = await parsing;
            } catch(error) {
                console.error('Error parsing form entry.', error);
                return;
            }
        }

        const doc = constructDoc($selectedCollection, entryData);
        
        $submitted = $backend.saveFile($selectedCollection, doc);

        try {
            $editingEntry = await $submitted;
            
            // If there's a custom 'on save' action defined, call it on a successful save.
            if($cmsActions?.onSave) {
                saveAction = $cmsActions.onSave($editingEntry);
                await saveAction;
            }
        } catch(error) {
            console.warn('Issue saving post.', error);
        }
    }
</script>

<EditorNavbar />

<div class="page">
    <section id="inputArea">
        <header>Edit</header>

        <form id="entry-data" on:submit|preventDefault={onEntrySubmit}>
            {#if $selectedCollection}
                {#each $selectedCollection.fields as field (field.name)}
                    {@const component = editorInputs[field.widget]}
                    {@const value = field?.default}

                    {#if field.widget === 'boolean'}
                        <svelte:component this={component} {...field} checked={value} />
                    {:else if field.widget === 'text'}
                        <svelte:component this={component} {...field} {value} multiline />
                    {:else}
                        <svelte:component this={component} {...field} {value} />
                    {/if}
                {/each}
            {/if}
        </form>

        <form id="md-link-editor"></form>
        <form id="ignore"></form>
    </section>

    <section id="previewArea">
        <header>Preview</header>

        <Preview />
    </section>
</div>

{#await parsing catch error}
    <Warning msg="Unable to save" details={error.message} />
{/await}

{#await $submitted}
    <Pending msg="Saving" />
{:catch error}
    <Warning msg="Unable to save" details={error.message} />
{/await}

{#await saveAction catch error}
    <Warning msg="'On save' event action failed" details={error.message} />
{/await}

<style>
    .page {
        overflow: hidden;
    }

    section {
        border: var(--pico-border-width) solid var(--pico-muted-border-color);
        margin: 0;
    }

    header {
        padding: calc(var(--pico-spacing) * 0.5) var(--pico-spacing);
        border-bottom: var(--pico-border-width) solid var(--pico-muted-border-color);
        background-color: var(--pico-card-background-color);
    }

    form {
        margin: 0;
    }

    #inputArea {
        overflow-y: auto;
    }

    #previewArea {
        display: flex;
        flex-direction: column;
    }

    @media (min-width: 720px) {
        .page {
            display: flex;
            justify-content: center;
        }

        #inputArea {
            width: 42vw;
        }

        #previewArea {
            flex-grow: 1;
        }
    }
</style>
