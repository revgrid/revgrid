import { isArrayEqual } from '@xilytix/sysutils';
import {
    BehavioredGridSettings,
    GridSettings,
    HorizontalWheelScrollingAllowed,
    ModifierKeyEnum,
    OnlyGridSettings,
    RowOrColumnSelectionAreaType,
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
    private _switchNewRectangleSelectionToRowOrColumn: RowOrColumnSelectionAreaType | undefined;
    private _defaultRowHeight: number;
    private _defaultColumnWidth: number;
    private _defaultUiControllerTypeNames: string[];
    private _editable: boolean;
    private _editKey: string;
    private _editOnClick: boolean;
    private _editOnDoubleClick: boolean;
    private _editOnFocusCell: boolean;
    private _editOnKeyDown: boolean;
    private _editorClickableCursorName: string | undefined;
    private _extendLastSelectionAreaModifierKey: ModifierKeyEnum;
    private _eventDispatchEnabled: boolean;
    private _filterable: boolean;
    private _filterBackgroundColor: GridSettings.Color;
    private _filterBackgroundSelectionColor: GridSettings.Color;
    private _filterColor: GridSettings.Color;
    private _filterEditor: string;
    private _filterFont: string;
    private _filterForegroundSelectionColor: GridSettings.Color;
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
    private _horizontalGridLinesColor: GridSettings.Color;
    private _horizontalGridLinesWidth: number;
    private _horizontalGridLinesVisible: boolean;
    private _verticalGridLinesVisible: boolean;
    private _visibleVerticalGridLinesDrawnInFixedAndPreMainOnly: boolean;
    private _verticalGridLinesColor: GridSettings.Color;
    private _verticalGridLinesWidth: number;
    private _horizontalWheelScrollingAllowed: HorizontalWheelScrollingAllowed;
    private _minimumColumnWidth: number;
    private _maximumColumnWidth: number | undefined;
    private _visibleColumnWidthAdjust: boolean;
    private _mouseLastSelectionAreaExtendingDragActiveCursorName: string | undefined;
    private _mouseLastSelectionAreaExtendingDragActiveTitleText: string | undefined;
    private _mouseAddToggleExtendSelectionAreaEnabled: boolean;
    private _mouseAddToggleExtendSelectionAreaDragModifierKey: ModifierKeyEnum | undefined;
    private _mouseColumnSelectionEnabled: boolean;
    private _mouseColumnSelectionModifierKey: ModifierKeyEnum | undefined;
    private _mouseRowSelectionEnabled: boolean;
    private _mouseRowSelectionModifierKey: ModifierKeyEnum | undefined;
    private _multipleSelectionAreas: boolean;
    private _primarySelectionAreaType: SelectionAreaType;
    private _minimumAnimateTimeInterval: number;
    private _backgroundAnimateTimeInterval: number | undefined;
    private _resizeColumnInPlace: boolean;
    private _resizedEventDebounceExtendedWhenPossible: boolean;
    private _resizedEventDebounceInterval: number;
    private _rowResize: boolean;
    private _rowStripeBackgroundColor: OnlyGridSettings.Color | undefined;
    private _scrollHorizontallySmoothly: boolean;
    private _scrollerThickness: string;
    private _scrollerThumbColor: string;
    private _scrollerThumbReducedVisibilityOpacity: number;
    private _scrollingEnabled: boolean;
    private _secondarySelectionAreaTypeSpecifierModifierKey: ModifierKeyEnum | undefined;
    private _secondarySelectionAreaType: SelectionAreaType;
    private _selectionRegionOutlineColor: GridSettings.Color | undefined;
    private _selectionRegionOverlayColor: GridSettings.Color | undefined;
    private _showFilterRow: boolean;
    private _showScrollerThumbOnMouseMoveModifierKey: ModifierKeyEnum | undefined;
    private _sortOnDoubleClick: boolean;
    private _sortOnClick: boolean;
    private _useHiDPI: boolean;
    private _wheelHFactor: number;
    private _wheelVFactor: number;

    get addToggleSelectionAreaModifierKey() { return this._addToggleSelectionAreaModifierKey; }
    set addToggleSelectionAreaModifierKey(value: ModifierKeyEnum) {
        if (value !== this._addToggleSelectionAreaModifierKey) {
            this.beginChange();
            this._addToggleSelectionAreaModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.addToggleSelectionAreaModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get addToggleSelectionAreaModifierKeyDoesToggle() { return this._addToggleSelectionAreaModifierKeyDoesToggle; }
    set addToggleSelectionAreaModifierKeyDoesToggle(value: boolean) {
        if (value !== this._addToggleSelectionAreaModifierKeyDoesToggle) {
            this.beginChange();
            this._addToggleSelectionAreaModifierKeyDoesToggle = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.addToggleSelectionAreaModifierKeyDoesToggle;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get backgroundColor() { return this._backgroundColor; }
    set backgroundColor(value: GridSettings.Color) {
        if (value !== this._backgroundColor) {
            this.beginChange();
            this._backgroundColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.backgroundColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get color() { return this._color; }
    set color(value: GridSettings.Color) {
        if (value !== this._color) {
            this.beginChange();
            this._color = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.color;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultColumnAutoSizing() { return this._defaultColumnAutoSizing; }
    set defaultColumnAutoSizing(value: boolean) {
        if (value !== this._defaultColumnAutoSizing) {
            this.beginChange();
            this._defaultColumnAutoSizing = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultColumnAutoSizing;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnAutoSizingMax() { return this._columnAutoSizingMax; }
    set columnAutoSizingMax(value: number | undefined) {
        if (value !== this._columnAutoSizingMax) {
            this.beginChange();
            this._columnAutoSizingMax = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnAutoSizingMax;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnClip() { return this._columnClip; }
    set columnClip(value: boolean | undefined) {
        if (value !== this._columnClip) {
            this.beginChange();
            this._columnClip = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnClip;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragPossibleCursorName() { return this._columnMoveDragPossibleCursorName; }
    set columnMoveDragPossibleCursorName(value: string | undefined) {
        if (value !== this._columnMoveDragPossibleCursorName) {
            this.beginChange();
            this._columnMoveDragPossibleCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnMoveDragPossibleCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragPossibleTitleText() { return this._columnMoveDragPossibleTitleText; }
    set columnMoveDragPossibleTitleText(value: string | undefined) {
        if (value !== this._columnMoveDragPossibleTitleText) {
            this.beginChange();
            this._columnMoveDragPossibleTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnMoveDragPossibleTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragActiveCursorName() { return this._columnMoveDragActiveCursorName; }
    set columnMoveDragActiveCursorName(value: string | undefined) {
        if (value !== this._columnMoveDragActiveCursorName) {
            this.beginChange();
            this._columnMoveDragActiveCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnMoveDragActiveCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragActiveTitleText() { return this._columnMoveDragActiveTitleText; }
    set columnMoveDragActiveTitleText(value: string | undefined) {
        if (value !== this._columnMoveDragActiveTitleText) {
            this.beginChange();
            this._columnMoveDragActiveTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnMoveDragActiveTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragPossibleCursorName() { return this._columnResizeDragPossibleCursorName; }
    set columnResizeDragPossibleCursorName(value: string | undefined) {
        if (value !== this._columnResizeDragPossibleCursorName) {
            this.beginChange();
            this._columnResizeDragPossibleCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnResizeDragPossibleCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragPossibleTitleText() { return this._columnResizeDragPossibleTitleText; }
    set columnResizeDragPossibleTitleText(value: string | undefined) {
        if (value !== this._columnResizeDragPossibleTitleText) {
            this.beginChange();
            this._columnResizeDragPossibleTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnResizeDragPossibleTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragActiveCursorName() { return this._columnResizeDragActiveCursorName; }
    set columnResizeDragActiveCursorName(value: string | undefined) {
        if (value !== this._columnResizeDragActiveCursorName) {
            this.beginChange();
            this._columnResizeDragActiveCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnResizeDragActiveCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragActiveTitleText() { return this._columnResizeDragActiveTitleText; }
    set columnResizeDragActiveTitleText(value: string | undefined) {
        if (value !== this._columnResizeDragActiveTitleText) {
            this.beginChange();
            this._columnResizeDragActiveTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnResizeDragActiveTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnSortPossibleCursorName() { return this._columnSortPossibleCursorName; }
    set columnSortPossibleCursorName(value: string | undefined) {
        if (value !== this._columnSortPossibleCursorName) {
            this.beginChange();
            this._columnSortPossibleCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnSortPossibleCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnSortPossibleTitleText() { return this._columnSortPossibleTitleText; }
    set columnSortPossibleTitleText(value: string | undefined) {
        if (value !== this._columnSortPossibleTitleText) {
            this.beginChange();
            this._columnSortPossibleTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnSortPossibleTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnsReorderable() { return this._columnsReorderable; }
    set columnsReorderable(value: boolean) {
        if (value !== this._columnsReorderable) {
            this.beginChange();
            this._columnsReorderable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnsReorderable;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnsReorderableHideable() { return this._columnsReorderableHideable; }
    set columnsReorderableHideable(value: boolean) {
        if (value !== this._columnsReorderableHideable) {
            this.beginChange();
            this._columnsReorderableHideable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnsReorderableHideable;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get switchNewRectangleSelectionToRowOrColumn() { return this._switchNewRectangleSelectionToRowOrColumn; }
    set switchNewRectangleSelectionToRowOrColumn(value: RowOrColumnSelectionAreaType | undefined) {
        if (value !== this._switchNewRectangleSelectionToRowOrColumn) {
            this.beginChange();
            this._switchNewRectangleSelectionToRowOrColumn = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.switchNewRectangleSelectionToRowOrColumn;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultRowHeight() { return this._defaultRowHeight; }
    set defaultRowHeight(value: number) {
        if (value !== this._defaultRowHeight) {
            this.beginChange();
            this._defaultRowHeight = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultRowHeight;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultColumnWidth() { return this._defaultColumnWidth; }
    set defaultColumnWidth(value: number) {
        if (value !== this._defaultColumnWidth) {
            this.beginChange();
            this._defaultColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultUiControllerTypeNames() { return this._defaultUiControllerTypeNames; }
    set defaultUiControllerTypeNames(value: string[]) {
        if (!isArrayEqual(value, this._defaultUiControllerTypeNames)) {
            this.beginChange();
            this._defaultUiControllerTypeNames = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultUiControllerTypeNames;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editable() { return this._editable; }
    set editable(value: boolean) {
        if (value !== this._editable) {
            this.beginChange();
            this._editable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editable;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editKey() { return this._editKey; }
    set editKey(value: string) {
        if (value !== this._editKey) {
            this.beginChange();
            this._editKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnClick() { return this._editOnClick; }
    set editOnClick(value: boolean) {
        if (value !== this._editOnClick) {
            this.beginChange();
            this._editOnClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnDoubleClick() { return this._editOnDoubleClick; }
    set editOnDoubleClick(value: boolean) {
        if (value !== this._editOnDoubleClick) {
            this.beginChange();
            this._editOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnDoubleClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnFocusCell() { return this._editOnFocusCell; }
    set editOnFocusCell(value: boolean) {
        if (value !== this._editOnFocusCell) {
            this.beginChange();
            this._editOnFocusCell = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnFocusCell;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnKeyDown() { return this._editOnKeyDown; }
    set editOnKeyDown(value: boolean) {
        if (value !== this._editOnKeyDown) {
            this.beginChange();
            this._editOnKeyDown = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnKeyDown;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editorClickableCursorName() { return this._editorClickableCursorName; }
    set editorClickableCursorName(value: string | undefined) {
        if (value !== this._editorClickableCursorName) {
            this.beginChange();
            this._editorClickableCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editorClickableCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get extendLastSelectionAreaModifierKey() { return this._extendLastSelectionAreaModifierKey; }
    set extendLastSelectionAreaModifierKey(value: ModifierKeyEnum) {
        if (value !== this._extendLastSelectionAreaModifierKey) {
            this.beginChange();
            this._extendLastSelectionAreaModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.extendLastSelectionAreaModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get eventDispatchEnabled() { return this._eventDispatchEnabled; }
    set eventDispatchEnabled(value: boolean) {
        if (value !== this._eventDispatchEnabled) {
            this.beginChange();
            this._eventDispatchEnabled = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.eventDispatchEnabled;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterable() { return this._filterable; }
    set filterable(value: boolean) {
        if (value !== this._filterable) {
            this.beginChange();
            this._filterable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterable;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterBackgroundColor() { return this._filterBackgroundColor; }
    set filterBackgroundColor(value: GridSettings.Color) {
        if (value !== this._filterBackgroundColor) {
            this.beginChange();
            this._filterBackgroundColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterBackgroundColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterBackgroundSelectionColor() { return this._filterBackgroundSelectionColor; }
    set filterBackgroundSelectionColor(value: GridSettings.Color) {
        if (value !== this._filterBackgroundSelectionColor) {
            this.beginChange();
            this._filterBackgroundSelectionColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterBackgroundSelectionColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterColor() { return this._filterColor; }
    set filterColor(value: GridSettings.Color) {
        if (value !== this._filterColor) {
            this.beginChange();
            this._filterColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterEditor() { return this._filterEditor; }
    set filterEditor(value: string) {
        if (value !== this._filterEditor) {
            this.beginChange();
            this._filterEditor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterEditor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterFont() { return this._filterFont; }
    set filterFont(value: string) {
        if (value !== this._filterFont) {
            this.beginChange();
            this._filterFont = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterFont;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterForegroundSelectionColor() { return this._filterForegroundSelectionColor; }
    set filterForegroundSelectionColor(value: GridSettings.Color) {
        if (value !== this._filterForegroundSelectionColor) {
            this.beginChange();
            this._filterForegroundSelectionColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterForegroundSelectionColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterCellPainter() { return this._filterCellPainter; }
    set filterCellPainter(value: string) {
        if (value !== this._filterCellPainter) {
            this.beginChange();
            this._filterCellPainter = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterCellPainter;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get fixedColumnCount() { return this._fixedColumnCount; }
    set fixedColumnCount(value: number) {
        if (value !== this._fixedColumnCount) {
            this.beginChange();
            this._fixedColumnCount = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.fixedColumnCount;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalFixedLineColor() { return this._horizontalFixedLineColor; }
    set horizontalFixedLineColor(value: GridSettings.Color) {
        if (value !== this._horizontalFixedLineColor) {
            this.beginChange();
            this._horizontalFixedLineColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalFixedLineColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalFixedLineEdgeWidth() { return this._horizontalFixedLineEdgeWidth; }
    set horizontalFixedLineEdgeWidth(value: number | undefined) {
        if (value !== this._horizontalFixedLineEdgeWidth) {
            this.beginChange();
            this._horizontalFixedLineEdgeWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalFixedLineEdgeWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalFixedLineWidth() { return this._horizontalFixedLineWidth; }
    set horizontalFixedLineWidth(value: number | undefined) {
        if (value !== this._horizontalFixedLineWidth) {
            this.beginChange();
            this._horizontalFixedLineWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalFixedLineWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalFixedLineColor() { return this._verticalFixedLineColor; }
    set verticalFixedLineColor(value: GridSettings.Color) {
        if (value !== this._verticalFixedLineColor) {
            this.beginChange();
            this._verticalFixedLineColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalFixedLineColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalFixedLineEdgeWidth() { return this._verticalFixedLineEdgeWidth; }
    set verticalFixedLineEdgeWidth(value: number | undefined) {
        if (value !== this._verticalFixedLineEdgeWidth) {
            this.beginChange();
            this._verticalFixedLineEdgeWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalFixedLineEdgeWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalFixedLineWidth() { return this._verticalFixedLineWidth; }
    set verticalFixedLineWidth(value: number | undefined) {
        if (value !== this._verticalFixedLineWidth) {
            this.beginChange();
            this._verticalFixedLineWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalFixedLineWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get fixedRowCount() { return this._fixedRowCount; }
    set fixedRowCount(value: number) {
        if (value !== this._fixedRowCount) {
            this.beginChange();
            this._fixedRowCount = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.fixedRowCount;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get gridRightAligned() { return this._gridRightAligned; }
    set gridRightAligned(value: boolean) {
        if (value !== this._gridRightAligned) {
            this.beginChange();
            this._gridRightAligned = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.gridRightAligned;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalGridLinesColor() { return this._horizontalGridLinesColor; }
    set horizontalGridLinesColor(value: GridSettings.Color) {
        if (value !== this._horizontalGridLinesColor) {
            this.beginChange();
            this._horizontalGridLinesColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalGridLinesColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalGridLinesWidth() { return this._horizontalGridLinesWidth; }
    set horizontalGridLinesWidth(value: number) {
        if (value !== this._horizontalGridLinesWidth) {
            this.beginChange();
            this._horizontalGridLinesWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalGridLinesWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalGridLinesVisible() { return this._horizontalGridLinesVisible; }
    set horizontalGridLinesVisible(value: boolean) {
        if (value !== this._horizontalGridLinesVisible) {
            this.beginChange();
            this._horizontalGridLinesVisible = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalGridLinesVisible;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalGridLinesVisible() { return this._verticalGridLinesVisible; }
    set verticalGridLinesVisible(value: boolean) {
        if (value !== this._verticalGridLinesVisible) {
            this.beginChange();
            this._verticalGridLinesVisible = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalGridLinesVisible;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get visibleVerticalGridLinesDrawnInFixedAndPreMainOnly() { return this._visibleVerticalGridLinesDrawnInFixedAndPreMainOnly; }
    set visibleVerticalGridLinesDrawnInFixedAndPreMainOnly(value: boolean) {
        if (value !== this._visibleVerticalGridLinesDrawnInFixedAndPreMainOnly) {
            this.beginChange();
            this._visibleVerticalGridLinesDrawnInFixedAndPreMainOnly = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.visibleVerticalGridLinesDrawnInFixedAndPreMainOnly;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalGridLinesColor() { return this._verticalGridLinesColor; }
    set verticalGridLinesColor(value: GridSettings.Color) {
        if (value !== this._verticalGridLinesColor) {
            this.beginChange();
            this._verticalGridLinesColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalGridLinesColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalGridLinesWidth() { return this._verticalGridLinesWidth; }
    set verticalGridLinesWidth(value: number) {
        if (value !== this._verticalGridLinesWidth) {
            this.beginChange();
            this._verticalGridLinesWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.verticalGridLinesWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalWheelScrollingAllowed() { return this._horizontalWheelScrollingAllowed; }
    set horizontalWheelScrollingAllowed(value: HorizontalWheelScrollingAllowed) {
        if (value !== this._horizontalWheelScrollingAllowed) {
            this.beginChange();
            this._horizontalWheelScrollingAllowed = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.horizontalWheelScrollingAllowed;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get minimumColumnWidth() { return this._minimumColumnWidth; }
    set minimumColumnWidth(value: number) {
        if (value !== this._minimumColumnWidth) {
            this.beginChange();
            this._minimumColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.minimumColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get maximumColumnWidth() { return this._maximumColumnWidth; }
    set maximumColumnWidth(value: number | undefined) {
        if (value !== this._maximumColumnWidth) {
            this.beginChange();
            this._maximumColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.maximumColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get visibleColumnWidthAdjust() { return this._visibleColumnWidthAdjust; }
    set visibleColumnWidthAdjust(value: boolean) {
        if (value !== this._visibleColumnWidthAdjust) {
            this.beginChange();
            this._visibleColumnWidthAdjust = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.visibleColumnWidthAdjust;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseColumnSelectionEnabled() { return this._mouseColumnSelectionEnabled; }
    set mouseColumnSelectionEnabled(value: boolean) {
        if (value !== this._mouseColumnSelectionEnabled) {
            this.beginChange();
            this._mouseColumnSelectionEnabled = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseColumnSelectionEnabled;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseColumnSelectionModifierKey() { return this._mouseColumnSelectionModifierKey; }
    set mouseColumnSelectionModifierKey(value: ModifierKeyEnum | undefined) {
        if (value !== this._mouseColumnSelectionModifierKey) {
            this.beginChange();
            this._mouseColumnSelectionModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseColumnSelectionModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseLastSelectionAreaExtendingDragActiveCursorName() { return this._mouseLastSelectionAreaExtendingDragActiveCursorName; }
    set mouseLastSelectionAreaExtendingDragActiveCursorName(value: string | undefined) {
        if (value !== this._mouseLastSelectionAreaExtendingDragActiveCursorName) {
            this.beginChange();
            this._mouseLastSelectionAreaExtendingDragActiveCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseLastSelectionAreaExtendingDragActiveCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseLastSelectionAreaExtendingDragActiveTitleText() { return this._mouseLastSelectionAreaExtendingDragActiveTitleText; }
    set mouseLastSelectionAreaExtendingDragActiveTitleText(value: string | undefined) {
        if (value !== this._mouseLastSelectionAreaExtendingDragActiveTitleText) {
            this.beginChange();
            this._mouseLastSelectionAreaExtendingDragActiveTitleText = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseLastSelectionAreaExtendingDragActiveTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseAddToggleExtendSelectionAreaEnabled() { return this._mouseAddToggleExtendSelectionAreaEnabled; }
    set mouseAddToggleExtendSelectionAreaEnabled(value: boolean) {
        if (value !== this._mouseAddToggleExtendSelectionAreaEnabled) {
            this.beginChange();
            this._mouseAddToggleExtendSelectionAreaEnabled = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseAddToggleExtendSelectionAreaEnabled;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseAddToggleExtendSelectionAreaDragModifierKey() { return this._mouseAddToggleExtendSelectionAreaDragModifierKey; }
    set mouseAddToggleExtendSelectionAreaDragModifierKey(value: ModifierKeyEnum | undefined) {
        if (value !== this._mouseAddToggleExtendSelectionAreaDragModifierKey) {
            this.beginChange();
            this._mouseAddToggleExtendSelectionAreaDragModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseAddToggleExtendSelectionAreaDragModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseRowSelectionEnabled() { return this._mouseRowSelectionEnabled; }
    set mouseRowSelectionEnabled(value: boolean) {
        if (value !== this._mouseRowSelectionEnabled) {
            this.beginChange();
            this._mouseRowSelectionEnabled = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseRowSelectionEnabled;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseRowSelectionModifierKey() { return this._mouseRowSelectionModifierKey; }
    set mouseRowSelectionModifierKey(value: ModifierKeyEnum | undefined) {
        if (value !== this._mouseRowSelectionModifierKey) {
            this.beginChange();
            this._mouseRowSelectionModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseRowSelectionModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get multipleSelectionAreas() { return this._multipleSelectionAreas; }
    set multipleSelectionAreas(value: boolean) {
        if (value !== this._multipleSelectionAreas) {
            this.beginChange();
            this._multipleSelectionAreas = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.multipleSelectionAreas;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get primarySelectionAreaType() { return this._primarySelectionAreaType; }
    set primarySelectionAreaType(value: SelectionAreaType) {
        if (value !== this._primarySelectionAreaType) {
            this.beginChange();
            this._primarySelectionAreaType = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.primarySelectionAreaType;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get minimumAnimateTimeInterval() { return this._minimumAnimateTimeInterval; }
    set minimumAnimateTimeInterval(value: number) {
        if (value !== this._minimumAnimateTimeInterval) {
            this.beginChange();
            this._minimumAnimateTimeInterval = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.minimumAnimateTimeInterval;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get backgroundAnimateTimeInterval() { return this._backgroundAnimateTimeInterval; }
    set backgroundAnimateTimeInterval(value: number | undefined) {
        if (value !== this._backgroundAnimateTimeInterval) {
            this.beginChange();
            this._backgroundAnimateTimeInterval = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.backgroundAnimateTimeInterval;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get resizeColumnInPlace() { return this._resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) {
        if (value !== this._resizeColumnInPlace) {
            this.beginChange();
            this._resizeColumnInPlace = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.resizeColumnInPlace;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get resizedEventDebounceExtendedWhenPossible() { return this._resizedEventDebounceExtendedWhenPossible; }
    set resizedEventDebounceExtendedWhenPossible(value: boolean) {
        if (value !== this._resizedEventDebounceExtendedWhenPossible) {
            this.beginChange();
            this._resizedEventDebounceExtendedWhenPossible = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.resizedEventDebounceExtendedWhenPossible;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get resizedEventDebounceInterval() { return this._resizedEventDebounceInterval; }
    set resizedEventDebounceInterval(value: number) {
        if (value !== this._resizedEventDebounceInterval) {
            this.beginChange();
            this._resizedEventDebounceInterval = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.resizedEventDebounceInterval;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get rowResize() { return this._rowResize; }
    set rowResize(value: boolean) {
        if (value !== this._rowResize) {
            this.beginChange();
            this._rowResize = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.rowResize;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get rowStripeBackgroundColor() { return this._rowStripeBackgroundColor; }
    set rowStripeBackgroundColor(value: OnlyGridSettings.Color | undefined) {
        if (value !== this._rowStripeBackgroundColor) {
            this.beginChange();
            this._rowStripeBackgroundColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.rowStripeBackgroundColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollHorizontallySmoothly() { return this._scrollHorizontallySmoothly; }
    set scrollHorizontallySmoothly(value: boolean) {
        if (value !== this._scrollHorizontallySmoothly) {
            this.beginChange();
            this._scrollHorizontallySmoothly = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.scrollHorizontallySmoothly;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollerThickness() { return this._scrollerThickness; }
    set scrollerThickness(value: string) {
        if (value !== this._scrollerThickness) {
            this.beginChange();
            this._scrollerThickness = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.scrollerThickness;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollerThumbColor() { return this._scrollerThumbColor; }
    set scrollerThumbColor(value: string) {
        if (value !== this._scrollerThumbColor) {
            this.beginChange();
            this._scrollerThumbColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.scrollerThumbColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollerThumbReducedVisibilityOpacity() { return this._scrollerThumbReducedVisibilityOpacity; }
    set scrollerThumbReducedVisibilityOpacity(value: number) {
        if (value !== this._scrollerThumbReducedVisibilityOpacity) {
            this.beginChange();
            this._scrollerThumbReducedVisibilityOpacity = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.scrollerThumbReducedVisibilityOpacity;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollingEnabled() { return this._scrollingEnabled; }
    set scrollingEnabled(value: boolean) {
        if (value !== this._scrollingEnabled) {
            this.beginChange();
            this._scrollingEnabled = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.scrollingEnabled;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get secondarySelectionAreaTypeSpecifierModifierKey() { return this._secondarySelectionAreaTypeSpecifierModifierKey; }
    set secondarySelectionAreaTypeSpecifierModifierKey(value: ModifierKeyEnum | undefined) {
        if (value !== this._secondarySelectionAreaTypeSpecifierModifierKey) {
            this.beginChange();
            this._secondarySelectionAreaTypeSpecifierModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.secondarySelectionAreaTypeSpecifierModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get secondarySelectionAreaType() { return this._secondarySelectionAreaType; }
    set secondarySelectionAreaType(value: SelectionAreaType) {
        if (value !== this._secondarySelectionAreaType) {
            this.beginChange();
            this._secondarySelectionAreaType = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.secondarySelectionAreaType;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get selectionRegionOutlineColor() { return this._selectionRegionOutlineColor; }
    set selectionRegionOutlineColor(value: GridSettings.Color | undefined) {
        if (value !== this._selectionRegionOutlineColor) {
            this.beginChange();
            this._selectionRegionOutlineColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.selectionRegionOutlineColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get selectionRegionOverlayColor() { return this._selectionRegionOverlayColor; }
    set selectionRegionOverlayColor(value: GridSettings.Color | undefined) {
        if (value !== this._selectionRegionOverlayColor) {
            this.beginChange();
            this._selectionRegionOverlayColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.selectionRegionOverlayColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get showFilterRow() { return this._showFilterRow; }
    set showFilterRow(value: boolean) {
        if (value !== this._showFilterRow) {
            this.beginChange();
            this._showFilterRow = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.showFilterRow;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get showScrollerThumbOnMouseMoveModifierKey() { return this._showScrollerThumbOnMouseMoveModifierKey; }
    set showScrollerThumbOnMouseMoveModifierKey(value: ModifierKeyEnum | undefined) {
        if (value !== this.showScrollerThumbOnMouseMoveModifierKey) {
            this.beginChange();
            this.showScrollerThumbOnMouseMoveModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.showScrollerThumbOnMouseMoveModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get sortOnDoubleClick() { return this._sortOnDoubleClick; }
    set sortOnDoubleClick(value: boolean) {
        if (value !== this._sortOnDoubleClick) {
            this.beginChange();
            this._sortOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.sortOnDoubleClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get sortOnClick() { return this._sortOnClick; }
    set sortOnClick(value: boolean) {
        if (value !== this._sortOnClick) {
            this.beginChange();
            this._sortOnClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.sortOnClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get useHiDPI() { return this._useHiDPI; }
    set useHiDPI(value: boolean) {
        if (value !== this._useHiDPI) {
            this.beginChange();
            this._useHiDPI = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.useHiDPI;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get wheelHFactor() { return this._wheelHFactor; }
    set wheelHFactor(value: number) {
        if (value !== this._wheelHFactor) {
            this.beginChange();
            this._wheelHFactor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.wheelHFactor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get wheelVFactor() { return this._wheelVFactor; }
    set wheelVFactor(value: number) {
        if (value !== this._wheelVFactor) {
            this.beginChange();
            this._wheelVFactor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.wheelVFactor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    merge(settings: Partial<GridSettings>) {
        this.beginChange();

        const requiredSettings = settings as Required<GridSettings>; // since we only iterate over keys that exist we can assume that settings is not partial in the switch loop
        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const gridSettingsKey = key as keyof GridSettings;
            switch (gridSettingsKey) {
                case 'addToggleSelectionAreaModifierKey':
                    if (this._addToggleSelectionAreaModifierKey !== requiredSettings.addToggleSelectionAreaModifierKey) {
                        this._addToggleSelectionAreaModifierKey = requiredSettings.addToggleSelectionAreaModifierKey;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.addToggleSelectionAreaModifierKey);
                    }
                    break;
                case 'addToggleSelectionAreaModifierKeyDoesToggle':
                    if (this._addToggleSelectionAreaModifierKeyDoesToggle !== requiredSettings.addToggleSelectionAreaModifierKeyDoesToggle) {
                        this._addToggleSelectionAreaModifierKeyDoesToggle = requiredSettings.addToggleSelectionAreaModifierKeyDoesToggle;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.addToggleSelectionAreaModifierKeyDoesToggle);
                    }
                    break;
                case 'backgroundColor':
                    if (this._backgroundColor !== requiredSettings.backgroundColor) {
                        this._backgroundColor = requiredSettings.backgroundColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.backgroundColor);
                    }
                    break;
                case 'color':
                    if (this._color !== requiredSettings.color) {
                        this._color = requiredSettings.color;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.color);
                    }
                    break;
                case 'defaultColumnAutoSizing':
                    if (this._defaultColumnAutoSizing !== requiredSettings.defaultColumnAutoSizing) {
                        this._defaultColumnAutoSizing = requiredSettings.defaultColumnAutoSizing;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.defaultColumnAutoSizing);
                    }
                    break;
                case 'columnAutoSizingMax':
                    if (this._columnAutoSizingMax !== requiredSettings.columnAutoSizingMax) {
                        this._columnAutoSizingMax = requiredSettings.columnAutoSizingMax;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnAutoSizingMax);
                    }
                    break;
                case 'columnClip':
                    if (this._columnClip !== requiredSettings.columnClip) {
                        this._columnClip = requiredSettings.columnClip;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnClip);
                    }
                    break;
                case 'columnMoveDragPossibleCursorName':
                    if (this._columnMoveDragPossibleCursorName !== requiredSettings.columnMoveDragPossibleCursorName) {
                        this._columnMoveDragPossibleCursorName = requiredSettings.columnMoveDragPossibleCursorName;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnMoveDragPossibleCursorName);
                    }
                    break;
                case 'columnMoveDragPossibleTitleText':
                    if (this._columnMoveDragPossibleTitleText !== requiredSettings.columnMoveDragPossibleTitleText) {
                        this._columnMoveDragPossibleTitleText = requiredSettings.columnMoveDragPossibleTitleText;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnMoveDragPossibleTitleText);
                    }
                    break;
                case 'columnMoveDragActiveCursorName':
                    if (this._columnMoveDragActiveCursorName !== requiredSettings.columnMoveDragActiveCursorName) {
                        this._columnMoveDragActiveCursorName = requiredSettings.columnMoveDragActiveCursorName;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnMoveDragActiveCursorName);
                    }
                    break;
                case 'columnMoveDragActiveTitleText':
                    if (this._columnMoveDragActiveTitleText !== requiredSettings.columnMoveDragActiveTitleText) {
                        this._columnMoveDragActiveTitleText = requiredSettings.columnMoveDragActiveTitleText;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnMoveDragActiveTitleText);
                    }
                    break;
                case 'columnResizeDragPossibleCursorName':
                    if (this._columnResizeDragPossibleCursorName !== requiredSettings.columnResizeDragPossibleCursorName) {
                        this._columnResizeDragPossibleCursorName = requiredSettings.columnResizeDragPossibleCursorName;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnResizeDragPossibleCursorName);
                    }
                    break;
                case 'columnResizeDragPossibleTitleText':
                    if (this._columnResizeDragPossibleTitleText !== requiredSettings.columnResizeDragPossibleTitleText) {
                        this._columnResizeDragPossibleTitleText = requiredSettings.columnResizeDragPossibleTitleText;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnResizeDragPossibleTitleText);
                    }
                    break;
                case 'columnResizeDragActiveCursorName':
                    if (this._columnResizeDragActiveCursorName !== requiredSettings.columnResizeDragActiveCursorName) {
                        this._columnResizeDragActiveCursorName = requiredSettings.columnResizeDragActiveCursorName;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnResizeDragActiveCursorName);
                    }
                    break;
                case 'columnResizeDragActiveTitleText':
                    if (this._columnResizeDragActiveTitleText !== requiredSettings.columnResizeDragActiveTitleText) {
                        this._columnResizeDragActiveTitleText = requiredSettings.columnResizeDragActiveTitleText;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnResizeDragActiveTitleText);
                    }
                    break;
                case 'columnSortPossibleCursorName':
                    if (this._columnSortPossibleCursorName !== requiredSettings.columnSortPossibleCursorName) {
                        this._columnSortPossibleCursorName = requiredSettings.columnSortPossibleCursorName;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnSortPossibleCursorName);
                    }
                    break;
                case 'columnSortPossibleTitleText':
                    if (this._columnSortPossibleTitleText !== requiredSettings.columnSortPossibleTitleText) {
                        this._columnSortPossibleTitleText = requiredSettings.columnSortPossibleTitleText;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnSortPossibleTitleText);
                    }
                    break;
                case 'columnsReorderable':
                    if (this._columnsReorderable !== requiredSettings.columnsReorderable) {
                        this._columnsReorderable = requiredSettings.columnsReorderable;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnsReorderable);
                    }
                    break;
                case 'columnsReorderableHideable':
                    if (this._columnsReorderableHideable !== requiredSettings.columnsReorderableHideable) {
                        this._columnsReorderableHideable = requiredSettings.columnsReorderableHideable;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnsReorderableHideable);
                    }
                    break;
                case 'switchNewRectangleSelectionToRowOrColumn':
                    if (this._switchNewRectangleSelectionToRowOrColumn !== requiredSettings.switchNewRectangleSelectionToRowOrColumn) {
                        this._switchNewRectangleSelectionToRowOrColumn = requiredSettings.switchNewRectangleSelectionToRowOrColumn;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.switchNewRectangleSelectionToRowOrColumn);
                    }
                    break;
                case 'defaultRowHeight':
                    if (this._defaultRowHeight !== requiredSettings.defaultRowHeight) {
                        this._defaultRowHeight = requiredSettings.defaultRowHeight;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.defaultRowHeight);
                    }
                    break;
                case 'defaultColumnWidth':
                    if (this._defaultColumnWidth !== requiredSettings.defaultColumnWidth) {
                        this._defaultColumnWidth = requiredSettings.defaultColumnWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.defaultColumnWidth);
                    }
                    break;
                case 'defaultUiControllerTypeNames':
                    if (this._defaultUiControllerTypeNames !== requiredSettings.defaultUiControllerTypeNames) {
                        this._defaultUiControllerTypeNames = requiredSettings.defaultUiControllerTypeNames;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.defaultUiControllerTypeNames);
                    }
                    break;
                case 'editable':
                    if (this._editable !== requiredSettings.editable) {
                        this._editable = requiredSettings.editable;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editable);
                    }
                    break;
                case 'editKey':
                    if (this._editKey !== requiredSettings.editKey) {
                        this._editKey = requiredSettings.editKey;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editKey);
                    }
                    break;
                case 'editOnClick':
                    if (this._editOnClick !== requiredSettings.editOnClick) {
                        this._editOnClick = requiredSettings.editOnClick;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editOnClick);
                    }
                    break;
                case 'editOnDoubleClick':
                    if (this._editOnDoubleClick !== requiredSettings.editOnDoubleClick) {
                        this._editOnDoubleClick = requiredSettings.editOnDoubleClick;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editOnDoubleClick);
                    }
                    break;
                case 'editOnFocusCell':
                    if (this._editOnFocusCell !== requiredSettings.editOnFocusCell) {
                        this._editOnFocusCell = requiredSettings.editOnFocusCell;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editOnFocusCell);
                    }
                    break;
                case 'editOnKeyDown':
                    if (this._editOnKeyDown !== requiredSettings.editOnKeyDown) {
                        this._editOnKeyDown = requiredSettings.editOnKeyDown;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editOnKeyDown);
                    }
                    break;
                case 'editorClickableCursorName':
                    if (this._editorClickableCursorName !== requiredSettings.editorClickableCursorName) {
                        this._editorClickableCursorName = requiredSettings.editorClickableCursorName;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editorClickableCursorName);
                    }
                    break;
                case 'extendLastSelectionAreaModifierKey':
                    if (this._extendLastSelectionAreaModifierKey !== requiredSettings.extendLastSelectionAreaModifierKey) {
                        this._extendLastSelectionAreaModifierKey = requiredSettings.extendLastSelectionAreaModifierKey;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.extendLastSelectionAreaModifierKey);
                    }
                    break;
                case 'eventDispatchEnabled':
                    if (this._eventDispatchEnabled !== requiredSettings.eventDispatchEnabled) {
                        this._eventDispatchEnabled = requiredSettings.eventDispatchEnabled;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.eventDispatchEnabled);
                    }
                    break;
                case 'filterable':
                    if (this._filterable !== requiredSettings.filterable) {
                        this._filterable = requiredSettings.filterable;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.filterable);
                    }
                    break;
                case 'filterBackgroundColor':
                    if (this._filterBackgroundColor !== requiredSettings.filterBackgroundColor) {
                        this._filterBackgroundColor = requiredSettings.filterBackgroundColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.filterBackgroundColor);
                    }
                    break;
                case 'filterBackgroundSelectionColor':
                    if (this._filterBackgroundSelectionColor !== requiredSettings.filterBackgroundSelectionColor) {
                        this._filterBackgroundSelectionColor = requiredSettings.filterBackgroundSelectionColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.filterBackgroundSelectionColor);
                    }
                    break;
                case 'filterColor':
                    if (this._filterColor !== requiredSettings.filterColor) {
                        this._filterColor = requiredSettings.filterColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.filterColor);
                    }
                    break;
                case 'filterEditor':
                    if (this._filterEditor !== requiredSettings.filterEditor) {
                        this._filterEditor = requiredSettings.filterEditor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.filterEditor);
                    }
                    break;
                case 'filterFont':
                    if (this._filterFont !== requiredSettings.filterFont) {
                        this._filterFont = requiredSettings.filterFont;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.filterFont);
                    }
                    break;
                case 'filterForegroundSelectionColor':
                    if (this._filterForegroundSelectionColor !== requiredSettings.filterForegroundSelectionColor) {
                        this._filterForegroundSelectionColor = requiredSettings.filterForegroundSelectionColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.filterForegroundSelectionColor);
                    }
                    break;
                case 'filterCellPainter':
                    if (this._filterCellPainter !== requiredSettings.filterCellPainter) {
                        this._filterCellPainter = requiredSettings.filterCellPainter;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.filterCellPainter);
                    }
                    break;
                case 'fixedColumnCount':
                    if (this._fixedColumnCount !== requiredSettings.fixedColumnCount) {
                        this._fixedColumnCount = requiredSettings.fixedColumnCount;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.fixedColumnCount);
                    }
                    break;
                case 'horizontalFixedLineColor':
                    if (this._horizontalFixedLineColor !== requiredSettings.horizontalFixedLineColor) {
                        this._horizontalFixedLineColor = requiredSettings.horizontalFixedLineColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.horizontalFixedLineColor);
                    }
                    break;
                case 'horizontalFixedLineEdgeWidth':
                    if (this._horizontalFixedLineEdgeWidth !== requiredSettings.horizontalFixedLineEdgeWidth) {
                        this._horizontalFixedLineEdgeWidth = requiredSettings.horizontalFixedLineEdgeWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.horizontalFixedLineEdgeWidth);
                    }
                    break;
                case 'horizontalFixedLineWidth':
                    if (this._horizontalFixedLineWidth !== requiredSettings.horizontalFixedLineWidth) {
                        this._horizontalFixedLineWidth = requiredSettings.horizontalFixedLineWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.horizontalFixedLineWidth);
                    }
                    break;
                case 'verticalFixedLineColor':
                    if (this._verticalFixedLineColor !== requiredSettings.verticalFixedLineColor) {
                        this._verticalFixedLineColor = requiredSettings.verticalFixedLineColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.verticalFixedLineColor);
                    }
                    break;
                case 'verticalFixedLineEdgeWidth':
                    if (this._verticalFixedLineEdgeWidth !== requiredSettings.verticalFixedLineEdgeWidth) {
                        this._verticalFixedLineEdgeWidth = requiredSettings.verticalFixedLineEdgeWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.verticalFixedLineEdgeWidth);
                    }
                    break;
                case 'verticalFixedLineWidth':
                    if (this._verticalFixedLineWidth !== requiredSettings.verticalFixedLineWidth) {
                        this._verticalFixedLineWidth = requiredSettings.verticalFixedLineWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.verticalFixedLineWidth);
                    }
                    break;
                case 'fixedRowCount':
                    if (this._fixedRowCount !== requiredSettings.fixedRowCount) {
                        this._fixedRowCount = requiredSettings.fixedRowCount;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.fixedRowCount);
                    }
                    break;
                case 'gridRightAligned':
                    if (this._gridRightAligned !== requiredSettings.gridRightAligned) {
                        this._gridRightAligned = requiredSettings.gridRightAligned;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.gridRightAligned);
                    }
                    break;
                case 'horizontalGridLinesColor':
                    if (this._horizontalGridLinesColor !== requiredSettings.horizontalGridLinesColor) {
                        this._horizontalGridLinesColor = requiredSettings.horizontalGridLinesColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.horizontalGridLinesColor);
                    }
                    break;
                case 'horizontalGridLinesWidth':
                    if (this._horizontalGridLinesWidth !== requiredSettings.horizontalGridLinesWidth) {
                        this._horizontalGridLinesWidth = requiredSettings.horizontalGridLinesWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.horizontalGridLinesWidth);
                    }
                    break;
                case 'horizontalGridLinesVisible':
                    if (this._horizontalGridLinesVisible !== requiredSettings.horizontalGridLinesVisible) {
                        this._horizontalGridLinesVisible = requiredSettings.horizontalGridLinesVisible;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.horizontalGridLinesVisible);
                    }
                    break;
                case 'verticalGridLinesVisible':
                    if (this._verticalGridLinesVisible !== requiredSettings.verticalGridLinesVisible) {
                        this._verticalGridLinesVisible = requiredSettings.verticalGridLinesVisible;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.verticalGridLinesVisible);
                    }
                    break;
                case 'visibleVerticalGridLinesDrawnInFixedAndPreMainOnly':
                    if (this._visibleVerticalGridLinesDrawnInFixedAndPreMainOnly !== requiredSettings.visibleVerticalGridLinesDrawnInFixedAndPreMainOnly) {
                        this._visibleVerticalGridLinesDrawnInFixedAndPreMainOnly = requiredSettings.visibleVerticalGridLinesDrawnInFixedAndPreMainOnly;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.visibleVerticalGridLinesDrawnInFixedAndPreMainOnly);
                    }
                    break;
                case 'verticalGridLinesColor':
                    if (this._verticalGridLinesColor !== requiredSettings.verticalGridLinesColor) {
                        this._verticalGridLinesColor = requiredSettings.verticalGridLinesColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.verticalGridLinesColor);
                    }
                    break;
                case 'verticalGridLinesWidth':
                    if (this._verticalGridLinesWidth !== requiredSettings.verticalGridLinesWidth) {
                        this._verticalGridLinesWidth = requiredSettings.verticalGridLinesWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.verticalGridLinesWidth);
                    }
                    break;
                case 'horizontalWheelScrollingAllowed':
                    if (this._horizontalWheelScrollingAllowed !== requiredSettings.horizontalWheelScrollingAllowed) {
                        this._horizontalWheelScrollingAllowed = requiredSettings.horizontalWheelScrollingAllowed;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.horizontalWheelScrollingAllowed);
                    }
                    break;
                case 'minimumColumnWidth':
                    if (this._minimumColumnWidth !== requiredSettings.minimumColumnWidth) {
                        this._minimumColumnWidth = requiredSettings.minimumColumnWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.minimumColumnWidth);
                    }
                    break;
                case 'maximumColumnWidth':
                    if (this._maximumColumnWidth !== requiredSettings.maximumColumnWidth) {
                        this._maximumColumnWidth = requiredSettings.maximumColumnWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.maximumColumnWidth);
                    }
                    break;
                case 'visibleColumnWidthAdjust':
                    if (this._visibleColumnWidthAdjust !== requiredSettings.visibleColumnWidthAdjust) {
                        this._visibleColumnWidthAdjust = requiredSettings.visibleColumnWidthAdjust;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.visibleColumnWidthAdjust);
                    }
                    break;
                case 'mouseLastSelectionAreaExtendingDragActiveCursorName':
                    if (this._mouseLastSelectionAreaExtendingDragActiveCursorName !== requiredSettings.mouseLastSelectionAreaExtendingDragActiveCursorName) {
                        this._mouseLastSelectionAreaExtendingDragActiveCursorName = requiredSettings.mouseLastSelectionAreaExtendingDragActiveCursorName;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.mouseLastSelectionAreaExtendingDragActiveCursorName);
                    }
                    break;
                case 'mouseLastSelectionAreaExtendingDragActiveTitleText':
                    if (this._mouseLastSelectionAreaExtendingDragActiveTitleText !== requiredSettings.mouseLastSelectionAreaExtendingDragActiveTitleText) {
                        this._mouseLastSelectionAreaExtendingDragActiveTitleText = requiredSettings.mouseLastSelectionAreaExtendingDragActiveTitleText;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.mouseLastSelectionAreaExtendingDragActiveTitleText);
                    }
                    break;
                case 'mouseAddToggleExtendSelectionAreaEnabled':
                    if (this._mouseAddToggleExtendSelectionAreaEnabled !== requiredSettings.mouseAddToggleExtendSelectionAreaEnabled) {
                        this._mouseAddToggleExtendSelectionAreaEnabled = requiredSettings.mouseAddToggleExtendSelectionAreaEnabled;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.mouseAddToggleExtendSelectionAreaEnabled);
                    }
                    break;
                case 'mouseAddToggleExtendSelectionAreaDragModifierKey':
                    if (this._mouseAddToggleExtendSelectionAreaDragModifierKey !== requiredSettings.mouseAddToggleExtendSelectionAreaDragModifierKey) {
                        this._mouseAddToggleExtendSelectionAreaDragModifierKey = requiredSettings.mouseAddToggleExtendSelectionAreaDragModifierKey;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.mouseAddToggleExtendSelectionAreaDragModifierKey);
                    }
                    break;
                case 'mouseColumnSelectionEnabled':
                    if (this._mouseColumnSelectionEnabled !== requiredSettings.mouseColumnSelectionEnabled) {
                        this._mouseColumnSelectionEnabled = requiredSettings.mouseColumnSelectionEnabled;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.mouseColumnSelectionEnabled);
                    }
                    break;
                case 'mouseColumnSelectionModifierKey':
                    if (this._mouseColumnSelectionModifierKey !== requiredSettings.mouseColumnSelectionModifierKey) {
                        this._mouseColumnSelectionModifierKey = requiredSettings.mouseColumnSelectionModifierKey;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.mouseColumnSelectionModifierKey);
                    }
                    break;
                case 'mouseRowSelectionEnabled':
                    if (this._mouseRowSelectionEnabled !== requiredSettings.mouseRowSelectionEnabled) {
                        this._mouseRowSelectionEnabled = requiredSettings.mouseRowSelectionEnabled;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.mouseRowSelectionEnabled);
                    }
                    break;
                case 'mouseRowSelectionModifierKey':
                    if (this._mouseRowSelectionModifierKey !== requiredSettings.mouseRowSelectionModifierKey) {
                        this._mouseRowSelectionModifierKey = requiredSettings.mouseRowSelectionModifierKey;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.mouseRowSelectionModifierKey);
                    }
                    break;
                case 'multipleSelectionAreas':
                    if (this._multipleSelectionAreas !== requiredSettings.multipleSelectionAreas) {
                        this._multipleSelectionAreas = requiredSettings.multipleSelectionAreas;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.multipleSelectionAreas);
                    }
                    break;
                case 'primarySelectionAreaType':
                    if (this._primarySelectionAreaType !== requiredSettings.primarySelectionAreaType) {
                        this._primarySelectionAreaType = requiredSettings.primarySelectionAreaType;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.primarySelectionAreaType);
                    }
                    break;
                case 'minimumAnimateTimeInterval':
                    if (this._minimumAnimateTimeInterval !== requiredSettings.minimumAnimateTimeInterval) {
                        this._minimumAnimateTimeInterval = requiredSettings.minimumAnimateTimeInterval;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.minimumAnimateTimeInterval);
                    }
                    break;
                case 'backgroundAnimateTimeInterval':
                    if (this._backgroundAnimateTimeInterval !== requiredSettings.backgroundAnimateTimeInterval) {
                        this._backgroundAnimateTimeInterval = requiredSettings.backgroundAnimateTimeInterval;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.backgroundAnimateTimeInterval);
                    }
                    break;
                case 'resizeColumnInPlace':
                    if (this._resizeColumnInPlace !== requiredSettings.resizeColumnInPlace) {
                        this._resizeColumnInPlace = requiredSettings.resizeColumnInPlace;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.resizeColumnInPlace);
                    }
                    break;
                case 'resizedEventDebounceExtendedWhenPossible':
                    if (this._resizedEventDebounceExtendedWhenPossible !== requiredSettings.resizedEventDebounceExtendedWhenPossible) {
                        this._resizedEventDebounceExtendedWhenPossible = requiredSettings.resizedEventDebounceExtendedWhenPossible;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.resizedEventDebounceExtendedWhenPossible);
                    }
                    break;
                case 'resizedEventDebounceInterval':
                    if (this._resizedEventDebounceInterval !== requiredSettings.resizedEventDebounceInterval) {
                        this._resizedEventDebounceInterval = requiredSettings.resizedEventDebounceInterval;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.resizedEventDebounceInterval);
                    }
                    break;
                case 'rowResize':
                    if (this._rowResize !== requiredSettings.rowResize) {
                        this._rowResize = requiredSettings.rowResize;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.rowResize);
                    }
                    break;
                case 'rowStripeBackgroundColor':
                    if (this._rowStripeBackgroundColor !== requiredSettings.rowStripeBackgroundColor) {
                        this._rowStripeBackgroundColor = requiredSettings.rowStripeBackgroundColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.rowStripeBackgroundColor);
                    }
                    break;
                case 'scrollerThickness':
                    if (this._scrollerThickness !== requiredSettings.scrollerThickness) {
                        this._scrollerThickness = requiredSettings.scrollerThickness;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.scrollerThickness);
                    }
                    break;
                case 'scrollerThumbColor':
                    if (this._scrollerThumbColor !== requiredSettings.scrollerThumbColor) {
                        this._scrollerThumbColor = requiredSettings.scrollerThumbColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.scrollerThumbColor);
                    }
                    break;
                case 'scrollerThumbReducedVisibilityOpacity':
                    if (this._scrollerThumbReducedVisibilityOpacity !== requiredSettings.scrollerThumbReducedVisibilityOpacity) {
                        this._scrollerThumbReducedVisibilityOpacity = requiredSettings.scrollerThumbReducedVisibilityOpacity;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.scrollerThumbReducedVisibilityOpacity);
                    }
                    break;
                case 'scrollHorizontallySmoothly':
                    if (this._scrollHorizontallySmoothly !== requiredSettings.scrollHorizontallySmoothly) {
                        this._scrollHorizontallySmoothly = requiredSettings.scrollHorizontallySmoothly;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.scrollHorizontallySmoothly);
                    }
                    break;
                case 'scrollingEnabled':
                    if (this._scrollingEnabled !== requiredSettings.scrollingEnabled) {
                        this._scrollingEnabled = requiredSettings.scrollingEnabled;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.scrollingEnabled);
                    }
                    break;
                case 'secondarySelectionAreaTypeSpecifierModifierKey':
                    if (this._secondarySelectionAreaTypeSpecifierModifierKey !== requiredSettings.secondarySelectionAreaTypeSpecifierModifierKey) {
                        this._secondarySelectionAreaTypeSpecifierModifierKey = requiredSettings.secondarySelectionAreaTypeSpecifierModifierKey;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.secondarySelectionAreaTypeSpecifierModifierKey);
                    }
                    break;
                case 'secondarySelectionAreaType':
                    if (this._secondarySelectionAreaType !== requiredSettings.secondarySelectionAreaType) {
                        this._secondarySelectionAreaType = requiredSettings.secondarySelectionAreaType;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.secondarySelectionAreaType);
                    }
                    break;
                case 'selectionRegionOutlineColor':
                    if (this._selectionRegionOutlineColor !== requiredSettings.selectionRegionOutlineColor) {
                        this._selectionRegionOutlineColor = requiredSettings.selectionRegionOutlineColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.selectionRegionOutlineColor);
                    }
                    break;
                case 'selectionRegionOverlayColor':
                    if (this._selectionRegionOverlayColor !== requiredSettings.selectionRegionOverlayColor) {
                        this._selectionRegionOverlayColor = requiredSettings.selectionRegionOverlayColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.selectionRegionOverlayColor);
                    }
                    break;
                case 'showFilterRow':
                    if (this._showFilterRow !== requiredSettings.showFilterRow) {
                        this._showFilterRow = requiredSettings.showFilterRow;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.showFilterRow);
                    }
                    break;
                case 'sortOnDoubleClick':
                    if (this._sortOnDoubleClick !== requiredSettings.sortOnDoubleClick) {
                        this._sortOnDoubleClick = requiredSettings.sortOnDoubleClick;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.sortOnDoubleClick);
                    }
                    break;
                case 'sortOnClick':
                    if (this._sortOnClick !== requiredSettings.sortOnClick) {
                        this._sortOnClick = requiredSettings.sortOnClick;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.sortOnClick);
                    }
                    break;
                case 'showScrollerThumbOnMouseMoveModifierKey':
                    if (this._showScrollerThumbOnMouseMoveModifierKey !== requiredSettings.showScrollerThumbOnMouseMoveModifierKey) {
                        this._showScrollerThumbOnMouseMoveModifierKey = requiredSettings.showScrollerThumbOnMouseMoveModifierKey;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.showScrollerThumbOnMouseMoveModifierKey);
                    }
                    break;
                case 'useHiDPI':
                    if (this._useHiDPI !== requiredSettings.useHiDPI) {
                        this._useHiDPI = requiredSettings.useHiDPI;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.useHiDPI);
                    }
                    break;
                case 'wheelHFactor':
                    if (this._wheelHFactor !== requiredSettings.wheelHFactor) {
                        this._wheelHFactor = requiredSettings.wheelHFactor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.wheelHFactor);
                    }
                    break;
                case 'wheelVFactor':
                    if (this._wheelVFactor !== requiredSettings.wheelVFactor) {
                        this._wheelVFactor = requiredSettings.wheelVFactor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.wheelVFactor);
                    }
                    break;

                default: {
                    gridSettingsKey satisfies never;
                }
            }
        }

        return this.endChange();
    }

    clone() {
        const copy = new InMemoryBehavioredGridSettings();
        copy.merge(this);
        return copy;
    }
}
