export interface RenderAction {
    type: RenderAction.TypeId;
}

export interface RepaintViewAction extends RenderAction {
    type: RenderAction.TypeId.PaintAll;
}

export namespace RenderAction {
    export const enum TypeId {
        PaintAll,
    }
}
