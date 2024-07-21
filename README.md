# SIP - Supreme Inspector for Pathbuilders

This repository contains SIP, an advanced inspector for Pathbuilders produced by the [WissKI](https://wiss-ki.eu) software.
It is a work in progress, and made available for evaluation purposes only.

<b>
While the code to this project is open source and you may inspect it to your heart's content, this repository (currently) does not have a license. 
This means that you may not run, create derivative works of or distribute this code.

In particular you are __not__ granted a license to use this code to create visualizations of your own pathbuilders for publications.
</b>

## User-facing Documentation

User-facing Documentation can be found in-app under the document tab. 
Alternatively, see [inspector.md](macros/docs/inspector.md) and [rdf.md](macros/docs/rdf.md).

## Development

The application is written in Typescript and uses [yarn](https://yarnpkg.com) for dependency management. 
To install all dependencies (including development tools) use:

```bash
yarn install
```

It uses [Vite](https://vitejs.dev) for bundling, [Vitest](https://vitest.dev) for testing, [Eslint](https://eslint.org) for linting (including a [Prettier](https://prettier.io) plugin for formatting). 
See the scripts part in [package.json](package.json) on how each command runs:
```bash
# start a development server
yarn start

# bundle a distribution into the dist/ directory
yarn build

# run typechecking, linting, testing + spellchecking
yarn ci
```

After starting a development server, access the app at `http://localhost:1234/`. 

## Scripts

In addition to the web-interface there are a couple of scripts in the `scripts` folder. 
These can be executed with `vite-node`, for example:

```bash
node node_modules/vite-node/vite-node.mjs ./scripts/render-model-graphviz.ts -p pathbuilder.xml
```

The individual scripts each come with an appropriate `--help` argument for detailed usage. 

## LICENSE

None yet, see warning above.
