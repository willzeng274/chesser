import { Squares } from "./chess";

export type SquareValue = (typeof Squares)[keyof typeof Squares];

export type MouchEvent = Event & Partial<MouseEvent & TouchEvent>;