import {
    BehavioredGridSettings,
    GridSettingChangeInvalidateType,
    GridSettings,
    GridSettingsBehavior,
    Halign,
    HorizontalWheelScrollingAllowed,
    ModifierKeyEnum,
    SelectionAreaType,
    UnreachableCaseError,
    gridSettingChangeInvalidateTypes
} from '../../grid/grid-public-api';

/** @public */
export class InMemoryDefaultBehavioredGridSettings implements BehavioredGridSettings {
    viewRenderInvalidatedEventer: GridSettingsBehavior.ViewRenderInvalidatedEventer;
    viewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;
    horizontalViewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;
    verticalViewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;
    resizeEventer: GridSettingsBehavior.ResizeEventer;

    private _addToggleSelectionAreaModifierKey: ModifierKeyEnum;
    private _addToggleSelectionAreaModifierKeyDoesToggle: boolean;
    private _backgroundColor: GridSettings.Color;
    private _borderWidth: number;
    private _borderColor: string;
    private _color: GridSettings.Color;
    private _columnAutosizing: boolean;
    private _columnAutosizingMax: number | undefined;
    private _columnClip: boolean | undefined;
    private _columnMoveDragPossibleCursorName: string | undefined;
    private _columnMoveDragActiveCursorName: string | undefined;
    private _columnResizeDragPossibleCursorName: string | undefined;
    private _columnResizeDragActiveCursorName: string | undefined;
    private _columnSortPossibleCursorName: string | undefined;
    private _columnsReorderable: boolean;
    private _columnsReorderableHideable: boolean;
    private _defaultRowHeight: number;
    private _defaultColumnWidth: number;
    private _defaultUiBehaviorTypeNames: string[];
    private _editable: boolean;
    private _editOnDoubleClick: boolean;
    private _editOnKeydown: boolean;
    private _editKey: string;
    private _editOnFocusCell: boolean;
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
    private _fixedLinesHColor: GridSettings.Color;
    private _fixedLinesHEdge: number | undefined;
    private _fixedLinesHWidth: number | undefined;
    private _fixedLinesVColor: GridSettings.Color;
    private _fixedLinesVEdge: number | undefined;
    private _fixedLinesVWidth: number | undefined;
    private _fixedRowCount: number;
    private _gridRightAligned: boolean;
    private _gridBorder: boolean | string;
    private _gridBorderBottom: boolean | string;
    private _gridBorderLeft: boolean | string;
    private _gridBorderRight: boolean | string;
    private _gridBorderTop: boolean | string;
    private _verticalGridLinesVisible: boolean;
    private _gridLinesH: boolean;
    private _gridLinesHColor: GridSettings.Color;
    private _gridLinesHWidth: number;
    private _horizontalGridLinesVisible: boolean;
    private _gridLinesV: boolean;
    private _gridLinesVColor: GridSettings.Color;
    private _gridLinesVWidth: number;
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
    private _scrollbarHoverOver: string;
    private _scrollbarHoverOff: string;
    private _scrollingEnabled: boolean;
    private _secondarySelectionAreaTypeSpecifierModifierKey: ModifierKeyEnum | undefined;
    private _secondarySelectionAreaType: SelectionAreaType;
    private _selectionExtendDragActiveCursorName: string | undefined;
    private _selectionRegionOutlineColor: GridSettings.Color;
    private _selectionRegionOverlayColor: GridSettings.Color;
    private _showFilterRow: boolean;
    private _mouseSortOnDoubleClick: boolean;
    private _mouseSortable: boolean;
    private _useHiDPI: boolean;
    private _verticalScrollbarClassPrefix: string;
    private _wheelHFactor: number;
    private _wheelVFactor: number;

