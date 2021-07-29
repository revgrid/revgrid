import { Subgrid } from '../behaviors/subgrid';
import { defaults } from './defaults';
import { Hypergrid } from './hypergrid';
import { HypergridProperties } from './hypergrid-properties';

export class HypergridPropertiesAccessor implements HypergridProperties {
    private readonly _raw: HypergridProperties;
    private readonly var = HypergridPropertiesAccessor.Var.createDefault();

    constructor(private grid: Hypergrid) {
        this._raw = grid.rawProperties;
    }

    get autoSelectColumns() { return this._raw.autoSelectColumns; }
    set autoSelectColumns(value: boolean) { this._raw.autoSelectColumns = value; }
    get autoSelectRows() { return this._raw.autoSelectRows; }
    set autoSelectRows(value: boolean) { this._raw.autoSelectRows = value; }
    get backgroundColor() { return this._raw.backgroundColor; }
    set backgroundColor(value: HypergridProperties.Color) { this._raw.backgroundColor2 = value; }
    get backgroundColor2() { return this._raw.backgroundColor; }
    set backgroundColor2(value: HypergridProperties.Color) { this._raw.backgroundColor2 = value; }
    get backgroundSelectionColor() { return this._raw.backgroundSelectionColor; }
    set backgroundSelectionColor(value: HypergridProperties.Color) { this._raw.backgroundSelectionColor = value; }
    get boxSizing() { return this._raw.boxSizing; }
    set boxSizing(value: string) { this._raw.boxSizing = value; }
    get calculators() { return this._raw.calculators; }
    set calculators(value: HypergridProperties.Calculators) { this._raw.calculators = value; }
    get cellPadding() { return this._raw.cellPadding; }
    set cellPadding(value: number) { this._raw.cellPadding = value; }
    /** Clicking in a cell "selects" it; it is added to the select region and repainted with "cell selection" colors. */
    get cellSelection() { return this._raw.cellSelection; }
    set cellSelection(value: boolean) { this._raw.cellSelection = value; }
    get checkboxOnlyRowSelections() { return this._raw.checkboxOnlyRowSelections; }
    set checkboxOnlyRowSelections(value: boolean) { this._raw.checkboxOnlyRowSelections = value; }
    /** Collapse cell selection onto next row selection. */
    get collapseCellSelections() { return this._raw.collapseCellSelections; }
    set collapseCellSelections(value: boolean) { this._raw.collapseCellSelections = value; }
    get color() { return this._raw.color; }
    set color(value: HypergridProperties.Color) { this._raw.color = value; }
    /** Whether the column is auto-sized */
    get columnAutosized() { return this._raw.columnAutosized; }
    set columnAutosized(value: boolean) { this._raw.columnAutosized = value; }
    /** Whether to automatically expand column width to accommodate widest rendered value. */
    get columnAutosizing() { return this._raw.columnAutosizing; }
    set columnAutosizing(value: boolean) { this._raw.columnAutosizing = value; }
    /** The widest the column will be auto-sized to. */
    get columnAutosizingMax() { return this._raw.columnAutosizingMax; }
    set columnAutosizingMax(value: number) { this._raw.columnAutosizingMax = value; }
    /** Set up a clipping region around each column before painting cells. */
    get columnClip() { return this._raw.columnClip; }
    set columnClip(value: boolean | null) { this._raw.columnClip = value; }
    /** Column grab within this number of pixels from top of cell. */
    get columnGrabMargin() { return this._raw.columnGrabMargin; }
    set columnGrabMargin(value: number) { this._raw.columnGrabMargin = value; }
    get columnHeaderBackgroundColor() { return this._raw.columnHeaderBackgroundColor; }
    set columnHeaderBackgroundColor(value: HypergridProperties.Color) { this._raw.columnHeaderBackgroundColor = value; }
    get columnHeaderBackgroundSelectionColor() { return this._raw.columnHeaderBackgroundSelectionColor; }
    set columnHeaderBackgroundSelectionColor(value: HypergridProperties.Color) { this._raw.columnHeaderBackgroundSelectionColor = value; }
    get columnHeaderColor() { return this._raw.columnHeaderColor; }
    set columnHeaderColor(value: HypergridProperties.Color) { this._raw.columnHeaderColor = value; }
    get columnHeaderFont() { return this._raw.columnHeaderFont; }
    set columnHeaderFont(value: string) { this._raw.columnHeaderFont = value; }
    get columnHeaderForegroundSelectionColor() { return this._raw.columnHeaderForegroundSelectionColor; }
    set columnHeaderForegroundSelectionColor(value: HypergridProperties.Color) { this._raw.columnHeaderForegroundSelectionColor = value; }
    get columnHeaderForegroundSelectionFont() { return this._raw.columnHeaderForegroundSelectionFont; }
    set columnHeaderForegroundSelectionFont(value: string) { this._raw.columnHeaderForegroundSelectionFont = value; }
    get columnHeaderFormat() { return this._raw.columnHeaderFormat; }
    set columnHeaderFormat(value: string) { this._raw.columnHeaderFormat = value; }
    get columnHeaderHalign() { return this._raw.columnHeaderHalign; }
    set columnHeaderHalign(value: HypergridProperties.Halign) { this._raw.columnHeaderHalign = value; }
    get columnHeaderRenderer() { return this._raw.columnHeaderRenderer; }
    set columnHeaderRenderer(value: string) { this._raw.columnHeaderRenderer = value; }
    /** Clicking in a column header (top row) "selects" the column; the entire column is added to the select region and repainted with "column selection" colors. */
    get columnSelection() { return this._raw.columnSelection; }
    set columnSelection(value: boolean) { this._raw.columnSelection = value; }
    /** Allow user to move columns. */
    get columnsReorderable() { return this._raw.columnsReorderable; }
    set columnsReorderable(value: boolean) { this._raw.columnsReorderable = value; }
    get centerIcon() { return this._raw.centerIcon; }
    set centerIcon(value: string) { this._raw.centerIcon = value; }
    get defaultRowHeight() { return this._raw.defaultRowHeight; }
    set defaultRowHeight(value: number) { this._raw.defaultRowHeight = value; }
    get defaultColumnWidth() { return this._raw.defaultColumnWidth; }
    set defaultColumnWidth(value: number) { this._raw.defaultColumnWidth = value; }
    get editable() { return this._raw.editable; }
    set editable(value: boolean) { this._raw.editable = value; }
    /** Edit cell on double-click rather than single-click. */
    get editOnDoubleClick() { return this._raw.editOnDoubleClick; }
    set editOnDoubleClick(value: boolean) { this._raw.editOnDoubleClick = value; }
    get editOnKeydown() { return this._raw.editOnKeydown; }
    set editOnKeydown(value: boolean) { this._raw.editOnKeydown = value; }
    /** Open cell editor when cell selected via keyboard navigation. */
    get editOnNextCell() { return this._raw.editOnNextCell; }
    set editOnNextCell(value: boolean) { this._raw.editOnNextCell = value; }
    /** Name of a cell editor. */
    get editor() { return this._raw.editor; }
    set editor(value: string) { this._raw.editor = value; }
    /** Re-render grid at maximum speed. */
    get enableContinuousRepaint() { return this._raw.enableContinuousRepaint; }
    set enableContinuousRepaint(value: boolean) { this._raw.enableContinuousRepaint = value; }
    /** Validation failure feedback. */
    get feedbackCount() { return this._raw.feedbackCount; }
    set feedbackCount(value: number) { this._raw.feedbackCount = value; }
    get feedbackEffect() { return this._raw.feedbackEffect; }
    set feedbackEffect(value: HypergridProperties.FeedbackEffect) { this._raw.feedbackEffect = value; }
    get fetchSubregions() { return this._raw.fetchSubregions; }
    set fetchSubregions(value: boolean) { this._raw.fetchSubregions = value; }
    get filterable() { return this._raw.filterable; }
    set filterable(value: boolean) { this._raw.filterable = value; }
    get filterBackgroundColor() { return this._raw.filterBackgroundColor; }
    set filterBackgroundColor(value: HypergridProperties.Color) { this._raw.filterBackgroundColor = value; }
    get filterBackgroundSelectionColor() { return this._raw.filterBackgroundSelectionColor; }
    set filterBackgroundSelectionColor(value: HypergridProperties.Color) { this._raw.filterBackgroundSelectionColor = value; }
    get filterColor() { return this._raw.filterColor; }
    set filterColor(value: HypergridProperties.Color) { this._raw.filterColor = value; }
    get filterEditor() { return this._raw.filterEditor; }
    set filterEditor(value: string) { this._raw.filterEditor = value; }
    get filterFont() { return this._raw.filterFont; }
    set filterFont(value: string) { this._raw.filterFont = value; }
    get filterForegroundSelectionColor() { return this._raw.filterForegroundSelectionColor; }
    set filterForegroundSelectionColor(value: HypergridProperties.Color) { this._raw.filterForegroundSelectionColor = value; }
    get filterHalign() { return this._raw.filterHalign; }
    set filterHalign(value: HypergridProperties.Halign) { this._raw.filterHalign = value; }
    get filterRenderer() { return this._raw.filterRenderer; }
    set filterRenderer(value: string) { this._raw.filterRenderer = value; }

