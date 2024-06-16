<script>
    import MarkdownMenu from './md-ext/MarkdownMenu.svelte';
    import LinkEditor from './md-ext/LinkEditor.svelte';
    import Pending from '$lib/toasts/Pending.svelte';
    import Warning from '$lib/toasts/Warning.svelte';
    import SelectImageModal from '$lib/modals/md-ext/SelectImageModal.svelte';
    import { selectedCollection, draftEntry, editingEntry, backend } from '$stores';
    import { onMount } from 'svelte';
    import { Editor, rootCtx, defaultValueCtx, commandsCtx } from '@milkdown/core';
    import { listener, listenerCtx } from '@milkdown/plugin-listener';
    import { commonmark, turnIntoTextCommand, wrapInHeadingCommand, toggleStrongCommand, toggleEmphasisCommand, wrapInBulletListCommand, wrapInOrderedListCommand, wrapInBlockquoteCommand, insertHrCommand, toggleLinkCommand, insertImageCommand } from '@milkdown/preset-commonmark';
    import { nord } from '@milkdown/theme-nord';
    import { getHTML, replaceAll } from '@milkdown/utils';

    export let name;
    export let label;
    export let value = '';
    export let required = true;

    let initValue;

    let showImgModal = false;
    let savedSelection;

    let linkEditor;
    let mdEditor;
    let mdEditorEl;

    $: updateDraft(value);

    function updateDraft(updatedValue) {
        const draft = { ...$draftEntry }; // Copy the object
        
        // Update the draft with the label or the updated value
        if(!updatedValue) {
            draft[name] = $selectedCollection?.fields.find(f => f.name === name).label;
        } else if(mdEditor) {
            draft[name] = getHTML()(mdEditor.ctx);
        }
        
        $draftEntry = draft; // Update the store
    }

    function restoreSelection() {
        if(!savedSelection) return;

        const selection = document.getSelection();

        selection.removeAllRanges(); // Clear current selection

        const range = document.createRange();

        const { startOffset, endOffset } = savedSelection.range;

        range.setStart(savedSelection.node, startOffset);
        range.setEnd(savedSelection.node, endOffset);

        selection.addRange(range); // Restore the selection
    }

    function onSelectImg(event) {
        showImgModal = false;

        restoreSelection();

        const { img } = event.detail;
        if(!img) return;

        mdEditor.action(ctx => {
            const cmdManager = ctx.get(commandsCtx);

            const opts = {
                alt: img.name,
                src: img.url_preview
            };

            cmdManager.call(insertImageCommand.key, opts);
        });
    }

    function onSaveUrl(event) {
        restoreSelection();

        if(!event.detail) return;

        const { href } = event.detail;

        const selection = document.getSelection();

        // Retrieve data from the selection
        const { textContent } = selection.focusNode;
        const { startOffset, endOffset } = selection.getRangeAt(0);
        const selectedText = textContent.substring(startOffset, endOffset);

        mdEditor.action(ctx => {
            const cmdManager = ctx.get(commandsCtx);

            const opts = {
                title: selectedText,
                href
            };

            cmdManager.call(toggleLinkCommand.key, opts);
        });
    }

    function onMenuTextType(event) {
        const textType = event.detail;

        mdEditor.action(ctx => {
            const cmdManager = ctx.get(commandsCtx);

            if(textType === 'p') {
                cmdManager.call(turnIntoTextCommand.key);
            } else {
                cmdManager.call(wrapInHeadingCommand.key, textType);
            }
        });
    }

    function onMenuAction(event) {
        const action = event.detail;

        mdEditor.action(ctx => {
            const cmdManager = ctx.get(commandsCtx);

            switch(action) {
                case 'bold':
                    cmdManager.call(toggleStrongCommand.key);
                    break;
                
                case 'italic':
                    cmdManager.call(toggleEmphasisCommand.key);
                    break;
                
                case 'listBulleted':
                    cmdManager.call(wrapInBulletListCommand.key);
                    break;
                
                case 'listNumbered':
                    cmdManager.call(wrapInOrderedListCommand.key);
                    break;
                
                case 'quote':
                    cmdManager.call(wrapInBlockquoteCommand.key);
                    break;
                
                case 'horizontalRule':
                    cmdManager.call(insertHrCommand.key);
                    break;

                case 'link':
                    linkEditor.toggleEditor();
                    break;

                case 'image':
                    if(savedSelection) showImgModal = true;
                    break;
            }
        });
    }

    function onSelectionChange() {
        const selection = document.getSelection();
        const selectedEl = selection.focusNode;

        if(!mdEditorEl.contains(selectedEl)) return;

        savedSelection = {
            node: selection.focusNode, 
            range: selection.getRangeAt(0)
        };
    }

    function onEditorCreated(editor) {
        mdEditor = editor;
        mdEditorEl = document.querySelector('.milkdown .editor');

        replaceAll(value)(mdEditor.ctx);
        updateDraft(value);
    }

    function editor(dom) {
        Editor.make()
            .config(ctx => {
                ctx.set(rootCtx, dom);
                ctx.set(defaultValueCtx, value);

                ctx.get(listenerCtx)
                    .markdownUpdated((ctx, markdown, prevMarkdown) => {
                        value = markdown;
                    });
            })
            .config(nord)
            .use(commonmark)
            .use(listener)
            .create()
            .then(onEditorCreated);
    }

    async function init() {
        if(!$editingEntry) return;

        try {
            // Init the value
            const rawValue = (name === 'body') ? $editingEntry.body : $editingEntry.fields[name];
            
            initValue = $backend.replacePublicLinks(rawValue);
            value = await initValue;
            
            // Update the editor value
            if(mdEditor) replaceAll(value)(mdEditor.ctx);
        } catch(error) {
            // Already catching and re-throwing in the backend
        }
    }

    onMount(() => {
        init();
    });
</script>

<svelte:document on:selectionchange={onSelectionChange} />

<label class="editorInput" for={name}>
    {label}

    <div id="md-editor">
        <MarkdownMenu on:menutexttype={onMenuTextType} on:menuaction={onMenuAction} />

        <!-- Milkdown editor container -->
        <div use:editor />

        <LinkEditor bind:this={linkEditor} on:saveurl={onSaveUrl} />
    </div>

    <input type="hidden" id={name} {name} bind:value {required} />
</label>

{#await initValue}
    <Pending msg="Loading" />
{:catch error}
    <Warning msg="Unable to load" details={error.message} />
{/await}

{#if showImgModal}
    <SelectImageModal on:selectimg={onSelectImg} />
{/if}

<style>
    #md-editor {
        margin-top: calc(var(--pico-spacing) * 0.25);
        position: relative;
    }
</style>
