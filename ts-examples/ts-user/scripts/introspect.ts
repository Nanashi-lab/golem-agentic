import { Project } from "ts-morph";

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
                console.log("    Param:", param.getName(), ":", param.getType().getText());
            }

            console.log("return tyoe is " + method.getReturnType().getText())
        }
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