    // Tree Header may no longer be relevant
    get treeHeaderFont() { return this._raw.treeHeaderFont; }
    set treeHeaderFont(value: string) { this._raw.treeHeaderFont = value; }
    get treeHeaderColor() { return this._raw.treeHeaderColor; }
    set treeHeaderColor(value: HypergridProperties.Color) { this._raw.treeHeaderColor = value; }
    get treeHeaderBackgroundColor() { return this._raw.treeHeaderBackgroundColor; }
    set treeHeaderBackgroundColor(value: HypergridProperties.Color) { this._raw.treeHeaderBackgroundColor = value; }
    get treeHeaderForegroundSelectionColor() { return this._raw.treeHeaderForegroundSelectionColor; }
    set treeHeaderForegroundSelectionColor(value: HypergridProperties.Color) { this._raw.treeHeaderForegroundSelectionColor = value; }
    get treeHeaderForegroundSelectionFont() { return this._raw.treeHeaderForegroundSelectionFont; }
    set treeHeaderForegroundSelectionFont(value: string) { this._raw.treeHeaderForegroundSelectionFont = value; }
    get treeHeaderBackgroundSelectionColor() { return this._raw.treeHeaderBackgroundSelectionColor; }
    set treeHeaderBackgroundSelectionColor(value: HypergridProperties.Color) { this._raw.treeHeaderBackgroundSelectionColor = value; }

