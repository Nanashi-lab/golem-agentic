import {Project, Type} from "ts-morph";
import {TypeMetadata} from "@golemcloud/golem-ts-sdk";

async function main() {

    const project = new Project({
        tsConfigFilePath: "./tsconfig.json",
    });


    const sourceFiles = project.getSourceFiles("src/**/*.ts");

    TypeMetadata.updateFromSourceFiles(sourceFiles)
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
