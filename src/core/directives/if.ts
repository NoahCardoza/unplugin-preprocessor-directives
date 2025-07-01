import process from 'node:process'
import { defineDirective } from '../directive'
import type { IfStatement, IfToken, SimpleNode } from '../types'
import { simpleMatchToken } from '../utils'

export function resolveConditional(test: string, env = process.env) {
  test = test || 'true'
  test = test.trim()
  test = test.replace(/([^=!])=([^=])/g, '$1==$2')

  // eslint-disable-next-line no-new-func
  const evaluateCondition = new Function('env', `with (env){ return ( ${test} ) }`)

  try {
    return evaluateCondition(env) === 'false' ? false : !!evaluateCondition(env)
  }
  catch (error) {
    if (error instanceof ReferenceError) {
      const match = /(\w*?) is not defined/g.exec(error.message)
      if (match && match[1]) {
        const name = match[1]
        // @ts-expect-error ignore
        env[name] = false
        return resolveConditional(test, env)
      }
    }
    return false
  }
}

// function getRangeFromTokens(tokens: SimpleNode[]) {
//   return {
//     start: Math.min(...tokens.map(t => t.start || Number.POSITIVE_INFINITY)),
//     end: Math.max(...tokens.map(t => t.end || Number.NEGATIVE_INFINITY)),
//   }
// }

export const ifDirective = defineDirective<IfToken, IfStatement>((context) => {
  return {
    lex(comment) {
      return simpleMatchToken(comment, /#(if|else|elif|endif)\s?(.*)/)
    },
    parse(token) {
      if (token.type === 'if' || token.type === 'elif' || token.type === 'else') {
        const node: IfStatement = {
          type: 'IfStatement',
          test: token.value,
          consequent: [],
          alternate: [],
          kind: token.type,
          start: token.start,
          end: token.end,
        }
        this.current++

        while (this.current < this.tokens.length) {
          const nextToken = this.tokens[this.current]

          if (nextToken.type === 'elif' || nextToken.type === 'else') {
            node.alternate.push(this.walk())
            node.end = Math.max(node.end || Number.NEGATIVE_INFINITY, ...node.alternate.map(n => n.end || Number.NEGATIVE_INFINITY))
            break
          }
          else if (nextToken.type === 'endif') {
            this.current++ // Skip 'endif'
            node.end = nextToken.end
            break
          }
          else {
            node.consequent.push(this.walk())
            node.end = Math.max(node.end || Number.NEGATIVE_INFINITY, ...node.consequent.map(n => n.end || Number.NEGATIVE_INFINITY))
          }
        }

        return node
      }
    },
    transform(node) {
      if (node.type === 'IfStatement') {
        if (resolveConditional(node.test, context.env)) {
          return {
            type: 'Program',
            body: node.consequent.map(this.walk.bind(this)).filter(n => n != null),
            // range: getRangeFromTokens(node.consequent),
            start: node.start,
            end: node.end, // Math.max(...node.consequent.map(n => n.end)) || node.end,
            replace: true,
          }
        }
        else if (node.alternate) {
          return {
            type: 'Program',
            body: node.alternate.map(this.walk.bind(this)).filter(n => n != null),
            // range: getRangeFromTokens(node.alternate),
            start: node.start, // Math.min(...node.alternate.map(n => n.start)) || node.start,
            end: node.end,
            replace: true,
          }
        }
      }
    },
    generate(node, comment) {
      if (node.type === 'IfStatement' && comment) {
        let code = ''
        if (node.kind === 'else')
          code = `${comment.start} ${node.kind} ${comment.end}`

        else
          code = `${comment.start} #${node.kind} ${node.test}${comment.end}`

        const consequentCode = node.consequent.map(this.walk.bind(this)).join('\n')
        code += `\n${consequentCode}`
        if (node.alternate.length) {
          const alternateCode = node.alternate.map(this.walk.bind(this)).join('\n')
          code += `\n${alternateCode}`
        }
        else {
          code += `\n${comment.start} #endif ${comment.end}`
        }
        return code
      }
    },
  }
})
