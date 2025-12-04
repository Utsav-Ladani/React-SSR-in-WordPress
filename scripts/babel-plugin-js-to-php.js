module.exports = function ({ types: t }) {
    return {
        visitor: {
            Program: {
                enter(path) {
                    if (!path.state) path.state = {};
                    path.state.functionNames = new Set();
                    path.state.importedNames = new Set();
                    // Collect all function names and imported names in the program
                    path.traverse({
                        FunctionDeclaration(funcPath) {
                            path.state.functionNames.add(funcPath.node.id.name);
                        },
                        ImportDeclaration(importPath) {
                            // Collect imported specifiers
                            importPath.node.specifiers.forEach(spec => {
                                path.state.importedNames.add(spec.local.name);
                            });
                        }
                    });
                },
                exit(path) {
                    const phpCode = path.state.phpOutput || "";
                    // Store the PHP code in metadata so the build script can retrieve it
                    path.hub.file.metadata.phpOutput = "<?php\n" + phpCode;
                    path.hub.file.metadata.dependencies = path.state.dependencies || [];
                    // Clear the body so no JS is generated
                    path.node.body = [];
                }
            },
            ImportDeclaration(path) {
                const source = path.node.source.value;
                // Simple mapping: import ... from 'x' -> require_once 'x.php';
                // We might want to adjust the extension or path.

                if (source.startsWith('@')) {
                    appendPhp(path, `require_once SERVER_MODULES_DIR . '/${source}/index.php';\n`);
                } else {
                    appendPhp(path, `require_once SERVER_BUILD_DIR . '/${source.replace('./', '').replace('.js', '.php')}';\n`);

                    // Collect dependency for recursive build
                    const program = path.findParent(p => p.isProgram());
                    if (!program.state.dependencies) program.state.dependencies = [];
                    program.state.dependencies.push(source);
                }
            },
            FunctionDeclaration: {
                enter(path) {
                    const program = path.findParent(p => p.isProgram());
                    const name = path.node.id.name;
                    const params = path.node.params.map(generateExpression).join(', ');
                    
                    // Check if this is a nested function (inside another function)
                    const parentFunc = path.getFunctionParent();
                    if (parentFunc) {
                        // Nested function - convert to closure
                        // Collect all parameters from nested functions to exclude them
                        const nestedParams = new Set();
                        path.traverse({
                            'FunctionExpression|ArrowFunctionExpression|FunctionDeclaration'(nestedPath) {
                                if (nestedPath !== path) {
                                    nestedPath.node.params.forEach(p => {
                                        nestedParams.add(p.name);
                                    });
                                }
                            }
                        });
                        
                        // Collect variables used in the function body that are from parent scope
                        const usedVars = new Set();
                        const functionParams = new Set(path.node.params.map(p => p.name));
                        
                        path.traverse({
                            Identifier(idPath) {
                                const varName = idPath.node.name;
                                // Skip: function name, function parameters, nested function parameters
                                if (varName !== name && !functionParams.has(varName) && !nestedParams.has(varName)) {
                                    // Check if variable is from outer (parent) scope, not current scope
                                    const binding = path.scope.getBinding(varName);
                                    if (binding && binding.scope !== path.scope) {
                                        // Variable is from parent scope
                                        const parent = idPath.parent;
                                        if (parent.type !== 'MemberExpression' || parent.object === idPath.node) {
                                            usedVars.add(`$${varName}`);
                                        }
                                    }
                                }
                            }
                        });
                        
                        const useClause = usedVars.size > 0 ? ` use (${Array.from(usedVars).join(', ')})` : '';
                        appendPhp(path, `  $${name} = function(${params})${useClause} {\n`);
                    } else {
                        // Top-level function
                        appendPhp(path, `function ${name}(${params}) {\n`);
                    }
                },
                exit(path) {
                    const parentFunc = path.getFunctionParent();
                    if (parentFunc) {
                        // Nested function - close the closure assignment
                        appendPhp(path, "  };\n");
                    } else {
                        // Top-level function
                        appendPhp(path, "}\n");
                    }
                }
            },
            VariableDeclaration(path) {
                const program = path.findParent(p => p.isProgram());
                const declarations = path.node.declarations;
                let code = "";
                declarations.forEach(decl => {
                    // Handle array destructuring
                    if (decl.id.type === 'ArrayPattern') {
                        const init = generateExpression(decl.init, program.state);
                        const vars = decl.id.elements.map(el => el ? `$${el.name}` : null).filter(Boolean);
                        code += `  list(${vars.join(', ')}) = ${init};\n`;
                    } else {
                        const name = decl.id.name;
                        const init = generateExpression(decl.init, program.state);
                        code += `  $${name} = ${init};\n`;
                    }
                });
                appendPhp(path, code);
            },
            ReturnStatement(path) {
                const program = path.findParent(p => p.isProgram());
                const arg = generateExpression(path.node.argument, program.state);
                appendPhp(path, `  return ${arg};\n`);
            },
            ExpressionStatement(path) {
                const program = path.findParent(p => p.isProgram());
                const expr = generateExpression(path.node.expression, program.state);
                appendPhp(path, `  ${expr};\n`);
            },
            IfStatement: {
                enter(path) {
                    const program = path.findParent(p => p.isProgram());
                    const test = generateExpression(path.node.test, program.state);
                    
                    // Check if this is part of an else-if chain
                    const parent = path.parent;
                    if (parent.type === 'IfStatement' && parent.alternate === path.node) {
                        // This is an else-if, don't add 'if' yet, it will be added in the parent's exit
                        return;
                    }
                    
                    appendPhp(path, `  if (${test}) {\n`);
                },
                exit(path) {
                    const parent = path.parent;
                    if (parent.type === 'IfStatement' && parent.alternate === path.node) {
                        // This is an else-if, handled by parent
                        return;
                    }
                    
                    if (path.node.alternate) {
                        if (path.node.alternate.type === 'IfStatement') {
                            // else if
                            const test = generateExpression(path.node.alternate.test, path.findParent(p => p.isProgram()).state);
                            appendPhp(path, `  } else if (${test}) {\n`);
                        } else {
                            // else block
                            appendPhp(path, `  } else {\n`);
                        }
                    } else {
                        appendPhp(path, `  }\n`);
                    }
                }
            },
            // We need to handle specific nodes to transform them to PHP strings.
        }
    };
};

