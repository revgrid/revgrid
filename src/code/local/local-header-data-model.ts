
import { Hypegrid } from '../grid/hypegrid';
import { DataModel } from '../model/data-model';
import { SchemaModel } from '../model/schema-model';

export class LocalHeaderDataModel implements DataModel {

    // readonly dataRow: DataModel.DataRowObject;

    constructor(private readonly grid: Hypegrid) { }

    getRowCount() {
        return 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getValue(schemaColumn: SchemaModel.Column, y: number) {
        return schemaColumn.header ?? schemaColumn.name;
    }

    getSchema() {
        const schemaDataModel = this.grid.behavior.schemaModel;
        if (schemaDataModel === undefined) {
            return [];
        } else {
            return schemaDataModel.getSchema();
        }
    }

    // setValue(x: number, y: number, value: string) {
    //     if (y < this.getRowCount()) {
    //         this.grid.behavior.getColumn(x).header = value;
    //     }
    // }

    // getRow(y: number) {
    //     return this.dataRow;
    // }
}
