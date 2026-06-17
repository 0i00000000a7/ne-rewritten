import { type InjectionKey } from 'vue';
import type { Settings } from '@/core/settings';

export const SETTINGS_KEY: InjectionKey<Settings> = Symbol('settings');
