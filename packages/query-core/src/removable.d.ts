export declare abstract class Removable {
    #private;
    gcTime: number;
    destroy(): void;
    protected scheduleGc(): void;
    protected updateGcTime(newGcTime: number | undefined): void;
    protected clearGcTimeout(): void;
    protected abstract optionalRemove(): void;
}
//# sourceMappingURL=removable.d.ts.map