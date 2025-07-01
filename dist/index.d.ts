import { U as UserOptions, D as Directive, I as IfToken, a as IfStatement, b as DefineToken, c as DefineStatement, M as MessageToken, d as MessageStatement, S as SimpleToken, e as SimpleNode, P as ProgramNode, C as Comment } from './types-DINME5SR.js';
export { l as CodeStatement, k as CodeToken, f as Context, F as FunctionDirective, G as Generate, h as Lex, L as Lexer, j as ObjectDirective, O as Options, i as Parse, g as Parser, T as Transform, r as resolveOptions, s as sortUserDirectives } from './types-DINME5SR.js';
import * as _unplugin from 'unplugin';
import { UnpluginFactory } from 'unplugin';
import 'vite';
import 'magic-string';

declare const unpluginFactory: UnpluginFactory<UserOptions | undefined>;
declare const unplugin: _unplugin.UnpluginInstance<UserOptions | undefined, boolean>;

declare function resolveConditional(test: string, env?: NodeJS.ProcessEnv): boolean;
declare const ifDirective: Directive<IfToken, IfStatement>;

declare const theDefineDirective: Directive<DefineToken, DefineStatement>;

declare const MessageDirective: Directive<MessageToken, MessageStatement>;

declare function defineDirective<T extends Omit<SimpleToken, 'start' | 'end'>, N extends SimpleNode>(directive: Directive<T, N>): Directive<T, N>;

declare function simpleMatchToken<T = SimpleToken>(comment: string, regex: RegExp): T | undefined;
declare function createProgramNode(body?: SimpleNode[]): ProgramNode;
declare function isComment(line: string): boolean;
declare function parseComment(line: string): {
    type: string | undefined;
    content: string;
};
declare function findComment(type: string): Comment;

declare const comments: Comment[];

export { Comment, DefineStatement, DefineToken, Directive, IfStatement, IfToken, MessageDirective, MessageStatement, MessageToken, ProgramNode, SimpleNode, SimpleToken, UserOptions, comments, createProgramNode, defineDirective, findComment, ifDirective, isComment, parseComment, resolveConditional, simpleMatchToken, theDefineDirective, unplugin, unpluginFactory };
