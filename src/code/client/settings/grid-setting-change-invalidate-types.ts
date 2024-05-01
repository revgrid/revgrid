// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevAssertError } from '../../common/internal-api';
import { RevGridSettings } from './grid-settings';

/** @public */
export const enum RevGridSettingChangeInvalidateTypeId {
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
export namespace RevGridSettingChangeInvalidateType {
    interface Priority {
        value: number; // higher value means higher priority
        ifEqualThenHigherTypeId: RevGridSettingChangeInvalidateTypeId | undefined;
    }
    const prioritiesMap = new Map<RevGridSettingChangeInvalidateTypeId, Priority>();
    prioritiesMap.set(RevGridSettingChangeInvalidateTypeId.None,
        { value: 0, ifEqualThenHigherTypeId: undefined }
    );
    prioritiesMap.set(RevGridSettingChangeInvalidateTypeId.ViewRender,
        { value: 1, ifEqualThenHigherTypeId: undefined }
    );
    prioritiesMap.set(RevGridSettingChangeInvalidateTypeId.HorizontalViewLayout,
        { value: 2, ifEqualThenHigherTypeId: RevGridSettingChangeInvalidateTypeId.ViewLayout }
    );
    prioritiesMap.set(RevGridSettingChangeInvalidateTypeId.VerticalViewLayout,
        { value: 2, ifEqualThenHigherTypeId: RevGridSettingChangeInvalidateTypeId.ViewLayout }
    );
    prioritiesMap.set(RevGridSettingChangeInvalidateTypeId.ViewLayout,
        { value: 3, ifEqualThenHigherTypeId: undefined }
    );
    prioritiesMap.set(RevGridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
        { value: 4, ifEqualThenHigherTypeId: RevGridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension }
    );
    prioritiesMap.set(RevGridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
        { value: 4, ifEqualThenHigherTypeId: RevGridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension }
    );
    prioritiesMap.set(RevGridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
        { value: 5, ifEqualThenHigherTypeId: undefined }
    );
    prioritiesMap.set(RevGridSettingChangeInvalidateTypeId.Resize,
        { value: 5, ifEqualThenHigherTypeId: undefined }
    );

    /** May return a type id different from the 2 parameters */
    export function getHigherPriority(left: RevGridSettingChangeInvalidateTypeId, right: RevGridSettingChangeInvalidateTypeId) {
        const leftPriority = prioritiesMap.get(left);
        if (leftPriority === undefined) {
            throw new RevAssertError('GSCITGHPL44220', left.toString());
        } else {
            const rightPriority = prioritiesMap.get(right);
            if (rightPriority === undefined) {
                throw new RevAssertError('GSCITGHPR44220', right.toString());
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
export type RevGridSettingChangeInvalidateTypeIds = {
    [key in keyof RevGridSettings]: RevGridSettingChangeInvalidateTypeId;
}

/** @public */
export const revGridSettingChangeInvalidateTypeIds: RevGridSettingChangeInvalidateTypeIds = {
    addToggleSelectionAreaModifierKey: RevGridSettingChangeInvalidateTypeId.None,
    addToggleSelectionAreaModifierKeyDoesToggle: RevGridSettingChangeInvalidateTypeId.None,
    backgroundColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    color: RevGridSettingChangeInvalidateTypeId.ViewRender,
    columnAutoSizingMax: RevGridSettingChangeInvalidateTypeId.ViewRender,
    columnClip: RevGridSettingChangeInvalidateTypeId.ViewRender,
    columnMoveDragPossibleCursorName: RevGridSettingChangeInvalidateTypeId.None,
    columnMoveDragPossibleTitleText: RevGridSettingChangeInvalidateTypeId.None,
    columnMoveDragActiveCursorName: RevGridSettingChangeInvalidateTypeId.None,
    columnMoveDragActiveTitleText: RevGridSettingChangeInvalidateTypeId.None,
    columnResizeDragPossibleCursorName: RevGridSettingChangeInvalidateTypeId.None,
    columnResizeDragPossibleTitleText: RevGridSettingChangeInvalidateTypeId.None,
    columnResizeDragActiveCursorName: RevGridSettingChangeInvalidateTypeId.None,
    columnResizeDragActiveTitleText: RevGridSettingChangeInvalidateTypeId.None,
    columnSortPossibleCursorName: RevGridSettingChangeInvalidateTypeId.None,
    columnSortPossibleTitleText: RevGridSettingChangeInvalidateTypeId.None,
    columnsReorderable: RevGridSettingChangeInvalidateTypeId.None,
    columnsReorderableHideable: RevGridSettingChangeInvalidateTypeId.None,
    switchNewRectangleSelectionToRowOrColumn: RevGridSettingChangeInvalidateTypeId.None,
    defaultRowHeight: RevGridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    defaultColumnAutoSizing: RevGridSettingChangeInvalidateTypeId.None,
    defaultColumnWidth: RevGridSettingChangeInvalidateTypeId.None,
    defaultUiControllerTypeNames: RevGridSettingChangeInvalidateTypeId.Resize,
    editable: RevGridSettingChangeInvalidateTypeId.None,
    editKey: RevGridSettingChangeInvalidateTypeId.None,
    editOnDoubleClick: RevGridSettingChangeInvalidateTypeId.None,
    editOnFocusCell: RevGridSettingChangeInvalidateTypeId.None,
    editOnKeyDown: RevGridSettingChangeInvalidateTypeId.None,
    editOnClick: RevGridSettingChangeInvalidateTypeId.None,
    editorClickableCursorName: RevGridSettingChangeInvalidateTypeId.None,
    extendLastSelectionAreaModifierKey: RevGridSettingChangeInvalidateTypeId.None,
    eventDispatchEnabled: RevGridSettingChangeInvalidateTypeId.None,
    filterable: RevGridSettingChangeInvalidateTypeId.None,
    filterBackgroundColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    filterBackgroundSelectionColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    filterColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    filterEditor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    filterFont: RevGridSettingChangeInvalidateTypeId.ViewRender,
    filterForegroundSelectionColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    filterCellPainter: RevGridSettingChangeInvalidateTypeId.ViewRender,
    fixedColumnCount: RevGridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
    horizontalFixedLineColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    horizontalFixedLineEdgeWidth: RevGridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
    horizontalFixedLineWidth: RevGridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
    verticalFixedLineColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    verticalFixedLineEdgeWidth: RevGridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
    verticalFixedLineWidth: RevGridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
    fixedRowCount: RevGridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    gridRightAligned: RevGridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    horizontalGridLinesColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    horizontalGridLinesWidth: RevGridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
    horizontalGridLinesVisible: RevGridSettingChangeInvalidateTypeId.ViewRender,
    verticalGridLinesVisible: RevGridSettingChangeInvalidateTypeId.ViewRender,
    visibleVerticalGridLinesDrawnInFixedAndPreMainOnly: RevGridSettingChangeInvalidateTypeId.ViewRender,
    verticalGridLinesColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    verticalGridLinesWidth: RevGridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
    horizontalWheelScrollingAllowed: RevGridSettingChangeInvalidateTypeId.None,
    minimumColumnWidth: RevGridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    maximumColumnWidth: RevGridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    visibleColumnWidthAdjust: RevGridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension,
    mouseLastSelectionAreaExtendingDragActiveCursorName: RevGridSettingChangeInvalidateTypeId.None,
    mouseLastSelectionAreaExtendingDragActiveTitleText: RevGridSettingChangeInvalidateTypeId.None,
    mouseAddToggleExtendSelectionAreaEnabled: RevGridSettingChangeInvalidateTypeId.None,
    mouseAddToggleExtendSelectionAreaDragModifierKey: RevGridSettingChangeInvalidateTypeId.None,
    mouseColumnSelectionEnabled: RevGridSettingChangeInvalidateTypeId.None,
    mouseColumnSelectionModifierKey: RevGridSettingChangeInvalidateTypeId.None,
    mouseRowSelectionEnabled: RevGridSettingChangeInvalidateTypeId.None,
    mouseRowSelectionModifierKey: RevGridSettingChangeInvalidateTypeId.None,
    multipleSelectionAreas: RevGridSettingChangeInvalidateTypeId.None,
    primarySelectionAreaType: RevGridSettingChangeInvalidateTypeId.None,
    minimumAnimateTimeInterval: RevGridSettingChangeInvalidateTypeId.ViewRender,
    backgroundAnimateTimeInterval: RevGridSettingChangeInvalidateTypeId.ViewRender,
    resizeColumnInPlace: RevGridSettingChangeInvalidateTypeId.None,
    resizedEventDebounceExtendedWhenPossible: RevGridSettingChangeInvalidateTypeId.None,
    resizedEventDebounceInterval: RevGridSettingChangeInvalidateTypeId.None,
    rowResize: RevGridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
    rowStripeBackgroundColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    scrollHorizontallySmoothly: RevGridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension,
    scrollerThickness: RevGridSettingChangeInvalidateTypeId.None,
    scrollerThumbColor: RevGridSettingChangeInvalidateTypeId.None,
    scrollerThumbReducedVisibilityOpacity: RevGridSettingChangeInvalidateTypeId.None,
    scrollingEnabled: RevGridSettingChangeInvalidateTypeId.None,
    secondarySelectionAreaTypeSpecifierModifierKey: RevGridSettingChangeInvalidateTypeId.None,
    secondarySelectionAreaType: RevGridSettingChangeInvalidateTypeId.None,
    selectionRegionOutlineColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    selectionRegionOverlayColor: RevGridSettingChangeInvalidateTypeId.ViewRender,
    showFilterRow: RevGridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension,
    showScrollerThumbOnMouseMoveModifierKey: RevGridSettingChangeInvalidateTypeId.None,
    sortOnDoubleClick: RevGridSettingChangeInvalidateTypeId.None,
    sortOnClick: RevGridSettingChangeInvalidateTypeId.None,
    useHiDPI: RevGridSettingChangeInvalidateTypeId.Resize,
    wheelHFactor: RevGridSettingChangeInvalidateTypeId.None,
    wheelVFactor: RevGridSettingChangeInvalidateTypeId.None,
};
