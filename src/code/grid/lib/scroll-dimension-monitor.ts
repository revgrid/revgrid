export interface ScrollDimensionMonitor {
    readonly start: number;
    readonly size: number;
    readonly viewportStart: number;
    readonly viewportSize: number;

    startSizeChangedEventer: ScrollDimensionMonitor.DimensionChangedEventer;
    // viewportChangedEventer: ScrollDimensionMonitor.ViewportChangedEventer;
    viewportStartChangedEventer: ScrollDimensionMonitor.ViewportStartChangedEventer;
}

export namespace ScrollDimensionMonitor {
    export type DimensionChangedEventer = (this: void) => void;
    // export type ViewportChangedEventer = (this: void) => void;
    export type ViewportStartChangedEventer = (this: void) => void;
}
