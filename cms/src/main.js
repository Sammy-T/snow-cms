import './main.css';
import { mount } from 'svelte';
import App from './lib/App.svelte';

let app;

function init() {
    const targetEl = document.getElementById('app');
    
    // There's an issue where this module occasionally gets called twice
    // so make sure we're not adding to an already created app.
    if(targetEl.childElementCount > 0) return;

    app = mount(App, {
        target: targetEl
    });
}

init();
  
export default app;