    get fixedColumnCount() { return this._raw.fixedColumnCount; }
    set fixedColumnCount(value: number) { this._raw.fixedColumnCount = value; }
    get fixedLinesHColor() { return this._raw.fixedLinesHColor; }
    set fixedLinesHColor(value: HypergridProperties.Color) { this._raw.fixedLinesHColor = value; }
    get fixedLinesHEdge() { return this._raw.fixedLinesHEdge; }
    set fixedLinesHEdge(value: number) { this._raw.fixedLinesHEdge = value; }
    get fixedLinesHWidth() { return this._raw.fixedLinesHWidth; }
    set fixedLinesHWidth(value: number) { this._raw.fixedLinesHWidth = value; }
    get fixedLinesVColor() { return this._raw.fixedLinesVColor; }
    set fixedLinesVColor(value: HypergridProperties.Color) { this._raw.fixedLinesVColor = value; }
    get fixedLinesVEdge() { return this._raw.fixedLinesVEdge; }
    set fixedLinesVEdge(value: number) { this._raw.fixedLinesVEdge = value; }
    get fixedLinesVWidth() { return this._raw.fixedLinesVWidth; }
    set fixedLinesVWidth(value: number) { this._raw.fixedLinesVWidth = value; }
    get fixedRowCount() { return this._raw.fixedRowCount; }
    set fixedRowCount(value: number) { this._raw.fixedRowCount = value; }
    get font() { return this._raw.font; }
    set font(value: string) { this._raw.font = value; }
    get foregroundSelectionColor() { return this._raw.foregroundSelectionColor; }
    set foregroundSelectionColor(value: HypergridProperties.Color) { this._raw.foregroundSelectionColor = value; }
    get foregroundSelectionFont() { return this._raw.foregroundSelectionFont; }
    set foregroundSelectionFont(value: string) { this._raw.foregroundSelectionFont = value; }
    /** Name of a formatter for cell text. */
    get format() { return this._raw.format; }
    set format(value: string) { this._raw.format = value; }
    get gridLinesColumnHeader() { return this._raw.gridLinesColumnHeader; }
    set gridLinesColumnHeader(value: boolean) { this._raw.gridLinesColumnHeader = value; }
    get gridLinesRowHeader() { return this._raw.gridLinesRowHeader; }
    set gridLinesRowHeader(value: boolean) { this._raw.gridLinesRowHeader = value; }
    get gridLinesH() { return this._raw.gridLinesH; }
    set gridLinesH(value: boolean) { this._raw.gridLinesH = value; }
    get gridLinesHColor() { return this._raw.gridLinesHColor; }
    set gridLinesHColor(value: HypergridProperties.Color) { this._raw.gridLinesHColor = value; }
    get gridLinesHWidth() { return this._raw.gridLinesHWidth; }
    set gridLinesHWidth(value: number) { this._raw.gridLinesHWidth = value; }
    get gridLinesUserDataArea() { return this._raw.gridLinesUserDataArea; }
    set gridLinesUserDataArea(value: boolean) { this._raw.gridLinesUserDataArea = value; }
    get gridLinesV() { return this._raw.gridLinesV; }
    set gridLinesV(value: boolean) { this._raw.gridLinesV = value; }
    get gridLinesVColor() { return this._raw.gridLinesVColor; }
    set gridLinesVColor(value: HypergridProperties.Color) { this._raw.gridLinesVColor = value; }
    get gridLinesVWidth() { return this._raw.gridLinesVWidth; }
    set gridLinesVWidth(value: number) { this._raw.gridLinesVWidth = value; }
    /** The cell's horizontal alignment, as interpreted by the cell renderer */
    get halign() { return this._raw.halign; }
    set halign(value: HypergridProperties.Halign) { this._raw.halign = value; }
    get headerify() { return this._raw.headerify; }
    set headerify(value: string) { this._raw.headerify = value; }
    /** Whether text in header cells is wrapped. */
    get headerTextWrapping() { return this._raw.headerTextWrapping; }
    set headerTextWrapping(value: boolean) { this._raw.headerTextWrapping = value; }
    /** On mouse hover, whether to repaint the cell background and how. */
    get hoverCellHighlight() { return this._raw.hoverCellHighlight; }
    set hoverCellHighlight(value: HypergridProperties.HoverColors) { this._raw.hoverCellHighlight = value; }
    /** On mouse hover, whether to repaint the column background and how. */
    get hoverColumnHighlight() { return this._raw.hoverColumnHighlight; }
    set hoverColumnHighlight(value: HypergridProperties.HoverColors) { this._raw.hoverColumnHighlight = value; }
    /** On mouse hover, whether to repaint the row background and how. */
    get hoverRowHighlight() { return this._raw.hoverRowHighlight; }
    set hoverRowHighlight(value: HypergridProperties.HoverColors) { this._raw.hoverRowHighlight = value; }
    get hScrollbarClassPrefix() { return this._raw.hScrollbarClassPrefix; }
    set hScrollbarClassPrefix(value: string) { this._raw.hScrollbarClassPrefix = value; }
    get iconPadding() { return this._raw.iconPadding; }
    set iconPadding(value: number) { this._raw.iconPadding = value; }
    get leftIcon() { return this._raw.leftIcon; }
    set leftIcon(value: string) { this._raw.leftIcon = value; }
    /** Display cell value as a link (with underline). */
    get link() { return this._raw.link; }
    set link(value: false | string | HypergridProperties.LinkProp | HypergridProperties.LinkFunction) { this._raw.link = value; }
    /** Color for link. */
    get linkColor() { return this._raw.linkColor; }
    set linkColor(value: HypergridProperties.Color) { this._raw.linkColor = value; }
    /** Color link on hover only. */
    get linkColorOnHover() { return this._raw.linkColorOnHover; }
    set linkColorOnHover(value: boolean) { this._raw.linkColorOnHover = value; }
    /** Underline link on hover only. */
    get linkOnHover() { return this._raw.linkOnHover; }
    set linkOnHover(value: boolean) { this._raw.linkOnHover = value; }
    /** The window (or tab) in which to open the link. */
    get linkTarget() { return this._raw.linkTarget; }
    set linkTarget(value: string) { this._raw.linkTarget = value; }
    /** Color for visited link. */
    get linkVisitedColor() { return this._raw.linkVisitedColor; }
    set linkVisitedColor(value: HypergridProperties.Color) { this._raw.linkVisitedColor = value; }
    /** The maximum number of columns that may participate in a multi-column sort (via ctrl-click headers). */
    get maxSortColumns() { return this._raw.maxSortColumns; }
    set maxSortColumns(value: number) { this._raw.maxSortColumns = value; }
    get minimumColumnWidth() { return this._raw.minimumColumnWidth; }
    set minimumColumnWidth(value: number) { this._raw.minimumColumnWidth = value; }
    get maximumColumnWidth() { return this._raw.maximumColumnWidth; }
    set maximumColumnWidth(value: number) { this._raw.maximumColumnWidth = value; }
    /** Allow multiple cell region selections. */
    get multipleSelections() { return this._raw.multipleSelections; }
    set multipleSelections(value: boolean) { this._raw.multipleSelections = value; }
    /** Mappings for cell navigation keys. */
    get navKeyMap() { return this._raw.navKeyMap; }
    set navKeyMap(value: HypergridProperties.NavKeyMap) { this._raw.navKeyMap = value; }
    get noDataMessage() { return this._raw.noDataMessage; }
    set noDataMessage(value: string) { this._raw.noDataMessage = value; }
    propClassLayers: HypergridProperties.propClassEnum;
    get readOnly() { return this._raw.readOnly; }
    set readOnly(value: boolean) { this._raw.readOnly = value; }
    /** Name of cell renderer. */
    get renderer() { return this._raw.renderer; }
    set renderer(value: string) { this._raw.renderer = value; }
    /** Set to `true` to render `0` and `false`. Otherwise these value appear as blank cells. */
    get renderFalsy() { return this._raw.renderFalsy; }
    set renderFalsy(value: boolean) { this._raw.renderFalsy = value; }
    get repaintImmediately() { return this._raw.repaintImmediately; }
    set repaintImmediately(value: boolean) { this._raw.repaintImmediately = value; }
    get repaintIntervalRate() { return this._raw.repaintIntervalRate; }
    set repaintIntervalRate(value: number) { this._raw.repaintIntervalRate = value; }
    get rightIcon() { return this._raw.rightIcon; }
    set rightIcon(value: string) { this._raw.rightIcon = value; }
    get resizeColumnInPlace() { return this._raw.resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) { this._raw.resizeColumnInPlace = value; }
    /** Restore column selections across data transformations (`reindex` calls). */
    get restoreColumnSelections() { return this._raw.restoreColumnSelections; }
    set restoreColumnSelections(value: boolean) { this._raw.restoreColumnSelections = value; }
    /** Restore row selections across data transformations (`reindex` calls). */
    get restoreRowSelections() { return this._raw.restoreRowSelections; }
    set restoreRowSelections(value: boolean) { this._raw.restoreRowSelections = value; }
    get rowHeaderBackgroundColor() { return this._raw.rowHeaderBackgroundColor; }
    set rowHeaderBackgroundColor(value: HypergridProperties.Color) { this._raw.rowHeaderBackgroundColor = value; }
    get rowHeaderBackgroundSelectionColor() { return this._raw.rowHeaderBackgroundSelectionColor; }
    set rowHeaderBackgroundSelectionColor(value: HypergridProperties.Color) { this._raw.rowHeaderBackgroundSelectionColor = value; }
    get rowHeaderColor() { return this._raw.rowHeaderColor; }
    set rowHeaderColor(value: HypergridProperties.Color) { this._raw.rowHeaderColor = value; }
    get rowHeaderFont() { return this._raw.rowHeaderFont; }
    set rowHeaderFont(value: string) { this._raw.rowHeaderFont = value; }
    get rowHeaderForegroundSelectionColor() { return this._raw.rowHeaderForegroundSelectionColor; }
    set rowHeaderForegroundSelectionColor(value: HypergridProperties.Color) { this._raw.rowHeaderForegroundSelectionColor = value; }
    /** Font style for selected rows' headers. */
    get rowHeaderForegroundSelectionFont() { return this._raw.rowHeaderForegroundSelectionFont; }
    set rowHeaderForegroundSelectionFont(value: string) { this._raw.rowHeaderForegroundSelectionFont = value; }
    /** Whether to automatically expand row number column width to accommodate widest rendered row number */
    get rowNumberAutosizing() { return this._raw.rowNumberAutosizing; }
    set rowNumberAutosizing(value: boolean) { this._raw.rowNumberAutosizing = value; }
    get rowResize() { return this._raw.rowResize; }
    set rowResize(value: boolean) { this._raw.rowResize = value; }
    /** Clicking in a row header (leftmost column) "selects" the row; the entire row is added to the select region and repainted with "row selection" colors. */
    get rowSelection() { return this._raw.rowSelection; }
    set rowSelection(value: boolean) { this._raw.rowSelection = value; }
    /** Repeating pattern of property overrides for grid rows. */
    get rowStripes() { return this._raw.rowStripes; }
    set rowStripes(value: HypergridProperties.RowStripe[]) { this._raw.rowStripes = value; }
    get scrollbarHoverOver() { return this._raw.scrollbarHoverOver; }
    set scrollbarHoverOver(value: string) { this._raw.scrollbarHoverOver = value; }
    get scrollbarHoverOff() { return this._raw.scrollbarHoverOff; }
    set scrollbarHoverOff(value: string) { this._raw.scrollbarHoverOff = value; }
    get scrollingEnabled() { return this._raw.scrollingEnabled; }
    set scrollingEnabled(value: boolean) { this._raw.scrollingEnabled = value; }
    /** Stroke color for last selection overlay. */
    get selectionRegionOutlineColor() { return this._raw.selectionRegionOutlineColor; }
    set selectionRegionOutlineColor(value: HypergridProperties.Color) { this._raw.selectionRegionOutlineColor = value; }
    /** Fill color for last selection overlay. */
    get selectionRegionOverlayColor() { return this._raw.selectionRegionOverlayColor; }
    set selectionRegionOverlayColor(value: HypergridProperties.Color) { this._raw.selectionRegionOverlayColor = value; }
    get settingState() { return this._raw.settingState; }
    set settingState(value: boolean) { this._raw.settingState = value; }
    get singleRowSelectionMode() { return this._raw.singleRowSelectionMode; }
    set singleRowSelectionMode(value: boolean) { this._raw.singleRowSelectionMode = value; }
    get showFilterRow() { return this._raw.showFilterRow; }
    set showFilterRow(value: boolean) { this._raw.showFilterRow = value; }
    get showHeaderRow() { return this._raw.showHeaderRow; }
    set showHeaderRow(value: boolean) { this._raw.showHeaderRow = value; }
    get showTreeColumn() { return this._raw.showTreeColumn; }
    set showTreeColumn(value: boolean) { this._raw.showTreeColumn = value; }
    /** Sort column on double-click rather than single-click. */
    get sortOnDoubleClick() { return this._raw.sortOnDoubleClick; }
    set sortOnDoubleClick(value: boolean) { this._raw.sortOnDoubleClick = value; }
    /** Column(s) participating and subsequently hidden still affect sort. */
    get sortOnHiddenColumns() { return this._raw.sortOnHiddenColumns; }
    set sortOnHiddenColumns(value: boolean) { this._raw.sortOnHiddenColumns = value; }
    /** Display cell font with strike-through line drawn over it. */
    get strikeThrough() { return this._raw.strikeThrough; }
    set strikeThrough(value: boolean) { this._raw.strikeThrough = value; }
    get themeName() { return this._raw.themeName; }
    set themeName(value: string) { this._raw.themeName = value; }
    /** Whether to automatically expand row number column width to accommodate widest rendered group label. */
    get treeColumnAutosizing() { return this._raw.treeColumnAutosizing; }
    set treeColumnAutosizing(value: boolean) { this._raw.treeColumnAutosizing = value; }
    /** The widest the tree column will be auto-sized to. */
    get treeColumnAutosizingMax() { return this._raw.treeColumnAutosizingMax; }
    set treeColumnAutosizingMax(value: number) { this._raw.treeColumnAutosizingMax = value; }
    get treeRenderer() { return this._raw.treeRenderer; }
    set treeRenderer(value: string) { this._raw.treeRenderer = value; }
    /** How to truncate text. */
    get truncateTextWithEllipsis() { return this._raw.truncateTextWithEllipsis; }
    set truncateTextWithEllipsis(value: boolean | null) { this._raw.truncateTextWithEllipsis = value; }
    get unsortable() { return this._raw.unsortable; }
    set unsortable(value: boolean) { this._raw.unsortable = value; }
    get useBitBlit() { return this._raw.useBitBlit; }
    set useBitBlit(value: boolean) { this._raw.useBitBlit = value; }
    get useHiDPI() { return this._raw.useHiDPI; }
    set useHiDPI(value: boolean) { this._raw.useHiDPI = value; }
    get voffset() { return this._raw.voffset; }
    set voffset(value: number) { this._raw.voffset = value; }
    get vScrollbarClassPrefix() { return this._raw.vScrollbarClassPrefix; }
    set vScrollbarClassPrefix(value: string) { this._raw.vScrollbarClassPrefix = value; }
    /** The current width of the column */
    get width() { return this._raw.width; }
    set width(value: number) { this._raw.width = value; }

