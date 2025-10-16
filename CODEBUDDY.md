# CODEBUDDY.md This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Overview

`webfunny_dejs` is a JavaScript code analysis and deobfuscation tool that specializes in runtime function decryption. It uses Babel's AST parser to analyze JavaScript code, extract and decrypt obfuscated functions, and simplify code by replacing function calls with their computed constant values.

## Development Commands

### Installation
```bash
npm install
```

### Running the Tool
```bash
# Basic usage
node de.js -f input.js

# Specify output file
node de.js -f input.js -o output.js

# Verbose mode with debugging
node de.js -f input.js -v -d

# Custom function name pattern
node de.js -f input.js --function-name "f\\d+"
```

## Architecture and Core Components

### Main Entry Point: `de.js`
- **Location**: Root directory
- **Purpose**: CLI tool entry point with comprehensive command-line argument parsing
- **Key Dependencies**: 
  - Babel parser, traverse, and generator for AST manipulation
  - Node.js VM for safe function execution
  - yargs for CLI argument parsing

### Processing Pipeline
1. **Preprocessing**: Handles string reverse operations (`"hello".split("").reverse().join("")` → `"olleh"`)
2. **AST Analysis**: Uses Babel parser to build abstract syntax tree
3. **Function Extraction**: Identifies functions matching specific patterns (default: `f\d+`)
4. **Dependency Analysis**: Resolves function call dependencies and topological sorting
5. **Runtime Execution**: Executes extracted functions in isolated VM environment
6. **Code Replacement**: Replaces function calls with computed constant values
7. **Cleanup**: Optionally comments or removes decrypted functions

### Key Architecture Features

#### Function Extraction Strategy
- **Pattern Matching**: Default intercepts functions named like `f123`, `f456`, etc.
- **Dependency Resolution**: Handles nested function calls and topological sorting
- **Immediate Functions**: Processes IIFEs (Immediately Invoked Function Expressions)

#### VM Execution Environment
- **Isolated Context**: Creates safe execution environment using Node.js VM
- **Function Instrumentation**: Optional debug tracing for function execution
- **Timeout Protection**: 30-second execution timeout to prevent infinite loops

#### AST-Based Replacement
- **Precise Targeting**: Uses AST traversal to replace specific call expressions
- **Type-Safe Replacement**: Handles different result types (string, number, boolean, null, undefined)
- **Context Preservation**: Maintains code structure and comments

### Configuration System

The tool uses a comprehensive configuration object with CLI-driven parameters:

```javascript
const config = {
  decryptStringReverse: true,      // Process string reverse operations
  decryptFunctionCalls: true,       // Process function calls
  verbose: false,                   // Verbose output
  debug: false,                     // Debug mode with tracing
  interceptPattern: /f\d+/,         // Function name pattern
  minArgs: 4,                       // Minimum function arguments
  maxArgs: 6,                       // Maximum function arguments
  cleanupFunctions: 'none'          // Function cleanup mode
};
```

### Sample Files

- `sample.js`, `sample2.js`, `sample3.js`: Example obfuscated JavaScript files for testing
- `a.js`: Additional test file

## Common Development Tasks

### Adding New Function Patterns
1. Modify the `interceptPattern` regex in the configuration
2. Update argument count constraints in `minArgs`/`maxArgs`
3. Test with sample files

### Debugging Function Execution
```bash
node de.js -f input.js -d --output-debug debug.log
```

### Extending String Processing
- Add new string transformation patterns to `processStringReverse` function
- Ensure pattern matching and replacement logic is robust

### Modifying AST Processing
- Work with Babel AST nodes in `applyCallExpressionReplacements`
- Use Babel's traverse and generate functions for AST manipulation

## Important Code Patterns

### Function Dependency Resolution
The tool implements a topological sort algorithm to handle function dependencies:
```javascript
function topologicalSort(graph) {
  // Ensures functions are extracted in dependency order
}
```

### Safe Function Execution
Functions are executed in a controlled VM environment with error handling:
```javascript
function safeCall(func, args, callStr) {
  // Wraps function calls with timing and error handling
}
```

### AST-Based Transformation
Code modifications are performed at the AST level for precision:
```javascript
function applyCallExpressionReplacements(code, callExpressionMap) {
  // Uses Babel AST to replace call expressions with computed values
}
```

## Testing and Validation

Use the provided sample files to test changes:
```bash
node de.js -f sample.js -v
node de.js -f sample2.js -o sample2_decrypted.js
node de.js -f sample3.js -d --function-name "f[0-9]+"
```

## Performance Considerations

- The tool is designed for batch processing of obfuscated JavaScript files
- VM execution adds overhead but ensures safety
- AST manipulation is memory-intensive for large files
- Consider file size when processing large codebases

## Security Notes

- The tool runs in a sandboxed VM environment
- Only processes JavaScript code - no file system or network access
- Use caution when processing untrusted code
- Default timeout prevents infinite execution