import { isArrayEqual } from '@xilytix/sysutils';
import {
    RevBehavioredGridSettings,
    RevGridSettings,
    RevHorizontalWheelScrollingAllowed,
    RevModifierKeyEnum,
    RevOnlyGridSettings,
    RevRowOrColumnSelectionAreaType,
    RevSelectionAreaType,
    revGridSettingChangeInvalidateTypeIds
} from '../../client/internal-api';
import { RevInMemoryBehavioredSettings } from './in-memory-behaviored-settings';

/** @public */
export class RevInMemoryBehavioredGridSettings extends RevInMemoryBehavioredSettings implements RevBehavioredGridSettings {
    private _addToggleSelectionAreaModifierKey: RevModifierKeyEnum;
    private _addToggleSelectionAreaModifierKeyDoesToggle: boolean;
    private _backgroundColor: RevGridSettings.Color;
    private _color: RevGridSettings.Color;
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
    private _switchNewRectangleSelectionToRowOrColumn: RevRowOrColumnSelectionAreaType | undefined;
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
    private _extendLastSelectionAreaModifierKey: RevModifierKeyEnum;
    private _eventDispatchEnabled: boolean;
    private _filterable: boolean;
    private _filterBackgroundColor: RevGridSettings.Color;
    private _filterBackgroundSelectionColor: RevGridSettings.Color;
    private _filterColor: RevGridSettings.Color;
    private _filterEditor: string;
    private _filterFont: string;
    private _filterForegroundSelectionColor: RevGridSettings.Color;
    private _filterCellPainter: string;
    private _fixedColumnCount: number;
    private _horizontalFixedLineColor: RevGridSettings.Color;
    private _horizontalFixedLineEdgeWidth: number | undefined;
    private _horizontalFixedLineWidth: number | undefined;
    private _verticalFixedLineColor: RevGridSettings.Color;
    private _verticalFixedLineEdgeWidth: number | undefined;
    private _verticalFixedLineWidth: number | undefined;
    private _fixedRowCount: number;
    private _gridRightAligned: boolean;
    private _horizontalGridLinesColor: RevGridSettings.Color;
    private _horizontalGridLinesWidth: number;
    private _horizontalGridLinesVisible: boolean;
    private _verticalGridLinesVisible: boolean;
    private _visibleVerticalGridLinesDrawnInFixedAndPreMainOnly: boolean;
    private _verticalGridLinesColor: RevGridSettings.Color;
    private _verticalGridLinesWidth: number;
    private _horizontalWheelScrollingAllowed: RevHorizontalWheelScrollingAllowed;
    private _minimumColumnWidth: number;
    private _maximumColumnWidth: number | undefined;
    private _visibleColumnWidthAdjust: boolean;
    private _mouseLastSelectionAreaExtendingDragActiveCursorName: string | undefined;
    private _mouseLastSelectionAreaExtendingDragActiveTitleText: string | undefined;
    private _mouseAddToggleExtendSelectionAreaEnabled: boolean;
    private _mouseAddToggleExtendSelectionAreaDragModifierKey: RevModifierKeyEnum | undefined;
    private _mouseColumnSelectionEnabled: boolean;
    private _mouseColumnSelectionModifierKey: RevModifierKeyEnum | undefined;
    private _mouseRowSelectionEnabled: boolean;
    private _mouseRowSelectionModifierKey: RevModifierKeyEnum | undefined;
    private _multipleSelectionAreas: boolean;
    private _primarySelectionAreaType: RevSelectionAreaType;
    private _minimumAnimateTimeInterval: number;
    private _backgroundAnimateTimeInterval: number | undefined;
    private _resizeColumnInPlace: boolean;
    private _resizedEventDebounceExtendedWhenPossible: boolean;
    private _resizedEventDebounceInterval: number;
    private _rowResize: boolean;
    private _rowStripeBackgroundColor: RevOnlyGridSettings.Color | undefined;
    private _scrollHorizontallySmoothly: boolean;
    private _scrollerThickness: string;
    private _scrollerThumbColor: string;
    private _scrollerThumbReducedVisibilityOpacity: number;
    private _scrollingEnabled: boolean;
    private _secondarySelectionAreaTypeSpecifierModifierKey: RevModifierKeyEnum | undefined;
    private _secondarySelectionAreaType: RevSelectionAreaType;
    private _selectionRegionOutlineColor: RevGridSettings.Color | undefined;
    private _selectionRegionOverlayColor: RevGridSettings.Color | undefined;
    private _showFilterRow: boolean;
    private _showScrollerThumbOnMouseMoveModifierKey: RevModifierKeyEnum | undefined;
    private _sortOnDoubleClick: boolean;
    private _sortOnClick: boolean;
    private _useHiDPI: boolean;
    private _wheelHFactor: number;
    private _wheelVFactor: number;