    // get theme() { return this.grid.getTheme(); }
    // set theme(theme) { this.grid.applyTheme(theme); }

    get wheelHFactor() { return this.grid.sbHScroller?.deltaXFactor ?? defaults.wheelHFactor; }
    set wheelHFactor(factor) { this.grid.sbHScroller.deltaXFactor = factor; }

    get wheelVFactor() { return this.grid.sbVScroller?.deltaYFactor ?? defaults.wheelVFactor; }
    set wheelVFactor(factor) { this.grid.sbVScroller.deltaYFactor = factor; }

    get subgrids() { return this.var.subgrids; }
    set subgrids(subgrids: Subgrid.Spec[]) {
        this.var.subgrids = subgrids;

        if (this.grid.behavior) {
            this.grid.behavior.setSubgrids(subgrids);
        }
    }

    /**
     * @memberOf module:dynamicProperties
     */
    get features() { return this.var.features; }
    set features(features: string[]) {
        this.var.features = features.slice();
        this.grid.behavior.initializeFeatureChain(/*features*/);
        this.grid.allowEvents(this.grid.getRowCount() > 0);
    }

    /**
     * @memberOf module:dynamicProperties
     */
    get gridRenderer() { return this.var.gridRenderer; }
    set gridRenderer(rendererName: string) {
        this.var.gridRenderer = rendererName;
        this.grid.renderer.setGridRenderer(rendererName);
    }

