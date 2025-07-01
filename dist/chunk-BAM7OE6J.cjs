"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/core/constant.ts
var comments = [
  // js
  {
    type: "js",
    start: "// ",
    end: "",
    regex: /^\/\/\s?(.*)$/
  },
  // jsx
  {
    type: "jsx",
    start: "{/* ",
    end: " */}",
    regex: /^\{\s?\/\*\s?(.*)\s?\*\/\s?\}$/
  },
  // css
  {
    type: "css",
    start: "/* ",
    end: " */",
    regex: /^\/\*\s?(.*)\*\/$/
  },
  // html
  {
    type: "html",
    start: "<!-- ",
    end: " -->",
    regex: /^<!--\s?(.*)-->$/
  }
];

// src/core/utils.ts
function simpleMatchToken(comment, regex) {
  var _a;
  const match = comment.match(regex);
  if (match) {
    return {
      type: match[1],
      value: (_a = match[2]) == null ? void 0 : _a.trim()
    };
  }
}
function createProgramNode(body = []) {
  return {
    type: "Program",
    body
  };
}
function isComment(line) {
  return comments.some((comment) => comment.regex.test(line));
}
function parseComment(line) {
  var _a, _b;
  const comment = comments.find((comment2) => comment2.start === line.slice(0, comment2.start.length));
  const content = (_a = comment == null ? void 0 : comment.regex.exec(line)) == null ? void 0 : _a[1];
  return {
    type: comment == null ? void 0 : comment.type,
    content: (_b = content == null ? void 0 : content.trim()) != null ? _b : ""
  };
}
function findComment(type) {
  return comments.find((comment) => comment.type === type);
}

// src/core/context/lexer.ts
var Lexer = class _Lexer {
  constructor(code, lexers = []) {
    this.code = code;
    this.lexers = lexers;
    this.current = 0;
    this.tokens = [];
  }
  lex() {
    const code = this.code;
    scanner:
      while (this.current < code.length) {
        const startIndex = this.current;
        let endIndex = code.indexOf("\n", startIndex + 1);
        if (endIndex === -1)
          endIndex = code.length;
        else
          endIndex += 1;
        const line = code.slice(startIndex, endIndex).trim();
        if (isComment(line)) {
          for (const lex of this.lexers) {
            const comment = parseComment(line);
            const token = lex.bind(this)(comment.content);
            if (token) {
              this.tokens.push(__spreadProps(__spreadValues({
                comment: comment.type
              }, token), {
                start: startIndex,
                end: endIndex
              }));
              this.current = endIndex;
              continue scanner;
            }
          }
        }
        this.tokens.push({
          type: "code",
          value: line,
          start: startIndex,
          end: endIndex
        });
        this.current = endIndex;
      }
    return this.tokens;
  }
  static lex(code, lexers = []) {
    const lexer = new _Lexer(code, lexers);
    return lexer.lex();
  }
};

// src/core/context/parser.ts
var Parser = class _Parser {
  constructor(tokens, parsers = []) {
    this.tokens = tokens;
    this.parsers = parsers;
    this.ast = createProgramNode();
    this.current = 0;
  }
  walk() {
    const token = this.tokens[this.current];
    if (token.type === "code") {
      this.current++;
      return { type: "CodeStatement", value: token.value, start: token.start, end: token.end };
    }
    for (const parser of this.parsers) {
      const node = parser.bind(this)(token);
      if (node)
        return __spreadValues({ comment: token.comment }, node);
    }
    throw new Error(`Parser: Unknown token type: ${token.type}`);
  }
  parse() {
    while (this.current < this.tokens.length)
      this.ast.body.push(this.walk());
    return this.ast;
  }
  static parse(tokens, parsers = []) {
    const parser = new _Parser(tokens, parsers);
    return parser.parse();
  }
};

// src/core/context/index.ts
var _process = require('process'); var _process2 = _interopRequireDefault(_process);
var _vite = require('vite');
var _magicstring = require('magic-string'); var _magicstring2 = _interopRequireDefault(_magicstring);

