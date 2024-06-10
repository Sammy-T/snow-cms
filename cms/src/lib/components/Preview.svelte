<script>
    import { config, selectedCollection, draftEntry } from '$stores';
    import { getStyles, loadTemplate, replaceTags } from '$util';
    import dayjs from 'dayjs';
    import customParseFormat from 'dayjs/plugin/customParseFormat';

    dayjs.extend(customParseFormat);

    $: previewName = $selectedCollection?.preview || $config?.previews.default;
    $: styles = getStyles($config, previewName);

    let template;
    $: (async () => template = await loadTemplate($config, previewName))();

    $: srcdoc = replaceTags(template, styles);

    let iframe;

    // Update content on collection and draft entry changes
    $: updateContent([$selectedCollection, $draftEntry]);

    /**
     * A helper function to initialize iframe contents.
     */
    function onIframeLoaded() {
        updateContent([$selectedCollection, $draftEntry]);
    }

    /**
     * Updates the iframe's contents with the draft input values.
     * @param {*} placeholder - A placeholder to hold the variables that are the reactive triggers
     */
    function updateContent(placeholder) {
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
    }
</script>

<iframe bind:this={iframe} title="Preview" sandbox="allow-same-origin" {srcdoc} on:load={onIframeLoaded}></iframe>

<style>
    iframe {
        flex-grow: 1;
        min-height: 80vh;
    }
</style>