    /**
     * @memberOf module:dynamicProperties
     */
    get columnIndexes() {
        return this.grid.behavior.getActiveColumns().map(
            (column) => {
                return column.index;
            }
        );
    }
    set columnIndexes(columnIndexes: number[]) {
        this.grid.behavior.setColumnOrder(columnIndexes);
        this.grid.behavior.changed();
    }

    /**
     * @memberOf module:dynamicProperties
     */
    get columnNames() {
        return this.grid.behavior.getActiveColumns().map(
            (column) => {
                return column.name;
            }
        );
    }
    set columnNames(columnNames) {
        this.grid.behavior.setColumnOrderByName(columnNames);
        this.grid.behavior.changed();
    }

    /**
     * @memberOf module:dynamicProperties
     */
    // get rows()  { // to be called with grid.properties as context
    //     const subgrids = {};
    //     const behavior = this.grid.behavior;
    //     const defaultRowHeight = this.grid.properties.defaultRowHeight;
    //     behavior.subgrids.forEach((dataModel) => {
    //         const key = dataModel.name || dataModel.type;
    //         for (let rowIndex = 0, rowCount = dataModel.getRowCount(); rowIndex < rowCount; ++rowIndex) {
    //             let rowProps = behavior.getRowProperties(rowIndex, undefined, dataModel);
    //             if (rowProps) {
    //                 // create height mixin by invoking `height` getter
    //                 const height = { height: rowProps.height };
    //                 if (height.height === defaultRowHeight) {
    //                     height = undefined;
    //                 }

