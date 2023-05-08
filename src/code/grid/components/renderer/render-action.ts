export interface RenderAction {
    type: RenderAction.Type;
}

export interface RepaintGridRenderAction extends RenderAction {
    type: RenderAction.Type.RepaintView;
}

export interface RecalculateViewRenderAction extends RenderAction {
    type: RenderAction.Type.InvalidateView;
}

export namespace RenderAction {
    export const enum Type {
        RepaintView,
        InvalidateView,
    }
}
