import { DataServer } from '../../interfaces/data/data-server';
import { MainSubgrid } from '../../interfaces/data/main-subgrid';
import { MetaModel } from '../../interfaces/data/meta-model';
import { Subgrid } from '../../interfaces/data/subgrid';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { AssertError } from '../../types-utils/revgrid-error';
import { ColumnsManager } from '../column/columns-manager';
import { MainSubgridImplementation } from './main-subgrid-implementation';
import { SubgridImplementation } from './subgrid-implementation';

/** @public */
export class SubgridsManager<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    readonly mainSubgrid: MainSubgrid<BCS, SF>;
    readonly subgrids: Subgrid<BCS, SF>[];
    /** @internal */
    readonly subgridImplementations = new Array<SubgridImplementation<BGS, BCS, SF>>();
    /** @internal */
    readonly _handledSubgrids = new Array<SubgridImplementation<BGS, BCS, SF> | undefined>();

    /** @internal */
    constructor(
        /** @internal */
        private readonly _gridSettings: BGS,
        /** @internal */
        private readonly _columnsManager: ColumnsManager<BGS, BCS, SF>,
        definitions: Subgrid.Definition<BCS, SF>[],
    ) {
        this.subgrids = this.subgridImplementations;
        let mainSubgrid: MainSubgrid<BCS, SF> | undefined;
        const subgrids = this.subgridImplementations;
        definitions.sort((left, right) => Subgrid.Role.gridOrderCompare(left.role, right.role));
        for (const definition of definitions) {
            if (definition !== undefined) {
                const subgridHandle = this._handledSubgrids.length;
                const subgrid = this.createSubgridFromDefinition(subgridHandle, definition);
                subgrids.push(subgrid);
                this._handledSubgrids.push(subgrid);
                if (subgrid.role === Subgrid.RoleEnum.main) {
                    mainSubgrid = subgrid as MainSubgridImplementation<BGS, BCS, SF>;
                }
            }
        }

        if (mainSubgrid === undefined) {
            throw new AssertError('SMSS98224', 'Subgrid Specs does not include main');
        } else {
            this.mainSubgrid = mainSubgrid;
        }
    }

    /** @internal */
    destroy() {
        this.destroySubgrids();
    }

    /** @internal */
    getSubgridByHandle(handle: SubgridImplementation.Handle) { return this._handledSubgrids[handle]; }

    /**
     * @summary Resolves a `subgridSpec` to a Subgrid (and its DataModel).
     * @desc The spec may describe either an existing data model, or a constructor for a new data model.
     * @returns either Subgrid or MainSubgrid depending on role specified in Spec
     */
    private createSubgridFromDefinition(
        subgridHandle: SubgridImplementation.Handle,
        definition: Subgrid.Definition<BCS, SF>,
    ) {
        const role = definition.role ?? Subgrid.Role.defaultRole;
        const isMainRole = role === Subgrid.RoleEnum.main;

        let dataServer = definition.dataServer;
        if (typeof dataServer === 'function') {
            dataServer = new dataServer();
        }
        let metaModel = definition.metaModel;
        if (typeof metaModel === 'function') {
            metaModel = new metaModel();
        }

        const rowHeightsCanDiffer = definition.rowPropertiesCanSpecifyRowHeight === true;
        let selectable = definition.selectable;
        if (selectable === undefined) {
            selectable = isMainRole;
        }
        return this.createSubgrid(
            subgridHandle,
            role,
            dataServer,
            metaModel,
            selectable,
            definition.defaultRowHeight,
            rowHeightsCanDiffer,
            definition.rowPropertiesPrototype,
            definition.getCellPainterEventer,
        );
    }

    /** @returns either Subgrid or MainSubgrid depending on role */
    private createSubgrid(
        subgridHandle: SubgridImplementation.Handle,
        role: Subgrid.Role, dataServer: DataServer<SF>, metaModel: MetaModel | undefined,
        selectable: boolean,
        defaultRowHeight: number | undefined, rowHeightsCanDiffer: boolean,
        rowPropertiesPrototype: MetaModel.RowPropertiesPrototype | undefined,
        getCellPainterEventer: Subgrid.GetCellPainterEventer<BCS, SF>,
    ) {
        let subgrid: SubgridImplementation<BGS, BCS, SF>;
        if (role === Subgrid.RoleEnum.main) {
            subgrid = new MainSubgridImplementation<BGS, BCS, SF>(
                this._gridSettings,
                this._columnsManager,
                subgridHandle,
                role,
                this._columnsManager.schemaServer,
                dataServer,
                metaModel,
                selectable,
                defaultRowHeight,
                rowHeightsCanDiffer,
                rowPropertiesPrototype,
                getCellPainterEventer,
            );
        } else {
            subgrid = new SubgridImplementation(
                this._gridSettings,
                this._columnsManager,
                subgridHandle,
                role,
                this._columnsManager.schemaServer,
                dataServer,
                metaModel,
                selectable,
                defaultRowHeight,
                rowHeightsCanDiffer,
                rowPropertiesPrototype,
                getCellPainterEventer,
            );
        }

        return subgrid;
    }

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
            height += subgridCount * this._gridSettings.horizontalGridLinesWidth; // includes gridline before these subgrids
        }

        return height;
    }

    calculatePostMainAndFooterHeights(): SubgridsManager.PostMainAndFooterHeights {
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

    calculateSummariesFootersHeights(): SubgridsManager.SummariesFootersHeights {
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
     * @summary Gets the total number of rows across all subgrids.
     */
    getAllRowCount() {
        let count = 0;
        for (const subgrid of this.subgridImplementations) {
            count += subgrid.getRowCount();
        }
        return count;
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
export namespace SubgridsManager {
    export type LoadedEventer = (this: void) => void;

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
