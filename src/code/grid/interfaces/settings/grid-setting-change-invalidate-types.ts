import { AssertError } from '../../types-utils/revgrid-error';
import { GridSettings } from './grid-settings';

/** @public */
export const enum GridSettingChangeInvalidateTypeId {
    None,
    ViewRender,
    HorizontalViewLayout,
    VerticalViewLayout,
    ViewLayout,
    HorizontalViewLayoutAndScrollDimension,
    VerticalViewLayoutAndScrollDimension,
    ViewLayoutAndScrollDimension,
    Resize,
}

/** @public */
export namespace GridSettingChangeInvalidateType {
    interface Priority {
        value: number; // higher value means higher priority
        ifEqualThenHigherTypeId: GridSettingChangeInvalidateTypeId | undefined;
    }
    const prioritiesMap = new Map<GridSettingChangeInvalidateTypeId, Priority>();
    prioritiesMap.set(GridSettingChangeInvalidateTypeId.None,
        { value: 0, ifEqualThenHigherTypeId: undefined }
    );
    prioritiesMap.set(GridSettingChangeInvalidateTypeId.ViewRender,
        { value: 1, ifEqualThenHigherTypeId: undefined }
    );
    prioritiesMap.set(GridSettingChangeInvalidateTypeId.HorizontalViewLayout,
        { value: 2, ifEqualThenHigherTypeId: GridSettingChangeInvalidateTypeId.ViewLayout }
    );
    prioritiesMap.set(GridSettingChangeInvalidateTypeId.VerticalViewLayout,
        { value: 2, ifEqualThenHigherTypeId: GridSettingChangeInvalidateTypeId.ViewLayout }
    );
    prioritiesMap.set(GridSettingChangeInvalidateTypeId.ViewLayout,
        { value: 3, ifEqualThenHigherTypeId: undefined }
    );
    prioritiesMap.set(GridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
        { value: 4, ifEqualThenHigherTypeId: GridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension }
    );
    prioritiesMap.set(GridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
        { value: 4, ifEqualThenHigherTypeId: GridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension }
    );
    prioritiesMap.set(GridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
        { value: 5, ifEqualThenHigherTypeId: undefined }
    );
    prioritiesMap.set(GridSettingChangeInvalidateTypeId.Resize,
        { value: 5, ifEqualThenHigherTypeId: undefined }
    );

    /** May return a type id different from the 2 parameters */
    export function getHigherPriority(left: GridSettingChangeInvalidateTypeId, right: GridSettingChangeInvalidateTypeId) {
        const leftPriority = prioritiesMap.get(left);
        if (leftPriority === undefined) {
            throw new AssertError('GSCITGHPL44220', left.toString());
        } else {
            const rightPriority = prioritiesMap.get(right);
            if (rightPriority === undefined) {
                throw new AssertError('GSCITGHPR44220', right.toString());
            } else {
                const leftPriorityValue = leftPriority.value;
                const rightPriorityValue = rightPriority.value;
                if (leftPriorityValue > rightPriorityValue) {
                    return left;
                } else {
                    if (rightPriorityValue > leftPriorityValue) {
                        return right;
                    } else {
                        const ifEqualThenHigherTypeId = leftPriority.ifEqualThenHigherTypeId;
                        if (ifEqualThenHigherTypeId === undefined) {
                            return left;
                        } else {
                            return ifEqualThenHigherTypeId;
                        }
                    }
                }
            }
        }
    }

}

/** @public */
export type GridSettingChangeInvalidateTypeIds = {
    [key in keyof GridSettings]: GridSettingChangeInvalidateTypeId;
}

