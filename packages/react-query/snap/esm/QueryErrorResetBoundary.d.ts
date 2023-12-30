import * as React from 'react';
export interface QueryErrorResetBoundaryValue {
    clearReset: () => void;
    isReset: () => boolean;
    reset: () => void;
}
export declare const useQueryErrorResetBoundary: () => QueryErrorResetBoundaryValue;
export interface QueryErrorResetBoundaryProps {
    children: ((value: QueryErrorResetBoundaryValue) => React.ReactNode) | React.ReactNode;
}
export declare const QueryErrorResetBoundary: ({ children, }: QueryErrorResetBoundaryProps) => React.JSX.Element;
//# sourceMappingURL=QueryErrorResetBoundary.d.ts.map