    //                 // clone it and mix in height
    //                 rowProps = Object.assign({}, rowProps, height);

    //                 // only include if at least one defined prop
    //                 if (Object.getOwnPropertyNames(rowProps).find(definedProp)) {
    //                     var subgrid = subgrids[key] || (subgrids[key] = {});
    //                     subgrid[rowIndex] = rowProps;
    //                 }
    //             }
    //         }
    //         function definedProp(key) { return rowProps[key] !== undefined; }
    //     });
    //     return subgrids;
    // }
    // set rows(rowsHash) {
    //     if (rowsHash) {
    //         // setRowPropertiesBySubgridAndRowIndex
    //         // to be called with grid.properties as context

    //         var behavior = this.grid.behavior,
    //         methodName = this.settingState ? 'setRowProperties' : 'addRowProperties';

    //         Object.keys(rowsHash).forEach(function(subgridName) {
    //             var subgrid = behavior.subgrids.lookup[subgridName];
    //             if (subgrid) {
    //                 var subgridHash = rowsHash[subgridName];
    //                 Object.keys(subgridHash).forEach(function(rowIndex) {
    //                     var properties = subgridHash[rowIndex];
    //                     behavior[methodName](rowIndex, properties, subgrid);
    //                 });
    //             }
    //         });

    //         this.grid.behavior.changed();
    //     }
    // }

