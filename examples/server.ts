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
        describe: "start a server"
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
    .parse<{ verbose: boolean, port: number }>(process.argv.slice(2));

console.log(ctx);