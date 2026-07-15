import { inject, ref } from 'vue';
import { ast_to_latex, parse_latex } from '@/core/latex_ast.ts';
import { SETTINGS_KEY } from '@/composables/use_settings.ts';

const latex = ref('');
const visible = ref(false);
const pos_x = ref(0);
const pos_y = ref(0);

export function use_latex() {
    const settings = inject(SETTINGS_KEY)!;

    function show(input: string, x: number, y: number) {
        if (input === '') {
            visible.value = false;
            return;
        }
        try {
            const expr = parse_latex(input, settings.latex_analysis);
            latex.value = ast_to_latex(expr);
            pos_x.value = x;
            pos_y.value = y;
            visible.value = true;
        } catch {
            visible.value = false;
        }
    }

    function hide() {
        visible.value = false;
    }

    return { latex, visible, pos_x, pos_y, show, hide };
}
