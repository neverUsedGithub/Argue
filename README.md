# Argue
Modern argument parsing, with colors, made easy.

# Installation
```
npm i https://github.com/neverUsedGithub/Argue
```

# Usage
### Basics
```ts
import argue from "argue";

const ctx = 
    argue({
        name: "greeter"
    })
    .opt({
        name: "-n, --name",
        accepts: "string",
        default: "World"
    })
    .parse(process.argv.slice(2));

// Argue automatically created argv with the correct types
console.log(ctx.argv.name);
```
### Advanced
```ts
const ctx =
    argue({
        name: "server",
        describe: "A server cli.",
    })
    .command({
        name: "serve",
        help: "serve [port]",
        describe: "Start a server on the specified port."
    }, argue => argue
        .pos({
            name: "port",
            describe: "The port to listen on.",
            accepts: "number",
            default: 3000
        })
    )
    .opt({
        name: "-v, --verbose",
        describe: "Use verbose logging.",
        accepts: "boolean",
        default: false
    })
    .parse(process.argv.slice(2));

// ctx.command is the command that was used or undefined
console.log(ctx.command, ctx.argv);
```