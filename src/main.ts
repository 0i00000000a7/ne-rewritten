import {createApp} from 'vue'
import App from './App.vue'
import {BM4} from './notations/BM'

window.notations ??= {}
window.notations.BM4 = BM4

createApp(App).mount('#app')
