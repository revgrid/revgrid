import { RevAssertError, RevClientObject, RevDataServer, RevMetaServer, RevSchemaField } from '../../../common';
import { RevMainSubgrid } from '../../interfaces/main-subgrid';
import { RevSubgrid } from '../../interfaces/subgrid';
import { RevBehavioredColumnSettings, RevGridSettings } from '../../settings';
import { RevColumnsManager } from '../column/columns-manager';
import { RevMainSubgridImplementation } from './main-subgrid-implementation';
import { RevSubgridImplementation } from './subgrid-implementation';

/** @public */
export class RevSubgridsManager<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    readonly subgrids: RevSubgrid<BCS, SF>[];
    readonly mainSubgrid: RevMainSubgrid<BCS, SF>;
    readonly headerSubgrid: RevSubgrid<BCS, SF> | undefined;
    readonly filterSubgrid: RevSubgrid<BCS, SF> | undefined;
    readonly summarySubgrid: RevSubgrid<BCS, SF> | undefined;
    readonly footerSubgrid: RevSubgrid<BCS, SF> | undefined;

    readonly mainDataServer: RevDataServer<SF>;

    /** @internal */
    readonly subgridImplementations = new Array<RevSubgridImplementation<BCS, SF>>();
    /** @internal */
    readonly _handledSubgrids = new Array<RevSubgridImplementation<BCS, SF> | undefined>();

    /** @internal */
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        /** @internal */
        private readonly _gridSettings: RevGridSettings,
        /** @internal */
        private readonly _columnsManager: RevColumnsManager<BCS, SF>,
        definitions: RevSubgrid.Definition<BCS, SF>[],
    ) {
        this.subgrids = this.subgridImplementations;
        const subgrids = this.subgridImplementations;
        definitions.sort((left, right) => RevSubgrid.Role.gridOrderCompare(left.role, right.role));
        for (const definition of definitions) {
            const subgridHandle = this._handledSubgrids.length;
            const subgrid = this.createSubgridFromDefinition(subgridHandle, definition);
            subgrids.push(subgrid);
            this._handledSubgrids.push(subgrid);
            const role = subgrid.role;
            switch (role) {
                case 'header': this.headerSubgrid = subgrid; break;
                case 'filter': this.filterSubgrid = subgrid; break;
                case 'main': this.mainSubgrid = subgrid as RevMainSubgrid<BCS, SF>; break;
                case 'summary': this.summarySubgrid = subgrid; break;
                case 'footer': this.footerSubgrid = subgrid; break;
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this.mainSubgrid === undefined) {
            throw new RevAssertError('SMSS98224', 'Subgrid Specs does not include main');
        } else {
            this.mainDataServer = this.mainSubgrid.dataServer;
        }
    }

    /** @internal */
    destroy() {
        this.destroySubgrids();
    }

    getSubgridWithDataServer(dataServer: RevDataServer<SF>): RevSubgrid<BCS, SF> {
        return this.getSubgridImplementationWithDataServer(dataServer);
    }

    /** @internal */
    getSubgridImplementationWithDataServer(dataServer: RevDataServer<SF>): RevSubgrid<BCS, SF> {
        if (dataServer === this.mainDataServer) {
            return this.mainSubgrid;
        } else {
            const subgridImplementations = this.subgridImplementations;
            const count = subgridImplementations.length;
            for (let i = 0; i < count; i++) {
                const subgrid = subgridImplementations[i];
                if (subgrid.dataServer === dataServer) {
                    return subgrid;
                }
            }
            throw new RevAssertError('SMGSWDS98224');
        }
    }

    /** @internal */
    getSubgridByHandle(handle: RevSubgridImplementation.Handle) { return this._handledSubgrids[handle]; }

    calculateRowCount() {
        const subgrids = this.subgridImplementations;
        const subgridCount = subgrids.length;
        let count = 0;
        for (let i = 0; i < subgridCount; i++) {
            const subgrid = subgrids[i];
            count += subgrid.getRowCount();
        }
        return count;
    }

    calculatePreMainRowCount() {
        let count = 0;
        for (const subgrid of this.subgridImplementations) {
            if (subgrid.isMain) {
                break;
            }
            count += subgrid.getRowCount();
        }
        return count;
    }

    calculatePreMainHeight() {
        let height = 0;
        let subgridCount = 0;
        for (const subgrid of this.subgridImplementations) {
            if (subgrid.isMain) {
                break;
            }
            height += subgrid.calculateHeight();
            subgridCount++;
        }
        if (subgridCount > 1) {
            height += (subgridCount - 1) * this._gridSettings.horizontalGridLinesWidth
        }
        return height;
    }

    calculatePreMainPlusFixedRowCount() {
        return this.calculatePreMainRowCount() + this._gridSettings.fixedRowCount;
    }

    calculatePreMainPlusFixedRowsHeight(): number {
        const subgrids = this.subgridImplementations;
        const subgridCount = subgrids.length;

        let preSubgridCountPlusFixedRowCount = 0;
        let height = 0;

        for (let subgridIndex = 0; subgridIndex < subgridCount; subgridIndex++) {
            const subgrid = subgrids[subgridIndex];
            if (!subgrid.isMain) {
                height += subgrid.calculateHeight();
                preSubgridCountPlusFixedRowCount++;
            } else {
                const fixedRowCount = this._gridSettings.fixedRowCount;
                if (fixedRowCount > 0) {
                    preSubgridCountPlusFixedRowCount += fixedRowCount;
                    for (let fixedRowIndex = 0; fixedRowIndex < fixedRowCount; fixedRowIndex++) {
                        height += subgrid.getRowHeight(fixedRowIndex);
                    }
                }

                break;
            }
        }

        if (preSubgridCountPlusFixedRowCount > 0) {
            // Add grid lines between pre subgrids and fixed rows and add grid line after last of these
            const gridSettings = this._gridSettings;
            const gridLinesHWidth = gridSettings.horizontalGridLinesWidth;
            height += (preSubgridCountPlusFixedRowCount - 1) * gridLinesHWidth;
            const fixedLinesHWidth = gridSettings.horizontalFixedLineWidth;
            height += fixedLinesHWidth === undefined ? gridLinesHWidth : fixedLinesHWidth;
        }

        return height;
    }

    calculatePreMainPlusFixedRowCountAndHeight(): RevSubgridsManager.CountAndHeight {
        const subgrids = this.subgridImplementations;
        const subgridCount = subgrids.length;

        let preSubgridCountPlusFixedRowCount = 0;
        let rowCount = 0;
        let height = 0;

        for (let subgridIndex = 0; subgridIndex < subgridCount; subgridIndex++) {
            const subgrid = subgrids[subgridIndex];
            if (!subgrid.isMain) {
                const subgridRowCountAndHeight= subgrid.calculateRowCountAndHeight();
                rowCount += subgridRowCountAndHeight.count;
                height += subgridRowCountAndHeight.height;
                preSubgridCountPlusFixedRowCount++;
            } else {
                const fixedRowCount = this._gridSettings.fixedRowCount;
                if (fixedRowCount > 0) {
                    preSubgridCountPlusFixedRowCount += fixedRowCount;
                    rowCount += fixedRowCount;
                    for (let fixedRowIndex = 0; fixedRowIndex < fixedRowCount; fixedRowIndex++) {
                        height += subgrid.getRowHeight(fixedRowIndex);
                    }
                }

                break;
            }
        }

        if (preSubgridCountPlusFixedRowCount > 0) {
            // Add grid lines between pre subgrids and fixed rows and add grid line after last of these
            const gridSettings = this._gridSettings;
            const gridLinesHWidth = gridSettings.horizontalGridLinesWidth;
            height += (preSubgridCountPlusFixedRowCount - 1) * gridLinesHWidth;
            const fixedLinesHWidth = gridSettings.horizontalFixedLineWidth;
            height += fixedLinesHWidth === undefined ? gridLinesHWidth : fixedLinesHWidth;
        }

        return {
            count: rowCount,
            height,
        };
    }

    calculatePostMainRowCount() {
        let count = 0;
        let hadMain = false;
        for (const subgrid of this.subgridImplementations) {
            if (hadMain) {
                count += subgrid.getRowCount();
            }
            if (subgrid.isMain) {
                hadMain = true;
            }
        }
        return count;
    }

    calculatePostMainHeight(): number {
        let hadMain = false;
        let height = 0;
        let subgridCount = 0;
        for (const subgrid of this.subgridImplementations) {
            if (hadMain) {
                const subgridHeight = subgrid.calculateHeight();
                height += subgridHeight;
                subgridCount++;
            }
            if (subgrid.isMain) {
                hadMain = true;
            }
        }

        if (subgridCount > 1) {
            height += (subgridCount - 1) * this._gridSettings.horizontalGridLinesWidth; // includes gridline before these subgrids
        }

        return height;
    }

    calculatePostMainAndFooterHeights(): RevSubgridsManager.PostMainAndFooterHeights {
        let hadMain = false;
        let othersHeight = 0;
        let footersHeight = 0;
        let footerSubgridCount = 0
        let otherSubgridCount = 0;
        for (const subgrid of this.subgridImplementations) {
            if (hadMain) {
                const subgridHeight = subgrid.calculateHeight();
                if (subgrid.isFooter) {
                    footersHeight += subgridHeight;
                    footerSubgridCount++;
                } else {
                    othersHeight += subgridHeight;
                    otherSubgridCount++;
                }
            }
            if (subgrid.isMain) {
                hadMain = true;
            }
        }

        if (footerSubgridCount > 1) {
            footersHeight += (footerSubgridCount - 1) * this._gridSettings.horizontalGridLinesWidth;
        }

        let allPostMainSubgridsHeight = footersHeight + othersHeight;
        const allPostMainSubgridCount = footerSubgridCount + otherSubgridCount;
        if (allPostMainSubgridCount > 1) {
            allPostMainSubgridsHeight += (allPostMainSubgridCount - 1) * this._gridSettings.horizontalGridLinesWidth
        }

        return {
            allPostMainSubgridsHeight,
            footersHeight,
        }
    }

    calculateSummariesFootersHeights(): RevSubgridsManager.SummariesFootersHeights {
        let summariesHeight = 0;
        let footersHeight = 0;
        let footerSubgridCount = 0;
        let summarySubgridCount = 0;
        for (const subgrid of this.subgridImplementations) {
            if (subgrid.isFooter) {
                footersHeight += subgrid.calculateHeight();
                footerSubgridCount++;
            } else {
                if (subgrid.isSummary) {
                    summariesHeight += subgrid.calculateHeight();
                    summarySubgridCount++;
                }
            }
        }
        if (footerSubgridCount > 1) {
            summariesHeight += (footerSubgridCount - 1) * this._gridSettings.horizontalGridLinesWidth
        }
        if (summarySubgridCount > 1) {
            footersHeight += (summarySubgridCount - 1) * this._gridSettings.horizontalGridLinesWidth
        }
        let summariesPlusFootersHeight = summariesHeight + footersHeight;
        if (summariesHeight > 0 && footersHeight > 0) {
            summariesPlusFootersHeight += this._gridSettings.horizontalGridLinesWidth;
        }
        return {
            summariesHeight,
            footersHeight,
            summariesPlusFootersHeight,
        }
    }

    calculatePrePostMainRowcount() {
        let count = 0;
        for (const subgrid of this.subgridImplementations) {
            if (!subgrid.isMain) {
                count += subgrid.getRowCount();
            }
        }
        return count;
    }

    calculateFootersHeight() {
        let height = 0;
        for (const subgrid of this.subgridImplementations) {
            if (subgrid.isFooter) {
                height += subgrid.calculateHeight();
            }
        }
        return height;
    }

    /**
     * Gets the total number of rows across all subgrids.
     */
    getAllRowCount() {
        let count = 0;
        for (const subgrid of this.subgridImplementations) {
            count += subgrid.getRowCount();
        }
        return count;
    }

    /**
     * Resolves a `subgridSpec` to a Subgrid (and its DataModel).
     * @remarks The spec may describe either an existing data model, or a constructor for a new data model.
     * @returns either Subgrid or MainSubgrid depending on role specified in Spec
     * @internal
     */
    private createSubgridFromDefinition(
        subgridHandle: RevSubgridImplementation.Handle,
        definition: RevSubgrid.Definition<BCS, SF>,
    ) {
        const role = definition.role ?? RevSubgrid.Role.defaultRole;
        const isMainRole = role === RevSubgrid.Role.main;

        let dataServer = definition.dataServer;
        if (typeof dataServer === 'function') {
            dataServer = new dataServer();
        }
        let metaServer = definition.metaServer;
        if (typeof metaServer === 'function') {
            metaServer = new metaServer();
        }

        const rowHeightsCanDiffer = definition.rowPropertiesCanSpecifyRowHeight === true;
        let selectable = definition.selectable;
        if (selectable === undefined) {
            selectable = isMainRole;
        }
        let focusable = definition.focusable;
        if (focusable === undefined) {
            focusable = isMainRole;
        }
        return this.createSubgrid(
            subgridHandle,
            role,
            dataServer,
            metaServer,
            focusable,
            selectable,
            definition.defaultRowHeight,
            rowHeightsCanDiffer,
            definition.rowPropertiesPrototype,
            definition.getCellPainterEventer,
        );
    }

    /**
     * @returns either Subgrid or MainSubgrid depending on role
     * @internal
     */
    private createSubgrid(
        subgridHandle: RevSubgridImplementation.Handle,
        role: RevSubgrid.Role, dataServer: RevDataServer<SF>, metaServer: RevMetaServer | undefined,
        focusable: boolean,
        selectable: boolean,
        defaultRowHeight: number | undefined, rowHeightsCanDiffer: boolean,
        rowPropertiesPrototype: RevMetaServer.RowPropertiesPrototype | undefined,
        getCellPainterEventer: RevSubgrid.GetCellPainterEventer<BCS, SF>,
    ) {
        let subgrid: RevSubgridImplementation<BCS, SF>;
        if (role === RevSubgrid.Role.main) {
            subgrid = new RevMainSubgridImplementation<BCS, SF>(
                this._gridSettings,
                this._columnsManager,
                subgridHandle,
                role,
                this._columnsManager.schemaServer,
                dataServer,
                metaServer,
                focusable,
                selectable,
                defaultRowHeight,
                rowHeightsCanDiffer,
                rowPropertiesPrototype,
                getCellPainterEventer,
            );
        } else {
            subgrid = new RevSubgridImplementation(
                this._gridSettings,
                this._columnsManager,
                subgridHandle,
                role,
                this._columnsManager.schemaServer,
                dataServer,
                metaServer,
                focusable,
                selectable,
                defaultRowHeight,
                rowHeightsCanDiffer,
                rowPropertiesPrototype,
                getCellPainterEventer,
            );
        }

        return subgrid;
    }

    /** @internal */
    private destroySubgrids() {
        const subgridCount = this.subgridImplementations.length;
        for (let i = subgridCount - 1; i > 0; i--) {
            const subgrid = this.subgridImplementations[i];
            subgrid.destroy();
        }
        this.subgridImplementations.length = 0;

        const handledSubgrids = this._handledSubgrids;
        const handledSubgridCount = handledSubgrids.length;
        for (let i = 0; i < handledSubgridCount; i++) {
            handledSubgrids[i] = undefined;
        }
    }
}

/** @public */
export namespace RevSubgridsManager {
    export interface CountAndHeight {
        count: number; // number of rows
        height: number; // height of all rows in pixels
    }

    export interface SummariesFootersHeights {
        summariesHeight: number;
        footersHeight: number;
        summariesPlusFootersHeight: number;
    }

    export interface PostMainAndFooterHeights {
        allPostMainSubgridsHeight: number;
        footersHeight: number;
    }
}
