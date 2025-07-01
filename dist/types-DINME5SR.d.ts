import { Logger, FilterPattern } from 'vite';
import * as magic_string from 'magic-string';

declare class Lexer {
    code: string;
    lexers: Lex[];
    current: number;
    tokens: SimpleToken[];
    constructor(code: string, lexers?: Lex[]);
    private lex;
    static lex(code: string, lexers?: Lex[]): SimpleToken[];
}

declare class Parser {
    tokens: SimpleToken[];
    parsers: Parse[];
    ast: ProgramNode;
    current: number;
    constructor(tokens: SimpleToken[], parsers?: Parse[]);
    walk(): CodeStatement | {
        comment: string | undefined;
        type: string;
        start?: number | undefined;
        end?: number | undefined;
    };
    private parse;
    static parse(tokens: SimpleToken[], parsers?: Parse[]): ProgramNode;
}

declare function resolveOptions(options?: UserOptions): Required<UserOptions>;
declare function sortUserDirectives(directives: ObjectDirective[]): [ObjectDirective[], ObjectDirective[], ObjectDirective[]];
declare class Context {
    options: Required<UserOptions>;
    directives: ObjectDirective[];
    lexers: Lex[];
    parsers: Parse[];
    transforms: Transform[];
    generates: Generate[];
    filter: (id: string) => boolean;
    env: Record<string, any>;
    logger: Logger;
    constructor(options?: UserOptions);
    loadEnv(mode?: string): Record<string, string>;
    transform(code: string, _id: string): string | undefined;
    transformWithMap(code: string, _id: string): {
        code: string;
        map: magic_string.SourceMap;
    };
}

declare class Transformer {
    program: ProgramNode;
    transforms: Transform[];
    constructor(program: ProgramNode, transforms?: Transform[]);
    walk(node: SimpleNode): SimpleNode | void;
    private transform;
    static transform(program: ProgramNode, transforms?: Transform[]): void | SimpleNode;
}

declare abstract class Generator {
    node: SimpleNode;
    generates: Generate[];
    abstract walk(node: SimpleNode, insideReplacement?: boolean): string | void;
    constructor(node: SimpleNode, generates?: Generate[]);
    protected generate(): string | MagicStringNode[];
}
interface MagicStringNode {
    start: number;
    end: number;
    value: string;
}

/**
 * TODO: this interface needs to be split so the
 * so directives don't need to be required to provide
 * start and end properties
 */
interface SimpleToken {
    comment?: string;
    type: string;
    value: string;
    start?: number;
    end?: number;
    [x: string]: any;
}
/**
 * TODO: the issue above also related to this interface
 * since the start and end are often copied over directly
 */
interface SimpleNode {
    comment?: string;
    type: string;
    start?: number;
    end?: number;
    [x: string]: any;
}
type Lex<T = SimpleToken> = (this: Lexer, currentLine: string) => (T | void);
type Parse<T = SimpleToken, N = SimpleNode> = (this: Parser, currentToken: T) => (N | void);
type Transform<N = SimpleNode, ResultN = SimpleNode> = (this: Transformer, currentNode: N) => (ResultN | void);
type Generate = (this: Generator, ast: SimpleNode, comment?: Comment) => (string | void);
interface ObjectDirective<T = SimpleToken, N = SimpleNode> {
    enforce?: 'pre' | 'post';
    lex: Lex<T>;
    parse: Parse<T, N>;
    transform: Transform<N>;
    generate: Generate;
}
interface FunctionDirective<T = SimpleToken, N = SimpleNode> {
    (context: Context): ObjectDirective<T, N>;
}
type Directive<T = SimpleToken, N = SimpleNode> = ObjectDirective<T, N> | FunctionDirective<T, N>;

interface CodeToken extends SimpleToken {
    type: 'code';
    value: string;
}
interface IfToken extends SimpleToken {
    type: 'if' | 'else' | 'elif' | 'endif';
    value: string;
}
interface DefineToken extends SimpleToken {
    type: 'define' | 'undef';
    value: string;
}
interface MessageToken extends SimpleToken {
    type: 'error' | 'warning' | 'info';
    value: string;
}

interface ProgramNode extends SimpleNode {
    type: 'Program';
    body: SimpleNode[];
}
interface CodeStatement extends SimpleNode {
    type: 'CodeStatement';
    value: string;
}
interface IfStatement extends SimpleNode {
    type: 'IfStatement';
    test: string;
    consequent: SimpleNode[];
    alternate: SimpleNode[];
    kind: IfToken['type'];
}
interface DefineStatement extends SimpleNode {
    type: 'DefineStatement';
    kind: 'define' | 'undef';
    value: string;
}
interface MessageStatement extends SimpleNode {
    type: 'MessageStatement';
    kind: 'error' | 'warning' | 'info';
    value: string;
}

interface Comment {
    type: string;
    start: string;
    end: string;
    regex: RegExp;
}

interface Options {
    cwd: string;
    directives: Directive[];
    include: FilterPattern;
    exclude: FilterPattern;
}
interface UserOptions extends Partial<Options> {
}

export { type Comment as C, type Directive as D, type FunctionDirective as F, type Generate as G, type IfToken as I, Lexer as L, type MessageToken as M, type Options as O, type ProgramNode as P, type SimpleToken as S, type Transform as T, type UserOptions as U, type IfStatement as a, type DefineToken as b, type DefineStatement as c, type MessageStatement as d, type SimpleNode as e, Context as f, Parser as g, type Lex as h, type Parse as i, type ObjectDirective as j, type CodeToken as k, type CodeStatement as l, resolveOptions as r, sortUserDirectives as s };
