import type { Diagram } from '@/core/diagram_types.ts';

export type NotationDisplay<T> = (a: T) => string;

export type NotationDisplaySpec<T> =
    | NotationDisplay<T>
    | {
          plain: NotationDisplay<T>;
          html?: NotationDisplay<T>;
          from_display?: (str: string) => T;
      };

export function resolve_display<T>(spec: NotationDisplaySpec<T>): {
    plain: NotationDisplay<T>;
    html: NotationDisplay<T>;
    from_display?: (str: string) => T;
} {
    if (typeof spec === 'function') {
        return { plain: spec, html: spec };
    }
    return {
        plain: spec.plain,
        html: spec.html ?? spec.plain,
        from_display: spec.from_display,
    };
}

export type DiagramAction = {
    type: 'scroll';
    direction: 'up' | 'down' | 'left' | 'right';
    step: number;
};

export interface DiagramControl<T, DataType> {
    default_data: DataType;
    draw_diagram: (expr: T, data: DataType) => Diagram | undefined;
    handle_action?: (data: DataType, action: DiagramAction) => DataType | null;
}

export interface NotationDefinition<T> {
    id: string;
    name: string;
    simple_name?: string;
    display: NotationDisplaySpec<T>;
    display_equiv?: Record<string, NotationDisplaySpec<T>>;
    is_limit: (a: T) => boolean;
    compare: (a: T, b: T) => number;
    FS: (a: T, index: number) => T;
    FS_alter?: (a: T, index: number) => T;
    FS_short?: (a: T, index: number) => T;
    draw_diagram?: DiagramControl<T, any>;
    init: () => T[];

    /** Debug helpers — not consumed by the app but accessible at runtime. */
    debug?: Record<string, any>;
}
