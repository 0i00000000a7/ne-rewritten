import {createApp, ref, provide} from 'vue'
import App from './App.vue'
import {BM4} from './notations/BM'
import {Omega} from './notations/Omega'
import {register_notation} from './core/registry'
import {DEFAULT_SETTINGS} from './core/settings'
import {SETTINGS_KEY} from './composables/useSettings'

register_notation(Omega)
register_notation(BM4)

// 调试控制台
window.notations ??= {}
window.notations.Omega = Omega
window.notations.BM4 = BM4

const app = createApp(App)

const settings = ref({...DEFAULT_SETTINGS})

app.provide(SETTINGS_KEY, {
    settings,
    update(patch: Partial<typeof DEFAULT_SETTINGS>) {
        Object.assign(settings.value, patch)
    },
})

app.mount('#app')
