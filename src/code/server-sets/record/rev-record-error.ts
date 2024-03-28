import { InternalError, UnreachableCaseInternalError } from '@xilytix/sysutils';

/** @public */
export class RevRecordUnexpectedUndefinedError extends InternalError {
    constructor(code: string, message?: string) {
        super(code, message, 'RevRecord:UnexpectedUndefined');
    }
}

/** @public */
export class RevRecordAssertError extends InternalError {
    constructor(code: string, message?: string) {
        super(code, message, 'RevRecord:Assert');
    }
}

/** @public */
export class RevRecordUnreachableCaseError extends UnreachableCaseInternalError {
    constructor(code: string, value: never) {
        super(code, value, undefined, 'RevRecord:UnreachableCase');
    }
}

/** @public */
export abstract class RevRecordExternalError extends Error {
    constructor(public readonly code: string, message: string | undefined, baseMessage: string) {
        super(`Revgrid Error: ${code}: ${message === undefined ? baseMessage : `${baseMessage}: ${message}`}`);
    }
}

/** @public */
export class RevRecordSchemaError extends RevRecordExternalError {
    constructor(code: string, message: string) {
        super(code, message, 'Schema');
    }
}

/** @public */
export class RevRecordDataError extends RevRecordExternalError {
    constructor(code: string, message: string) {
        super(code, message, 'Data');
    }
}

/** @public */
export class RevRecordRowError extends RevRecordExternalError {
    constructor(code: string, message: string) {
        super(code, message, 'RecordRow');
    }
}
