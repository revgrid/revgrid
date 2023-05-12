export interface RenderAction {
    type: RenderAction.Type;
}

export interface RepaintViewAction extends RenderAction {
    type: RenderAction.Type.PaintAll;
}

export namespace RenderAction {
    export const enum Type {
        PaintAll,
    }
}
