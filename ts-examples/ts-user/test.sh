#!/bin/bash

npm run build
cp dist/index.mjs ../generated_rust/src/user-module.js
cd ../generated_rust
echo "Building Rust project"
~/projects/ribbb/golem-cli/target/debug/golem app build
echo "Copying wasm file to test-components directory"
cp target/wasm32-wasip1/debug/agent_guest.wasm ~/projects/ribbb/golem/test-components/
cd -