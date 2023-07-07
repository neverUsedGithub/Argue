import argue from "../src";
import chalk from "chalk";

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
        accepts: "boolean"
    })
    .parse(process.argv.slice(2));

console.log(ctx.argv);
//              ^?