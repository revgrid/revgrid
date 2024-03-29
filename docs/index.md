# Introduction

Welcome to the Revgrid website

Revgrid is a canvas based virtual grid focusing on realtime data display and performance. Data is injected into the grid using server interfaces.

Its main features are:

* Speed
* Virtual (supporting display of very large data sets)
* Event driven (low CPU usage)
* Multiple selections (rectangle, row and column)
* Focus
* Smooth horizontal scrolling
* Multiple subgrids (header, main, footer)
* Fixed rows and columns
* Plug in cell painters
* Plug in cell editors
* Plug in UI controllers

To use Revgrid, you first need to create a set of servers (implementations of the schema and server interfaces) in order to display data with Revgrid. The test programs in the source code demonstrate how to create these servers. In addition, the Revgrid source code contains 4 pre-built server sets:
1. **Record**: Allows applications to work with records and fields and converts these to rows and columns. Sorting and filtering of rows is fully handled by the server set. In addition, the server set allows recent changes in records and field values to be highlighted in the grid.
1. **Data Row Array**: A data set consisting of an array of JSON objects is injected into Revgrid with a `setData()` function.
1. **Single Heading**: A one row data set where the value of each cell is obtained from a heading field.
1. **Multi Heading**: A data set where the value of each cell is obtained from an array in the heading field.

# Install Library
Revgrid is shipped via NPM. Use the following commands to install it into an application package:\
`npm i revgrid`