    get addToggleSelectionAreaModifierKey() { return this._addToggleSelectionAreaModifierKey; }
    set addToggleSelectionAreaModifierKey(value: ModifierKeyEnum) {
        if (value !== this._addToggleSelectionAreaModifierKey) {
            this._addToggleSelectionAreaModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypes.addToggleSelectionAreaModifierKey;
            this.invalidateByType(invalidateType);
        }
    }
    get addToggleSelectionAreaModifierKeyDoesToggle() { return this._addToggleSelectionAreaModifierKeyDoesToggle; }
    set addToggleSelectionAreaModifierKeyDoesToggle(value: boolean) {
        if (value !== this._addToggleSelectionAreaModifierKeyDoesToggle) {
            this._addToggleSelectionAreaModifierKeyDoesToggle = value;
            const invalidateType = gridSettingChangeInvalidateTypes.addToggleSelectionAreaModifierKeyDoesToggle;
            this.invalidateByType(invalidateType);
        }
    }
    get backgroundColor() { return this._backgroundColor; }
    set backgroundColor(value: GridSettings.Color) {
        if (value !== this._backgroundColor) {
            this._backgroundColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.backgroundColor;
            this.invalidateByType(invalidateType);
        }
    }
    get borderWidth() { return this._borderWidth; }
    set borderWidth(value: number) {
        if (value !== this._borderWidth) {
            this._borderWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypes.borderWidth;
            this.invalidateByType(invalidateType);
        }
    }
    get borderColor() { return this._borderColor; }
    set borderColor(value: string) {
        if (value !== this._borderColor) {
            this._borderColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.borderColor;
            this.invalidateByType(invalidateType);
        }
    }
    get color() { return this._color; }
    set color(value: GridSettings.Color) {
        if (value !== this._color) {
            this._color = value;
            const invalidateType = gridSettingChangeInvalidateTypes.color;
            this.invalidateByType(invalidateType);
        }
    }
    get defaultColumnAutosizing() { return this._columnAutosizing; }
    set defaultColumnAutosizing(value: boolean) {
        if (value !== this._columnAutosizing) {
            this._columnAutosizing = value;
            const invalidateType = gridSettingChangeInvalidateTypes.defaultColumnAutosizing;
            this.invalidateByType(invalidateType);
        }
    }
    get columnAutosizingMax() { return this._columnAutosizingMax; }
    set columnAutosizingMax(value: number | undefined) {
        if (value !== this._columnAutosizingMax) {
            this._columnAutosizingMax = value;
            const invalidateType = gridSettingChangeInvalidateTypes.columnAutosizingMax;
            this.invalidateByType(invalidateType);
        }
    }
    get columnClip() { return this._columnClip; }
    set columnClip(value: boolean | undefined) {
        if (value !== this._columnClip) {
            this._columnClip = value;
            const invalidateType = gridSettingChangeInvalidateTypes.columnClip;
            this.invalidateByType(invalidateType);
        }
    }
    get columnMoveDragPossibleCursorName() { return this._columnMoveDragPossibleCursorName; }
    set columnMoveDragPossibleCursorName(value: string | undefined) {
        if (value !== this._columnMoveDragPossibleCursorName) {
            this._columnMoveDragPossibleCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypes.columnMoveDragPossibleCursorName;
            this.invalidateByType(invalidateType);
        }
    }
    get columnMoveDragActiveCursorName() { return this._columnMoveDragActiveCursorName; }
    set columnMoveDragActiveCursorName(value: string | undefined) {
        if (value !== this._columnMoveDragActiveCursorName) {
            this._columnMoveDragActiveCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypes.columnMoveDragActiveCursorName;
            this.invalidateByType(invalidateType);
        }
    }
    get columnResizeDragPossibleCursorName() { return this._columnResizeDragPossibleCursorName; }
    set columnResizeDragPossibleCursorName(value: string | undefined) {
        if (value !== this._columnResizeDragPossibleCursorName) {
            this._columnResizeDragPossibleCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypes.columnResizeDragPossibleCursorName;
            this.invalidateByType(invalidateType);
        }
    }
    get columnResizeDragActiveCursorName() { return this._columnResizeDragActiveCursorName; }
    set columnResizeDragActiveCursorName(value: string | undefined) {
        if (value !== this._columnResizeDragActiveCursorName) {
            this._columnResizeDragActiveCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypes.columnResizeDragActiveCursorName;
            this.invalidateByType(invalidateType);
        }
    }
    get columnSortPossibleCursorName() { return this._columnSortPossibleCursorName; }
    set columnSortPossibleCursorName(value: string | undefined) {
        if (value !== this._columnSortPossibleCursorName) {
            this._columnSortPossibleCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypes.columnSortPossibleCursorName;
            this.invalidateByType(invalidateType);
        }
    }
    get columnsReorderable() { return this._columnsReorderable; }
    set columnsReorderable(value: boolean) {
        if (value !== this._columnsReorderable) {
            this._columnsReorderable = value;
            const invalidateType = gridSettingChangeInvalidateTypes.columnsReorderable;
            this.invalidateByType(invalidateType);
        }
    }
    get columnsReorderableHideable() { return this._columnsReorderableHideable; }
    set columnsReorderableHideable(value: boolean) {
        if (value !== this._columnsReorderableHideable) {
            this._columnsReorderableHideable = value;
            const invalidateType = gridSettingChangeInvalidateTypes.columnsReorderableHideable;
            this.invalidateByType(invalidateType);
        }
    }
    get defaultRowHeight() { return this._defaultRowHeight; }
    set defaultRowHeight(value: number) {
        if (value !== this._defaultRowHeight) {
            this._defaultRowHeight = value;
            const invalidateType = gridSettingChangeInvalidateTypes.defaultRowHeight;
            this.invalidateByType(invalidateType);
        }
    }
    get defaultColumnWidth() { return this._defaultColumnWidth; }
    set defaultColumnWidth(value: number) {
        if (value !== this._defaultColumnWidth) {
            this._defaultColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypes.defaultColumnWidth;
            this.invalidateByType(invalidateType);
        }
    }
    get defaultUiBehaviorTypeNames() { return this._defaultUiBehaviorTypeNames; }
    set defaultUiBehaviorTypeNames(value: string[]) {
        if (value !== this._defaultUiBehaviorTypeNames) {
            this._defaultUiBehaviorTypeNames = value;
            const invalidateType = gridSettingChangeInvalidateTypes.defaultUiBehaviorTypeNames;
            this.invalidateByType(invalidateType);
        }
    }
    get editable() { return this._editable; }
    set editable(value: boolean) {
        if (value !== this._editable) {
            this._editable = value;
            const invalidateType = gridSettingChangeInvalidateTypes.editable;
            this.invalidateByType(invalidateType);
        }
    }
    get editOnDoubleClick() { return this._editOnDoubleClick; }
    set editOnDoubleClick(value: boolean) {
        if (value !== this._editOnDoubleClick) {
            this._editOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypes.editOnDoubleClick;
            this.invalidateByType(invalidateType);
        }
    }
    get editOnKeydown() { return this._editOnKeydown; }
    set editOnKeydown(value: boolean) {
        if (value !== this._editOnKeydown) {
            this._editOnKeydown = value;
            const invalidateType = gridSettingChangeInvalidateTypes.editOnKeydown;
            this.invalidateByType(invalidateType);
        }
    }
    get editKey() { return this._editKey; }
    set editKey(value: string) {
        if (value !== this._editKey) {
            this._editKey = value;
            const invalidateType = gridSettingChangeInvalidateTypes.editKey;
            this.invalidateByType(invalidateType);
        }
    }
    get editOnFocusCell() { return this._editOnFocusCell; }
    set editOnFocusCell(value: boolean) {
        if (value !== this._editOnFocusCell) {
            this._editOnFocusCell = value;
            const invalidateType = gridSettingChangeInvalidateTypes.editOnFocusCell;
            this.invalidateByType(invalidateType);
        }
    }
    get enableContinuousRepaint() { return this._enableContinuousRepaint; }
    set enableContinuousRepaint(value: boolean) {
        if (value !== this._enableContinuousRepaint) {
            this._enableContinuousRepaint = value;
            const invalidateType = gridSettingChangeInvalidateTypes.enableContinuousRepaint;
            this.invalidateByType(invalidateType);
        }
    }
    get extendLastSelectionAreaModifierKey() { return this._extendLastSelectionAreaModifierKey; }
    set extendLastSelectionAreaModifierKey(value: ModifierKeyEnum) {
        if (value !== this._extendLastSelectionAreaModifierKey) {
            this._extendLastSelectionAreaModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypes.extendLastSelectionAreaModifierKey;
            this.invalidateByType(invalidateType);
        }
    }
    get eventDispatchEnabled() { return this._eventDispatchEnabled; }
    set eventDispatchEnabled(value: boolean) {
        if (value !== this._eventDispatchEnabled) {
            this._eventDispatchEnabled = value;
            const invalidateType = gridSettingChangeInvalidateTypes.eventDispatchEnabled;
            this.invalidateByType(invalidateType);
        }
    }
    get filterable() { return this._filterable; }
    set filterable(value: boolean) {
        if (value !== this._filterable) {
            this._filterable = value;
            const invalidateType = gridSettingChangeInvalidateTypes.filterable;
            this.invalidateByType(invalidateType);
        }
    }
    get filterBackgroundColor() { return this._filterBackgroundColor; }
    set filterBackgroundColor(value: GridSettings.Color) {
        if (value !== this._filterBackgroundColor) {
            this._filterBackgroundColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.filterBackgroundColor;
            this.invalidateByType(invalidateType);
        }
    }
    get filterBackgroundSelectionColor() { return this._filterBackgroundSelectionColor; }
    set filterBackgroundSelectionColor(value: GridSettings.Color) {
        if (value !== this._filterBackgroundSelectionColor) {
            this._filterBackgroundSelectionColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.filterBackgroundSelectionColor;
            this.invalidateByType(invalidateType);
        }
    }
    get filterColor() { return this._filterColor; }
    set filterColor(value: GridSettings.Color) {
        if (value !== this._filterColor) {
            this._filterColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.filterColor;
            this.invalidateByType(invalidateType);
        }
    }
    get filterEditor() { return this._filterEditor; }
    set filterEditor(value: string) {
        if (value !== this._filterEditor) {
            this._filterEditor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.filterEditor;
            this.invalidateByType(invalidateType);
        }
    }
    get filterFont() { return this._filterFont; }
    set filterFont(value: string) {
        if (value !== this._filterFont) {
            this._filterFont = value;
            const invalidateType = gridSettingChangeInvalidateTypes.filterFont;
            this.invalidateByType(invalidateType);
        }
    }
    get filterForegroundSelectionColor() { return this._filterForegroundSelectionColor; }
    set filterForegroundSelectionColor(value: GridSettings.Color) {
        if (value !== this._filterForegroundSelectionColor) {
            this._filterForegroundSelectionColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.filterForegroundSelectionColor;
            this.invalidateByType(invalidateType);
        }
    }
    get filterHalign() { return this._filterHalign; }
    set filterHalign(value: Halign) {
        if (value !== this._filterHalign) {
            this._filterHalign = value;
            const invalidateType = gridSettingChangeInvalidateTypes.filterHalign;
            this.invalidateByType(invalidateType);
        }
    }
    get filterCellPainter() { return this._filterCellPainter; }
    set filterCellPainter(value: string) {
        if (value !== this._filterCellPainter) {
            this._filterCellPainter = value;
            const invalidateType = gridSettingChangeInvalidateTypes.filterCellPainter;
            this.invalidateByType(invalidateType);
        }
    }
    get fixedColumnCount() { return this._fixedColumnCount; }
    set fixedColumnCount(value: number) {
        if (value !== this._fixedColumnCount) {
            this._fixedColumnCount = value;
            const invalidateType = gridSettingChangeInvalidateTypes.fixedColumnCount;
            this.invalidateByType(invalidateType);
        }
    }
    get fixedLinesHColor() { return this._fixedLinesHColor; }
    set fixedLinesHColor(value: GridSettings.Color) {
        if (value !== this._fixedLinesHColor) {
            this._fixedLinesHColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.fixedLinesHColor;
            this.invalidateByType(invalidateType);
        }
    }
    get fixedLinesHEdge() { return this._fixedLinesHEdge; }
    set fixedLinesHEdge(value: number | undefined) {
        if (value !== this._fixedLinesHEdge) {
            this._fixedLinesHEdge = value;
            const invalidateType = gridSettingChangeInvalidateTypes.fixedLinesHEdge;
            this.invalidateByType(invalidateType);
        }
    }
    get fixedLinesHWidth() { return this._fixedLinesHWidth; }
    set fixedLinesHWidth(value: number | undefined) {
        if (value !== this._fixedLinesHWidth) {
            this._fixedLinesHWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypes.fixedLinesHWidth;
            this.invalidateByType(invalidateType);
        }
    }
    get fixedLinesVColor() { return this._fixedLinesVColor; }
    set fixedLinesVColor(value: GridSettings.Color) {
        if (value !== this._fixedLinesVColor) {
            this._fixedLinesVColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.fixedLinesVColor;
            this.invalidateByType(invalidateType);
        }
    }
    get fixedLinesVEdge() { return this._fixedLinesVEdge; }
    set fixedLinesVEdge(value: number | undefined) {
        if (value !== this._fixedLinesVEdge) {
            this._fixedLinesVEdge = value;
            const invalidateType = gridSettingChangeInvalidateTypes.fixedLinesVEdge;
            this.invalidateByType(invalidateType);
        }
    }
    get fixedLinesVWidth() { return this._fixedLinesVWidth; }
    set fixedLinesVWidth(value: number | undefined) {
        if (value !== this._fixedLinesVWidth) {
            this._fixedLinesVWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypes.fixedLinesVWidth;
            this.invalidateByType(invalidateType);
        }
    }
    get fixedRowCount() { return this._fixedRowCount; }
    set fixedRowCount(value: number) {
        if (value !== this._fixedRowCount) {
            this._fixedRowCount = value;
            const invalidateType = gridSettingChangeInvalidateTypes.fixedRowCount;
            this.invalidateByType(invalidateType);
        }
    }
    get gridRightAligned() { return this._gridRightAligned; }
    set gridRightAligned(value: boolean) {
        if (value !== this._gridRightAligned) {
            this._gridRightAligned = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridRightAligned;
            this.invalidateByType(invalidateType);
        }
    }
    get gridBorder() { return this._gridBorder; }
    set gridBorder(value: boolean | string) {
        if (value !== this._gridBorder) {
            this._gridBorder = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridBorder;
            this.invalidateByType(invalidateType);
        }
    }
    get gridBorderBottom() { return this._gridBorderBottom; }
    set gridBorderBottom(value: boolean | string) {
        if (value !== this._gridBorderBottom) {
            this._gridBorderBottom = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridBorderBottom;
            this.invalidateByType(invalidateType);
        }
    }
    get gridBorderLeft() { return this._gridBorderLeft; }
    set gridBorderLeft(value: boolean | string) {
        if (value !== this._gridBorderLeft) {
            this._gridBorderLeft = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridBorderLeft;
            this.invalidateByType(invalidateType);
        }
    }
    get gridBorderRight() { return this._gridBorderRight; }
    set gridBorderRight(value: boolean | string) {
        if (value !== this._gridBorderRight) {
            this._gridBorderRight = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridBorderRight;
            this.invalidateByType(invalidateType);
        }
    }
    get gridBorderTop() { return this._gridBorderTop; }
    set gridBorderTop(value: boolean | string) {
        if (value !== this._gridBorderTop) {
            this._gridBorderTop = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridBorderTop;
            this.invalidateByType(invalidateType);
        }
    }
    get verticalGridLinesVisible() { return this._verticalGridLinesVisible; }
    set verticalGridLinesVisible(value: boolean) {
        if (value !== this._verticalGridLinesVisible) {
            this._verticalGridLinesVisible = value;
            const invalidateType = gridSettingChangeInvalidateTypes.verticalGridLinesVisible;
            this.invalidateByType(invalidateType);
        }
    }
    get gridLinesH() { return this._gridLinesH; }
    set gridLinesH(value: boolean) {
        if (value !== this._gridLinesH) {
            this._gridLinesH = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridLinesH;
            this.invalidateByType(invalidateType);
        }
    }
    get gridLinesHColor() { return this._gridLinesHColor; }
    set gridLinesHColor(value: GridSettings.Color) {
        if (value !== this._gridLinesHColor) {
            this._gridLinesHColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridLinesHColor;
            this.invalidateByType(invalidateType);
        }
    }
    get gridLinesHWidth() { return this._gridLinesHWidth; }
    set gridLinesHWidth(value: number) {
        if (value !== this._gridLinesHWidth) {
            this._gridLinesHWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridLinesHWidth;
            this.invalidateByType(invalidateType);
        }
    }
    get horizontalGridLinesVisible() { return this._horizontalGridLinesVisible; }
    set horizontalGridLinesVisible(value: boolean) {
        if (value !== this._horizontalGridLinesVisible) {
            this._horizontalGridLinesVisible = value;
            const invalidateType = gridSettingChangeInvalidateTypes.horizontalGridLinesVisible;
            this.invalidateByType(invalidateType);
        }
    }
    get gridLinesV() { return this._gridLinesV; }
    set gridLinesV(value: boolean) {
        if (value !== this._gridLinesV) {
            this._gridLinesV = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridLinesV;
            this.invalidateByType(invalidateType);
        }
    }
    get gridLinesVColor() { return this._gridLinesVColor; }
    set gridLinesVColor(value: GridSettings.Color) {
        if (value !== this._gridLinesVColor) {
            this._gridLinesVColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridLinesVColor;
            this.invalidateByType(invalidateType);
        }
    }
    get gridLinesVWidth() { return this._gridLinesVWidth; }
    set gridLinesVWidth(value: number) {
        if (value !== this._gridLinesVWidth) {
            this._gridLinesVWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypes.gridLinesVWidth;
            this.invalidateByType(invalidateType);
        }
    }
    get horizontalWheelScrollingAllowed() { return this._horizontalWheelScrollingAllowed; }
    set horizontalWheelScrollingAllowed(value: HorizontalWheelScrollingAllowed) {
        if (value !== this._horizontalWheelScrollingAllowed) {
            this._horizontalWheelScrollingAllowed = value;
            const invalidateType = gridSettingChangeInvalidateTypes.horizontalWheelScrollingAllowed;
            this.invalidateByType(invalidateType);
        }
    }
    get horizontalScrollbarClassPrefix() { return this._horizontalScrollbarClassPrefix; }
    set horizontalScrollbarClassPrefix(value: string) {
        if (value !== this._horizontalScrollbarClassPrefix) {
            this._horizontalScrollbarClassPrefix = value;
            const invalidateType = gridSettingChangeInvalidateTypes.horizontalScrollbarClassPrefix;
            this.invalidateByType(invalidateType);
        }
    }
    get minimumColumnWidth() { return this._minimumColumnWidth; }
    set minimumColumnWidth(value: number) {
        if (value !== this._minimumColumnWidth) {
            this._minimumColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypes.minimumColumnWidth;
            this.invalidateByType(invalidateType);
        }
    }
    get maximumColumnWidth() { return this._maximumColumnWidth; }
    set maximumColumnWidth(value: number | undefined) {
        if (value !== this._maximumColumnWidth) {
            this._maximumColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypes.maximumColumnWidth;
            this.invalidateByType(invalidateType);
        }
    }
    get visibleColumnWidthAdjust() { return this._visibleColumnWidthAdjust; }
    set visibleColumnWidthAdjust(value: boolean) {
        if (value !== this._visibleColumnWidthAdjust) {
            this._visibleColumnWidthAdjust = value;
            const invalidateType = gridSettingChangeInvalidateTypes.visibleColumnWidthAdjust;
            this.invalidateByType(invalidateType);
        }
    }
    get mouseRectangleSelection() { return this._mouseRectangleSelection; }
    set mouseRectangleSelection(value: boolean) {
        if (value !== this._mouseRectangleSelection) {
            this._mouseRectangleSelection = value;
            const invalidateType = gridSettingChangeInvalidateTypes.mouseRectangleSelection;
            this.invalidateByType(invalidateType);
        }
    }
    get mouseColumnSelection() { return this._mouseColumnSelection; }
    set mouseColumnSelection(value: boolean) {
        if (value !== this._mouseColumnSelection) {
            this._mouseColumnSelection = value;
            const invalidateType = gridSettingChangeInvalidateTypes.mouseColumnSelection;
            this.invalidateByType(invalidateType);
        }
    }
    get mouseRowSelection() { return this._mouseRowSelection; }
    set mouseRowSelection(value: boolean) {
        if (value !== this._mouseRowSelection) {
            this._mouseRowSelection = value;
            const invalidateType = gridSettingChangeInvalidateTypes.mouseRowSelection;
            this.invalidateByType(invalidateType);
        }
    }
    get multipleSelectionAreas() { return this._multipleSelectionAreas; }
    set multipleSelectionAreas(value: boolean) {
        if (value !== this._multipleSelectionAreas) {
            this._multipleSelectionAreas = value;
            const invalidateType = gridSettingChangeInvalidateTypes.multipleSelectionAreas;
            this.invalidateByType(invalidateType);
        }
    }
    get primarySelectionAreaType() { return this._primarySelectionAreaType; }
    set primarySelectionAreaType(value: SelectionAreaType) {
        if (value !== this._primarySelectionAreaType) {
            this._primarySelectionAreaType = value;
            const invalidateType = gridSettingChangeInvalidateTypes.primarySelectionAreaType;
            this.invalidateByType(invalidateType);
        }
    }
    get repaintImmediately() { return this._repaintImmediately; }
    set repaintImmediately(value: boolean) {
        if (value !== this._repaintImmediately) {
            this._repaintImmediately = value;
            const invalidateType = gridSettingChangeInvalidateTypes.repaintImmediately;
            this.invalidateByType(invalidateType);
        }
    }
    get repaintFramesPerSecond() { return this._repaintFramesPerSecond; }
    set repaintFramesPerSecond(value: number) {
        if (value !== this._repaintFramesPerSecond) {
            this._repaintFramesPerSecond = value;
            const invalidateType = gridSettingChangeInvalidateTypes.repaintFramesPerSecond;
            this.invalidateByType(invalidateType);
        }
    }
    get resizeColumnInPlace() { return this._resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) {
        if (value !== this._resizeColumnInPlace) {
            this._resizeColumnInPlace = value;
            const invalidateType = gridSettingChangeInvalidateTypes.resizeColumnInPlace;
            this.invalidateByType(invalidateType);
        }
    }
    get resizedEventDebounceExtendedWhenPossible() { return this._resizedEventDebounceExtendedWhenPossible; }
    set resizedEventDebounceExtendedWhenPossible(value: boolean) {
        if (value !== this._resizedEventDebounceExtendedWhenPossible) {
            this._resizedEventDebounceExtendedWhenPossible = value;
            const invalidateType = gridSettingChangeInvalidateTypes.resizedEventDebounceExtendedWhenPossible;
            this.invalidateByType(invalidateType);
        }
    }
    get resizedEventDebounceInterval() { return this._resizedEventDebounceInterval; }
    set resizedEventDebounceInterval(value: number) {
        if (value !== this._resizedEventDebounceInterval) {
            this._resizedEventDebounceInterval = value;
            const invalidateType = gridSettingChangeInvalidateTypes.resizedEventDebounceInterval;
            this.invalidateByType(invalidateType);
        }
    }
    get rowResize() { return this._rowResize; }
    set rowResize(value: boolean) {
        if (value !== this._rowResize) {
            this._rowResize = value;
            const invalidateType = gridSettingChangeInvalidateTypes.rowResize;
            this.invalidateByType(invalidateType);
        }
    }
    get rowStripes() { return this._rowStripes; }
    set rowStripes(value: GridSettings.RowStripe[] | undefined) {
        if (value !== this._rowStripes) {
            this._rowStripes = value;
            const invalidateType = gridSettingChangeInvalidateTypes.rowStripes;
            this.invalidateByType(invalidateType);
        }
    }
    get scrollHorizontallySmoothly() { return this._scrollHorizontallySmoothly; }
    set scrollHorizontallySmoothly(value: boolean) {
        if (value !== this._scrollHorizontallySmoothly) {
            this._scrollHorizontallySmoothly = value;
            const invalidateType = gridSettingChangeInvalidateTypes.scrollHorizontallySmoothly;
            this.invalidateByType(invalidateType);
        }
    }
    get scrollbarHoverOver() { return this._scrollbarHoverOver; }
    set scrollbarHoverOver(value: string) {
        if (value !== this._scrollbarHoverOver) {
            this._scrollbarHoverOver = value;
            const invalidateType = gridSettingChangeInvalidateTypes.scrollbarHoverOver;
            this.invalidateByType(invalidateType);
        }
    }
    get scrollbarHoverOff() { return this._scrollbarHoverOff; }
    set scrollbarHoverOff(value: string) {
        if (value !== this._scrollbarHoverOff) {
            this._scrollbarHoverOff = value;
            const invalidateType = gridSettingChangeInvalidateTypes.scrollbarHoverOff;
            this.invalidateByType(invalidateType);
        }
    }
    get scrollingEnabled() { return this._scrollingEnabled; }
    set scrollingEnabled(value: boolean) {
        if (value !== this._scrollingEnabled) {
            this._scrollingEnabled = value;
            const invalidateType = gridSettingChangeInvalidateTypes.scrollingEnabled;
            this.invalidateByType(invalidateType);
        }
    }
    get secondarySelectionAreaTypeSpecifierModifierKey() { return this._secondarySelectionAreaTypeSpecifierModifierKey; }
    set secondarySelectionAreaTypeSpecifierModifierKey(value: ModifierKeyEnum | undefined) {
        if (value !== this._secondarySelectionAreaTypeSpecifierModifierKey) {
            this._secondarySelectionAreaTypeSpecifierModifierKey = value;
            const invalidateType = gridSettingChangeInvalidateTypes.secondarySelectionAreaTypeSpecifierModifierKey;
            this.invalidateByType(invalidateType);
        }
    }
    get secondarySelectionAreaType() { return this._secondarySelectionAreaType; }
    set secondarySelectionAreaType(value: SelectionAreaType) {
        if (value !== this._secondarySelectionAreaType) {
            this._secondarySelectionAreaType = value;
            const invalidateType = gridSettingChangeInvalidateTypes.secondarySelectionAreaType;
            this.invalidateByType(invalidateType);
        }
    }
    get selectionExtendDragActiveCursorName() { return this._selectionExtendDragActiveCursorName; }
    set selectionExtendDragActiveCursorName(value: string | undefined) {
        if (value !== this._selectionExtendDragActiveCursorName) {
            this._selectionExtendDragActiveCursorName = value;
            const invalidateType = gridSettingChangeInvalidateTypes.selectionExtendDragActiveCursorName;
            this.invalidateByType(invalidateType);
        }
    }
    get selectionRegionOutlineColor() { return this._selectionRegionOutlineColor; }
    set selectionRegionOutlineColor(value: GridSettings.Color) {
        if (value !== this._selectionRegionOutlineColor) {
            this._selectionRegionOutlineColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.selectionRegionOutlineColor;
            this.invalidateByType(invalidateType);
        }
    }
    get selectionRegionOverlayColor() { return this._selectionRegionOverlayColor; }
    set selectionRegionOverlayColor(value: GridSettings.Color) {
        if (value !== this._selectionRegionOverlayColor) {
            this._selectionRegionOverlayColor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.selectionRegionOverlayColor;
            this.invalidateByType(invalidateType);
        }
    }
    get showFilterRow() { return this._showFilterRow; }
    set showFilterRow(value: boolean) {
        if (value !== this._showFilterRow) {
            this._showFilterRow = value;
            const invalidateType = gridSettingChangeInvalidateTypes.showFilterRow;
            this.invalidateByType(invalidateType);
        }
    }
    get mouseSortOnDoubleClick() { return this._mouseSortOnDoubleClick; }
    set mouseSortOnDoubleClick(value: boolean) {
        if (value !== this._mouseSortOnDoubleClick) {
            this._mouseSortOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypes.mouseSortOnDoubleClick;
            this.invalidateByType(invalidateType);
        }
    }
    get mouseSortable() { return this._mouseSortable; }
    set mouseSortable(value: boolean) {
        if (value !== this._mouseSortable) {
            this._mouseSortable = value;
            const invalidateType = gridSettingChangeInvalidateTypes.mouseSortable;
            this.invalidateByType(invalidateType);
        }
    }
    get useHiDPI() { return this._useHiDPI; }
    set useHiDPI(value: boolean) {
        if (value !== this._useHiDPI) {
            this._useHiDPI = value;
            const invalidateType = gridSettingChangeInvalidateTypes.useHiDPI;
            this.invalidateByType(invalidateType);
        }
    }
    get verticalScrollbarClassPrefix() { return this._verticalScrollbarClassPrefix; }
    set verticalScrollbarClassPrefix(value: string) {
        if (value !== this._verticalScrollbarClassPrefix) {
            this._verticalScrollbarClassPrefix = value;
            const invalidateType = gridSettingChangeInvalidateTypes.verticalScrollbarClassPrefix;
            this.invalidateByType(invalidateType);
        }
    }
    get wheelHFactor() { return this._wheelHFactor; }
    set wheelHFactor(value: number) {
        if (value !== this._wheelHFactor) {
            this._wheelHFactor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.wheelHFactor;
            this.invalidateByType(invalidateType);
        }
    }
    get wheelVFactor() { return this._wheelVFactor; }
    set wheelVFactor(value: number) {
        if (value !== this._wheelVFactor) {
            this._wheelVFactor = value;
            const invalidateType = gridSettingChangeInvalidateTypes.wheelVFactor;
            this.invalidateByType(invalidateType);
        }
    }