// src/core/context/generator.ts
var Generator = class {
  constructor(node, generates = []) {
    this.node = node;
    this.generates = generates;
  }
  generate() {
    return this.walk(this.node);
  }
};
var SimpleGenerator = class extends Generator {
  walk(node) {
    switch (node.type) {
      case "Program":
        return node.body.map(this.walk.bind(this)).filter((n) => !!n).join("\n");
      case "CodeStatement":
        return node.value;
    }
    for (const generate of this.generates) {
      const comment = findComment(node.comment);
      const generated = generate.call(this, node, comment);
      if (generated)
        return generated;
    }
    throw new Error(`Generator: Unknown node type: ${node.type}`);
  }
  generate() {
    return this.walk(this.node);
  }
  static generate(node, generates = []) {
    return new this(node, generates).generate();
  }
};
var SourcemapGenerator = class _SourcemapGenerator extends Generator {
  constructor(node, generates = []) {
    super(node, generates);
    this.node = node;
    this.generates = generates;
    this.magicStringEdits = [];
  }
  walk(node, insideReplacement) {
    switch (node.type) {
      case "Program":
        if (node.replace && !insideReplacement) {
          this.magicStringEdits.push({
            start: node.start,
            end: node.end,
            value: node.body.map((n) => this.walk(n, true)).filter((n) => !!n).join("\n")
          });
        } else {
          return node.body.map((n) => this.walk(n, insideReplacement)).filter((n) => !!n).join("\n");
        }
        return;
      case "CodeStatement":
        return node.value;
    }
    for (const generate of this.generates) {
      const comment = findComment(node.comment);
      const generated = generate.call(this, node, comment);
      if (generated)
        return generated;
    }
    throw new Error(`Generator: Unknown node type: ${node.type}`);
  }
  generate() {
    this.walk(this.node, false);
    return this.magicStringEdits.toSorted((a, b) => a.start - b.start);
  }
  static generate(node, generates = []) {
    return new _SourcemapGenerator(node, generates).generate();
  }
};

// src/core/context/transformer.ts
var Transformer = class _Transformer {
  constructor(program, transforms = []) {
    this.program = program;
    this.transforms = transforms;
  }
  walk(node) {
    switch (node.type) {
      case "Program":
        return __spreadProps(__spreadValues({}, node), {
          body: node.body.map(this.walk.bind(this)).filter((n) => !!n)
        });
      case "CodeStatement":
        return node;
    }
    for (const transformer of this.transforms) {
      const transformed = transformer.bind(this)(node);
      if (transformed)
        return transformed;
    }
    throw new Error(`Transformer: Unknown node type: ${node.type}`);
  }
  transform() {
    const ast = this.walk(this.program);
    return ast;
  }
  static transform(program, transforms = []) {
    const transformer = new _Transformer(program, transforms);
    return transformer.transform();
  }
};

// src/core/context/index.ts
function resolveOptions(options) {
  return __spreadValues({
    cwd: _process2.default.cwd(),
    include: ["**/*"],
    exclude: [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/],
    directives: []
  }, options);
}
function sortUserDirectives(directives) {
  const preDirectives = [];
  const postDirectives = [];
  const normalDirectives = [];
  if (directives) {
    directives.forEach((p) => {
      if (p.enforce === "pre")
        preDirectives.push(p);
      else if (p.enforce === "post")
        postDirectives.push(p);
      else
        normalDirectives.push(p);
    });
  }
  return [preDirectives, normalDirectives, postDirectives];
}
var Context = class {
  constructor(options) {
    this.env = _process2.default.env;
    this.options = resolveOptions(options);
    this.directives = sortUserDirectives(this.options.directives.map((d) => typeof d === "function" ? d(this) : d)).flat();
    this.lexers = this.directives.map((d) => d.lex);
    this.parsers = this.directives.map((d) => d.parse);
    this.transforms = this.directives.map((d) => d.transform);
    this.generates = this.directives.map((d) => d.generate);
    this.filter = _vite.createFilter.call(void 0, this.options.include, this.options.exclude);
    this.logger = _vite.createLogger.call(void 0, void 0, {
      prefix: "unplugin-preprocessor-directives"
    });
    this.env = this.loadEnv();
  }
  loadEnv(mode = _process2.default.env.NODE_ENV || "development") {
    return _vite.loadEnv.call(void 0, 
      mode,
      this.options.cwd,
      ""
    );
  }
  transform(code, _id) {
    const tokens = Lexer.lex(code, this.lexers);
    const ast = Parser.parse(tokens, this.parsers);
    const transformed = Transformer.transform(ast, this.transforms);
    if (transformed)
      return SimpleGenerator.generate(transformed, this.generates);
  }
  transformWithMap(code, _id) {
    const tokens = Lexer.lex(code, this.lexers);
    const ast = Parser.parse(tokens, this.parsers);
    const transformed = Transformer.transform(ast, this.transforms);
    const ms = new (0, _magicstring2.default)(code, { filename: _id });
    const generateSourcemap = () => {
      return {
        code: ms.toString(),
        map: ms.generateMap({
          hires: true
        })
      };
    };
    if (!transformed)
      return generateSourcemap();
    const generated = SourcemapGenerator.generate(transformed, this.generates);
    if (!(generated == null ? void 0 : generated.length))
      return generateSourcemap();
    generated.forEach((edit) => {
      ms.overwrite(edit.start, edit.end, edit.value);
    });
    return generateSourcemap();
  }
};