# Install Source
The source can be installed by cloning the repository (or a fork) at: [https://github.com/revgrid/revgrid](https://github.com/revgrid/revgrid)

To build the distribution locally, open a shell at the directory/folder in which Revgrid was cloned and run the following commands:
1. `npm install` or `npm ci` (recommended) to install required dependencies
1. `npm run dist` to generate the distribution (`dist` subfolder). This script will:
    * delete the existing `lib` and `dist` folders
    * compile the TypeScript code
    * generate the rolled up TypeScript definition files (`index.d.ts` and `revgrid-untrimmed.d.ts`)
    * generate source maps

After the distribution has been initially built, it can be rebuilt using `npm run api`. This project uses [TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html) and the `dist` npm script forces a complete build while the `api` script only recompiles the referenced projects which have changed (so it can be a lot faster).

Note that the `lib` subfolder only holds the TypeScript declaration files generated by the compiler. Generally this subfolder can be ignored. It is used during the build process to generate the rolled up TypeScript definition files.

# Test applications

Revgrid has 3 test applications which can be easily built to see it in action:
* **testapp**: Test application for the grid.
* **recordtestapp**: Test application for the Record server set.
* **dratestapp**: Test application which displays static JSON data from a Data Row Array server set and uses a Multi Heading server set to get headings from the property names within the JSON data.

Follow the steps below to build and run these applications:
1. Install the source as described above.
1. Run the respective NPM script (`testapp:serve` or `dratestapp:serve` or `recordtestapp:serve`) to build the test application and start the server.
1. Start the application by opening the following link in your browser:
    http://localhost:3001/

Corresponding NPM scripts also exist in the package file to build the test applications but not run them.

# Building single-file bundles

UMD and ESM single file bundles can be generated for easier consumption without toolchain in-place. To do this, run `npm run bundles`, afterwards find the bundled files under `dist/bundles/`.
Bundles are not built by default and are not included in the NPM package. It is recommended to consume the library through NPM and webpack.

# Public API Interfaces are subject to change
Many aspects of the code base still need to be cleaned up.  As part of this, it is possible that API interfaces and behaviour will change. Also, some features and convenience functions may be removed if they are deemed to not be inline with Revgrid's objectives.

We will endeavour to document these API changes however this will probably only consist of dot points. You may need to examine the Revgrid source code to fully understand the implications of these API changes.

# Should you use Revgrid?
Revgrid is open source and used in at least one production application. However please consider the following before using it:
* There is little documentation describing covering how it works and how it should be used.
* There are significant parts of it which have not yet been tested.
* The support for it is voluntary and cannot be relied upon.
* It is specifically targeted at high performance and real time display of data (especially related to financial trading). Features not relevant to this domain will not be incorporated.
* The public API interfaces are subject to change.

If you do intend to use it, it is recommended you have the skills to develop an understanding of the library based on the code base and existing available documentation. Also that you have sufficient development skills to be able to fix issues in the library yourself. (Pull Requests fixing issues will obviously be appreciated.)

There are many excellent alternative JavaScript grid libraries (both paid and free) to consider if the above does not align with your grid library needs and expectations.

# Release information

 Version | Date        | Details
---------|-------------|---------
 0.4.5   | 12 Dec 2023 | Fix Single/MultiHeadingDataRowArrayServerSet field index initialisation<br>Change license to MIT NON-AI
 0.4.4   | 28 Sep 2023 | Update typescript-eslint to 6 
 0.4.3   | 19 Sep 2023 | Fix packaging issue
 0.4.2   | 19 Sep 2023 | Fix animation scheduling issue<br>Remove RowMetadata from DataRowArrayDataServer<br>Fix grid setting verticalGridLinesVisible<br>Add grid setting visibleVerticalGridLinesDrawnInFixedAndPreMainOnly<br>Set default for many standard grid settings to undefined
 0.4.1   | 12 Sep 2023 | Add recordMoved, recordReplaced & recordsReplaced to RevRecordStore.RecordsEventers<br>Improve RevRecordDataServer consistency checks<br>Fix move active column
 0.4.0   | 25 Aug 2023 | Fix Paint AutoWidening<br>Add StandardTextPainter (contains behavior previously in StandardTextCellPainter)<br>Remove StandardTextCellPainter<br>Add StandardCheckboxPainter (contains behavior previously in StandardCheckboxCellPainter)<br>Remove Text settings (move behavior into Standard settings)<br>Rename RevRecordMainDataServer to RevRecordDataServer<br>Split out "Multi Heading" and "Single Heading" server sets from "Data Row Array" server set<br>Delete RevRecordHeaderDataServer (use Single Heading server instead)<br>Rename simpletestapp to dratestapp (short for datarowarraytestapp)<br>Refactor checkbox to allow better re-use<br>Fix Checkbox editor readonly<br>Fix column width autosize not narrowing<br>Initialise StandardElementCellEditor to be hidden<br>Remove focus control from StandardElementCellEditor
 0.3.0   | 18 Aug 2023 | Update packages<br>Fix recommended-requiring-type-checking linting errors<br>Fix & improve animation scheduling<br>Add immediate Animation<br>Add selection methods to class Revgrid<br>Change default for setting multipleSelectionAreas to true<br>Remove EnableContinuousRepaint setting<br>Rename mouseMultiCellRectangleSelection* settings to mouseAddToggleExtendSelectionArea*<br>Add switchNewRectangleSelectionToRowOrColumn setting<br>Rename selectOnly... to clearSelect... Rename selectToggle... to toggleSelect...<br>Hide FocusSelectBehavior and expose its public methods through Revgrid<br>Hide FocusScrollBehavior and expose its public methods through Revgrid<br>Rename CanvasManager to Canvas<br>Add return type to Revgrid.getSelectedRectangles()<br>Prevent selection extending from changing focus<br>Fix column moving when not scrollable<br>Fix right click select<br>Fix Selection adjustForDeleted LastArea<br>Fix ContiguousIndexRangeList.adjustForDeleted()<br>Put includeAll param in Selection.getRowIndices()<br>Add Selection.getRowIndicesIncludeAll()<br>Implement Selection.isSelectedCellTheOnlySelectedCell()<br>Replace Selection.CellSelectedType with SelectionAreaTypeId<br>Include All in SelectionAreaTypeId<br>Fix initialise of Standard Element Cell Editor when opened by key<br>Change CellEditor readonly setter to defer to method setReadOnly() to allow overriding
 0.2.2   | 03 Aug 2023 | Rename CellEditor methods and events<br>Implement Focus invalidate editor<br>Fix Renderer invalidate view<br>Fix bug in Point.adjustForRangeDeleted<br>Remove ScrollbarClassPrefix setting<br>Rework Mouse selection grid settings<br>Add InsertRecords text box to recordtestapp<br>Add support for Focus and Selection in recordtestapp
 0.2.1   | 25 Jul 2023 | Rework revgridId so works with ShadowDom<br>Add options: firstGeneratedIdFromBaseIsAlsoNumbered and canvasOverflowOverride<br>Set canvas display style to block<br>Rework Host, Canvas and Scroller CSS<br>Refactor ScrollDimensionComputedEvent handlers<br>Rename ModelUpdateId to ServerNotificationId<br>Make Revgrid.renderer public<br>
 0.2.0   | 19 Jul 2023 | Expose SchemaServer in Revgrid<br>Make Scrollers public in Revgrid<br>Fix scroller inside overlap<br>Change UiController LinedHoverCell to be initialised to null<br>Move start and stop into Revgrid.active<br>Fix Scroller resize logic<br>Change Canvas and Scroller CSS class and id<br>Fix focus row/column only<br>Make ScrollDimension start, size and viewportSize never undefined<br>Fix painting animation<br>Restore LastRectangleFirstCellStash<br>Fix calculateLastSelectionBounds()<br>Fix reindex<br>Add revgridId and internalParent to classes<br>Prevent invalidation if canvas does not have bounds<br>ViewLayout tracks Scroller<br>Change settings default for scrollHorizontallySmoothly and visibleColumnWidthAdjust<br>Fix vertical click scroll<br>Fix rows loaded adjusting scroll anchor<br>Add scrollerThickness grid setting<br>Fix VerticalScrollAnchor finishAnchorLimitIndex
 0.1.17  | 09 Jul 2023 | Separate text settings from standard settings<br>Change AllowEvents to Active<br>Move horizontalAlign from Text to Standard settings<br>Export ViewLayout to public<br>Improve Refactor AutoSizeColumnWidth<br>Implement settings.merge<br>Implement rowStripeBackgroundColor<br>Add Focus row changed event<br>Implement single and multi heading DataRowArray server sets<br>Make some Revgrid constructor parameters public<br>Rename container element to host element<br>Rename UiBehavior to UiController
 0.1.16  | 21 Jun 2023 | Remove column settings from field and implement merge settings.
 0.1.15  | 20 Jun 2023 | SchemaField is now independent of SchemaServer and includes column Settings. Refactor settings.
 0.1.14  | 19 Jun 2023 | Fix dev dependency issue
 0.1.13  | 19 Jun 2023 | A major rewrite of this library.  Substantial changes to API.