    get addToggleSelectionAreaModifierKey() { return this._addToggleSelectionAreaModifierKey; }
    set addToggleSelectionAreaModifierKey(value: RevModifierKeyEnum) {
        if (value !== this._addToggleSelectionAreaModifierKey) {
            this.beginChange();
            this._addToggleSelectionAreaModifierKey = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.addToggleSelectionAreaModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get addToggleSelectionAreaModifierKeyDoesToggle() { return this._addToggleSelectionAreaModifierKeyDoesToggle; }
    set addToggleSelectionAreaModifierKeyDoesToggle(value: boolean) {
        if (value !== this._addToggleSelectionAreaModifierKeyDoesToggle) {
            this.beginChange();
            this._addToggleSelectionAreaModifierKeyDoesToggle = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.addToggleSelectionAreaModifierKeyDoesToggle;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get backgroundColor() { return this._backgroundColor; }
    set backgroundColor(value: RevGridSettings.Color) {
        if (value !== this._backgroundColor) {
            this.beginChange();
            this._backgroundColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.backgroundColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get color() { return this._color; }
    set color(value: RevGridSettings.Color) {
        if (value !== this._color) {
            this.beginChange();
            this._color = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.color;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultColumnAutoSizing() { return this._defaultColumnAutoSizing; }
    set defaultColumnAutoSizing(value: boolean) {
        if (value !== this._defaultColumnAutoSizing) {
            this.beginChange();
            this._defaultColumnAutoSizing = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.defaultColumnAutoSizing;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnAutoSizingMax() { return this._columnAutoSizingMax; }
    set columnAutoSizingMax(value: number | undefined) {
        if (value !== this._columnAutoSizingMax) {
            this.beginChange();
            this._columnAutoSizingMax = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnAutoSizingMax;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnClip() { return this._columnClip; }
    set columnClip(value: boolean | undefined) {
        if (value !== this._columnClip) {
            this.beginChange();
            this._columnClip = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnClip;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragPossibleCursorName() { return this._columnMoveDragPossibleCursorName; }
    set columnMoveDragPossibleCursorName(value: string | undefined) {
        if (value !== this._columnMoveDragPossibleCursorName) {
            this.beginChange();
            this._columnMoveDragPossibleCursorName = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnMoveDragPossibleCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragPossibleTitleText() { return this._columnMoveDragPossibleTitleText; }
    set columnMoveDragPossibleTitleText(value: string | undefined) {
        if (value !== this._columnMoveDragPossibleTitleText) {
            this.beginChange();
            this._columnMoveDragPossibleTitleText = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnMoveDragPossibleTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragActiveCursorName() { return this._columnMoveDragActiveCursorName; }
    set columnMoveDragActiveCursorName(value: string | undefined) {
        if (value !== this._columnMoveDragActiveCursorName) {
            this.beginChange();
            this._columnMoveDragActiveCursorName = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnMoveDragActiveCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnMoveDragActiveTitleText() { return this._columnMoveDragActiveTitleText; }
    set columnMoveDragActiveTitleText(value: string | undefined) {
        if (value !== this._columnMoveDragActiveTitleText) {
            this.beginChange();
            this._columnMoveDragActiveTitleText = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnMoveDragActiveTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragPossibleCursorName() { return this._columnResizeDragPossibleCursorName; }
    set columnResizeDragPossibleCursorName(value: string | undefined) {
        if (value !== this._columnResizeDragPossibleCursorName) {
            this.beginChange();
            this._columnResizeDragPossibleCursorName = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnResizeDragPossibleCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragPossibleTitleText() { return this._columnResizeDragPossibleTitleText; }
    set columnResizeDragPossibleTitleText(value: string | undefined) {
        if (value !== this._columnResizeDragPossibleTitleText) {
            this.beginChange();
            this._columnResizeDragPossibleTitleText = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnResizeDragPossibleTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragActiveCursorName() { return this._columnResizeDragActiveCursorName; }
    set columnResizeDragActiveCursorName(value: string | undefined) {
        if (value !== this._columnResizeDragActiveCursorName) {
            this.beginChange();
            this._columnResizeDragActiveCursorName = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnResizeDragActiveCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnResizeDragActiveTitleText() { return this._columnResizeDragActiveTitleText; }
    set columnResizeDragActiveTitleText(value: string | undefined) {
        if (value !== this._columnResizeDragActiveTitleText) {
            this.beginChange();
            this._columnResizeDragActiveTitleText = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnResizeDragActiveTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnSortPossibleCursorName() { return this._columnSortPossibleCursorName; }
    set columnSortPossibleCursorName(value: string | undefined) {
        if (value !== this._columnSortPossibleCursorName) {
            this.beginChange();
            this._columnSortPossibleCursorName = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnSortPossibleCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnSortPossibleTitleText() { return this._columnSortPossibleTitleText; }
    set columnSortPossibleTitleText(value: string | undefined) {
        if (value !== this._columnSortPossibleTitleText) {
            this.beginChange();
            this._columnSortPossibleTitleText = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnSortPossibleTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnsReorderable() { return this._columnsReorderable; }
    set columnsReorderable(value: boolean) {
        if (value !== this._columnsReorderable) {
            this.beginChange();
            this._columnsReorderable = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnsReorderable;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get columnsReorderableHideable() { return this._columnsReorderableHideable; }
    set columnsReorderableHideable(value: boolean) {
        if (value !== this._columnsReorderableHideable) {
            this.beginChange();
            this._columnsReorderableHideable = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnsReorderableHideable;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get switchNewRectangleSelectionToRowOrColumn() { return this._switchNewRectangleSelectionToRowOrColumn; }
    set switchNewRectangleSelectionToRowOrColumn(value: RevRowOrColumnSelectionAreaType | undefined) {
        if (value !== this._switchNewRectangleSelectionToRowOrColumn) {
            this.beginChange();
            this._switchNewRectangleSelectionToRowOrColumn = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.switchNewRectangleSelectionToRowOrColumn;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultRowHeight() { return this._defaultRowHeight; }
    set defaultRowHeight(value: number) {
        if (value !== this._defaultRowHeight) {
            this.beginChange();
            this._defaultRowHeight = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.defaultRowHeight;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultColumnWidth() { return this._defaultColumnWidth; }
    set defaultColumnWidth(value: number) {
        if (value !== this._defaultColumnWidth) {
            this.beginChange();
            this._defaultColumnWidth = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.defaultColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get defaultUiControllerTypeNames() { return this._defaultUiControllerTypeNames; }
    set defaultUiControllerTypeNames(value: string[]) {
        if (!isArrayEqual(value, this._defaultUiControllerTypeNames)) {
            this.beginChange();
            this._defaultUiControllerTypeNames = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.defaultUiControllerTypeNames;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editable() { return this._editable; }
    set editable(value: boolean) {
        if (value !== this._editable) {
            this.beginChange();
            this._editable = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editable;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editKey() { return this._editKey; }
    set editKey(value: string) {
        if (value !== this._editKey) {
            this.beginChange();
            this._editKey = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnClick() { return this._editOnClick; }
    set editOnClick(value: boolean) {
        if (value !== this._editOnClick) {
            this.beginChange();
            this._editOnClick = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editOnClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnDoubleClick() { return this._editOnDoubleClick; }
    set editOnDoubleClick(value: boolean) {
        if (value !== this._editOnDoubleClick) {
            this.beginChange();
            this._editOnDoubleClick = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editOnDoubleClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnFocusCell() { return this._editOnFocusCell; }
    set editOnFocusCell(value: boolean) {
        if (value !== this._editOnFocusCell) {
            this.beginChange();
            this._editOnFocusCell = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editOnFocusCell;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editOnKeyDown() { return this._editOnKeyDown; }
    set editOnKeyDown(value: boolean) {
        if (value !== this._editOnKeyDown) {
            this.beginChange();
            this._editOnKeyDown = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editOnKeyDown;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get editorClickableCursorName() { return this._editorClickableCursorName; }
    set editorClickableCursorName(value: string | undefined) {
        if (value !== this._editorClickableCursorName) {
            this.beginChange();
            this._editorClickableCursorName = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editorClickableCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get extendLastSelectionAreaModifierKey() { return this._extendLastSelectionAreaModifierKey; }
    set extendLastSelectionAreaModifierKey(value: RevModifierKeyEnum) {
        if (value !== this._extendLastSelectionAreaModifierKey) {
            this.beginChange();
            this._extendLastSelectionAreaModifierKey = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.extendLastSelectionAreaModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get eventDispatchEnabled() { return this._eventDispatchEnabled; }
    set eventDispatchEnabled(value: boolean) {
        if (value !== this._eventDispatchEnabled) {
            this.beginChange();
            this._eventDispatchEnabled = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.eventDispatchEnabled;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterable() { return this._filterable; }
    set filterable(value: boolean) {
        if (value !== this._filterable) {
            this.beginChange();
            this._filterable = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.filterable;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterBackgroundColor() { return this._filterBackgroundColor; }
    set filterBackgroundColor(value: RevGridSettings.Color) {
        if (value !== this._filterBackgroundColor) {
            this.beginChange();
            this._filterBackgroundColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.filterBackgroundColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterBackgroundSelectionColor() { return this._filterBackgroundSelectionColor; }
    set filterBackgroundSelectionColor(value: RevGridSettings.Color) {
        if (value !== this._filterBackgroundSelectionColor) {
            this.beginChange();
            this._filterBackgroundSelectionColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.filterBackgroundSelectionColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterColor() { return this._filterColor; }
    set filterColor(value: RevGridSettings.Color) {
        if (value !== this._filterColor) {
            this.beginChange();
            this._filterColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.filterColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterEditor() { return this._filterEditor; }
    set filterEditor(value: string) {
        if (value !== this._filterEditor) {
            this.beginChange();
            this._filterEditor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.filterEditor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterFont() { return this._filterFont; }
    set filterFont(value: string) {
        if (value !== this._filterFont) {
            this.beginChange();
            this._filterFont = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.filterFont;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterForegroundSelectionColor() { return this._filterForegroundSelectionColor; }
    set filterForegroundSelectionColor(value: RevGridSettings.Color) {
        if (value !== this._filterForegroundSelectionColor) {
            this.beginChange();
            this._filterForegroundSelectionColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.filterForegroundSelectionColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get filterCellPainter() { return this._filterCellPainter; }
    set filterCellPainter(value: string) {
        if (value !== this._filterCellPainter) {
            this.beginChange();
            this._filterCellPainter = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.filterCellPainter;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get fixedColumnCount() { return this._fixedColumnCount; }
    set fixedColumnCount(value: number) {
        if (value !== this._fixedColumnCount) {
            this.beginChange();
            this._fixedColumnCount = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.fixedColumnCount;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalFixedLineColor() { return this._horizontalFixedLineColor; }
    set horizontalFixedLineColor(value: RevGridSettings.Color) {
        if (value !== this._horizontalFixedLineColor) {
            this.beginChange();
            this._horizontalFixedLineColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.horizontalFixedLineColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalFixedLineEdgeWidth() { return this._horizontalFixedLineEdgeWidth; }
    set horizontalFixedLineEdgeWidth(value: number | undefined) {
        if (value !== this._horizontalFixedLineEdgeWidth) {
            this.beginChange();
            this._horizontalFixedLineEdgeWidth = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.horizontalFixedLineEdgeWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalFixedLineWidth() { return this._horizontalFixedLineWidth; }
    set horizontalFixedLineWidth(value: number | undefined) {
        if (value !== this._horizontalFixedLineWidth) {
            this.beginChange();
            this._horizontalFixedLineWidth = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.horizontalFixedLineWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalFixedLineColor() { return this._verticalFixedLineColor; }
    set verticalFixedLineColor(value: RevGridSettings.Color) {
        if (value !== this._verticalFixedLineColor) {
            this.beginChange();
            this._verticalFixedLineColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.verticalFixedLineColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalFixedLineEdgeWidth() { return this._verticalFixedLineEdgeWidth; }
    set verticalFixedLineEdgeWidth(value: number | undefined) {
        if (value !== this._verticalFixedLineEdgeWidth) {
            this.beginChange();
            this._verticalFixedLineEdgeWidth = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.verticalFixedLineEdgeWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalFixedLineWidth() { return this._verticalFixedLineWidth; }
    set verticalFixedLineWidth(value: number | undefined) {
        if (value !== this._verticalFixedLineWidth) {
            this.beginChange();
            this._verticalFixedLineWidth = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.verticalFixedLineWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get fixedRowCount() { return this._fixedRowCount; }
    set fixedRowCount(value: number) {
        if (value !== this._fixedRowCount) {
            this.beginChange();
            this._fixedRowCount = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.fixedRowCount;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get gridRightAligned() { return this._gridRightAligned; }
    set gridRightAligned(value: boolean) {
        if (value !== this._gridRightAligned) {
            this.beginChange();
            this._gridRightAligned = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.gridRightAligned;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalGridLinesColor() { return this._horizontalGridLinesColor; }
    set horizontalGridLinesColor(value: RevGridSettings.Color) {
        if (value !== this._horizontalGridLinesColor) {
            this.beginChange();
            this._horizontalGridLinesColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.horizontalGridLinesColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalGridLinesWidth() { return this._horizontalGridLinesWidth; }
    set horizontalGridLinesWidth(value: number) {
        if (value !== this._horizontalGridLinesWidth) {
            this.beginChange();
            this._horizontalGridLinesWidth = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.horizontalGridLinesWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalGridLinesVisible() { return this._horizontalGridLinesVisible; }
    set horizontalGridLinesVisible(value: boolean) {
        if (value !== this._horizontalGridLinesVisible) {
            this.beginChange();
            this._horizontalGridLinesVisible = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.horizontalGridLinesVisible;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalGridLinesVisible() { return this._verticalGridLinesVisible; }
    set verticalGridLinesVisible(value: boolean) {
        if (value !== this._verticalGridLinesVisible) {
            this.beginChange();
            this._verticalGridLinesVisible = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.verticalGridLinesVisible;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get visibleVerticalGridLinesDrawnInFixedAndPreMainOnly() { return this._visibleVerticalGridLinesDrawnInFixedAndPreMainOnly; }
    set visibleVerticalGridLinesDrawnInFixedAndPreMainOnly(value: boolean) {
        if (value !== this._visibleVerticalGridLinesDrawnInFixedAndPreMainOnly) {
            this.beginChange();
            this._visibleVerticalGridLinesDrawnInFixedAndPreMainOnly = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.visibleVerticalGridLinesDrawnInFixedAndPreMainOnly;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalGridLinesColor() { return this._verticalGridLinesColor; }
    set verticalGridLinesColor(value: RevGridSettings.Color) {
        if (value !== this._verticalGridLinesColor) {
            this.beginChange();
            this._verticalGridLinesColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.verticalGridLinesColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get verticalGridLinesWidth() { return this._verticalGridLinesWidth; }
    set verticalGridLinesWidth(value: number) {
        if (value !== this._verticalGridLinesWidth) {
            this.beginChange();
            this._verticalGridLinesWidth = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.verticalGridLinesWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get horizontalWheelScrollingAllowed() { return this._horizontalWheelScrollingAllowed; }
    set horizontalWheelScrollingAllowed(value: RevHorizontalWheelScrollingAllowed) {
        if (value !== this._horizontalWheelScrollingAllowed) {
            this.beginChange();
            this._horizontalWheelScrollingAllowed = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.horizontalWheelScrollingAllowed;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get minimumColumnWidth() { return this._minimumColumnWidth; }
    set minimumColumnWidth(value: number) {
        if (value !== this._minimumColumnWidth) {
            this.beginChange();
            this._minimumColumnWidth = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.minimumColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get maximumColumnWidth() { return this._maximumColumnWidth; }
    set maximumColumnWidth(value: number | undefined) {
        if (value !== this._maximumColumnWidth) {
            this.beginChange();
            this._maximumColumnWidth = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.maximumColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get visibleColumnWidthAdjust() { return this._visibleColumnWidthAdjust; }
    set visibleColumnWidthAdjust(value: boolean) {
        if (value !== this._visibleColumnWidthAdjust) {
            this.beginChange();
            this._visibleColumnWidthAdjust = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.visibleColumnWidthAdjust;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseColumnSelectionEnabled() { return this._mouseColumnSelectionEnabled; }
    set mouseColumnSelectionEnabled(value: boolean) {
        if (value !== this._mouseColumnSelectionEnabled) {
            this.beginChange();
            this._mouseColumnSelectionEnabled = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.mouseColumnSelectionEnabled;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseColumnSelectionModifierKey() { return this._mouseColumnSelectionModifierKey; }
    set mouseColumnSelectionModifierKey(value: RevModifierKeyEnum | undefined) {
        if (value !== this._mouseColumnSelectionModifierKey) {
            this.beginChange();
            this._mouseColumnSelectionModifierKey = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.mouseColumnSelectionModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseLastSelectionAreaExtendingDragActiveCursorName() { return this._mouseLastSelectionAreaExtendingDragActiveCursorName; }
    set mouseLastSelectionAreaExtendingDragActiveCursorName(value: string | undefined) {
        if (value !== this._mouseLastSelectionAreaExtendingDragActiveCursorName) {
            this.beginChange();
            this._mouseLastSelectionAreaExtendingDragActiveCursorName = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.mouseLastSelectionAreaExtendingDragActiveCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseLastSelectionAreaExtendingDragActiveTitleText() { return this._mouseLastSelectionAreaExtendingDragActiveTitleText; }
    set mouseLastSelectionAreaExtendingDragActiveTitleText(value: string | undefined) {
        if (value !== this._mouseLastSelectionAreaExtendingDragActiveTitleText) {
            this.beginChange();
            this._mouseLastSelectionAreaExtendingDragActiveTitleText = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.mouseLastSelectionAreaExtendingDragActiveTitleText;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseAddToggleExtendSelectionAreaEnabled() { return this._mouseAddToggleExtendSelectionAreaEnabled; }
    set mouseAddToggleExtendSelectionAreaEnabled(value: boolean) {
        if (value !== this._mouseAddToggleExtendSelectionAreaEnabled) {
            this.beginChange();
            this._mouseAddToggleExtendSelectionAreaEnabled = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.mouseAddToggleExtendSelectionAreaEnabled;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseAddToggleExtendSelectionAreaDragModifierKey() { return this._mouseAddToggleExtendSelectionAreaDragModifierKey; }
    set mouseAddToggleExtendSelectionAreaDragModifierKey(value: RevModifierKeyEnum | undefined) {
        if (value !== this._mouseAddToggleExtendSelectionAreaDragModifierKey) {
            this.beginChange();
            this._mouseAddToggleExtendSelectionAreaDragModifierKey = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.mouseAddToggleExtendSelectionAreaDragModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseRowSelectionEnabled() { return this._mouseRowSelectionEnabled; }
    set mouseRowSelectionEnabled(value: boolean) {
        if (value !== this._mouseRowSelectionEnabled) {
            this.beginChange();
            this._mouseRowSelectionEnabled = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.mouseRowSelectionEnabled;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get mouseRowSelectionModifierKey() { return this._mouseRowSelectionModifierKey; }
    set mouseRowSelectionModifierKey(value: RevModifierKeyEnum | undefined) {
        if (value !== this._mouseRowSelectionModifierKey) {
            this.beginChange();
            this._mouseRowSelectionModifierKey = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.mouseRowSelectionModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get multipleSelectionAreas() { return this._multipleSelectionAreas; }
    set multipleSelectionAreas(value: boolean) {
        if (value !== this._multipleSelectionAreas) {
            this.beginChange();
            this._multipleSelectionAreas = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.multipleSelectionAreas;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get primarySelectionAreaType() { return this._primarySelectionAreaType; }
    set primarySelectionAreaType(value: RevSelectionAreaType) {
        if (value !== this._primarySelectionAreaType) {
            this.beginChange();
            this._primarySelectionAreaType = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.primarySelectionAreaType;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get minimumAnimateTimeInterval() { return this._minimumAnimateTimeInterval; }
    set minimumAnimateTimeInterval(value: number) {
        if (value !== this._minimumAnimateTimeInterval) {
            this.beginChange();
            this._minimumAnimateTimeInterval = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.minimumAnimateTimeInterval;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get backgroundAnimateTimeInterval() { return this._backgroundAnimateTimeInterval; }
    set backgroundAnimateTimeInterval(value: number | undefined) {
        if (value !== this._backgroundAnimateTimeInterval) {
            this.beginChange();
            this._backgroundAnimateTimeInterval = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.backgroundAnimateTimeInterval;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get resizeColumnInPlace() { return this._resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) {
        if (value !== this._resizeColumnInPlace) {
            this.beginChange();
            this._resizeColumnInPlace = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.resizeColumnInPlace;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get resizedEventDebounceExtendedWhenPossible() { return this._resizedEventDebounceExtendedWhenPossible; }
    set resizedEventDebounceExtendedWhenPossible(value: boolean) {
        if (value !== this._resizedEventDebounceExtendedWhenPossible) {
            this.beginChange();
            this._resizedEventDebounceExtendedWhenPossible = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.resizedEventDebounceExtendedWhenPossible;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get resizedEventDebounceInterval() { return this._resizedEventDebounceInterval; }
    set resizedEventDebounceInterval(value: number) {
        if (value !== this._resizedEventDebounceInterval) {
            this.beginChange();
            this._resizedEventDebounceInterval = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.resizedEventDebounceInterval;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get rowResize() { return this._rowResize; }
    set rowResize(value: boolean) {
        if (value !== this._rowResize) {
            this.beginChange();
            this._rowResize = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.rowResize;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get rowStripeBackgroundColor() { return this._rowStripeBackgroundColor; }
    set rowStripeBackgroundColor(value: RevOnlyGridSettings.Color | undefined) {
        if (value !== this._rowStripeBackgroundColor) {
            this.beginChange();
            this._rowStripeBackgroundColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.rowStripeBackgroundColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollHorizontallySmoothly() { return this._scrollHorizontallySmoothly; }
    set scrollHorizontallySmoothly(value: boolean) {
        if (value !== this._scrollHorizontallySmoothly) {
            this.beginChange();
            this._scrollHorizontallySmoothly = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.scrollHorizontallySmoothly;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollerThickness() { return this._scrollerThickness; }
    set scrollerThickness(value: string) {
        if (value !== this._scrollerThickness) {
            this.beginChange();
            this._scrollerThickness = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.scrollerThickness;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollerThumbColor() { return this._scrollerThumbColor; }
    set scrollerThumbColor(value: string) {
        if (value !== this._scrollerThumbColor) {
            this.beginChange();
            this._scrollerThumbColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.scrollerThumbColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollerThumbReducedVisibilityOpacity() { return this._scrollerThumbReducedVisibilityOpacity; }
    set scrollerThumbReducedVisibilityOpacity(value: number) {
        if (value !== this._scrollerThumbReducedVisibilityOpacity) {
            this.beginChange();
            this._scrollerThumbReducedVisibilityOpacity = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.scrollerThumbReducedVisibilityOpacity;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get scrollingEnabled() { return this._scrollingEnabled; }
    set scrollingEnabled(value: boolean) {
        if (value !== this._scrollingEnabled) {
            this.beginChange();
            this._scrollingEnabled = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.scrollingEnabled;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get secondarySelectionAreaTypeSpecifierModifierKey() { return this._secondarySelectionAreaTypeSpecifierModifierKey; }
    set secondarySelectionAreaTypeSpecifierModifierKey(value: RevModifierKeyEnum | undefined) {
        if (value !== this._secondarySelectionAreaTypeSpecifierModifierKey) {
            this.beginChange();
            this._secondarySelectionAreaTypeSpecifierModifierKey = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.secondarySelectionAreaTypeSpecifierModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get secondarySelectionAreaType() { return this._secondarySelectionAreaType; }
    set secondarySelectionAreaType(value: RevSelectionAreaType) {
        if (value !== this._secondarySelectionAreaType) {
            this.beginChange();
            this._secondarySelectionAreaType = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.secondarySelectionAreaType;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get selectionRegionOutlineColor() { return this._selectionRegionOutlineColor; }
    set selectionRegionOutlineColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._selectionRegionOutlineColor) {
            this.beginChange();
            this._selectionRegionOutlineColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.selectionRegionOutlineColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get selectionRegionOverlayColor() { return this._selectionRegionOverlayColor; }
    set selectionRegionOverlayColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._selectionRegionOverlayColor) {
            this.beginChange();
            this._selectionRegionOverlayColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.selectionRegionOverlayColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get showFilterRow() { return this._showFilterRow; }
    set showFilterRow(value: boolean) {
        if (value !== this._showFilterRow) {
            this.beginChange();
            this._showFilterRow = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.showFilterRow;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get showScrollerThumbOnMouseMoveModifierKey() { return this._showScrollerThumbOnMouseMoveModifierKey; }
    set showScrollerThumbOnMouseMoveModifierKey(value: RevModifierKeyEnum | undefined) {
        if (value !== this.showScrollerThumbOnMouseMoveModifierKey) {
            this.beginChange();
            this.showScrollerThumbOnMouseMoveModifierKey = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.showScrollerThumbOnMouseMoveModifierKey;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get sortOnDoubleClick() { return this._sortOnDoubleClick; }
    set sortOnDoubleClick(value: boolean) {
        if (value !== this._sortOnDoubleClick) {
            this.beginChange();
            this._sortOnDoubleClick = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.sortOnDoubleClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get sortOnClick() { return this._sortOnClick; }
    set sortOnClick(value: boolean) {
        if (value !== this._sortOnClick) {
            this.beginChange();
            this._sortOnClick = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.sortOnClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get useHiDPI() { return this._useHiDPI; }
    set useHiDPI(value: boolean) {
        if (value !== this._useHiDPI) {
            this.beginChange();
            this._useHiDPI = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.useHiDPI;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get wheelHFactor() { return this._wheelHFactor; }
    set wheelHFactor(value: number) {
        if (value !== this._wheelHFactor) {
            this.beginChange();
            this._wheelHFactor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.wheelHFactor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }
    get wheelVFactor() { return this._wheelVFactor; }
    set wheelVFactor(value: number) {
        if (value !== this._wheelVFactor) {
            this.beginChange();
            this._wheelVFactor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.wheelVFactor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    merge(settings: Partial<RevGridSettings>) {
        this.beginChange();

        const requiredSettings = settings as Required<RevGridSettings>; // since we only iterate over keys that exist we can assume that settings is not partial in the switch loop
        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const gridSettingsKey = key as keyof RevGridSettings;
            switch (gridSettingsKey) {
                case 'addToggleSelectionAreaModifierKey':
                    if (this._addToggleSelectionAreaModifierKey !== requiredSettings.addToggleSelectionAreaModifierKey) {
                        this._addToggleSelectionAreaModifierKey = requiredSettings.addToggleSelectionAreaModifierKey;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.addToggleSelectionAreaModifierKey);
                    }
                    break;
                case 'addToggleSelectionAreaModifierKeyDoesToggle':
                    if (this._addToggleSelectionAreaModifierKeyDoesToggle !== requiredSettings.addToggleSelectionAreaModifierKeyDoesToggle) {
                        this._addToggleSelectionAreaModifierKeyDoesToggle = requiredSettings.addToggleSelectionAreaModifierKeyDoesToggle;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.addToggleSelectionAreaModifierKeyDoesToggle);
                    }
                    break;
                case 'backgroundColor':
                    if (this._backgroundColor !== requiredSettings.backgroundColor) {
                        this._backgroundColor = requiredSettings.backgroundColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.backgroundColor);
                    }
                    break;
                case 'color':
                    if (this._color !== requiredSettings.color) {
                        this._color = requiredSettings.color;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.color);
                    }
                    break;
                case 'defaultColumnAutoSizing':
                    if (this._defaultColumnAutoSizing !== requiredSettings.defaultColumnAutoSizing) {
                        this._defaultColumnAutoSizing = requiredSettings.defaultColumnAutoSizing;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.defaultColumnAutoSizing);
                    }
                    break;
                case 'columnAutoSizingMax':
                    if (this._columnAutoSizingMax !== requiredSettings.columnAutoSizingMax) {
                        this._columnAutoSizingMax = requiredSettings.columnAutoSizingMax;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnAutoSizingMax);
                    }
                    break;
                case 'columnClip':
                    if (this._columnClip !== requiredSettings.columnClip) {
                        this._columnClip = requiredSettings.columnClip;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnClip);
                    }
                    break;
                case 'columnMoveDragPossibleCursorName':
                    if (this._columnMoveDragPossibleCursorName !== requiredSettings.columnMoveDragPossibleCursorName) {
                        this._columnMoveDragPossibleCursorName = requiredSettings.columnMoveDragPossibleCursorName;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnMoveDragPossibleCursorName);
                    }
                    break;
                case 'columnMoveDragPossibleTitleText':
                    if (this._columnMoveDragPossibleTitleText !== requiredSettings.columnMoveDragPossibleTitleText) {
                        this._columnMoveDragPossibleTitleText = requiredSettings.columnMoveDragPossibleTitleText;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnMoveDragPossibleTitleText);
                    }
                    break;
                case 'columnMoveDragActiveCursorName':
                    if (this._columnMoveDragActiveCursorName !== requiredSettings.columnMoveDragActiveCursorName) {
                        this._columnMoveDragActiveCursorName = requiredSettings.columnMoveDragActiveCursorName;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnMoveDragActiveCursorName);
                    }
                    break;
                case 'columnMoveDragActiveTitleText':
                    if (this._columnMoveDragActiveTitleText !== requiredSettings.columnMoveDragActiveTitleText) {
                        this._columnMoveDragActiveTitleText = requiredSettings.columnMoveDragActiveTitleText;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnMoveDragActiveTitleText);
                    }
                    break;
                case 'columnResizeDragPossibleCursorName':
                    if (this._columnResizeDragPossibleCursorName !== requiredSettings.columnResizeDragPossibleCursorName) {
                        this._columnResizeDragPossibleCursorName = requiredSettings.columnResizeDragPossibleCursorName;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnResizeDragPossibleCursorName);
                    }
                    break;
                case 'columnResizeDragPossibleTitleText':
                    if (this._columnResizeDragPossibleTitleText !== requiredSettings.columnResizeDragPossibleTitleText) {
                        this._columnResizeDragPossibleTitleText = requiredSettings.columnResizeDragPossibleTitleText;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnResizeDragPossibleTitleText);
                    }
                    break;
                case 'columnResizeDragActiveCursorName':
                    if (this._columnResizeDragActiveCursorName !== requiredSettings.columnResizeDragActiveCursorName) {
                        this._columnResizeDragActiveCursorName = requiredSettings.columnResizeDragActiveCursorName;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnResizeDragActiveCursorName);
                    }
                    break;
                case 'columnResizeDragActiveTitleText':
                    if (this._columnResizeDragActiveTitleText !== requiredSettings.columnResizeDragActiveTitleText) {
                        this._columnResizeDragActiveTitleText = requiredSettings.columnResizeDragActiveTitleText;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnResizeDragActiveTitleText);
                    }
                    break;
                case 'columnSortPossibleCursorName':
                    if (this._columnSortPossibleCursorName !== requiredSettings.columnSortPossibleCursorName) {
                        this._columnSortPossibleCursorName = requiredSettings.columnSortPossibleCursorName;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnSortPossibleCursorName);
                    }
                    break;
                case 'columnSortPossibleTitleText':
                    if (this._columnSortPossibleTitleText !== requiredSettings.columnSortPossibleTitleText) {
                        this._columnSortPossibleTitleText = requiredSettings.columnSortPossibleTitleText;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnSortPossibleTitleText);
                    }
                    break;
                case 'columnsReorderable':
                    if (this._columnsReorderable !== requiredSettings.columnsReorderable) {
                        this._columnsReorderable = requiredSettings.columnsReorderable;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnsReorderable);
                    }
                    break;
                case 'columnsReorderableHideable':
                    if (this._columnsReorderableHideable !== requiredSettings.columnsReorderableHideable) {
                        this._columnsReorderableHideable = requiredSettings.columnsReorderableHideable;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnsReorderableHideable);
                    }
                    break;
                case 'switchNewRectangleSelectionToRowOrColumn':
                    if (this._switchNewRectangleSelectionToRowOrColumn !== requiredSettings.switchNewRectangleSelectionToRowOrColumn) {
                        this._switchNewRectangleSelectionToRowOrColumn = requiredSettings.switchNewRectangleSelectionToRowOrColumn;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.switchNewRectangleSelectionToRowOrColumn);
                    }
                    break;
                case 'defaultRowHeight':
                    if (this._defaultRowHeight !== requiredSettings.defaultRowHeight) {
                        this._defaultRowHeight = requiredSettings.defaultRowHeight;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.defaultRowHeight);
                    }
                    break;
                case 'defaultColumnWidth':
                    if (this._defaultColumnWidth !== requiredSettings.defaultColumnWidth) {
                        this._defaultColumnWidth = requiredSettings.defaultColumnWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.defaultColumnWidth);
                    }
                    break;
                case 'defaultUiControllerTypeNames':
                    if (this._defaultUiControllerTypeNames !== requiredSettings.defaultUiControllerTypeNames) {
                        this._defaultUiControllerTypeNames = requiredSettings.defaultUiControllerTypeNames;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.defaultUiControllerTypeNames);
                    }
                    break;
                case 'editable':
                    if (this._editable !== requiredSettings.editable) {
                        this._editable = requiredSettings.editable;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editable);
                    }
                    break;
                case 'editKey':
                    if (this._editKey !== requiredSettings.editKey) {
                        this._editKey = requiredSettings.editKey;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editKey);
                    }
                    break;
                case 'editOnClick':
                    if (this._editOnClick !== requiredSettings.editOnClick) {
                        this._editOnClick = requiredSettings.editOnClick;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editOnClick);
                    }
                    break;
                case 'editOnDoubleClick':
                    if (this._editOnDoubleClick !== requiredSettings.editOnDoubleClick) {
                        this._editOnDoubleClick = requiredSettings.editOnDoubleClick;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editOnDoubleClick);
                    }
                    break;
                case 'editOnFocusCell':
                    if (this._editOnFocusCell !== requiredSettings.editOnFocusCell) {
                        this._editOnFocusCell = requiredSettings.editOnFocusCell;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editOnFocusCell);
                    }
                    break;
                case 'editOnKeyDown':
                    if (this._editOnKeyDown !== requiredSettings.editOnKeyDown) {
                        this._editOnKeyDown = requiredSettings.editOnKeyDown;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editOnKeyDown);
                    }
                    break;
                case 'editorClickableCursorName':
                    if (this._editorClickableCursorName !== requiredSettings.editorClickableCursorName) {
                        this._editorClickableCursorName = requiredSettings.editorClickableCursorName;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editorClickableCursorName);
                    }
                    break;
                case 'extendLastSelectionAreaModifierKey':
                    if (this._extendLastSelectionAreaModifierKey !== requiredSettings.extendLastSelectionAreaModifierKey) {
                        this._extendLastSelectionAreaModifierKey = requiredSettings.extendLastSelectionAreaModifierKey;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.extendLastSelectionAreaModifierKey);
                    }
                    break;
                case 'eventDispatchEnabled':
                    if (this._eventDispatchEnabled !== requiredSettings.eventDispatchEnabled) {
                        this._eventDispatchEnabled = requiredSettings.eventDispatchEnabled;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.eventDispatchEnabled);
                    }
                    break;
                case 'filterable':
                    if (this._filterable !== requiredSettings.filterable) {
                        this._filterable = requiredSettings.filterable;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.filterable);
                    }
                    break;
                case 'filterBackgroundColor':
                    if (this._filterBackgroundColor !== requiredSettings.filterBackgroundColor) {
                        this._filterBackgroundColor = requiredSettings.filterBackgroundColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.filterBackgroundColor);
                    }
                    break;
                case 'filterBackgroundSelectionColor':
                    if (this._filterBackgroundSelectionColor !== requiredSettings.filterBackgroundSelectionColor) {
                        this._filterBackgroundSelectionColor = requiredSettings.filterBackgroundSelectionColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.filterBackgroundSelectionColor);
                    }
                    break;
                case 'filterColor':
                    if (this._filterColor !== requiredSettings.filterColor) {
                        this._filterColor = requiredSettings.filterColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.filterColor);
                    }
                    break;
                case 'filterEditor':
                    if (this._filterEditor !== requiredSettings.filterEditor) {
                        this._filterEditor = requiredSettings.filterEditor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.filterEditor);
                    }
                    break;
                case 'filterFont':
                    if (this._filterFont !== requiredSettings.filterFont) {
                        this._filterFont = requiredSettings.filterFont;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.filterFont);
                    }
                    break;
                case 'filterForegroundSelectionColor':
                    if (this._filterForegroundSelectionColor !== requiredSettings.filterForegroundSelectionColor) {
                        this._filterForegroundSelectionColor = requiredSettings.filterForegroundSelectionColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.filterForegroundSelectionColor);
                    }
                    break;
                case 'filterCellPainter':
                    if (this._filterCellPainter !== requiredSettings.filterCellPainter) {
                        this._filterCellPainter = requiredSettings.filterCellPainter;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.filterCellPainter);
                    }
                    break;
                case 'fixedColumnCount':
                    if (this._fixedColumnCount !== requiredSettings.fixedColumnCount) {
                        this._fixedColumnCount = requiredSettings.fixedColumnCount;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.fixedColumnCount);
                    }
                    break;
                case 'horizontalFixedLineColor':
                    if (this._horizontalFixedLineColor !== requiredSettings.horizontalFixedLineColor) {
                        this._horizontalFixedLineColor = requiredSettings.horizontalFixedLineColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.horizontalFixedLineColor);
                    }
                    break;
                case 'horizontalFixedLineEdgeWidth':
                    if (this._horizontalFixedLineEdgeWidth !== requiredSettings.horizontalFixedLineEdgeWidth) {
                        this._horizontalFixedLineEdgeWidth = requiredSettings.horizontalFixedLineEdgeWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.horizontalFixedLineEdgeWidth);
                    }
                    break;
                case 'horizontalFixedLineWidth':
                    if (this._horizontalFixedLineWidth !== requiredSettings.horizontalFixedLineWidth) {
                        this._horizontalFixedLineWidth = requiredSettings.horizontalFixedLineWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.horizontalFixedLineWidth);
                    }
                    break;
                case 'verticalFixedLineColor':
                    if (this._verticalFixedLineColor !== requiredSettings.verticalFixedLineColor) {
                        this._verticalFixedLineColor = requiredSettings.verticalFixedLineColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.verticalFixedLineColor);
                    }
                    break;
                case 'verticalFixedLineEdgeWidth':
                    if (this._verticalFixedLineEdgeWidth !== requiredSettings.verticalFixedLineEdgeWidth) {
                        this._verticalFixedLineEdgeWidth = requiredSettings.verticalFixedLineEdgeWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.verticalFixedLineEdgeWidth);
                    }
                    break;
                case 'verticalFixedLineWidth':
                    if (this._verticalFixedLineWidth !== requiredSettings.verticalFixedLineWidth) {
                        this._verticalFixedLineWidth = requiredSettings.verticalFixedLineWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.verticalFixedLineWidth);
                    }
                    break;
                case 'fixedRowCount':
                    if (this._fixedRowCount !== requiredSettings.fixedRowCount) {
                        this._fixedRowCount = requiredSettings.fixedRowCount;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.fixedRowCount);
                    }
                    break;
                case 'gridRightAligned':
                    if (this._gridRightAligned !== requiredSettings.gridRightAligned) {
                        this._gridRightAligned = requiredSettings.gridRightAligned;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.gridRightAligned);
                    }
                    break;
                case 'horizontalGridLinesColor':
                    if (this._horizontalGridLinesColor !== requiredSettings.horizontalGridLinesColor) {
                        this._horizontalGridLinesColor = requiredSettings.horizontalGridLinesColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.horizontalGridLinesColor);
                    }
                    break;
                case 'horizontalGridLinesWidth':
                    if (this._horizontalGridLinesWidth !== requiredSettings.horizontalGridLinesWidth) {
                        this._horizontalGridLinesWidth = requiredSettings.horizontalGridLinesWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.horizontalGridLinesWidth);
                    }
                    break;
                case 'horizontalGridLinesVisible':
                    if (this._horizontalGridLinesVisible !== requiredSettings.horizontalGridLinesVisible) {
                        this._horizontalGridLinesVisible = requiredSettings.horizontalGridLinesVisible;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.horizontalGridLinesVisible);
                    }
                    break;
                case 'verticalGridLinesVisible':
                    if (this._verticalGridLinesVisible !== requiredSettings.verticalGridLinesVisible) {
                        this._verticalGridLinesVisible = requiredSettings.verticalGridLinesVisible;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.verticalGridLinesVisible);
                    }
                    break;
                case 'visibleVerticalGridLinesDrawnInFixedAndPreMainOnly':
                    if (this._visibleVerticalGridLinesDrawnInFixedAndPreMainOnly !== requiredSettings.visibleVerticalGridLinesDrawnInFixedAndPreMainOnly) {
                        this._visibleVerticalGridLinesDrawnInFixedAndPreMainOnly = requiredSettings.visibleVerticalGridLinesDrawnInFixedAndPreMainOnly;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.visibleVerticalGridLinesDrawnInFixedAndPreMainOnly);
                    }
                    break;
                case 'verticalGridLinesColor':
                    if (this._verticalGridLinesColor !== requiredSettings.verticalGridLinesColor) {
                        this._verticalGridLinesColor = requiredSettings.verticalGridLinesColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.verticalGridLinesColor);
                    }
                    break;
                case 'verticalGridLinesWidth':
                    if (this._verticalGridLinesWidth !== requiredSettings.verticalGridLinesWidth) {
                        this._verticalGridLinesWidth = requiredSettings.verticalGridLinesWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.verticalGridLinesWidth);
                    }
                    break;
                case 'horizontalWheelScrollingAllowed':
                    if (this._horizontalWheelScrollingAllowed !== requiredSettings.horizontalWheelScrollingAllowed) {
                        this._horizontalWheelScrollingAllowed = requiredSettings.horizontalWheelScrollingAllowed;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.horizontalWheelScrollingAllowed);
                    }
                    break;
                case 'minimumColumnWidth':
                    if (this._minimumColumnWidth !== requiredSettings.minimumColumnWidth) {
                        this._minimumColumnWidth = requiredSettings.minimumColumnWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.minimumColumnWidth);
                    }
                    break;
                case 'maximumColumnWidth':
                    if (this._maximumColumnWidth !== requiredSettings.maximumColumnWidth) {
                        this._maximumColumnWidth = requiredSettings.maximumColumnWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.maximumColumnWidth);
                    }
                    break;
                case 'visibleColumnWidthAdjust':
                    if (this._visibleColumnWidthAdjust !== requiredSettings.visibleColumnWidthAdjust) {
                        this._visibleColumnWidthAdjust = requiredSettings.visibleColumnWidthAdjust;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.visibleColumnWidthAdjust);
                    }
                    break;
                case 'mouseLastSelectionAreaExtendingDragActiveCursorName':
                    if (this._mouseLastSelectionAreaExtendingDragActiveCursorName !== requiredSettings.mouseLastSelectionAreaExtendingDragActiveCursorName) {
                        this._mouseLastSelectionAreaExtendingDragActiveCursorName = requiredSettings.mouseLastSelectionAreaExtendingDragActiveCursorName;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.mouseLastSelectionAreaExtendingDragActiveCursorName);
                    }
                    break;
                case 'mouseLastSelectionAreaExtendingDragActiveTitleText':
                    if (this._mouseLastSelectionAreaExtendingDragActiveTitleText !== requiredSettings.mouseLastSelectionAreaExtendingDragActiveTitleText) {
                        this._mouseLastSelectionAreaExtendingDragActiveTitleText = requiredSettings.mouseLastSelectionAreaExtendingDragActiveTitleText;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.mouseLastSelectionAreaExtendingDragActiveTitleText);
                    }
                    break;
                case 'mouseAddToggleExtendSelectionAreaEnabled':
                    if (this._mouseAddToggleExtendSelectionAreaEnabled !== requiredSettings.mouseAddToggleExtendSelectionAreaEnabled) {
                        this._mouseAddToggleExtendSelectionAreaEnabled = requiredSettings.mouseAddToggleExtendSelectionAreaEnabled;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.mouseAddToggleExtendSelectionAreaEnabled);
                    }
                    break;
                case 'mouseAddToggleExtendSelectionAreaDragModifierKey':
                    if (this._mouseAddToggleExtendSelectionAreaDragModifierKey !== requiredSettings.mouseAddToggleExtendSelectionAreaDragModifierKey) {
                        this._mouseAddToggleExtendSelectionAreaDragModifierKey = requiredSettings.mouseAddToggleExtendSelectionAreaDragModifierKey;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.mouseAddToggleExtendSelectionAreaDragModifierKey);
                    }
                    break;
                case 'mouseColumnSelectionEnabled':
                    if (this._mouseColumnSelectionEnabled !== requiredSettings.mouseColumnSelectionEnabled) {
                        this._mouseColumnSelectionEnabled = requiredSettings.mouseColumnSelectionEnabled;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.mouseColumnSelectionEnabled);
                    }
                    break;
                case 'mouseColumnSelectionModifierKey':
                    if (this._mouseColumnSelectionModifierKey !== requiredSettings.mouseColumnSelectionModifierKey) {
                        this._mouseColumnSelectionModifierKey = requiredSettings.mouseColumnSelectionModifierKey;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.mouseColumnSelectionModifierKey);
                    }
                    break;
                case 'mouseRowSelectionEnabled':
                    if (this._mouseRowSelectionEnabled !== requiredSettings.mouseRowSelectionEnabled) {
                        this._mouseRowSelectionEnabled = requiredSettings.mouseRowSelectionEnabled;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.mouseRowSelectionEnabled);
                    }
                    break;
                case 'mouseRowSelectionModifierKey':
                    if (this._mouseRowSelectionModifierKey !== requiredSettings.mouseRowSelectionModifierKey) {
                        this._mouseRowSelectionModifierKey = requiredSettings.mouseRowSelectionModifierKey;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.mouseRowSelectionModifierKey);
                    }
                    break;
                case 'multipleSelectionAreas':
                    if (this._multipleSelectionAreas !== requiredSettings.multipleSelectionAreas) {
                        this._multipleSelectionAreas = requiredSettings.multipleSelectionAreas;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.multipleSelectionAreas);
                    }
                    break;
                case 'primarySelectionAreaType':
                    if (this._primarySelectionAreaType !== requiredSettings.primarySelectionAreaType) {
                        this._primarySelectionAreaType = requiredSettings.primarySelectionAreaType;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.primarySelectionAreaType);
                    }
                    break;
                case 'minimumAnimateTimeInterval':
                    if (this._minimumAnimateTimeInterval !== requiredSettings.minimumAnimateTimeInterval) {
                        this._minimumAnimateTimeInterval = requiredSettings.minimumAnimateTimeInterval;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.minimumAnimateTimeInterval);
                    }
                    break;
                case 'backgroundAnimateTimeInterval':
                    if (this._backgroundAnimateTimeInterval !== requiredSettings.backgroundAnimateTimeInterval) {
                        this._backgroundAnimateTimeInterval = requiredSettings.backgroundAnimateTimeInterval;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.backgroundAnimateTimeInterval);
                    }
                    break;
                case 'resizeColumnInPlace':
                    if (this._resizeColumnInPlace !== requiredSettings.resizeColumnInPlace) {
                        this._resizeColumnInPlace = requiredSettings.resizeColumnInPlace;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.resizeColumnInPlace);
                    }
                    break;
                case 'resizedEventDebounceExtendedWhenPossible':
                    if (this._resizedEventDebounceExtendedWhenPossible !== requiredSettings.resizedEventDebounceExtendedWhenPossible) {
                        this._resizedEventDebounceExtendedWhenPossible = requiredSettings.resizedEventDebounceExtendedWhenPossible;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.resizedEventDebounceExtendedWhenPossible);
                    }
                    break;
                case 'resizedEventDebounceInterval':
                    if (this._resizedEventDebounceInterval !== requiredSettings.resizedEventDebounceInterval) {
                        this._resizedEventDebounceInterval = requiredSettings.resizedEventDebounceInterval;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.resizedEventDebounceInterval);
                    }
                    break;
                case 'rowResize':
                    if (this._rowResize !== requiredSettings.rowResize) {
                        this._rowResize = requiredSettings.rowResize;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.rowResize);
                    }
                    break;
                case 'rowStripeBackgroundColor':
                    if (this._rowStripeBackgroundColor !== requiredSettings.rowStripeBackgroundColor) {
                        this._rowStripeBackgroundColor = requiredSettings.rowStripeBackgroundColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.rowStripeBackgroundColor);
                    }
                    break;
                case 'scrollerThickness':
                    if (this._scrollerThickness !== requiredSettings.scrollerThickness) {
                        this._scrollerThickness = requiredSettings.scrollerThickness;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.scrollerThickness);
                    }
                    break;
                case 'scrollerThumbColor':
                    if (this._scrollerThumbColor !== requiredSettings.scrollerThumbColor) {
                        this._scrollerThumbColor = requiredSettings.scrollerThumbColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.scrollerThumbColor);
                    }
                    break;
                case 'scrollerThumbReducedVisibilityOpacity':
                    if (this._scrollerThumbReducedVisibilityOpacity !== requiredSettings.scrollerThumbReducedVisibilityOpacity) {
                        this._scrollerThumbReducedVisibilityOpacity = requiredSettings.scrollerThumbReducedVisibilityOpacity;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.scrollerThumbReducedVisibilityOpacity);
                    }
                    break;
                case 'scrollHorizontallySmoothly':
                    if (this._scrollHorizontallySmoothly !== requiredSettings.scrollHorizontallySmoothly) {
                        this._scrollHorizontallySmoothly = requiredSettings.scrollHorizontallySmoothly;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.scrollHorizontallySmoothly);
                    }
                    break;
                case 'scrollingEnabled':
                    if (this._scrollingEnabled !== requiredSettings.scrollingEnabled) {
                        this._scrollingEnabled = requiredSettings.scrollingEnabled;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.scrollingEnabled);
                    }
                    break;
                case 'secondarySelectionAreaTypeSpecifierModifierKey':
                    if (this._secondarySelectionAreaTypeSpecifierModifierKey !== requiredSettings.secondarySelectionAreaTypeSpecifierModifierKey) {
                        this._secondarySelectionAreaTypeSpecifierModifierKey = requiredSettings.secondarySelectionAreaTypeSpecifierModifierKey;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.secondarySelectionAreaTypeSpecifierModifierKey);
                    }
                    break;
                case 'secondarySelectionAreaType':
                    if (this._secondarySelectionAreaType !== requiredSettings.secondarySelectionAreaType) {
                        this._secondarySelectionAreaType = requiredSettings.secondarySelectionAreaType;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.secondarySelectionAreaType);
                    }
                    break;
                case 'selectionRegionOutlineColor':
                    if (this._selectionRegionOutlineColor !== requiredSettings.selectionRegionOutlineColor) {
                        this._selectionRegionOutlineColor = requiredSettings.selectionRegionOutlineColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.selectionRegionOutlineColor);
                    }
                    break;
                case 'selectionRegionOverlayColor':
                    if (this._selectionRegionOverlayColor !== requiredSettings.selectionRegionOverlayColor) {
                        this._selectionRegionOverlayColor = requiredSettings.selectionRegionOverlayColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.selectionRegionOverlayColor);
                    }
                    break;
                case 'showFilterRow':
                    if (this._showFilterRow !== requiredSettings.showFilterRow) {
                        this._showFilterRow = requiredSettings.showFilterRow;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.showFilterRow);
                    }
                    break;
                case 'sortOnDoubleClick':
                    if (this._sortOnDoubleClick !== requiredSettings.sortOnDoubleClick) {
                        this._sortOnDoubleClick = requiredSettings.sortOnDoubleClick;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.sortOnDoubleClick);
                    }
                    break;
                case 'sortOnClick':
                    if (this._sortOnClick !== requiredSettings.sortOnClick) {
                        this._sortOnClick = requiredSettings.sortOnClick;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.sortOnClick);
                    }
                    break;
                case 'showScrollerThumbOnMouseMoveModifierKey':
                    if (this._showScrollerThumbOnMouseMoveModifierKey !== requiredSettings.showScrollerThumbOnMouseMoveModifierKey) {
                        this._showScrollerThumbOnMouseMoveModifierKey = requiredSettings.showScrollerThumbOnMouseMoveModifierKey;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.showScrollerThumbOnMouseMoveModifierKey);
                    }
                    break;
                case 'useHiDPI':
                    if (this._useHiDPI !== requiredSettings.useHiDPI) {
                        this._useHiDPI = requiredSettings.useHiDPI;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.useHiDPI);
                    }
                    break;
                case 'wheelHFactor':
                    if (this._wheelHFactor !== requiredSettings.wheelHFactor) {
                        this._wheelHFactor = requiredSettings.wheelHFactor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.wheelHFactor);
                    }
                    break;
                case 'wheelVFactor':
                    if (this._wheelVFactor !== requiredSettings.wheelVFactor) {
                        this._wheelVFactor = requiredSettings.wheelVFactor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.wheelVFactor);
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
        const copy = new RevInMemoryBehavioredGridSettings();
        copy.merge(this);
        return copy;
    }
}
