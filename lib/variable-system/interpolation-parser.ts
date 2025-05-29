/**
 * Variable Interpolation Parser
 * 
 * Parses @variable syntax in text content, supporting complex expressions,
 * conditionals, formatting, and transformation functions.
 */

// =============================================================================
// AST NODE TYPES
// =============================================================================

export interface ASTNode {
  type: string
  position: { start: number; end: number }
}

export interface VariableNode extends ASTNode {
  type: 'variable'
  name: string
  modifiers?: ModifierNode[]
}

export interface ConditionalNode extends ASTNode {
  type: 'conditional'
  condition: ExpressionNode
  thenBranch: ExpressionNode
  elseBranch?: ExpressionNode
}

export interface FunctionNode extends ASTNode {
  type: 'function'
  name: string
  arguments: ExpressionNode[]
}

export interface LiteralNode extends ASTNode {
  type: 'literal'
  value: string | number | boolean
}

export interface ModifierNode extends ASTNode {
  type: 'modifier'
  name: string
  arguments?: ExpressionNode[]
}

export interface InterpolationNode extends ASTNode {
  type: 'interpolation'
  expression: ExpressionNode
  rawText: string
}

export type ExpressionNode = 
  | VariableNode 
  | ConditionalNode 
  | FunctionNode 
  | LiteralNode

// =============================================================================
// TOKEN TYPES
// =============================================================================

export interface Token {
  type: TokenType
  value: string
  position: { start: number; end: number }
}

export enum TokenType {
  AT = 'AT',                    // @
  IDENTIFIER = 'IDENTIFIER',    // variable names, function names
  DOT = 'DOT',                  // .
  PIPE = 'PIPE',                // |
  COLON = 'COLON',              // :
  QUESTION = 'QUESTION',        // ?
  EXCLAMATION = 'EXCLAMATION',  // !
  LPAREN = 'LPAREN',            // (
  RPAREN = 'RPAREN',            // )
  LBRACE = 'LBRACE',            // {
  RBRACE = 'RBRACE',            // }
  COMMA = 'COMMA',              // ,
  STRING = 'STRING',            // "string" or 'string'
  NUMBER = 'NUMBER',            // 123, 45.67
  BOOLEAN = 'BOOLEAN',          // true, false
  IF = 'IF',                    // if
  THEN = 'THEN',                // then
  ELSE = 'ELSE',                // else
  WHITESPACE = 'WHITESPACE',    // spaces, tabs
  EOF = 'EOF',                  // end of input
  UNKNOWN = 'UNKNOWN'           // unrecognized tokens
}

// =============================================================================
// PARSING RESULT TYPES
// =============================================================================

export interface ParseResult {
  success: boolean
  interpolations: InterpolationNode[]
  dependencies: string[]
  errors: ParseError[]
  originalText: string
}

export interface ParseError {
  message: string
  position: { start: number; end: number }
  severity: 'error' | 'warning'
}

// =============================================================================
// TOKENIZER
// =============================================================================

export class Tokenizer {
  private position = 0
  private line = 1
  private column = 1

  constructor(private input: string) {}

  tokenize(): Token[] {
    const tokens: Token[] = []
    this.position = 0
    this.line = 1
    this.column = 1

    while (this.position < this.input.length) {
      const token = this.nextToken()
      if (token) {
        tokens.push(token)
      }
    }

    tokens.push({
      type: TokenType.EOF,
      value: '',
      position: { start: this.position, end: this.position }
    })

    return tokens
  }

  private nextToken(): Token | null {
    this.skipWhitespace()

    if (this.position >= this.input.length) {
      return null
    }

    const start = this.position
    const char = this.currentChar()

    // Single character tokens
    switch (char) {
      case '@': return this.createToken(TokenType.AT, this.advance())
      case '.': return this.createToken(TokenType.DOT, this.advance())
      case '|': return this.createToken(TokenType.PIPE, this.advance())
      case ':': return this.createToken(TokenType.COLON, this.advance())
      case '?': return this.createToken(TokenType.QUESTION, this.advance())
      case '!': return this.createToken(TokenType.EXCLAMATION, this.advance())
      case '(': return this.createToken(TokenType.LPAREN, this.advance())
      case ')': return this.createToken(TokenType.RPAREN, this.advance())
      case '{': return this.createToken(TokenType.LBRACE, this.advance())
      case '}': return this.createToken(TokenType.RBRACE, this.advance())
      case ',': return this.createToken(TokenType.COMMA, this.advance())
    }

    // String literals
    if (char === '"' || char === "'") {
      return this.tokenizeString(char)
    }

    // Numbers
    if (this.isDigit(char)) {
      return this.tokenizeNumber()
    }

    // Identifiers and keywords
    if (this.isAlpha(char) || char === '_') {
      return this.tokenizeIdentifier()
    }

    // Unknown character
    return this.createToken(TokenType.UNKNOWN, this.advance())
  }

