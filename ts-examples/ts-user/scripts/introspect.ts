import {Project, ts, Type} from "ts-morph";

async function main() {

    const project = new Project({
        tsConfigFilePath: "./tsconfig.json",
    });


    const sourceFile = project.getSourceFileOrThrow("src/index.ts");


    const classDecls = sourceFile.getClasses();

    for (const classDecl of classDecls) {

        console.log("Class:", classDecl.getName());


        for (const ctor of classDecl.getConstructors()) {
            console.log("  Constructor:");
            for (const param of ctor.getParameters()) {
                let x: Type = param.getType();
                console.log(x.getText());

                console.log("    -", param.getName(), ":", param.getType().getText());
            }
        }


        for (const prop of classDecl.getProperties()) {
            console.log("  Property:", prop.getName(), ":", prop.getType().getText());
        }


        for (const method of classDecl.getMethods()) {
            console.log("  Method:", method.getName(), "→", method.getReturnType().getText());
            for (const param of method.getParameters()) {
                let type = param. getType();

                let x = describeType(type);

                console.log(JSON.stringify(x));
            }

            console.log("done with method params");

            let x = describeType(method.getReturnType());
            console.log(JSON.stringify(x));
        }
    }
}

function describeType(type: Type): any {

    // --- Promise ---
    const symbol = type.getSymbol();
    if (symbol?.getName() === "Promise" && type.getTypeArguments().length === 1) {
        const inner = type.getTypeArguments()[0];
        return { kind: "promise", elementType: describeType(inner) };
    }

    if (type.isArray()) {
        const elem = type.getArrayElementTypeOrThrow();
        return {
            kind: "array",
            elementType: describeType(elem),
        };
    }

    if (type.isUnion()) {
        return {
            kind: "union",
            types: type.getUnionTypes().map(t => describeType(t))
        };
    }


    if (type.isString()) return { kind: "string" };
    if (type.isNumber()) return { kind: "number" };
    if (type.isBoolean()) return { kind: "boolean" };


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


    return { kind: "unknown", text: type.getText() };
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
