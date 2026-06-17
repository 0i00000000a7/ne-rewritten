import type { NotationDefinition } from '@/utils';

const map = new Map<string, NotationDefinition<unknown>>();

export function register_notation<T>(notation: NotationDefinition<T>): void {
    map.set(notation.id, notation as NotationDefinition<unknown>);
}

export function get_notation(id: string): NotationDefinition<unknown> | undefined {
    return map.get(id);
}

export function list_notations(): NotationDefinition<unknown>[] {
    return Array.from(map.values());
}