    load(settings: GridSettings) {
        this._addToggleSelectionAreaModifierKey = settings.addToggleSelectionAreaModifierKey;
        this._addToggleSelectionAreaModifierKeyDoesToggle = settings.addToggleSelectionAreaModifierKeyDoesToggle;
        this._backgroundColor = settings.backgroundColor;
        this._borderWidth = settings.borderWidth;
        this._borderColor = settings.borderColor;
        this._color = settings.color;
        this._columnAutosizing = settings.defaultColumnAutosizing;
        this._columnAutosizingMax = settings.columnAutosizingMax;
        this._columnClip = settings.columnClip;
        this._columnMoveDragPossibleCursorName = settings.columnMoveDragPossibleCursorName;
        this._columnMoveDragActiveCursorName = settings.columnMoveDragActiveCursorName;
        this._columnResizeDragPossibleCursorName = settings.columnResizeDragPossibleCursorName;
        this._columnResizeDragActiveCursorName = settings.columnResizeDragActiveCursorName;
        this._columnSortPossibleCursorName = settings.columnSortPossibleCursorName;
        this._columnsReorderable = settings.columnsReorderable;
        this._columnsReorderableHideable = settings.columnsReorderableHideable;
        this._defaultRowHeight = settings.defaultRowHeight;
        this._defaultColumnWidth = settings.defaultColumnWidth;
        this._defaultUiBehaviorTypeNames = settings.defaultUiBehaviorTypeNames;
        this._editable = settings.editable;
        this._editOnDoubleClick = settings.editOnDoubleClick;
        this._editOnKeydown = settings.editOnKeydown;
        this._editKey = settings.editKey;
        this._editOnFocusCell = settings.editOnFocusCell;
        this._enableContinuousRepaint = settings.enableContinuousRepaint;
        this._extendLastSelectionAreaModifierKey = settings.extendLastSelectionAreaModifierKey;
        this._eventDispatchEnabled = settings.eventDispatchEnabled;
        this._filterable = settings.filterable;
        this._filterBackgroundColor = settings.filterBackgroundColor;
        this._filterBackgroundSelectionColor = settings.filterBackgroundSelectionColor;
        this._filterColor = settings.filterColor;
        this._filterEditor = settings.filterEditor;
        this._filterFont = settings.filterFont;
        this._filterForegroundSelectionColor = settings.filterForegroundSelectionColor;
        this._filterHalign = settings.filterHalign;
        this._filterCellPainter = settings.filterCellPainter;
        this._fixedColumnCount = settings.fixedColumnCount;
        this._fixedLinesHColor = settings.fixedLinesHColor;
        this._fixedLinesHEdge = settings.fixedLinesHEdge;
        this._fixedLinesHWidth = settings.fixedLinesHWidth;
        this._fixedLinesVColor = settings.fixedLinesVColor;
        this._fixedLinesVEdge = settings.fixedLinesVEdge;
        this._fixedLinesVWidth = settings.fixedLinesVWidth;
        this._fixedRowCount = settings.fixedRowCount;
        this._gridRightAligned = settings.gridRightAligned;
        this._gridBorder = settings.gridBorder;
        this._gridBorderBottom = settings.gridBorderBottom;
        this._gridBorderLeft = settings.gridBorderLeft;
        this._gridBorderRight = settings.gridBorderRight;
        this._gridBorderTop = settings.gridBorderTop;
        this._verticalGridLinesVisible = settings.verticalGridLinesVisible;
        this._gridLinesH = settings.gridLinesH;
        this._gridLinesHColor = settings.gridLinesHColor;
        this._gridLinesHWidth = settings.gridLinesHWidth;
        this._horizontalGridLinesVisible = settings.horizontalGridLinesVisible;
        this._gridLinesV = settings.gridLinesV;
        this._gridLinesVColor = settings.gridLinesVColor;
        this._gridLinesVWidth = settings.gridLinesVWidth;
        this._horizontalWheelScrollingAllowed = settings.horizontalWheelScrollingAllowed;
        this._horizontalScrollbarClassPrefix = settings.horizontalScrollbarClassPrefix;
        this._minimumColumnWidth = settings.minimumColumnWidth;
        this._maximumColumnWidth = settings.maximumColumnWidth;
        this._visibleColumnWidthAdjust = settings.visibleColumnWidthAdjust;
        this._mouseRectangleSelection = settings.mouseRectangleSelection;
        this._mouseColumnSelection = settings.mouseColumnSelection;
        this._mouseRowSelection = settings.mouseRowSelection;
        this._multipleSelectionAreas = settings.multipleSelectionAreas;
        this._primarySelectionAreaType = settings.primarySelectionAreaType;
        this._repaintImmediately = settings.repaintImmediately;
        this._repaintFramesPerSecond = settings.repaintFramesPerSecond;
        this._resizeColumnInPlace = settings.resizeColumnInPlace;
        this._resizedEventDebounceExtendedWhenPossible = settings.resizedEventDebounceExtendedWhenPossible;
        this._resizedEventDebounceInterval = settings.resizedEventDebounceInterval;
        this._rowResize = settings.rowResize;
        this._rowStripes = settings.rowStripes;
        this._scrollHorizontallySmoothly = settings.scrollHorizontallySmoothly;
        this._scrollbarHoverOver = settings.scrollbarHoverOver;
        this._scrollbarHoverOff = settings.scrollbarHoverOff;
        this._scrollingEnabled = settings.scrollingEnabled;
        this._secondarySelectionAreaTypeSpecifierModifierKey = settings.secondarySelectionAreaTypeSpecifierModifierKey;
        this._secondarySelectionAreaType = settings.secondarySelectionAreaType;
        this._selectionExtendDragActiveCursorName = settings.selectionExtendDragActiveCursorName;
        this._selectionRegionOutlineColor = settings.selectionRegionOutlineColor;
        this._selectionRegionOverlayColor = settings.selectionRegionOverlayColor;
        this._showFilterRow = settings.showFilterRow;
        this._mouseSortOnDoubleClick = settings.mouseSortOnDoubleClick;
        this._mouseSortable = settings.mouseSortable;
        this._useHiDPI = settings.useHiDPI;
        this._verticalScrollbarClassPrefix = settings.verticalScrollbarClassPrefix;
        this._wheelHFactor = settings.wheelHFactor;
        this._wheelVFactor = settings.wheelVFactor;
    }