  private tokenizeString(quote: string): Token {
    const start = this.position
    this.advance() // Skip opening quote

    let value = ''
    let escaped = false

    while (this.position < this.input.length) {
      const char = this.currentChar()

      if (escaped) {
        value += char
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        this.advance() // Skip closing quote
        break
      } else {
        value += char
      }

      this.advance()
    }

    return {
      type: TokenType.STRING,
      value,
      position: { start, end: this.position }
    }
  }

  private tokenizeNumber(): Token {
    const start = this.position
    let value = ''
    let hasDot = false

    while (this.position < this.input.length) {
      const char = this.currentChar()

      if (this.isDigit(char)) {
        value += char
        this.advance()
      } else if (char === '.' && !hasDot) {
        hasDot = true
        value += char
        this.advance()
      } else {
        break
      }
    }

    return {
      type: TokenType.NUMBER,
      value,
      position: { start, end: this.position }
    }
  }

  private tokenizeIdentifier(): Token {
    const start = this.position
    let value = ''

    while (this.position < this.input.length) {
      const char = this.currentChar()

      if (this.isAlphaNumeric(char) || char === '_') {
        value += char
        this.advance()
      } else {
        break
      }
    }

    // Check for keywords
    let type = TokenType.IDENTIFIER
    switch (value.toLowerCase()) {
      case 'if': type = TokenType.IF; break
      case 'then': type = TokenType.THEN; break
      case 'else': type = TokenType.ELSE; break
      case 'true':
      case 'false': type = TokenType.BOOLEAN; break
    }

    return {
      type,
      value,
      position: { start, end: this.position }
    }
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && this.isWhitespace(this.currentChar())) {
      if (this.currentChar() === '\n') {
        this.line++
        this.column = 1
      } else {
        this.column++
      }
      this.position++
    }
  }

  private currentChar(): string {
    return this.input[this.position] || ''
  }

  private advance(): string {
    const char = this.currentChar()
    this.position++
    this.column++
    return char
  }

  private createToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      position: { start: this.position - value.length, end: this.position }
    }
  }

  private isWhitespace(char: string): boolean {
    return /\s/.test(char)
  }

  private isDigit(char: string): boolean {
    return /\d/.test(char)
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z]/.test(char)
  }

  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9]/.test(char)
  }
}

// =============================================================================
// PARSER
// =============================================================================

export class InterpolationParser {
  private tokens: Token[] = []
  private position = 0
  private errors: ParseError[] = []

  parse(text: string): ParseResult {
    const interpolations: InterpolationNode[] = []
    const dependencies = new Set<string>()
    this.errors = []

    // Find all @variable patterns in the text
    const interpolationRegex = /@\{[^}]*\}|@[a-zA-Z_][a-zA-Z0-9_]*/g
    let match: RegExpExecArray | null

    while ((match = interpolationRegex.exec(text)) !== null) {
      try {
        const rawText = match[0]
        const position = { start: match.index, end: match.index + rawText.length }
        
        // Parse the interpolation expression
        const expression = this.parseInterpolationExpression(rawText, position.start)
        
        const interpolation: InterpolationNode = {
          type: 'interpolation',
          expression,
          rawText,
          position
        }

        interpolations.push(interpolation)

        // Extract dependencies
        this.extractDependencies(expression, dependencies)

      } catch (error) {
        this.addError(
          `Failed to parse interpolation: ${error}`,
          { start: match.index, end: match.index + match[0].length },
          'error'
        )
      }
    }

