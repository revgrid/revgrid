
import { ColorInputEditor } from './color-input-editor';

/**
 * As of spring 2016:
 * Functions well in Chrome and Firefox; unimplemented in Safari.
 */
export class Color extends ColorInputEditor {
}

// template = '<input type="color" lang="{{locale}}" style="{{style}}">'

export namespace Color {
    export const typeName = 'Color';
}