    /**
     * @memberOf module:dynamicProperties
     */
    // get columns() { // to be called with grid.properties as context
    //     // getColumnPropertiesByColumnIndexOrName
    //     const columns = this.grid.behavior.getColumns();
    //     const headerify = this.grid.headerify;
    //     return columns.reduce(function(obj, column) {
    //         var properties = Object.keys(column.properties).reduce(function(properties, key) {
    //             switch (key) {
    //                 case 'preferredWidth': // not a public property
    //                     break;
    //                 case 'header':
    //                     if (headerify && column.properties.header === headerify(column.properties.name)) {
    //                         break;
    //                     }
    //                     // fallthrough
    //                 default:
    //                     properties[key] = column.properties[key];
    //             }
    //             return properties;
    //         }, {});
    //         if (Object.keys(properties).length) {
    //             obj[column.name] = properties;
    //         }
    //         return obj;
    //     }, {});
    // }
    // set columns(columnsHash) {
    //     if (columnsHash) {
    //         // to be called with grid.properties as context
    //         // setColumnPropertiesByColumnIndexOrName
    //         this.grid.behavior.addAllColumnProperties(columnsHash, settingState);
    //         this.grid.behavior.changed();
    //     }
    // }

    // get columnProperties() { return this.columns; }
    // set columnProperties(value) { this.columns = value; }

    /**
     * @memberOf module:dynamicProperties
     */
    // get cells() {
    //     // getCellPropertiesByColumnNameAndRowIndex
    //     var behavior = this.grid.behavior,
    //         columns = behavior.getColumns(),
    //         subgrids = {};

    //     behavior.subgrids.forEach(function(dataModel) {
    //         const key = dataModel.name || dataModel.type;

    //         for (var rowIndex = 0, rowCount = dataModel.getRowCount(); rowIndex < rowCount; ++rowIndex) {
    //             columns.forEach(copyCellOwnProperties);
    //         }

    //         function copyCellOwnProperties(column) {
    //             var properties = behavior.getCellOwnProperties(column.index, rowIndex, dataModel);
    //             if (properties) {
    //                 var subgrid = subgrids[key] = subgrids[key] || {},
    //                     row = subgrid[rowIndex] = subgrid[rowIndex] = {};
    //                 row[column.name] = Object.assign({}, properties);
    //             }
    //         }
    //     });

    //     return subgrids;
    // }
    // set cells(cellsHash) {
    //     if (cellsHash) {
    //         // setCellPropertiesByColumnNameAndRowIndex
    //         // to be called with grid.properties as context
    //         const subgrids = this.grid.behavior.subgrids;
    //         const columns = this.grid.behavior.getColumns();
    //         const methodName = this.settingState ? 'setCellProperties' : 'addCellProperties';

    //         Object.keys(cellsHash).forEach(function(subgridName) {
    //             var subgrid = subgrids.lookup[subgridName];
    //             if (subgrid) {
    //                 var subgridHash = cellsHash[subgridName];
    //                 Object.keys(subgridHash).forEach(function(rowIndex) {
    //                     var columnProps = subgridHash[rowIndex];
    //                     Object.keys(columnProps).forEach(function(columnName) {
    //                         var properties = columnProps[columnName];
    //                         if (properties) {
    //                             var column = columns.find(function(column) {
    //                                 return column.name === columnName;
    //                             });
    //                             if (column) {
    //                                 column[methodName](rowIndex, properties, subgrid);
    //                             }
    //                         }
    //                     });
    //                 });
    //             }
    //         });

