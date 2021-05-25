// Import Vue and vue-highlgihtjs
import Vue from 'vue';
import VueHighlightJS from 'vue-highlight.js';

// Highlight.js languages (Only required languages)
import python from 'highlight.js/lib/languages/python';
import elixir from 'highlight.js/lib/languages/elixir';
import scala from 'highlight.js/lib/languages/scala';
import haskell from 'highlight.js/lib/languages/haskell';
import ruby from 'highlight.js/lib/languages/ruby';
import javascript from 'highlight.js/lib/languages/javascript';
import vue from 'vue-highlight.js/lib/languages/vue';


import 'highlight.js/styles/github.css' 
 
// Tell Vue.js to use vue-highlightjs
Vue.use(VueHighlightJS, {
	// Register only languages that you want
	languages: {
    elixir,
    haskell,
		javascript,
    python,
		ruby,
    scala,
		vue
	}
});