// src/core/directive.ts
function defineDirective(directive) {
  return directive;
}

// src/core/directives/if.ts

function resolveConditional(test, env = _process2.default.env) {
  test = test || "true";
  test = test.trim();
  test = test.replace(/([^=!])=([^=])/g, "$1==$2");
  const evaluateCondition = new Function("env", `with (env){ return ( ${test} ) }`);
  try {
    return evaluateCondition(env) === "false" ? false : !!evaluateCondition(env);
  } catch (error) {
    if (error instanceof ReferenceError) {
      const match = /(\w*?) is not defined/g.exec(error.message);
      if (match && match[1]) {
        const name = match[1];
        env[name] = false;
        return resolveConditional(test, env);
      }
    }
    return false;
  }
}
var ifDirective = defineDirective((context) => {
  return {
    lex(comment) {
      return simpleMatchToken(comment, /#(if|else|elif|endif)\s?(.*)/);
    },
    parse(token) {
      if (token.type === "if" || token.type === "elif" || token.type === "else") {
        const node = {
          type: "IfStatement",
          test: token.value,
          consequent: [],
          alternate: [],
          kind: token.type,
          start: token.start,
          end: token.end
        };
        this.current++;
        while (this.current < this.tokens.length) {
          const nextToken = this.tokens[this.current];
          if (nextToken.type === "elif" || nextToken.type === "else") {
            node.alternate.push(this.walk());
            node.end = Math.max(node.end || Number.NEGATIVE_INFINITY, ...node.alternate.map((n) => n.end || Number.NEGATIVE_INFINITY));
            break;
          } else if (nextToken.type === "endif") {
            this.current++;
            node.end = nextToken.end;
            break;
          } else {
            node.consequent.push(this.walk());
            node.end = Math.max(node.end || Number.NEGATIVE_INFINITY, ...node.consequent.map((n) => n.end || Number.NEGATIVE_INFINITY));
          }
        }
        return node;
      }
    },
    transform(node) {
      if (node.type === "IfStatement") {
        if (resolveConditional(node.test, context.env)) {
          return {
            type: "Program",
            body: node.consequent.map(this.walk.bind(this)).filter((n) => n != null),
            start: node.start,
            end: node.end,
            replace: true
          };
        } else if (node.alternate) {
          return {
            type: "Program",
            body: node.alternate.map(this.walk.bind(this)).filter((n) => n != null),
            start: node.start,
            end: node.end,
            replace: true
          };
        }
      }
    },
    generate(node, comment) {
      if (node.type === "IfStatement" && comment) {
        let code = "";
        if (node.kind === "else")
          code = `${comment.start} ${node.kind} ${comment.end}`;
        else
          code = `${comment.start} #${node.kind} ${node.test}${comment.end}`;
        const consequentCode = node.consequent.map(this.walk.bind(this)).join("\n");
        code += `
${consequentCode}`;
        if (node.alternate.length) {
          const alternateCode = node.alternate.map(this.walk.bind(this)).join("\n");
          code += `
${alternateCode}`;
        } else {
          code += `
${comment.start} #endif ${comment.end}`;
        }
        return code;
      }
    }
  };
});

// src/core/directives/define.ts

function resolveDefineNameAndValue(expression, env = _process2.default.env) {
  if (/^\w*$/.test(expression)) {
    return [expression, true];
  } else {
    const evaluateExpression = new Function("env", `with (env){ return {${expression.replace("=", ":")}} }`);
    return Object.entries(evaluateExpression(env))[0];
  }
}
var theDefineDirective = defineDirective((context) => ({
  lex(comment) {
    var _a, _b;
    const defineMath = comment.match(/#define\s?(.*)/);
    if (defineMath) {
      return {
        type: "define",
        value: (_a = defineMath[1]) == null ? void 0 : _a.trim()
      };
    }
    const undefMatch = comment.match(/#undef\s?(\w*)/);
    if (undefMatch) {
      return {
        type: "undef",
        value: (_b = undefMatch[1]) == null ? void 0 : _b.trim()
      };
    }
  },
  parse(token) {
    if (token.type === "define" || token.type === "undef") {
      this.current++;
      return {
        type: "DefineStatement",
        kind: token.type,
        value: token.value,
        start: token.start,
        end: token.end
      };
    }
  },
  transform(node) {
    if (node.type === "DefineStatement") {
      if (node.kind === "define") {
        const [name, value] = resolveDefineNameAndValue(node.value, context.env);
        context.env[name] = value;
      } else if (node.kind === "undef")
        context.env[node.value] = false;
      return createProgramNode();
    }
  },
  generate(node, comment) {
    if (node.type === "DefineStatement" && comment) {
      if (node.kind === "define")
        return `${comment.start} #${node.kind} ${node.value} ${comment.end}`;
      else if (node.kind === "undef")
        return `${comment.start} #${node.kind} ${node.value} ${comment.end}`;
    }
  }
}));

// src/core/directives/message.ts
var MessageDirective = defineDirective((context) => ({
  lex(comment) {
    return simpleMatchToken(comment, /#(error|warning|info)\s*(.*)/);
  },
  parse(token) {
    if (token.type === "error" || token.type === "warning" || token.type === "info") {
      this.current++;
      return {
        type: "MessageStatement",
        kind: token.type,
        value: token.value,
        start: token.start,
        end: token.end
      };
    }
  },
  transform(node) {
    if (node.type === "MessageStatement") {
      switch (node.kind) {
        case "error":
          context.logger.error(node.value, { timestamp: true });
          break;
        case "warning":
          context.logger.warn(node.value, { timestamp: true });
          break;
        case "info":
          context.logger.info(node.value, { timestamp: true });
          break;
      }
      return createProgramNode();
    }
  },
  generate(node, comment) {
    if (node.type === "MessageStatement" && comment)
      return `${comment.start} #${node.kind} ${node.value} ${comment.end}`;
  }
}));

// src/core/unplugin.ts
var _unplugin = require('unplugin');
var _remapping = require('@ampproject/remapping'); var _remapping2 = _interopRequireDefault(_remapping);
var unpluginFactory = (options) => {
  var _a;
  const ctx = new Context(__spreadProps(__spreadValues({}, options), { directives: [ifDirective, theDefineDirective, MessageDirective, ...(_a = options == null ? void 0 : options.directives) != null ? _a : []] }));
  return {
    name: "unplugin-preprocessor-directives",
    enforce: "pre",
    transform: (code, id) => ctx.transform(code, id),
    transformInclude(id) {
      return ctx.filter(id);
    },
    vite: {
      configResolved(config) {
        ctx.env = __spreadValues(__spreadValues({}, ctx.loadEnv(config.mode)), config.env);
      },
      transform(code, id) {
        if (ctx.filter(id)) {
          const transformed = ctx.transformWithMap(code, id);
          if (transformed) {
            const map = _remapping2.default.call(void 0, 
              [this.getCombinedSourcemap(), transformed.map],
              () => null
            );
            return {
              code: transformed.code,
              map
            };
          }
        }
      }
    }
  };
};
var unplugin = /* @__PURE__ */ _unplugin.createUnplugin.call(void 0, unpluginFactory);




















exports.comments = comments; exports.simpleMatchToken = simpleMatchToken; exports.createProgramNode = createProgramNode; exports.isComment = isComment; exports.parseComment = parseComment; exports.findComment = findComment; exports.Lexer = Lexer; exports.Parser = Parser; exports.resolveOptions = resolveOptions; exports.sortUserDirectives = sortUserDirectives; exports.Context = Context; exports.defineDirective = defineDirective; exports.resolveConditional = resolveConditional; exports.ifDirective = ifDirective; exports.theDefineDirective = theDefineDirective; exports.MessageDirective = MessageDirective; exports.unpluginFactory = unpluginFactory; exports.unplugin = unplugin;
