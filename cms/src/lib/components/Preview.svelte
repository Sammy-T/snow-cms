<script>
    import { config, selectedCollection, draftEntry, loadedWidgets, loadingWidgets } from '$stores';
    import { getStyles, loadTemplate, replaceTags } from '$util';
    import { onMount } from 'svelte';
    import dayjs from 'dayjs';
    import customParseFormat from 'dayjs/plugin/customParseFormat';

    dayjs.extend(customParseFormat);

    let previewName = $derived($selectedCollection?.preview || $config?.previews.default);
    let styles = $derived(getStyles($config, previewName));

    let template = $state();

    let srcdoc = $derived(replaceTags(template, styles));

    let iframe = $state();

    let draft = $state();

    let draftInit = false;

    $effect(() => {
        if(!draftInit && $loadedWidgets === $loadingWidgets) {
            draft = $state.snapshot($draftEntry);
            draftInit = true;
        }
    });

    $effect(() => {
        // Update content on draft entry changes
        if(JSON.stringify($draftEntry) !== JSON.stringify(draft)) updateContent();
    });

    /**
     * A helper function to initialize iframe contents.
     */
    function onIframeLoaded() {
        updateContent();
    }

    /**
     * Updates the iframe's contents with the draft input values.
     */
    function updateContent() {
        if(!iframe?.contentDocument) return;

        for(const name in $draftEntry) {
            const field = $selectedCollection?.fields.find(f => f.name === name);
            let displayValue = $draftEntry[name];

            if(field.name === 'date') {
                switch(field?.type) {
                    case 'time':
                        displayValue = dayjs($draftEntry[name], 'hh:mm').format(field.time_format);
                        break;

                    case 'date':
                        displayValue = dayjs($draftEntry[name], 'YYYY-MM-DD')
                            .format(field.date_format);
                        break;
                    
                    default:
                        displayValue = dayjs($draftEntry[name], 'YYYY-MM-DDThh:mm')
                            .format(field.datetime_format);
                }
            }

            const elements = iframe.contentDocument.querySelectorAll(`[data-tag="${name}"]`);

            elements.forEach(element => {
                if(element.innerHTML === displayValue) return; // Ignore values that haven't changed
                
                element.innerHTML = displayValue; // Update the value's display element
            });
        }

        draft = $draftEntry;
    }

    onMount(async () => {
        template = await loadTemplate($config, previewName);
    });
</script>

<iframe bind:this={iframe} title="Preview" sandbox="allow-same-origin" {srcdoc} onload={onIframeLoaded}></iframe>

<style>
    iframe {
        flex-grow: 1;
        min-height: 80vh;
    }
</style>
