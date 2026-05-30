/** @public */
export const RevRecordValueRecentChangeTypeId = {
    Update: 0,
    Increase: 1,
    Decrease: 2,
} as const;

/** @public */
export type RevRecordValueRecentChangeTypeId = (typeof RevRecordValueRecentChangeTypeId)[keyof typeof RevRecordValueRecentChangeTypeId];