    private invalidateByType(invalidateType: GridSettingChangeInvalidateType) {
        switch (invalidateType) {
            case GridSettingChangeInvalidateType.None:
                break;
            case GridSettingChangeInvalidateType.ViewRender:
                this.viewRenderInvalidatedEventer();
                break;
            case GridSettingChangeInvalidateType.HorizontalViewLayout:
                this.horizontalViewLayoutInvalidatedEventer(false);
                break;
            case GridSettingChangeInvalidateType.VerticalViewLayout:
                this.verticalViewLayoutInvalidatedEventer(false);
                break;
            case GridSettingChangeInvalidateType.ViewLayout:
                this.viewLayoutInvalidatedEventer(false);
                break;
            case GridSettingChangeInvalidateType.HorizontalViewLayoutAndScrollDimension:
                this.horizontalViewLayoutInvalidatedEventer(true);
                break;
            case GridSettingChangeInvalidateType.VerticalViewLayoutAndScrollDimension:
                this.verticalViewLayoutInvalidatedEventer(true);
                break;
            case GridSettingChangeInvalidateType.ViewLayoutAndScrollDimension:
                this.viewLayoutInvalidatedEventer(true);
                break;
            case GridSettingChangeInvalidateType.Resize:
                this.resizeEventer();
                break;
            default:
                throw new UnreachableCaseError('IMDMGSIBT43332', invalidateType);
        }
    }
}
