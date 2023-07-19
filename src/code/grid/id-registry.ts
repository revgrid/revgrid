import { AssertError, OptionsError } from './types-utils/revgrid-error';

export class IdRegistry {
    private readonly _registeredIds = new Array<string>();
    private _nextInternallyCreatedIdNumber = 1;

    createOrRegisterId(id: string | undefined) {
        if (id === undefined || id === '') {
            id = this.createAndRegisterId();
        } else {
            this.registerId(id);
        }
        return id;
    }

    private createAndRegisterId() {
        let id: string;
        do {
            const idNumber = this._nextInternallyCreatedIdNumber++;
            id = idNumber.toString(10);
        } while (this._registeredIds.includes(id));
        this._registeredIds.push(id);
        return id;
    }

    private registerId(id: string) {
        if (this._registeredIds.includes(id)) {
            throw new OptionsError('IRRI20691', `id is not unique "${id}`);
        } else {
            this._registeredIds.push(id);
        }
    }

    deregisterId(id: string) {
        const index = this._registeredIds.findIndex((registeredId) => registeredId === id);
        if (index < 0) {
            throw new AssertError('IRDI20691', id.toString());
        } else {
            this._registeredIds.splice(index, 1);
        }
    }
}
