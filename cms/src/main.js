import './main.css';
import App from './lib/App.svelte';

//// TODO: Set `window.global` here instead of from the html?

const app = new App({
    target: document.getElementById('app'),
});
  
export default app;