    //         this.grid.behavior.changed();
    //     }
    // }

    /**
     * @memberOf module:dynamicProperties
     */
    get rowHeaderCheckboxes() { return this.var.rowHeaderCheckboxes; }
    set rowHeaderCheckboxes(enabled) {
        this.var.rowHeaderCheckboxes = enabled;
        this.grid.renderer.resetRowHeaderColumnWidth();
    }

    /**
     * @memberOf module:dynamicProperties
     */
    get rowHeaderNumbers() { return this.var.rowHeaderNumbers; }
    set rowHeaderNumbers(enabled) {
        this.var.rowHeaderNumbers = enabled;
        this.grid.renderer.resetRowHeaderColumnWidth();
    }

    /**
     * Legacy property; now points to both `rowHeaderFeatures` props.
     * @memberOf module:dynamicProperties
     */
    get showRowNumbers() { return this.rowHeaderCheckboxes || this.rowHeaderNumbers; }
    set showRowNumbers(enabled: boolean) {
        this.rowHeaderCheckboxes = this.rowHeaderNumbers = enabled;
    }

    /** @summary Grid line color.
     * @desc This is a Legacy property. It is now implemented as a dynamic property accessor:
     * * Getting its value returns the current value of the new (as of 2.1.0) {@link module:defaults.gridLinesHColor gridLinesHColor} property.
     * * Setting its value sets {@link module:defaults.gridLinesHColor gridLinesHColor} and {@link module:defaults.gridLinesVColor gridLinesVColor}.
     * * It is non-enumerable; it is not output with `grid.saveState()`; the accessed properties are output instead.
     * @memberOf module:dynamicProperties
     */
    get lineColor() { return this.gridLinesHColor; }
    set lineColor(color) { this.gridLinesHColor = this.gridLinesVColor = color; }

    /** @summary Grid line width.
     * @desc This is a Legacy property. It is now implemented as a dynamic property accessor:
     * * Getting its value returns the current value of the new (as of 2.1.0) {@link module:defaults.gridLinesHColor gridLinesHColor} property.
     * * Setting its value sets {@link module:defaults.gridLinesHColor gridLinesHColor} and {@link module:defaults.gridLinesVColor gridLinesVColor}.
     * * It is non-enumerable; it is not output with `grid.saveState()`; the accessed properties are output instead.
     * @memberOf module:dynamicProperties
     */
    get lineWidth() { return this.gridLinesHWidth; }
    set lineWidth(width) { this.gridLinesHWidth = this.gridLinesVWidth = width; }

    get gridBorder() { return this.var.gridBorder; }
    set gridBorder(value: boolean | string) {
        this.var.gridBorder = value;
        this.var.gridBorderLeft = this.var.gridBorderRight = this.var.gridBorderTop = this.var.gridBorderBottom = value;
        this.grid.resetGridBorder();
    }

    get gridBorderLeft() { return this.var.gridBorderLeft; }
    set gridBorderLeft(value: boolean | string) {
        this.var.gridBorderLeft = value;
        this.grid.resetGridBorder('Left');
    }

    get gridBorderRight() { return this.var.gridBorderRight; }
    set gridBorderRight(value: boolean | string) {
        this.var.gridBorderRight = value;
        this.grid.resetGridBorder('Right');
    }

    get gridBorderTop() { return this.var.gridBorderTop; }
    set gridBorderTop(value: boolean | string) {
        this.var.gridBorderTop = value;
        this.grid.resetGridBorder('Top');
    }

    get gridBorderBottom() { return this.var.gridBorderBottom; }
    set gridBorderBottom(value: boolean | string) {
        this.var.gridBorderBottom = value;
        this.grid.resetGridBorder('Bottom');
    }

    loadDefaults() {
        HypergridProperties.assign(defaults, this._raw);
    }
}

export namespace HypergridPropertiesAccessor {
    export interface Var {
        subgrids: Subgrid.Spec[];
        features: string[];
        gridRenderer: string;
        rowHeaderCheckboxes: boolean;
        rowHeaderNumbers: boolean;
        gridBorder: boolean | string;
        gridBorderTop: boolean | string;
        gridBorderRight: boolean | string;
        gridBorderBottom: boolean | string;
        gridBorderLeft: boolean | string;
    }

    export namespace Var {
        export function createDefault(): Var {
            const result: Var = {
                subgrids: defaults.subgrids,
                features: defaults.features,
                gridRenderer: defaults.gridRenderer,
                rowHeaderCheckboxes: defaults.rowHeaderCheckboxes,
                rowHeaderNumbers: defaults.rowHeaderNumbers,
                gridBorder: defaults.gridBorder,
                gridBorderTop: defaults.gridBorderTop,
                gridBorderRight: defaults.gridBorderRight,
                gridBorderBottom: defaults.gridBorderBottom,
                gridBorderLeft: defaults.gridBorderLeft,
            }
            return result;
        }
    }
}

