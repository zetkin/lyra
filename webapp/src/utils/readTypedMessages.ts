import ts from 'typescript';

import { type MessageData } from './adapters';

export default function readTypedMessages(fileName: string): MessageData[] {
  const host = ts.createIncrementalCompilerHost(
    {},
    {
      ...ts.sys,
      readFile: (path, encoding) => {
        // Skip anything in node_modules, as clearly not app code
        if (path.includes('node_modules')) {
          return '';
        }
        return ts.sys.readFile(path, encoding);
      },
    },
  );

  const fullProgram = ts.createProgram([fileName], {}, host);
  const file = fullProgram.getSourceFile(fileName);

  if (file) {
    // TODO: Look at identifiers and bail if unsafe

    const makeMessagesCallNode = findMakeMessages(file);

    if (makeMessagesCallNode) {
      return inspectMessages(makeMessagesCallNode);
    }
  }

  return [];
}

function inspectMessages(node: ts.CallExpression): MessageData[] {
  function typeIdFromNode(typeNode?: ts.Node): string {
    if (typeNode?.kind == ts.SyntaxKind.BooleanKeyword) {
      return 'boolean';
    } else if (typeNode?.kind == ts.SyntaxKind.NumberKeyword) {
      return 'number';
    } else if (typeNode?.kind == ts.SyntaxKind.StringKeyword) {
      return 'string';
    } else if (typeNode?.kind == ts.SyntaxKind.NullKeyword) {
      return 'null';
    } else if (typeNode?.kind == ts.SyntaxKind.UndefinedKeyword) {
      return 'undefined';
    } else if (typeNode?.kind == ts.SyntaxKind.TypeReference) {
      const refNode = typeNode as ts.TypeReferenceNode;
      const idNode = refNode.typeName as ts.Identifier;
      return idNode.text;
    } else {
      return 'unknown';
    }
  }

  function traverse(
    prefix: string,
    curNode: ts.Node,
    output: MessageData[] = [],
  ): MessageData[] {
    if (curNode.kind == ts.SyntaxKind.ObjectLiteralExpression) {
      const objNode = curNode as ts.ObjectLiteralExpression;
      objNode.properties.forEach((propNode) => {
        const assignmentNode = propNode as ts.PropertyAssignment;
        const nameNode = assignmentNode.name as ts.Identifier;
        const id = `${prefix}.${nameNode.escapedText}`;

        if (
          assignmentNode.initializer.kind ==
          ts.SyntaxKind.ObjectLiteralExpression
        ) {
          traverse(id, assignmentNode.initializer, output);
        } else if (
          assignmentNode.initializer.kind == ts.SyntaxKind.CallExpression
        ) {
          const callNode = assignmentNode.initializer as ts.CallExpression;
          const argNode = callNode.arguments[0] as ts.StringLiteral;

          output.push({
            defaultMessage: argNode.text,
            id: id,
            params:
              (callNode.typeArguments?.[0] as ts.TypeLiteralNode)?.members.map(
                (member) => {
                  const memberNode = member as ts.PropertySignature;
                  const typeIdNode = memberNode.name as ts.Identifier;
                  if (memberNode.type?.kind == ts.SyntaxKind.UnionType) {
                    const unionNode = memberNode.type as ts.UnionTypeNode;
                    return {
                      name: typeIdNode.text,
                      types: unionNode.types.map((typeNode) =>
                        typeIdFromNode(typeNode),
                      ),
                    };
                  } else {
                    return {
                      name: typeIdNode.text,
                      types: [typeIdFromNode(memberNode.type)],
                    };
                  }
                },
              ) ?? [],
          });
        }
      });
    }
    return output;
  }

  const prefixArg = node.arguments[0] as ts.StringLiteral;
  return traverse(prefixArg.text, node.arguments[1]);
}

function findMakeMessages(curNode: ts.Node): ts.CallExpression | undefined {
  if (curNode.kind == ts.SyntaxKind.CallExpression) {
    const callNode = curNode as ts.CallExpression;
    const expr = callNode.expression as ts.Identifier;
    if (expr.escapedText == 'makeMessages') {
      return callNode;
    }
  }

  let found: ts.CallExpression | undefined;

  curNode.forEachChild((child) => {
    if (!found) {
      found = findMakeMessages(child);
    }
  });

  return found;
}
