# as-site-compiler

as-site-compiler is a Node.js package that compiles a static site to WebAssembly, by transpiling the site's markup and assets into AssemblyScript code. It uses the @blockless/sdk for interfacing with the HTTP component.

## Installation

To install as-site-compiler, run:

```bash
npm install as-site-compiler
```

## Usage

To use as-site-compiler, you can run the following commands:

```bash
npm run build    # Build the project using TypeScript
npm start        # Run the project
```

The `start` command will execute the TypeScript file src/index.ts using the ts-node package.

## Scripts

as-site-compiler has the following scripts:

- build: Builds the project using TypeScript and generates type declarations using the build:types script.
- start: Runs the project using the ts-node package.

## Dependencies

- @assemblyscript/wasi-shim: Version ^0.1.0
- @blockless/sdk: Version https://github.com/blocklessnetwork/sdk-assemblyscript#54ac31d4053a1eec0b3c020dbb21a0b458b96ca5
- as-wasi: Version ^0.5.1