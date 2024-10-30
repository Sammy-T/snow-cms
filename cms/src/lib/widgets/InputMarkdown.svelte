<script>
    import MarkdownMenu from './md-ext/MarkdownMenu.svelte';
    import LinkEditor from './md-ext/LinkEditor.svelte';
    import Pending from '$lib/toasts/Pending.svelte';
    import Warning from '$lib/toasts/Warning.svelte';
    import SelectImageModal from '$lib/modals/md-ext/SelectImageModal.svelte';
    import { selectedCollection, draftEntry, editingEntry, backend } from '$stores';
    import { onMount } from 'svelte';

    /**
     * @typedef {Object} Props
     * @property {String} name
     * @property {String} label
     * @property {String} value
     * @property {Boolean} required
     */

    /** @type {Props} */
    let {
        name,
        label,
        value = '',
        required = true,
    } = $props();

    // [Imported from Milkdown]
    let Editor, rootCtx, defaultValueCtx, commandsCtx;
    let listener, listenerCtx;
    let commonmark, turnIntoTextCommand, wrapInHeadingCommand, toggleStrongCommand, toggleEmphasisCommand, wrapInBulletListCommand, wrapInOrderedListCommand, wrapInBlockquoteCommand, insertHrCommand, toggleLinkCommand, insertImageCommand;
    let nord;
    let getHTML, replaceAll;
    // [end]

    let initValue = $state();
    let prevValue = $state();

    let showImgModal = $state(false);
    let savedSelection = $state();

    let linkEditor = $state();
    let mdEditor = $state();
    let mdEditorEl = $state();

    $effect(() => {
        if(value !== prevValue) updateDraft(value);
    });

    /**
     * A helper to dynamically import Milkdown
     */
    async function importMilkdown() {
        const core = await import('@milkdown/core');
        const pluginListener = await import('@milkdown/plugin-listener');
        const presetCommonmark = await import('@milkdown/preset-commonmark');
        const theme = await import('@milkdown/theme-nord');
        const utils = await import('@milkdown/utils');

        Editor = core.Editor;
        rootCtx = core.rootCtx;
        defaultValueCtx = core.defaultValueCtx;
        commandsCtx = core.commandsCtx;

        listener = pluginListener.listener;
        listenerCtx = pluginListener.listenerCtx;

        commonmark = presetCommonmark.commonmark;
        turnIntoTextCommand = presetCommonmark.turnIntoTextCommand;
        wrapInHeadingCommand = presetCommonmark.wrapInHeadingCommand;
        toggleStrongCommand = presetCommonmark.toggleStrongCommand;
        toggleEmphasisCommand = presetCommonmark.toggleEmphasisCommand;
        wrapInBulletListCommand = presetCommonmark.wrapInBulletListCommand;
        wrapInOrderedListCommand = presetCommonmark.wrapInOrderedListCommand;
        wrapInBlockquoteCommand = presetCommonmark.wrapInBlockquoteCommand;
        insertHrCommand = presetCommonmark.insertHrCommand;
        toggleLinkCommand = presetCommonmark.toggleLinkCommand;
        insertImageCommand = presetCommonmark.insertImageCommand;

        nord = theme.nord;

        getHTML = utils.getHTML;
        replaceAll = utils.replaceAll;
    }

    function updateDraft(updatedValue) {
        const draft = { ...$draftEntry }; // Copy the object
        
        // Update the draft with the label or the updated value
        if(!updatedValue) {
            draft[name] = $selectedCollection?.fields.find(f => f.name === name).label;
        } else if(mdEditor) {
            draft[name] = (getHTML()(mdEditor.ctx)).replaceAll('<img ', '<img crossorigin="use-credentials" ');
        }
        
        $draftEntry = draft; // Update the store

        prevValue = value;
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

    /**
     * @param {Object} selected
     */
    function onSelectImg(selected) {
        showImgModal = false;

        restoreSelection();

        if(!selected) return;

        mdEditor.action(ctx => {
            const cmdManager = ctx.get(commandsCtx);

            const opts = {
                alt: selected.name,
                src: selected.url_preview
            };

            cmdManager.call(insertImageCommand.key, opts);
        });
    }

    /**
     * @param {Object} urlOpts
     */
    function onSaveUrl(urlOpts) {
        restoreSelection();

        if(!urlOpts) return;

        const { href } = urlOpts;

        const selection = document.getSelection();

        // Retrieve data from the selection
        const { textContent } = selection.focusNode;
        const { startOffset, endOffset } = selection.getRangeAt(0);
        const selectedText = textContent.substring(startOffset, endOffset);

        mdEditor.action(ctx => {
            const cmdManager = ctx.get(commandsCtx);

            const opts = {
                title: selectedText,
                href,
            };

            cmdManager.call(toggleLinkCommand.key, opts);
        });
    }

    /**
     * @param {String} textType
     */
    function onMenuTextType(textType) {
        mdEditor.action(ctx => {
            const cmdManager = ctx.get(commandsCtx);

            if(textType === 'p') {
                cmdManager.call(turnIntoTextCommand.key);
            } else {
                cmdManager.call(wrapInHeadingCommand.key, textType);
            }
        });
    }

    /**
     * @param {String} action
     */
    function onMenuAction(action) {
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

        if(!mdEditorEl?.contains(selectedEl)) return;

        savedSelection = {
            node: selection.focusNode, 
            range: selection.getRangeAt(0)
        };
    }

    function onEditorCreated(editor) {
        mdEditor = editor;
        mdEditorEl = document.querySelector('.milkdown .ProseMirror');

        replaceAll(value)(mdEditor.ctx);
        updateDraft(value);
    }

    async function editor(dom) {
        await importMilkdown();

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

    function initEditor(dom) {
        editor(dom);
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

<svelte:document onselectionchange={onSelectionChange} />

<label class="editorInput" for={name}>
    {label}

    <div id="md-editor">
        <MarkdownMenu ontexttypeselect={onMenuTextType} onactionselect={onMenuAction} />

        <!-- Milkdown editor container -->
        <div use:initEditor></div>

        <LinkEditor bind:this={linkEditor} onsaveurl={onSaveUrl} />
    </div>

    <input type="hidden" id={name} {name} bind:value {required} />
</label>

{#await initValue}
    <Pending msg="Loading" />
{:catch error}
    <Warning msg="Unable to load" details={error.message} />
{/await}

{#if showImgModal}
    <SelectImageModal onselectimg={onSelectImg} />
{/if}

<style>
    #md-editor {
        margin-top: calc(var(--pico-spacing) * 0.25);
        position: relative;
    }
</style>
