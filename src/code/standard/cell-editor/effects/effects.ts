import { numberToPixels } from '@pbkware/js-utils';
import { RevApiError } from '../../../common/internal-api';
/** effectFunction
 * @remarks Element to perform transitions upon is `options.el` if defined or `this.el`.
 * @param {object} [options]
 * @param {HTMLElement} [options.el=this.el]
 * @param {function} [options.callback] Function to call at conclusion of transitions.
 * @param {string} [options.duration='0.065s'] - Duration of each transition.
 * @param {object} [options.styles=defaultGlowerStyles] - Hash of CSS styles and values to transition. (For {@link effects~glower|glower} only.
 */

export abstract class RevStandardCellEffect {
    protected readonly _callback: RevStandardCellEffect.Options.Callback | undefined;

    constructor(public readonly el: HTMLElement, public readonly options?: RevStandardCellEffect.Options) {
        this._callback = options?.callback;
    }

    abstract start(): void;
}

export namespace RevStandardCellEffect {
    export interface Options {
        callback?: Options.Callback;
    }

    export namespace Options {
        export type Callback = (this: void) => void;
    }

    export type Constructor = new(el: HTMLElement, options?: Options) => RevStandardCellEffect;
}

export class RevStandardCellEffectFactory {
    create(name: string, el: HTMLElement, options?: RevStandardCellEffect.Options) {
        switch (name) {
            case RevStandardShakerCellEffect.typeName: return new RevStandardShakerCellEffect(el, options as RevStandardShakerCellEffect.Options);
            case RevStandardGlowerCellEffect.typeName: return new RevStandardGlowerCellEffect(el, options as RevStandardGlowerCellEffect.Options);
            default:
                throw new RevApiError('EFC777454', `Unsupport effect: ${name}`);
        }
    }
}

export const effectFactory = new RevStandardCellEffectFactory();

/**
 * Shake element back and fourth a few times as if to say, "Nope!"
 */
export class RevStandardShakerCellEffect extends RevStandardCellEffect {
    private duration: string;
    private transitions: string[];
    private position: string;
    private x: number;
    private dx: number;
    private shakes: number;

    constructor(el: HTMLElement, options?: RevStandardShakerCellEffect.Options) {
        super(el, options);
        this.duration = options?.duration ?? RevStandardShakerCellEffect.duration;
    }

    start() {
        const computedStyle = window.getComputedStyle(this.el);
        this.transitions = computedStyle.transition.split(',');
        this.position = computedStyle.position;
        this.x = parseInt(computedStyle.left);
        this.dx = -3;
        this.shakes = 6;

        this.transitions.push('left ' + this.duration);
        this.el.style.transition = this.transitions.join(',');
        this.el.addEventListener('transitionend', this._transitionendListener);

        this.shake();
    }

    destroy() {
        const el = this.el;
        el.removeEventListener('transitionend', this._transitionendListener);
        this.transitions.pop();
        el.style.transition = this.transitions.join(',');
        el.style.position = this.position;
        if (this._callback !== undefined) {
            this._callback();
        }
    }

    shake(event?: TransitionEvent) {
        if (!event || event.propertyName === 'left') {
            this.el.style.left = numberToPixels(this.x + this.dx);
            if (this.shakes-- === 0) {
                this.destroy();
            }
            this.dx = this.shakes ? -this.dx : 0;
        }
    }

    private _transitionendListener = (ev: TransitionEvent) => { this.shake(ev); };
}

export namespace RevStandardShakerCellEffect {
    export const typeName = 'shaker';
    export const duration = '0.065s';

    export interface Options extends RevStandardCellEffect.Options {
        duration: string;
    }
}

/**
 * Transition styles on element for a moment and revert as if to say, "Whoa!."
 */
export class RevStandardGlowerCellEffect extends RevStandardCellEffect {
    private _duration: string;
    private _glowerStyles: RevStandardGlowerCellEffect.Styles;
    private _originalTransitionStyle: string;
    private _styleWasMap = new Map<string, RevStandardGlowerCellEffect.StyleWas>();
    private _activeCount: number;

    constructor(el: HTMLElement, options?: RevStandardGlowerCellEffect.Options) {
        super(el, options);

        this._duration = options?.duration ?? RevStandardGlowerCellEffect.duration;
        this._glowerStyles = (options?.styles) ?? RevStandardGlowerCellEffect.defaultStyles;
    }

    start() {
        const el = this.el;
        const glowerStyles = this._glowerStyles as Record<keyof CSSStyleDeclaration, string>;
        const computedStyle = window.getComputedStyle(el);
        this._originalTransitionStyle = computedStyle.transition;
        const transitions = this._originalTransitionStyle.split(',');


        for (const styleName in glowerStyles) {
            this._styleWasMap.set(styleName, {
                    style: computedStyle[styleName],
                    undo: true
                }
            );
            transitions.push(styleName + ' ' + this._duration);
        }
        this._activeCount = this._styleWasMap.size;
        el.style.transition = transitions.join(',');
        el.addEventListener('transitionend', this._transitionendListener);

        for (const styleName in glowerStyles) {
            el.style[styleName] = glowerStyles[styleName];
        }
    }

    destroy() {
        const el = this.el;
        el.removeEventListener('transitionend', this._transitionendListener);
        el.style.transition = this._originalTransitionStyle;
        if (this._callback !== undefined) {
            this._callback();
        }
    }

    glower(event: TransitionEvent) {
        const was = this._styleWasMap.get(event.propertyName);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (was !== undefined && was.undo) {
            this.el.style.setProperty(event.propertyName, was.style);
            was.undo = false;
        } else {
            if (--this._activeCount === 0) {
                this.destroy();
            }
        }
    }

    private _transitionendListener = (ev: TransitionEvent) => { this.glower(ev); };
}

export namespace RevStandardGlowerCellEffect {
    export const typeName = 'glower';
    export const duration = '0.25s';

    export interface Options extends RevStandardCellEffect.Options {
        duration: string;
        styles: Styles;
    }

    export type Styles = Record<string, string>;

    export const defaultStyles: Styles = {
        'background-color': 'yellow',
        'box-shadow': '0 0 10px red'
    };

    export interface StyleWas {
        style: string;
        undo: boolean;
    }
}
