import type { Generate, SimpleNode } from '../types'
import { findComment } from '../utils'

export abstract class Generator {
  abstract walk(node: SimpleNode, insideReplacement?: boolean): string | void

  constructor(public node: SimpleNode, public generates: Generate[] = []) {}

  protected generate(): string | MagicStringNode[] {
    return this.walk(this.node) as string | MagicStringNode[]
  }
}

export class SimpleGenerator extends Generator {
  walk(node: SimpleNode): string | void {
    switch (node.type) {
      case 'Program':
        return node.body.map(this.walk.bind(this)).filter((n: any) => !!n).join('\n')
      case 'CodeStatement':
        return node.value
    }

    for (const generate of this.generates) {
      const comment = findComment(node.comment!)
      const generated = generate.call(this, node, comment)
      if (generated)
        return generated
    }

    throw new Error(`Generator: Unknown node type: ${node.type}`)
  }

  protected generate() {
    return this.walk(this.node) as string
  }

  static generate(node: SimpleNode, generates: Generate[] = []) {
    return new this(node, generates).generate()
  }
}

interface MagicStringNode {
  start: number
  end: number
  value: string
}

export class SourcemapGenerator extends Generator {
  private magicStringEdits: MagicStringNode[]

  constructor(public node: SimpleNode, public generates: Generate[] = []) {
    super(node, generates)
    this.magicStringEdits = []
  }

  walk(node: SimpleNode, insideReplacement: boolean): string | void {
    switch (node.type) {
      case 'Program':
        if (node.replace && !insideReplacement) {
          this.magicStringEdits.push({
            start: node.start as number,
            end: node.end as number,
            value: node.body.map((n: SimpleNode) => this.walk(n, true)).filter((n: any) => !!n).join('\n'),
          })
        }
        else { return node.body.map((n: SimpleNode) => this.walk(n, insideReplacement)).filter((n: any) => !!n).join('\n') }

        return
      case 'CodeStatement':
        return node.value
    }

    for (const generate of this.generates) {
      const comment = findComment(node.comment!)
      const generated = generate.call(this, node, comment)
      if (generated)
        return generated
    }

    throw new Error(`Generator: Unknown node type: ${node.type}`)
  }

  protected generate() {
    this.walk(this.node, false)

    // sort the edits by start position
    return this.magicStringEdits.toSorted((a, b) => a.start - b.start)
  }

  static generate(node: SimpleNode, generates: Generate[] = []) {
    return new SourcemapGenerator(node, generates).generate()
  }
}
