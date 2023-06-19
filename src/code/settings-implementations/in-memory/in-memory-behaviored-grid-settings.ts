import {
    BehavioredGridSettings,
    GridSettingChangeInvalidateTypeId,
    GridSettings,
    Halign,
    HorizontalWheelScrollingAllowed,
    ModifierKeyEnum,
    SelectionAreaType,
    gridSettingChangeInvalidateTypeIds
} from '../../grid/grid-public-api';
import { InMemoryBehavioredSettings } from './in-memory-behaviored-settings';

/** @public */
export class InMemoryBehavioredGridSettings extends InMemoryBehavioredSettings implements BehavioredGridSettings {
    private _addToggleSelectionAreaModifierKey: ModifierKeyEnum;
    private _addToggleSelectionAreaModifierKeyDoesToggle: boolean;
    private _backgroundColor: GridSettings.Color;
    private _color: GridSettings.Color;
    private _defaultColumnAutoSizing: boolean;
    private _columnAutoSizingMax: number | undefined;
    private _columnClip: boolean | undefined;
    private _columnMoveDragPossibleCursorName: string | undefined;
    private _columnMoveDragPossibleTitleText: string | undefined;
    private _columnMoveDragActiveCursorName: string | undefined;
    private _columnMoveDragActiveTitleText: string | undefined;
    private _columnResizeDragPossibleCursorName: string | undefined;
    private _columnResizeDragPossibleTitleText: string | undefined;
    private _columnResizeDragActiveCursorName: string | undefined;
    private _columnResizeDragActiveTitleText: string | undefined;
    private _columnSortPossibleCursorName: string | undefined;
    private _columnSortPossibleTitleText: string | undefined;
    private _columnsReorderable: boolean;
    private _columnsReorderableHideable: boolean;
    private _defaultRowHeight: number;
    private _defaultColumnWidth: number;
    private _defaultUiBehaviorTypeNames: string[];
    private _editable: boolean;
    private _editKey: string;
    private _editOnClick: boolean;
    private _editOnDoubleClick: boolean;
    private _editOnFocusCell: boolean;
    private _editOnKeyDown: boolean;
    private _enableContinuousRepaint: boolean;
    private _extendLastSelectionAreaModifierKey: ModifierKeyEnum;
    private _eventDispatchEnabled: boolean;
    private _filterable: boolean;
    private _filterBackgroundColor: GridSettings.Color;
    private _filterBackgroundSelectionColor: GridSettings.Color;
    private _filterColor: GridSettings.Color;
    private _filterEditor: string;
    private _filterFont: string;
    private _filterForegroundSelectionColor: GridSettings.Color;
    private _filterHalign: Halign;
    private _filterCellPainter: string;
    private _fixedColumnCount: number;
    private _horizontalFixedLineColor: GridSettings.Color;
    private _horizontalFixedLineEdgeWidth: number | undefined;
    private _horizontalFixedLineWidth: number | undefined;
    private _verticalFixedLineColor: GridSettings.Color;
    private _verticalFixedLineEdgeWidth: number | undefined;
    private _verticalFixedLineWidth: number | undefined;
    private _fixedRowCount: number;
    private _gridRightAligned: boolean;
    private _verticalGridLinesVisible: boolean;
    private _horizontalGridLinesColor: GridSettings.Color;
    private _horizontalGridLinesWidth: number;
    private _horizontalGridLinesVisible: boolean;
    private _verticalGridLinesColor: GridSettings.Color;
    private _verticalGridLinesWidth: number;
    private _horizontalWheelScrollingAllowed: HorizontalWheelScrollingAllowed;
    private _horizontalScrollbarClassPrefix: string;
    private _minimumColumnWidth: number;
    private _maximumColumnWidth: number | undefined;
    private _visibleColumnWidthAdjust: boolean;
    private _mouseRectangleSelection: boolean;
    private _mouseColumnSelection: boolean;
    private _mouseRowSelection: boolean;
    private _multipleSelectionAreas: boolean;
    private _primarySelectionAreaType: SelectionAreaType;
    private _repaintImmediately: boolean;
    private _repaintFramesPerSecond: number;
    private _resizeColumnInPlace: boolean;
    private _resizedEventDebounceExtendedWhenPossible: boolean;
    private _resizedEventDebounceInterval: number;
    private _rowResize: boolean;
    private _rowStripes: GridSettings.RowStripe[] | undefined;
    private _scrollHorizontallySmoothly: boolean;
    private _scrollerThumbColor: string;
    private _scrollerThumbReducedVisibilityOpacity: number;
    private _scrollingEnabled: boolean;
    private _secondarySelectionAreaTypeSpecifierModifierKey: ModifierKeyEnum | undefined;
    private _secondarySelectionAreaType: SelectionAreaType;
    private _selectionExtendDragActiveCursorName: string | undefined;
    private _selectionExtendDragActiveTitleText: string | undefined;
    private _selectionRegionOutlineColor: GridSettings.Color;
    private _selectionRegionOverlayColor: GridSettings.Color;
    private _showFilterRow: boolean;
    private _showScrollerThumbOnMouseMoveModifierKey: ModifierKeyEnum | undefined;
    private _sortOnDoubleClick: boolean;
    private _sortOnClick: boolean;
    private _useHiDPI: boolean;
    private _verticalScrollbarClassPrefix: string;
    private _wheelHFactor: number;
    private _wheelVFactor: number;

