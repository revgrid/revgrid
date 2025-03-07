/** @public */
export interface RevSourcedFieldCustomHeadings {
    tryGetFieldHeading(sourceName: string, fieldName: string): string | undefined;
}
