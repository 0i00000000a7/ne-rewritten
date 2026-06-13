import { type InjectionKey, type Ref, type DeepReadonly } from 'vue'
import type { Settings } from '../core/settings'

export interface SettingsContext {
    settings: DeepReadonly<Ref<Settings>>
    update: (patch: Partial<Settings>) => void
}

export const SETTINGS_KEY: InjectionKey<SettingsContext> = Symbol('settings')