/** @public */
export const gridSettingChangeInvalidateTypeIds: GridSettingChangeInvalidateTypeIds = {
    addToggleSelectionAreaModifierKey: GridSettingChangeInvalidateTypeId.None,
    addToggleSelectionAreaModifierKeyDoesToggle: GridSettingChangeInvalidateTypeId.None,
    backgroundColor: GridSettingChangeInvalidateTypeId.ViewRender,
    color: GridSettingChangeInvalidateTypeId.ViewRender,
    columnAutoSizingMax: GridSettingChangeInvalidateTypeId.ViewRender,
    columnClip: GridSettingChangeInvalidateTypeId.ViewRender,
    columnMoveDragPossibleCursorName: GridSettingChangeInvalidateTypeId.None,
    columnMoveDragPossibleTitleText: GridSettingChangeInvalidateTypeId.None,
    columnMoveDragActiveCursorName: GridSettingChangeInvalidateTypeId.None,
    columnMoveDragActiveTitleText: GridSettingChangeInvalidateTypeId.None,
    columnResizeDragPossibleCursorName: GridSettingChangeInvalidateTypeId.None,
    columnResizeDragPossibleTitleText: GridSettingChangeInvalidateTypeId.None,
    columnResizeDragActiveCursorName: GridSettingChangeInvalidateTypeId.None,
    columnResizeDragActiveTitleText: GridSettingChangeInvalidateTypeId.None,
    columnSortPossibleCursorName: GridSettingChangeInvalidateTypeId.None,
    columnSortPossibleTitleText: GridSettingChangeInvalidateTypeId.None,
    columnsReorderable: GridSettingChangeInvalidateTypeId.None,
    columnsReorderableHideable: GridSettingChangeInvalidateTypeId.None,
    defaultRowHeight: GridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    defaultColumnAutoSizing: GridSettingChangeInvalidateTypeId.None,
    defaultColumnWidth: GridSettingChangeInvalidateTypeId.None,
    defaultUiBehaviorTypeNames: GridSettingChangeInvalidateTypeId.Resize,
    editable: GridSettingChangeInvalidateTypeId.None,
    editKey: GridSettingChangeInvalidateTypeId.None,
    editOnDoubleClick: GridSettingChangeInvalidateTypeId.None,
    editOnFocusCell: GridSettingChangeInvalidateTypeId.None,
    editOnKeyDown: GridSettingChangeInvalidateTypeId.None,
    editOnClick: GridSettingChangeInvalidateTypeId.None,
    enableContinuousRepaint: GridSettingChangeInvalidateTypeId.ViewRender,
    extendLastSelectionAreaModifierKey: GridSettingChangeInvalidateTypeId.None,
    eventDispatchEnabled: GridSettingChangeInvalidateTypeId.None,
    filterable: GridSettingChangeInvalidateTypeId.None,
    filterBackgroundColor: GridSettingChangeInvalidateTypeId.ViewRender,
    filterBackgroundSelectionColor: GridSettingChangeInvalidateTypeId.ViewRender,
    filterColor: GridSettingChangeInvalidateTypeId.ViewRender,
    filterEditor: GridSettingChangeInvalidateTypeId.ViewRender,
    filterFont: GridSettingChangeInvalidateTypeId.ViewRender,
    filterForegroundSelectionColor: GridSettingChangeInvalidateTypeId.ViewRender,
    filterHalign: GridSettingChangeInvalidateTypeId.ViewRender,
    filterCellPainter: GridSettingChangeInvalidateTypeId.ViewRender,
    fixedColumnCount: GridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
    horizontalFixedLineColor: GridSettingChangeInvalidateTypeId.ViewRender,
    horizontalFixedLineEdgeWidth: GridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
    horizontalFixedLineWidth: GridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
    verticalFixedLineColor: GridSettingChangeInvalidateTypeId.ViewRender,
    verticalFixedLineEdgeWidth: GridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
    verticalFixedLineWidth: GridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
    fixedRowCount: GridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    gridRightAligned: GridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    verticalGridLinesVisible: GridSettingChangeInvalidateTypeId.ViewRender,
    horizontalGridLinesEnabled: GridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
    horizontalGridLinesColor: GridSettingChangeInvalidateTypeId.ViewRender,
    horizontalGridLinesWidth: GridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
    horizontalGridLinesVisible: GridSettingChangeInvalidateTypeId.ViewRender,
    verticalGridLinesEnabled: GridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
    verticalGridLinesColor: GridSettingChangeInvalidateTypeId.ViewRender,
    verticalGridLinesWidth: GridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
    horizontalWheelScrollingAllowed: GridSettingChangeInvalidateTypeId.None,
    horizontalScrollbarClassPrefix: GridSettingChangeInvalidateTypeId.None,
    minimumColumnWidth: GridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    maximumColumnWidth: GridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    visibleColumnWidthAdjust: GridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    mouseRectangleSelection: GridSettingChangeInvalidateTypeId.None,
    mouseColumnSelection: GridSettingChangeInvalidateTypeId.None,
    mouseRowSelection: GridSettingChangeInvalidateTypeId.None,
    multipleSelectionAreas: GridSettingChangeInvalidateTypeId.None,
    primarySelectionAreaType: GridSettingChangeInvalidateTypeId.None,
    repaintImmediately: GridSettingChangeInvalidateTypeId.None,
    repaintFramesPerSecond: GridSettingChangeInvalidateTypeId.None,
    resizeColumnInPlace: GridSettingChangeInvalidateTypeId.None,
    resizedEventDebounceExtendedWhenPossible: GridSettingChangeInvalidateTypeId.None,
    resizedEventDebounceInterval: GridSettingChangeInvalidateTypeId.None,
    rowResize: GridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
    rowStripes: GridSettingChangeInvalidateTypeId.ViewRender,
    scrollHorizontallySmoothly: GridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
    scrollerThumbColor: GridSettingChangeInvalidateTypeId.None,
    scrollerThumbReducedVisibilityOpacity: GridSettingChangeInvalidateTypeId.None,
    scrollingEnabled: GridSettingChangeInvalidateTypeId.None,
    secondarySelectionAreaTypeSpecifierModifierKey: GridSettingChangeInvalidateTypeId.None,
    secondarySelectionAreaType: GridSettingChangeInvalidateTypeId.None,
    selectionExtendDragActiveCursorName: GridSettingChangeInvalidateTypeId.None,
    selectionExtendDragActiveTitleText: GridSettingChangeInvalidateTypeId.None,
    selectionRegionOutlineColor: GridSettingChangeInvalidateTypeId.ViewRender,
    selectionRegionOverlayColor: GridSettingChangeInvalidateTypeId.ViewRender,
    showFilterRow: GridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
    sortOnDoubleClick: GridSettingChangeInvalidateTypeId.None,
    sortOnClick: GridSettingChangeInvalidateTypeId.None,
    useHiDPI: GridSettingChangeInvalidateTypeId.Resize,
    verticalScrollbarClassPrefix: GridSettingChangeInvalidateTypeId.Resize,
    wheelHFactor: GridSettingChangeInvalidateTypeId.None,
    wheelVFactor: GridSettingChangeInvalidateTypeId.None,
};
