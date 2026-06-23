export interface Rgba {
    r: number;
    g: number;
    b: number;
    a?: number;
}

export type Element =
    | {
          type: 'circle';
          x: number;
          y: number;
          r: number;
          stroke: boolean;
          stroke_color?: Rgba;
          fill: boolean;
          fill_color?: Rgba;
          width?: number;
      }
    | {
          type: 'line';
          x1: number;
          y1: number;
          x2: number;
          y2: number;
          stroke: boolean;
          stroke_color?: Rgba;
          width?: number;
      }
    | {
          type: 'text';
          x: number;
          y: number;
          text: string;
          fill: boolean;
          fill_color?: Rgba;
          size?: number;
          align?: 'left' | 'center' | 'right';
      };

export interface ExtraText {
    text: string;
    x: number;
    y: number;
    size?: number;
    color?: Rgba;
    align?: 'left' | 'center' | 'right';
    display_html?: boolean;
}

export interface Diagram {
    width: number;
    height: number;
    elements: Element[];
    extra_text: ExtraText[];
}
