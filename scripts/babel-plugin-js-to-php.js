module.exports = function ({ types: t }) {
    return {
        visitor: {
            Program: {
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
                    const name = path.node.id.name;
                    const params = path.node.params.map(generateExpression).join(', ');
                    appendPhp(path, `function ${name}(${params}) {\n`);
                },
                exit(path) {
                    appendPhp(path, "}\n");
                }
            },
            VariableDeclaration(path) {
                const declarations = path.node.declarations;
                let code = "";
                declarations.forEach(decl => {
                    const name = decl.id.name;
                    const init = generateExpression(decl.init);
                    code += `  $${name} = ${init};\n`;
                });
                appendPhp(path, code);
            },
            ReturnStatement(path) {
                const arg = generateExpression(path.node.argument);
                appendPhp(path, `  return ${arg};\n`);
            },
            ExpressionStatement(path) {
                const expr = generateExpression(path.node.expression);
                appendPhp(path, `  ${expr};\n`);
            },
            // We need to handle specific nodes to transform them to PHP strings.
        }
    };
};

// Helper to generate expression string
function generateExpression(node) {
    if (!node) return 'null';
    if (node.type === 'NumericLiteral') return node.value;
    if (node.type === 'StringLiteral') return `'${node.value}'`;
    if (node.type === 'BooleanLiteral') return node.value ? 'true' : 'false';
    if (node.type === 'NullLiteral') return 'null';
    if (node.type === 'ArrayExpression') {
        const elements = node.elements.map(generateExpression).join(', ');
        return `[${elements}]`;
    }
    if (node.type === 'CallExpression') {
        let callee;
        if (node.callee.type === 'Identifier') {
            callee = node.callee.name;
        } else {
            callee = generateExpression(node.callee);
        }
        const args = node.arguments.map(generateExpression).join(', ');
        return `${callee}(${args})`;
    }
    if (node.type === 'Identifier') return `$${node.name}`;
    // Add more as needed
    return '/* unsupported */';
}

function appendPhp(path, code) {
    const program = path.findParent(p => p.isProgram());
    if (!program.state) program.state = {};
    if (!program.state.phpOutput) program.state.phpOutput = "";
    program.state.phpOutput += code;
}
