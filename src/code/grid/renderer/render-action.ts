export interface RenderAction {
    type: RenderAction.Type;
}

export interface RepaintGridRenderAction extends RenderAction {
    type: RenderAction.Type.RepaintViewport;
}

export interface RecalculateViewRenderAction extends RenderAction {
    type: RenderAction.Type.InvalidateViewport;
}

export namespace RenderAction {
    export const enum Type {
        RepaintViewport,
        InvalidateViewport,
    }
}
