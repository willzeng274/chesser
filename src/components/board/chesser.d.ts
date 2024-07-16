type CustomElement<T> = Partial<T & DOMAttributes<T> & { children?: React.Node }>;

type DivClone = CustomElement<HTMLDivElement>;

declare namespace JSX {
    interface IntrinsicElements {
        'cr-container': DivClone;
        'cr-board': DivClone;
        'cr-square': DivClone;
        'cr-piece': DivClone;
        'cr-coords': DivClone;
        'cr-coord': DivClone;
    }
}