    return {
      success: this.errors.filter(e => e.severity === 'error').length === 0,
      interpolations,
      dependencies: Array.from(dependencies),
      errors: this.errors,
      originalText: text
    }
  }

  private parseInterpolationExpression(text: string, offset: number): ExpressionNode {
    // Remove @ prefix and optional braces
    let expression = text.slice(1) // Remove @
    if (expression.startsWith('{') && expression.endsWith('}')) {
      expression = expression.slice(1, -1) // Remove { }
    }

    // Tokenize the expression
    const tokenizer = new Tokenizer(expression)
    this.tokens = tokenizer.tokenize()
    this.position = 0

    return this.parseExpression()
  }

  private parseExpression(): ExpressionNode {
    return this.parseConditional()
  }

  private parseConditional(): ExpressionNode {
    let expression = this.parsePipe()

    if (this.match(TokenType.QUESTION)) {
      const condition = expression
      const thenBranch = this.parseExpression()
      
      let elseBranch: ExpressionNode | undefined
      if (this.match(TokenType.COLON)) {
        elseBranch = this.parseExpression()
      }

      const start = condition.position.start
      const end = elseBranch ? elseBranch.position.end : thenBranch.position.end

      return {
        type: 'conditional',
        condition,
        thenBranch,
        elseBranch,
        position: { start, end }
      }
    }

    return expression
  }

  private parsePipe(): ExpressionNode {
    let expression = this.parseFunction()

    while (this.match(TokenType.PIPE)) {
      const functionName = this.consume(TokenType.IDENTIFIER, 'Expected function name after pipe')
      const args: ExpressionNode[] = [expression] // First argument is the piped value

      if (this.match(TokenType.LPAREN)) {
        args.push(...this.parseArgumentList())
        this.consume(TokenType.RPAREN, 'Expected closing parenthesis')
      }

      const start = expression.position.start
      const end = this.previous().position.end

      expression = {
        type: 'function',
        name: functionName.value,
        arguments: args,
        position: { start, end }
      }
    }

    return expression
  }

  private parseFunction(): ExpressionNode {
    return this.parsePrimary()
  }

  private parsePrimary(): ExpressionNode {
    const token = this.peek()

    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.previous().value
      const start = this.previous().position.start
      let end = this.previous().position.end

      // Check for function call
      if (this.match(TokenType.LPAREN)) {
        const args = this.parseArgumentList()
        this.consume(TokenType.RPAREN, 'Expected closing parenthesis')
        end = this.previous().position.end

        return {
          type: 'function',
          name,
          arguments: args,
          position: { start, end }
        }
      }

      // Variable reference
      return {
        type: 'variable',
        name,
        position: { start, end }
      }
    }

    if (this.match(TokenType.STRING)) {
      const value = this.previous().value
      return {
        type: 'literal',
        value,
        position: this.previous().position
      }
    }

    if (this.match(TokenType.NUMBER)) {
      const value = parseFloat(this.previous().value)
      return {
        type: 'literal',
        value,
        position: this.previous().position
      }
    }

    if (this.match(TokenType.BOOLEAN)) {
      const value = this.previous().value === 'true'
      return {
        type: 'literal',
        value,
        position: this.previous().position
      }
    }

    if (this.match(TokenType.LPAREN)) {
      const expression = this.parseExpression()
      this.consume(TokenType.RPAREN, 'Expected closing parenthesis')
      return expression
    }

    throw new Error(`Unexpected token: ${token.type}`)
  }

  private parseArgumentList(): ExpressionNode[] {
    const args: ExpressionNode[] = []

    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.parseExpression())
      } while (this.match(TokenType.COMMA))
    }

    return args
  }

  private extractDependencies(node: ExpressionNode, dependencies: Set<string>): void {
    switch (node.type) {
      case 'variable':
        dependencies.add(node.name)
        break
      case 'conditional':
        this.extractDependencies(node.condition, dependencies)
        this.extractDependencies(node.thenBranch, dependencies)
        if (node.elseBranch) {
          this.extractDependencies(node.elseBranch, dependencies)
        }
        break
      case 'function':
        node.arguments.forEach(arg => this.extractDependencies(arg, dependencies))
        break
    }
  }

  // Parser utility methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }
    return false
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.position++
    return this.previous()
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF
  }

  private peek(): Token {
    return this.tokens[this.position] || this.tokens[this.tokens.length - 1]
  }

  private previous(): Token {
    return this.tokens[this.position - 1]
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance()
    
    const token = this.peek()
    this.addError(message, token.position, 'error')
    throw new Error(message)
  }

  private addError(message: string, position: { start: number; end: number }, severity: 'error' | 'warning'): void {
    this.errors.push({ message, position, severity })
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Parse text content for @variable interpolations
 */
export function parseInterpolations(text: string): ParseResult {
  const parser = new InterpolationParser()
  return parser.parse(text)
}

/**
 * Extract all variable dependencies from text
 */
export function extractVariableDependencies(text: string): string[] {
  const result = parseInterpolations(text)
  return result.dependencies
}

/**
 * Check if text contains variable interpolations
 */
export function hasInterpolations(text: string): boolean {
  return /@\{[^}]*\}|@[a-zA-Z_][a-zA-Z0-9_]*/.test(text)
}

/**
 * Escape literal @ symbols in text
 */
export function escapeAtSymbols(text: string): string {
  return text.replace(/@@/g, '@')
} 