// Helper to generate expression string
function generateExpression(node, state) {
    if (!node) return 'null';
    if (node.type === 'NumericLiteral') return node.value;
    if (node.type === 'StringLiteral') return `'${node.value}'`;
    if (node.type === 'BooleanLiteral') return node.value ? 'true' : 'false';
    if (node.type === 'NullLiteral') return 'null';
    if (node.type === 'ArrayExpression') {
        const elements = node.elements.map(el => {
            if (el.type === 'SpreadElement') {
                // Handle spread syntax: ...array
                return '...' + generateExpression(el.argument, state);
            }
            return generateExpression(el, state);
        }).join(', ');
        return `[${elements}]`;
    }
    if (node.type === 'ObjectExpression') {
        const properties = node.properties.map(prop => {
            // Handle spread elements in objects
            if (prop.type === 'SpreadElement') {
                return '...' + generateExpression(prop.argument, state);
            }
            const key = prop.key ? (prop.key.name || prop.key.value) : 'unknown';
            // Generate value expression (identifiers become variables with $)
            const value = generateExpression(prop.value, state);
            return `'${key}' => ${value}`;
        }).join(', ');
        return `[${properties}]`;
    }
    if (node.type === 'BinaryExpression') {
        const left = generateExpression(node.left, state);
        const right = generateExpression(node.right, state);
        let operator = node.operator;
        // In PHP, use . for string concatenation instead of + when either operand is a string
        if (operator === '+') {
            const isLeftString = node.left.type === 'StringLiteral';
            const isRightString = node.right.type === 'StringLiteral';
            if (isLeftString || isRightString) {
                operator = '.';
            }
        }
        return `${left} ${operator} ${right}`;
    }
    if (node.type === 'CallExpression') {
        let callee;
        if (node.callee.type === 'Identifier') {
            const name = node.callee.name;
            // Check if it's a known function name (declared or imported)
            const isFunctionName = state && ((state.functionNames && state.functionNames.has(name)) || (state.importedNames && state.importedNames.has(name)));
            if (isFunctionName) {
                callee = name;
            } else {
                callee = `$${name}`;
            }
        } else if (node.callee.type === 'MemberExpression') {
            // Handle method calls like array.map(), string.trim()
            const object = generateExpression(node.callee.object, state);
            const method = node.callee.property.name;
            
            if (method === 'map') {
                // Convert .map() to array_map()
                const callback = node.arguments[0];
                const callbackStr = generateExpression(callback, state);
                return `array_map(${callbackStr}, ${object})`;
            }
            
            if (method === 'trim') {
                // Convert .trim() to trim()
                return `trim(${object})`;
            }
            
            if (method === 'preventDefault') {
                // Convert e.preventDefault() to a comment (not applicable in PHP)
                return '/* preventDefault() */';
            }
            
            callee = generateExpression(node.callee, state);
        } else {
            callee = generateExpression(node.callee, state);
        }
        
        if (node.callee.type !== 'MemberExpression' || node.callee.property.name !== 'map') {
            const args = node.arguments.map(arg => {
                if (arg.type === 'SpreadElement') {
                    return '...' + generateExpression(arg.argument, state);
                }
                return generateExpression(arg, state);
            }).join(', ');
            return `${callee}(${args})`;
        }
    }
    if (node.type === 'Identifier') {
        // Always add $ prefix for identifiers (variables)
        return `$${node.name}`;
    }
    if (node.type === 'MemberExpression') {
        const object = generateExpression(node.object, state);
        // Always use [property] access for PHP arrays/objects
        const property = node.computed
            ? `[${generateExpression(node.property, state)}]`
            : `[${JSON.stringify(node.property.name)}]`;
        return `${object}${property}`;
    }
    if (node.type === 'ArrowFunctionExpression') {
        const params = node.params.map(p => `$${p.name}`).join(', ');
        const body = generateExpression(node.body, state);
        
        // Collect variables used in the arrow function body from outer scope
        const usedVars = new Set();
        const functionParams = new Set(node.params.map(p => p.name));
        const callees = new Set(); // Track function names that are called
        
        // For arrow functions with expression bodies, collect identifiers
        if (node.body.type !== 'BlockStatement') {
            // First pass: collect all function callees
            const collectCallees = (n, visited = new WeakSet()) => {
                if (!n || visited.has(n)) return;
                if (typeof n === 'object') visited.add(n);
                
                if (n.type === 'CallExpression' && n.callee && n.callee.type === 'Identifier') {
                    callees.add(n.callee.name);
                } else if (typeof n === 'object' && n !== null) {
                    for (const key in n) {
                        if (key !== 'parent' && key !== 'loc' && key !== 'start' && key !== 'end') {
                            const val = n[key];
                            if (Array.isArray(val)) {
                                val.forEach(item => collectCallees(item, visited));
                            } else if (typeof val === 'object' && val !== null) {
                                collectCallees(val, visited);
                            }
                        }
                    }
                }
            };
            collectCallees(node.body);
            
            // Second pass: collect identifiers that are not function callees
            const collectIdentifiers = (n, visited = new WeakSet()) => {
                if (!n || visited.has(n)) return;
                if (typeof n === 'object') visited.add(n);
                
                if (n.type === 'Identifier') {
                    const varName = n.name;
                    // Skip: function params, identifiers that are function callees
                    if (!functionParams.has(varName) && !callees.has(varName)) {
                        usedVars.add(`$${varName}`);
                    }
                } else if (typeof n === 'object' && n !== null) {
                    for (const key in n) {
                        if (key !== 'parent' && key !== 'loc' && key !== 'start' && key !== 'end') {
                            const val = n[key];
                            if (Array.isArray(val)) {
                                val.forEach(item => collectIdentifiers(item, visited));
                            } else if (typeof val === 'object' && val !== null) {
                                collectIdentifiers(val, visited);
                            }
                        }
                    }
                }
            };
            collectIdentifiers(node.body);
        }
        
        const useClause = usedVars.size > 0 ? ` use (${Array.from(usedVars).join(', ')})` : '';
        return `function(${params})${useClause} { return ${body}; }`;
    }
    if (node.type === 'ConditionalExpression') {
        const test = generateExpression(node.test, state);
        const consequent = generateExpression(node.consequent, state);
        const alternate = generateExpression(node.alternate, state);
        return `(${test} ? ${consequent} : ${alternate})`;
    }
    // Add more as needed
    return '/* unsupported */';
}

function appendPhp(path, code) {
    const program = path.findParent(p => p.isProgram());
    if (!program.state) program.state = {};
    if (!program.state.phpOutput) program.state.phpOutput = "";
    program.state.phpOutput += code;
}