    get addToggleSelectionAreaModifierKey() { return this._addToggleSelectionAreaModifierKey; }
    set addToggleSelectionAreaModifierKey(value: ModifierKeyEnum) {
        if (value !== this._addToggleSelectionAreaModifierKey) {
            this.beginChange();
            this._addToggleSelectionAreaModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.addToggleSelectionAreaModifierKey;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get addToggleSelectionAreaModifierKeyDoesToggle() { return this._addToggleSelectionAreaModifierKeyDoesToggle; }
    set addToggleSelectionAreaModifierKeyDoesToggle(value: boolean) {
        if (value !== this._addToggleSelectionAreaModifierKeyDoesToggle) {
            this.beginChange();
            this._addToggleSelectionAreaModifierKeyDoesToggle = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.addToggleSelectionAreaModifierKeyDoesToggle;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get backgroundColor() { return this._backgroundColor; }
    set backgroundColor(value: GridSettings.Color) {
        if (value !== this._backgroundColor) {
            this.beginChange();
            this._backgroundColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.backgroundColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get color() { return this._color; }
    set color(value: GridSettings.Color) {
        if (value !== this._color) {
            this.beginChange();
            this._color = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.color;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultColumnAutoSizing() { return this._defaultColumnAutoSizing; }
    set defaultColumnAutoSizing(value: boolean) {
        if (value !== this._defaultColumnAutoSizing) {
            this.beginChange();
            this._defaultColumnAutoSizing = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultColumnAutoSizing;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnAutoSizingMax() { return this._columnAutoSizingMax; }
    set columnAutoSizingMax(value: number | undefined) {
        if (value !== this._columnAutoSizingMax) {
            this.beginChange();
            this._columnAutoSizingMax = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnAutoSizingMax;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnClip() { return this._columnClip; }
    set columnClip(value: boolean | undefined) {
        if (value !== this._columnClip) {
            this.beginChange();
            this._columnClip = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnClip;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragPossibleCursorName() { return this._columnMoveDragPossibleCursorName; }
    set columnMoveDragPossibleCursorName(value: string | undefined) {
        if (value !== this._columnMoveDragPossibleCursorName) {
            this.beginChange();
            this._columnMoveDragPossibleCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnMoveDragPossibleCursorName;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragPossibleTitleText() { return this._columnMoveDragPossibleTitleText; }
    set columnMoveDragPossibleTitleText(value: string | undefined) {
        if (value !== this._columnMoveDragPossibleTitleText) {
            this.beginChange();
            this._columnMoveDragPossibleTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnMoveDragPossibleTitleText;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragActiveCursorName() { return this._columnMoveDragActiveCursorName; }
    set columnMoveDragActiveCursorName(value: string | undefined) {
        if (value !== this._columnMoveDragActiveCursorName) {
            this.beginChange();
            this._columnMoveDragActiveCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnMoveDragActiveCursorName;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragActiveTitleText() { return this._columnMoveDragActiveTitleText; }
    set columnMoveDragActiveTitleText(value: string | undefined) {
        if (value !== this._columnMoveDragActiveTitleText) {
            this.beginChange();
            this._columnMoveDragActiveTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnMoveDragActiveTitleText;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragPossibleCursorName() { return this._columnResizeDragPossibleCursorName; }
    set columnResizeDragPossibleCursorName(value: string | undefined) {
        if (value !== this._columnResizeDragPossibleCursorName) {
            this.beginChange();
            this._columnResizeDragPossibleCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnResizeDragPossibleCursorName;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragPossibleTitleText() { return this._columnResizeDragPossibleTitleText; }
    set columnResizeDragPossibleTitleText(value: string | undefined) {
        if (value !== this._columnResizeDragPossibleTitleText) {
            this.beginChange();
            this._columnResizeDragPossibleTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnResizeDragPossibleTitleText;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragActiveCursorName() { return this._columnResizeDragActiveCursorName; }
    set columnResizeDragActiveCursorName(value: string | undefined) {
        if (value !== this._columnResizeDragActiveCursorName) {
            this.beginChange();
            this._columnResizeDragActiveCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnResizeDragActiveCursorName;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragActiveTitleText() { return this._columnResizeDragActiveTitleText; }
    set columnResizeDragActiveTitleText(value: string | undefined) {
        if (value !== this._columnResizeDragActiveTitleText) {
            this.beginChange();
            this._columnResizeDragActiveTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnResizeDragActiveTitleText;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnSortPossibleCursorName() { return this._columnSortPossibleCursorName; }
    set columnSortPossibleCursorName(value: string | undefined) {
        if (value !== this._columnSortPossibleCursorName) {
            this.beginChange();
            this._columnSortPossibleCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnSortPossibleCursorName;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnSortPossibleTitleText() { return this._columnSortPossibleTitleText; }
    set columnSortPossibleTitleText(value: string | undefined) {
        if (value !== this._columnSortPossibleTitleText) {
            this.beginChange();
            this._columnSortPossibleTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnSortPossibleTitleText;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnsReorderable() { return this._columnsReorderable; }
    set columnsReorderable(value: boolean) {
        if (value !== this._columnsReorderable) {
            this.beginChange();
            this._columnsReorderable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnsReorderable;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get columnsReorderableHideable() { return this._columnsReorderableHideable; }
    set columnsReorderableHideable(value: boolean) {
        if (value !== this._columnsReorderableHideable) {
            this.beginChange();
            this._columnsReorderableHideable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnsReorderableHideable;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultRowHeight() { return this._defaultRowHeight; }
    set defaultRowHeight(value: number) {
        if (value !== this._defaultRowHeight) {
            this.beginChange();
            this._defaultRowHeight = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultRowHeight;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultColumnWidth() { return this._defaultColumnWidth; }
    set defaultColumnWidth(value: number) {
        if (value !== this._defaultColumnWidth) {
            this.beginChange();
            this._defaultColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultColumnWidth;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultUiBehaviorTypeNames() { return this._defaultUiBehaviorTypeNames; }
    set defaultUiBehaviorTypeNames(value: string[]) {
        if (value !== this._defaultUiBehaviorTypeNames) {
            this.beginChange();
            this._defaultUiBehaviorTypeNames = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultUiBehaviorTypeNames;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get editable() { return this._editable; }
    set editable(value: boolean) {
        if (value !== this._editable) {
            this.beginChange();
            this._editable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editable;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get editKey() { return this._editKey; }
    set editKey(value: string) {
        if (value !== this._editKey) {
            this.beginChange();
            this._editKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editKey;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnClick() { return this._editOnClick; }
    set editOnClick(value: boolean) {
        if (value !== this._editOnClick) {
            this.beginChange();
            this._editOnClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnClick;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnDoubleClick() { return this._editOnDoubleClick; }
    set editOnDoubleClick(value: boolean) {
        if (value !== this._editOnDoubleClick) {
            this.beginChange();
            this._editOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnDoubleClick;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnFocusCell() { return this._editOnFocusCell; }
    set editOnFocusCell(value: boolean) {
        if (value !== this._editOnFocusCell) {
            this.beginChange();
            this._editOnFocusCell = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnFocusCell;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnKeyDown() { return this._editOnKeyDown; }
    set editOnKeyDown(value: boolean) {
        if (value !== this._editOnKeyDown) {
            this.beginChange();
            this._editOnKeyDown = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnKeyDown;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get enableContinuousRepaint() { return this._enableContinuousRepaint; }
    set enableContinuousRepaint(value: boolean) {
        if (value !== this._enableContinuousRepaint) {
            this.beginChange();
            this._enableContinuousRepaint = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.enableContinuousRepaint;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get extendLastSelectionAreaModifierKey() { return this._extendLastSelectionAreaModifierKey; }
    set extendLastSelectionAreaModifierKey(value: ModifierKeyEnum) {
        if (value !== this._extendLastSelectionAreaModifierKey) {
            this.beginChange();
            this._extendLastSelectionAreaModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.extendLastSelectionAreaModifierKey;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get eventDispatchEnabled() { return this._eventDispatchEnabled; }
    set eventDispatchEnabled(value: boolean) {
        if (value !== this._eventDispatchEnabled) {
            this.beginChange();
            this._eventDispatchEnabled = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.eventDispatchEnabled;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get filterable() { return this._filterable; }
    set filterable(value: boolean) {
        if (value !== this._filterable) {
            this.beginChange();
            this._filterable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterable;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get filterBackgroundColor() { return this._filterBackgroundColor; }
    set filterBackgroundColor(value: GridSettings.Color) {
        if (value !== this._filterBackgroundColor) {
            this.beginChange();
            this._filterBackgroundColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterBackgroundColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get filterBackgroundSelectionColor() { return this._filterBackgroundSelectionColor; }
    set filterBackgroundSelectionColor(value: GridSettings.Color) {
        if (value !== this._filterBackgroundSelectionColor) {
            this.beginChange();
            this._filterBackgroundSelectionColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterBackgroundSelectionColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get filterColor() { return this._filterColor; }
    set filterColor(value: GridSettings.Color) {
        if (value !== this._filterColor) {
            this.beginChange();
            this._filterColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get filterEditor() { return this._filterEditor; }
    set filterEditor(value: string) {
        if (value !== this._filterEditor) {
            this.beginChange();
            this._filterEditor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterEditor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get filterFont() { return this._filterFont; }
    set filterFont(value: string) {
        if (value !== this._filterFont) {
            this.beginChange();
            this._filterFont = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterFont;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get filterForegroundSelectionColor() { return this._filterForegroundSelectionColor; }
    set filterForegroundSelectionColor(value: GridSettings.Color) {
        if (value !== this._filterForegroundSelectionColor) {
            this.beginChange();
            this._filterForegroundSelectionColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterForegroundSelectionColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get filterHalign() { return this._filterHalign; }
    set filterHalign(value: Halign) {
        if (value !== this._filterHalign) {
            this.beginChange();
            this._filterHalign = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterHalign;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get filterCellPainter() { return this._filterCellPainter; }
    set filterCellPainter(value: string) {
        if (value !== this._filterCellPainter) {
            this.beginChange();
            this._filterCellPainter = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterCellPainter;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get fixedColumnCount() { return this._fixedColumnCount; }
    set fixedColumnCount(value: number) {
        if (value !== this._fixedColumnCount) {
            this.beginChange();
            this._fixedColumnCount = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.fixedColumnCount;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalFixedLineColor() { return this._horizontalFixedLineColor; }
    set horizontalFixedLineColor(value: GridSettings.Color) {
        if (value !== this._horizontalFixedLineColor) {
            this.beginChange();
            this._horizontalFixedLineColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalFixedLineColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalFixedLineEdgeWidth() { return this._horizontalFixedLineEdgeWidth; }
    set horizontalFixedLineEdgeWidth(value: number | undefined) {
        if (value !== this._horizontalFixedLineEdgeWidth) {
            this.beginChange();
            this._horizontalFixedLineEdgeWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalFixedLineEdgeWidth;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalFixedLineWidth() { return this._horizontalFixedLineWidth; }
    set horizontalFixedLineWidth(value: number | undefined) {
        if (value !== this._horizontalFixedLineWidth) {
            this.beginChange();
            this._horizontalFixedLineWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalFixedLineWidth;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalFixedLineColor() { return this._verticalFixedLineColor; }
    set verticalFixedLineColor(value: GridSettings.Color) {
        if (value !== this._verticalFixedLineColor) {
            this.beginChange();
            this._verticalFixedLineColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalFixedLineColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalFixedLineEdgeWidth() { return this._verticalFixedLineEdgeWidth; }
    set verticalFixedLineEdgeWidth(value: number | undefined) {
        if (value !== this._verticalFixedLineEdgeWidth) {
            this.beginChange();
            this._verticalFixedLineEdgeWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalFixedLineEdgeWidth;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalFixedLineWidth() { return this._verticalFixedLineWidth; }
    set verticalFixedLineWidth(value: number | undefined) {
        if (value !== this._verticalFixedLineWidth) {
            this.beginChange();
            this._verticalFixedLineWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalFixedLineWidth;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get fixedRowCount() { return this._fixedRowCount; }
    set fixedRowCount(value: number) {
        if (value !== this._fixedRowCount) {
            this.beginChange();
            this._fixedRowCount = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.fixedRowCount;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get gridRightAligned() { return this._gridRightAligned; }
    set gridRightAligned(value: boolean) {
        if (value !== this._gridRightAligned) {
            this.beginChange();
            this._gridRightAligned = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.gridRightAligned;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalGridLinesVisible() { return this._verticalGridLinesVisible; }
    set verticalGridLinesVisible(value: boolean) {
        if (value !== this._verticalGridLinesVisible) {
            this.beginChange();
            this._verticalGridLinesVisible = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalGridLinesVisible;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalGridLinesColor() { return this._horizontalGridLinesColor; }
    set horizontalGridLinesColor(value: GridSettings.Color) {
        if (value !== this._horizontalGridLinesColor) {
            this.beginChange();
            this._horizontalGridLinesColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalGridLinesColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalGridLinesWidth() { return this._horizontalGridLinesWidth; }
    set horizontalGridLinesWidth(value: number) {
        if (value !== this._horizontalGridLinesWidth) {
            this.beginChange();
            this._horizontalGridLinesWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalGridLinesWidth;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalGridLinesVisible() { return this._horizontalGridLinesVisible; }
    set horizontalGridLinesVisible(value: boolean) {
        if (value !== this._horizontalGridLinesVisible) {
            this.beginChange();
            this._horizontalGridLinesVisible = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalGridLinesVisible;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalGridLinesColor() { return this._verticalGridLinesColor; }
    set verticalGridLinesColor(value: GridSettings.Color) {
        if (value !== this._verticalGridLinesColor) {
            this.beginChange();
            this._verticalGridLinesColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalGridLinesColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalGridLinesWidth() { return this._verticalGridLinesWidth; }
    set verticalGridLinesWidth(value: number) {
        if (value !== this._verticalGridLinesWidth) {
            this.beginChange();
            this._verticalGridLinesWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalGridLinesWidth;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalWheelScrollingAllowed() { return this._horizontalWheelScrollingAllowed; }
    set horizontalWheelScrollingAllowed(value: HorizontalWheelScrollingAllowed) {
        if (value !== this._horizontalWheelScrollingAllowed) {
            this.beginChange();
            this._horizontalWheelScrollingAllowed = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalWheelScrollingAllowed;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalScrollbarClassPrefix() { return this._horizontalScrollbarClassPrefix; }
    set horizontalScrollbarClassPrefix(value: string) {
        if (value !== this._horizontalScrollbarClassPrefix) {
            this.beginChange();
            this._horizontalScrollbarClassPrefix = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalScrollbarClassPrefix;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get minimumColumnWidth() { return this._minimumColumnWidth; }
    set minimumColumnWidth(value: number) {
        if (value !== this._minimumColumnWidth) {
            this.beginChange();
            this._minimumColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.minimumColumnWidth;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get maximumColumnWidth() { return this._maximumColumnWidth; }
    set maximumColumnWidth(value: number | undefined) {
        if (value !== this._maximumColumnWidth) {
            this.beginChange();
            this._maximumColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.maximumColumnWidth;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get visibleColumnWidthAdjust() { return this._visibleColumnWidthAdjust; }
    set visibleColumnWidthAdjust(value: boolean) {
        if (value !== this._visibleColumnWidthAdjust) {
            this.beginChange();
            this._visibleColumnWidthAdjust = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.visibleColumnWidthAdjust;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseRectangleSelection() { return this._mouseRectangleSelection; }
    set mouseRectangleSelection(value: boolean) {
        if (value !== this._mouseRectangleSelection) {
            this.beginChange();
            this._mouseRectangleSelection = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseRectangleSelection;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseColumnSelection() { return this._mouseColumnSelection; }
    set mouseColumnSelection(value: boolean) {
        if (value !== this._mouseColumnSelection) {
            this.beginChange();
            this._mouseColumnSelection = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseColumnSelection;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseRowSelection() { return this._mouseRowSelection; }
    set mouseRowSelection(value: boolean) {
        if (value !== this._mouseRowSelection) {
            this.beginChange();
            this._mouseRowSelection = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseRowSelection;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get multipleSelectionAreas() { return this._multipleSelectionAreas; }
    set multipleSelectionAreas(value: boolean) {
        if (value !== this._multipleSelectionAreas) {
            this.beginChange();
            this._multipleSelectionAreas = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.multipleSelectionAreas;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get primarySelectionAreaType() { return this._primarySelectionAreaType; }
    set primarySelectionAreaType(value: SelectionAreaType) {
        if (value !== this._primarySelectionAreaType) {
            this.beginChange();
            this._primarySelectionAreaType = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.primarySelectionAreaType;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get repaintImmediately() { return this._repaintImmediately; }
    set repaintImmediately(value: boolean) {
        if (value !== this._repaintImmediately) {
            this.beginChange();
            this._repaintImmediately = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.repaintImmediately;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get repaintFramesPerSecond() { return this._repaintFramesPerSecond; }
    set repaintFramesPerSecond(value: number) {
        if (value !== this._repaintFramesPerSecond) {
            this.beginChange();
            this._repaintFramesPerSecond = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.repaintFramesPerSecond;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get resizeColumnInPlace() { return this._resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) {
        if (value !== this._resizeColumnInPlace) {
            this.beginChange();
            this._resizeColumnInPlace = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.resizeColumnInPlace;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get resizedEventDebounceExtendedWhenPossible() { return this._resizedEventDebounceExtendedWhenPossible; }
    set resizedEventDebounceExtendedWhenPossible(value: boolean) {
        if (value !== this._resizedEventDebounceExtendedWhenPossible) {
            this.beginChange();
            this._resizedEventDebounceExtendedWhenPossible = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.resizedEventDebounceExtendedWhenPossible;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get resizedEventDebounceInterval() { return this._resizedEventDebounceInterval; }
    set resizedEventDebounceInterval(value: number) {
        if (value !== this._resizedEventDebounceInterval) {
            this.beginChange();
            this._resizedEventDebounceInterval = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.resizedEventDebounceInterval;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get rowResize() { return this._rowResize; }
    set rowResize(value: boolean) {
        if (value !== this._rowResize) {
            this.beginChange();
            this._rowResize = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.rowResize;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get rowStripes() { return this._rowStripes; }
    set rowStripes(value: GridSettings.RowStripe[] | undefined) {
        if (value !== this._rowStripes) {
            this.beginChange();
            this._rowStripes = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.rowStripes;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollHorizontallySmoothly() { return this._scrollHorizontallySmoothly; }
    set scrollHorizontallySmoothly(value: boolean) {
        if (value !== this._scrollHorizontallySmoothly) {
            this.beginChange();
            this._scrollHorizontallySmoothly = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.scrollHorizontallySmoothly;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollerThumbColor() { return this._scrollerThumbColor; }
    set scrollerThumbColor(value: string) {
        if (value !== this._scrollerThumbColor) {
            this.beginChange();
            this._scrollerThumbColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.scrollerThumbColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollerThumbReducedVisibilityOpacity() { return this._scrollerThumbReducedVisibilityOpacity; }
    set scrollerThumbReducedVisibilityOpacity(value: number) {
        if (value !== this._scrollerThumbReducedVisibilityOpacity) {
            this.beginChange();
            this._scrollerThumbReducedVisibilityOpacity = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.scrollerThumbReducedVisibilityOpacity;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollingEnabled() { return this._scrollingEnabled; }
    set scrollingEnabled(value: boolean) {
        if (value !== this._scrollingEnabled) {
            this.beginChange();
            this._scrollingEnabled = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.scrollingEnabled;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get secondarySelectionAreaTypeSpecifierModifierKey() { return this._secondarySelectionAreaTypeSpecifierModifierKey; }
    set secondarySelectionAreaTypeSpecifierModifierKey(value: ModifierKeyEnum | undefined) {
        if (value !== this._secondarySelectionAreaTypeSpecifierModifierKey) {
            this.beginChange();
            this._secondarySelectionAreaTypeSpecifierModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.secondarySelectionAreaTypeSpecifierModifierKey;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get secondarySelectionAreaType() { return this._secondarySelectionAreaType; }
    set secondarySelectionAreaType(value: SelectionAreaType) {
        if (value !== this._secondarySelectionAreaType) {
            this.beginChange();
            this._secondarySelectionAreaType = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.secondarySelectionAreaType;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get selectionExtendDragActiveCursorName() { return this._selectionExtendDragActiveCursorName; }
    set selectionExtendDragActiveCursorName(value: string | undefined) {
        if (value !== this._selectionExtendDragActiveCursorName) {
            this.beginChange();
            this._selectionExtendDragActiveCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.selectionExtendDragActiveCursorName;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get selectionExtendDragActiveTitleText() { return this._selectionExtendDragActiveTitleText; }
    set selectionExtendDragActiveTitleText(value: string | undefined) {
        if (value !== this._selectionExtendDragActiveTitleText) {
            this.beginChange();
            this._selectionExtendDragActiveTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.selectionExtendDragActiveTitleText;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get selectionRegionOutlineColor() { return this._selectionRegionOutlineColor; }
    set selectionRegionOutlineColor(value: GridSettings.Color) {
        if (value !== this._selectionRegionOutlineColor) {
            this.beginChange();
            this._selectionRegionOutlineColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.selectionRegionOutlineColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get selectionRegionOverlayColor() { return this._selectionRegionOverlayColor; }
    set selectionRegionOverlayColor(value: GridSettings.Color) {
        if (value !== this._selectionRegionOverlayColor) {
            this.beginChange();
            this._selectionRegionOverlayColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.selectionRegionOverlayColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get showFilterRow() { return this._showFilterRow; }
    set showFilterRow(value: boolean) {
        if (value !== this._showFilterRow) {
            this.beginChange();
            this._showFilterRow = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.showFilterRow;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get showScrollerThumbOnMouseMoveModifierKey() { return this._showScrollerThumbOnMouseMoveModifierKey; }
    set showScrollerThumbOnMouseMoveModifierKey(value: ModifierKeyEnum | undefined) {
        if (value !== this.showScrollerThumbOnMouseMoveModifierKey) {
            this.beginChange();
            this.showScrollerThumbOnMouseMoveModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.showScrollerThumbOnMouseMoveModifierKey;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get sortOnDoubleClick() { return this._sortOnDoubleClick; }
    set sortOnDoubleClick(value: boolean) {
        if (value !== this._sortOnDoubleClick) {
            this.beginChange();
            this._sortOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.sortOnDoubleClick;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get sortOnClick() { return this._sortOnClick; }
    set sortOnClick(value: boolean) {
        if (value !== this._sortOnClick) {
            this.beginChange();
            this._sortOnClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.sortOnClick;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get useHiDPI() { return this._useHiDPI; }
    set useHiDPI(value: boolean) {
        if (value !== this._useHiDPI) {
            this.beginChange();
            this._useHiDPI = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.useHiDPI;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalScrollbarClassPrefix() { return this._verticalScrollbarClassPrefix; }
    set verticalScrollbarClassPrefix(value: string) {
        if (value !== this._verticalScrollbarClassPrefix) {
            this.beginChange();
            this._verticalScrollbarClassPrefix = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalScrollbarClassPrefix;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get wheelHFactor() { return this._wheelHFactor; }
    set wheelHFactor(value: number) {
        if (value !== this._wheelHFactor) {
            this.beginChange();
            this._wheelHFactor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.wheelHFactor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }
    get wheelVFactor() { return this._wheelVFactor; }
    set wheelVFactor(value: number) {
        if (value !== this._wheelVFactor) {
            this.beginChange();
            this._wheelVFactor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.wheelVFactor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    load(settings: GridSettings) {
        this.beginChange();

        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const gridSettingsKey = key as keyof GridSettings;
            switch (gridSettingsKey) {
                case 'addToggleSelectionAreaModifierKey':
                    this._addToggleSelectionAreaModifierKey = settings.addToggleSelectionAreaModifierKey;
                    break;
                case 'addToggleSelectionAreaModifierKeyDoesToggle':
                    this._addToggleSelectionAreaModifierKeyDoesToggle = settings.addToggleSelectionAreaModifierKeyDoesToggle;
                    break;
                case 'backgroundColor':
                    this._backgroundColor = settings.backgroundColor;
                    break;
                case 'color':
                    this._color = settings.color;
                    break;
                case 'defaultColumnAutoSizing':
                    this._defaultColumnAutoSizing = settings.defaultColumnAutoSizing;
                    break;
                case 'columnAutoSizingMax':
                    this._columnAutoSizingMax = settings.columnAutoSizingMax;
                    break;
                case 'columnClip':
                    this._columnClip = settings.columnClip;
                    break;
                case 'columnMoveDragPossibleCursorName':
                    this._columnMoveDragPossibleCursorName = settings.columnMoveDragPossibleCursorName;
                    break;
                case 'columnMoveDragPossibleTitleText':
                    this._columnMoveDragPossibleTitleText = settings.columnMoveDragPossibleTitleText;
                    break;
                case 'columnMoveDragActiveCursorName':
                    this._columnMoveDragActiveCursorName = settings.columnMoveDragActiveCursorName;
                    break;
                case 'columnMoveDragActiveTitleText':
                    this._columnMoveDragActiveTitleText = settings.columnMoveDragActiveTitleText;
                    break;
                case 'columnResizeDragPossibleCursorName':
                    this._columnResizeDragPossibleCursorName = settings.columnResizeDragPossibleCursorName;
                    break;
                case 'columnResizeDragPossibleTitleText':
                    this._columnResizeDragPossibleTitleText = settings.columnResizeDragPossibleTitleText;
                    break;
                case 'columnResizeDragActiveCursorName':
                    this._columnResizeDragActiveCursorName = settings.columnResizeDragActiveCursorName;
                    break;
                case 'columnResizeDragActiveTitleText':
                    this._columnResizeDragActiveTitleText = settings.columnResizeDragActiveTitleText;
                    break;
                case 'columnSortPossibleCursorName':
                    this._columnSortPossibleCursorName = settings.columnSortPossibleCursorName;
                    break;
                case 'columnSortPossibleTitleText':
                    this._columnSortPossibleTitleText = settings.columnSortPossibleTitleText;
                    break;
                case 'columnsReorderable':
                    this._columnsReorderable = settings.columnsReorderable;
                    break;
                case 'columnsReorderableHideable':
                    this._columnsReorderableHideable = settings.columnsReorderableHideable;
                    break;
                case 'defaultRowHeight':
                    this._defaultRowHeight = settings.defaultRowHeight;
                    break;
                case 'defaultColumnWidth':
                    this._defaultColumnWidth = settings.defaultColumnWidth;
                    break;
                case 'defaultUiBehaviorTypeNames':
                    this._defaultUiBehaviorTypeNames = settings.defaultUiBehaviorTypeNames;
                    break;
                case 'editable':
                    this._editable = settings.editable;
                    break;
                case 'editKey':
                    this._editKey = settings.editKey;
                    break;
                case 'editOnClick':
                    this._editOnClick = settings.editOnClick;
                    break;
                case 'editOnDoubleClick':
                    this._editOnDoubleClick = settings.editOnDoubleClick;
                    break;
                case 'editOnFocusCell':
                    this._editOnFocusCell = settings.editOnFocusCell;
                    break;
                case 'editOnKeyDown':
                    this._editOnKeyDown = settings.editOnKeyDown;
                    break;
                case 'enableContinuousRepaint':
                    this._enableContinuousRepaint = settings.enableContinuousRepaint;
                    break;
                case 'extendLastSelectionAreaModifierKey':
                    this._extendLastSelectionAreaModifierKey = settings.extendLastSelectionAreaModifierKey;
                    break;
                case 'eventDispatchEnabled':
                    this._eventDispatchEnabled = settings.eventDispatchEnabled;
                    break;
                case 'filterable':
                    this._filterable = settings.filterable;
                    break;
                case 'filterBackgroundColor':
                    this._filterBackgroundColor = settings.filterBackgroundColor;
                    break;
                case 'filterBackgroundSelectionColor':
                    this._filterBackgroundSelectionColor = settings.filterBackgroundSelectionColor;
                    break;
                case 'filterColor':
                    this._filterColor = settings.filterColor;
                    break;
                case 'filterEditor':
                    this._filterEditor = settings.filterEditor;
                    break;
                case 'filterFont':
                    this._filterFont = settings.filterFont;
                    break;
                case 'filterForegroundSelectionColor':
                    this._filterForegroundSelectionColor = settings.filterForegroundSelectionColor;
                    break;
                case 'filterHalign':
                    this._filterHalign = settings.filterHalign;
                    break;
                case 'filterCellPainter':
                    this._filterCellPainter = settings.filterCellPainter;
                    break;
                case 'fixedColumnCount':
                    this._fixedColumnCount = settings.fixedColumnCount;
                    break;
                case 'horizontalFixedLineColor':
                    this._horizontalFixedLineColor = settings.horizontalFixedLineColor;
                    break;
                case 'horizontalFixedLineEdgeWidth':
                    this._horizontalFixedLineEdgeWidth = settings.horizontalFixedLineEdgeWidth;
                    break;
                case 'horizontalFixedLineWidth':
                    this._horizontalFixedLineWidth = settings.horizontalFixedLineWidth;
                    break;
                case 'verticalFixedLineColor':
                    this._verticalFixedLineColor = settings.verticalFixedLineColor;
                    break;
                case 'verticalFixedLineEdgeWidth':
                    this._verticalFixedLineEdgeWidth = settings.verticalFixedLineEdgeWidth;
                    break;
                case 'verticalFixedLineWidth':
                    this._verticalFixedLineWidth = settings.verticalFixedLineWidth;
                    break;
                case 'fixedRowCount':
                    this._fixedRowCount = settings.fixedRowCount;
                    break;
                case 'gridRightAligned':
                    this._gridRightAligned = settings.gridRightAligned;
                    break;
                case 'verticalGridLinesVisible':
                    this._verticalGridLinesVisible = settings.verticalGridLinesVisible;
                    break;
                case 'horizontalGridLinesColor':
                    this._horizontalGridLinesColor = settings.horizontalGridLinesColor;
                    break;
                case 'horizontalGridLinesWidth':
                    this._horizontalGridLinesWidth = settings.horizontalGridLinesWidth;
                    break;
                case 'horizontalGridLinesVisible':
                    this._horizontalGridLinesVisible = settings.horizontalGridLinesVisible;
                    break;
                case 'verticalGridLinesColor':
                    this._verticalGridLinesColor = settings.verticalGridLinesColor;
                    break;
                case 'verticalGridLinesWidth':
                    this._verticalGridLinesWidth = settings.verticalGridLinesWidth;
                    break;
                case 'horizontalWheelScrollingAllowed':
                    this._horizontalWheelScrollingAllowed = settings.horizontalWheelScrollingAllowed;
                    break;
                case 'horizontalScrollbarClassPrefix':
                    this._horizontalScrollbarClassPrefix = settings.horizontalScrollbarClassPrefix;
                    break;
                case 'minimumColumnWidth':
                    this._minimumColumnWidth = settings.minimumColumnWidth;
                    break;
                case 'maximumColumnWidth':
                    this._maximumColumnWidth = settings.maximumColumnWidth;
                    break;
                case 'visibleColumnWidthAdjust':
                    this._visibleColumnWidthAdjust = settings.visibleColumnWidthAdjust;
                    break;
                case 'mouseRectangleSelection':
                    this._mouseRectangleSelection = settings.mouseRectangleSelection;
                    break;
                case 'mouseColumnSelection':
                    this._mouseColumnSelection = settings.mouseColumnSelection;
                    break;
                case 'mouseRowSelection':
                    this._mouseRowSelection = settings.mouseRowSelection;
                    break;
                case 'multipleSelectionAreas':
                    this._multipleSelectionAreas = settings.multipleSelectionAreas;
                    break;
                case 'primarySelectionAreaType':
                    this._primarySelectionAreaType = settings.primarySelectionAreaType;
                    break;
                case 'repaintImmediately':
                    this._repaintImmediately = settings.repaintImmediately;
                    break;
                case 'repaintFramesPerSecond':
                    this._repaintFramesPerSecond = settings.repaintFramesPerSecond;
                    break;
                case 'resizeColumnInPlace':
                    this._resizeColumnInPlace = settings.resizeColumnInPlace;
                    break;
                case 'resizedEventDebounceExtendedWhenPossible':
                    this._resizedEventDebounceExtendedWhenPossible = settings.resizedEventDebounceExtendedWhenPossible;
                    break;
                case 'resizedEventDebounceInterval':
                    this._resizedEventDebounceInterval = settings.resizedEventDebounceInterval;
                    break;
                case 'rowResize':
                    this._rowResize = settings.rowResize;
                    break;
                case 'rowStripes':
                    this._rowStripes = settings.rowStripes;
                    break;
                case 'scrollerThumbColor':
                    this._scrollerThumbColor = settings.scrollerThumbColor;
                    break;
                case 'scrollerThumbReducedVisibilityOpacity':
                    this._scrollerThumbReducedVisibilityOpacity = settings.scrollerThumbReducedVisibilityOpacity;
                    break;
                case 'scrollHorizontallySmoothly':
                    this._scrollHorizontallySmoothly = settings.scrollHorizontallySmoothly;
                    break;
                case 'scrollingEnabled':
                    this._scrollingEnabled = settings.scrollingEnabled;
                    break;
                case 'secondarySelectionAreaTypeSpecifierModifierKey':
                    this._secondarySelectionAreaTypeSpecifierModifierKey = settings.secondarySelectionAreaTypeSpecifierModifierKey;
                    break;
                case 'secondarySelectionAreaType':
                    this._secondarySelectionAreaType = settings.secondarySelectionAreaType;
                    break;
                case 'selectionExtendDragActiveCursorName':
                    this._selectionExtendDragActiveCursorName = settings.selectionExtendDragActiveCursorName;
                    break;
                case 'selectionExtendDragActiveTitleText':
                    this._selectionExtendDragActiveTitleText = settings.selectionExtendDragActiveTitleText;
                    break;
                case 'selectionRegionOutlineColor':
                    this._selectionRegionOutlineColor = settings.selectionRegionOutlineColor;
                    break;
                case 'selectionRegionOverlayColor':
                    this._selectionRegionOverlayColor = settings.selectionRegionOverlayColor;
                    break;
                case 'showFilterRow':
                    this._showFilterRow = settings.showFilterRow;
                    break;
                case 'sortOnDoubleClick':
                    this._sortOnDoubleClick = settings.sortOnDoubleClick;
                    break;
                case 'sortOnClick':
                    this._sortOnClick = settings.sortOnClick;
                    break;
                case 'showScrollerThumbOnMouseMoveModifierKey':
                    this._showScrollerThumbOnMouseMoveModifierKey = settings.showScrollerThumbOnMouseMoveModifierKey;
                    break;
                case 'useHiDPI':
                    this._useHiDPI = settings.useHiDPI;
                    break;
                case 'verticalScrollbarClassPrefix':
                    this._verticalScrollbarClassPrefix = settings.verticalScrollbarClassPrefix;
                    break;
                case 'wheelHFactor':
                    this._wheelHFactor = settings.wheelHFactor;
                    break;
                case 'wheelVFactor':
                    this._wheelVFactor = settings.wheelVFactor;
                    break;

                default: {
                    gridSettingsKey satisfies never;
                }
            }
        }

        this.notifyChanged(GridSettingChangeInvalidateTypeId.Resize);

        this.endChange();
    }
}
