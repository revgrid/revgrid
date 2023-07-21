
export class IdRegistry {
    private readonly _baseIds = new Map<string, number>();

    resolveId(optionsId: string | undefined, hostElementId: string) {
        if (optionsId !== undefined) {
            const baseIdCount = this._baseIds.get(optionsId);
            if (baseIdCount === undefined) {
                this._baseIds.set(optionsId, 1);
            }
            return optionsId;
        } else {
            // create a unique Id based on host element
            let baseCreateCount = this._baseIds.get(hostElementId);
            if (baseCreateCount === undefined) {
                this._baseIds.set(hostElementId, 1);
                return hostElementId;
            } else {
                this._baseIds.set(hostElementId, ++baseCreateCount);
                return hostElementId + baseCreateCount.toString(10);
            }
        }
    }
}
