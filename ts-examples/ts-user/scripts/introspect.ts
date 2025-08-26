import {Project, ts, Type} from "ts-morph";

async function main() {
    // Create a ts-morph project based on your tsconfig.json
    const project = new Project({
        tsConfigFilePath: "./tsconfig.json",
    });

    // Add files (you can also use glob patterns like `src/**/*.ts`)
    const sourceFile = project.getSourceFileOrThrow("src/index.ts");

    // Find a class
    const classDecls = sourceFile.getClasses();

    for (const classDecl of classDecls) {

        console.log("Class:", classDecl.getName());

        // Constructors
        for (const ctor of classDecl.getConstructors()) {
            console.log("  Constructor:");
            for (const param of ctor.getParameters()) {
                let x: Type = param.getType();
                console.log(x.getText());

                console.log("    -", param.getName(), ":", param.getType().getText());
            }
        }

        // Properties
        for (const prop of classDecl.getProperties()) {
            console.log("  Property:", prop.getName(), ":", prop.getType().getText());
        }

        // Methods
        for (const method of classDecl.getMethods()) {
            console.log("  Method:", method.getName(), "→", method.getReturnType().getText());
            for (const param of method.getParameters()) {
                let type = param. getType();

                let x = describeType(type);

                console.log(x);
            }

            console.log("return tyoe is " + method.getReturnType().getText())
        }
    }
}

function describeType(type: Type): any {
    // Arrays
    if (type.isArray()) {
        const elem = type.getArrayElementTypeOrThrow();
        return {
            kind: "array",
            elementType: describeType(elem),
        };
    }

    // Primitive types
    if (type.isString()) return { kind: "string" };
    if (type.isNumber()) return { kind: "number" };
    if (type.isBoolean()) return { kind: "boolean" };

    // Objects
    if (type.isObject()) {
        const props: Record<string, any> = {};
        for (const prop of type.getProperties()) {
            const valueType = prop.getTypeAtLocation(prop.getValueDeclarationOrThrow());
            props[prop.getName()] = describeType(valueType);
        }
        return {
            kind: "object",
            properties: props,
        };
    }

    // Fallback
    return { kind: "unknown", text: type.getText() };
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
