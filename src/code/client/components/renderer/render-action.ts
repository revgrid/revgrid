export interface RevRenderAction {
    type: RevRenderAction.TypeId;
}

export interface RevRepaintViewAction extends RevRenderAction {
    type: RevRenderAction.TypeId.PaintAll;
}

export namespace RevRenderAction {
    export const enum TypeId {
        PaintAll,
    }
}
