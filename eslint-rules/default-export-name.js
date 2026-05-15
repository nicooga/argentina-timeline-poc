import path from "node:path";

function defaultExportName(node) {
  const declaration = node.declaration;
  if (!declaration) return null;
  if (declaration.type === "Identifier") return declaration.name;
  if (
    (declaration.type === "FunctionDeclaration" ||
      declaration.type === "ClassDeclaration") &&
    declaration.id
  ) {
    return declaration.id.name;
  }
  return null;
}

function expectedName(filename) {
  const parsed = path.parse(filename);
  if (parsed.name === "index") {
    return path.basename(path.dirname(filename));
  }
  return parsed.name;
}

export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require default export names to match their file or directory name.",
    },
    schema: [],
    messages: {
      mismatch:
        "Default export '{{actual}}' must match the expected name '{{expected}}'.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.();
    const expected = expectedName(filename);

    return {
      ExportDefaultDeclaration(node) {
        const actual = defaultExportName(node);
        if (!actual || actual === expected) return;
        context.report({
          node,
          messageId: "mismatch",
          data: { actual, expected },
        });
      },
    };
  },
};
