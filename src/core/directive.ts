import type { Directive, SimpleNode, SimpleToken } from './types/index'

export function defineDirective<T extends Omit<SimpleToken, 'start' | 'end'>, N extends SimpleNode>(directive: Directive<T, N>) {
  return directive
}
