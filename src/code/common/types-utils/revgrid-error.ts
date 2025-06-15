import { InternalError, UnreachableCaseInternalError } from '@pbkware/js-utils';

/** @public */
export class RevAssertError extends InternalError {
    constructor(code: string, message?: string) {
        super(code, message, 'Rev:Assert');
    }
}

/** @public */
export class RevUnreachableCaseError extends UnreachableCaseInternalError {
    constructor(code: string, value: never) {
        super(code, value, undefined, 'Rev:UnreachableCase');
    }
}

/** @public */
export class RevOptionsError extends InternalError {
    constructor(code: string, message?: string) {
        super(code, message, 'Rev:Options');
    }
}

/** @public */
export class RevApiError extends InternalError {
    constructor(code: string, message: string) {
        super(code, message, 'Rev:API');
    }
}
