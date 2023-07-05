import argue from "../src";
import chalk from "chalk";

const ctx =
    argue({
        name: "codetut",
        suffix: " [files...]",
        describe: "A program for generating interactive coding tutorials.",
        colors: {
            error: chalk.red,
            header: chalk.bgCyan,
            description: chalk.italic
        }
    })
    .pos({
        name: "files",
        describe: "The input files.",
        accepts: "string",
        required: true,
        multiple: true
    })
    .opt({
        name: "-t, --template",
        describe: "The template to use",
        accepts: [ "scrollycoding" ],
        default: "scrollycoding"
    })
    .parse(process.argv.slice(2));

if (ctx.command === "help") {
    ctx.help();
    process.exit(1);
}

console.log("Compiling", ctx.argv.files, "with template", ctx.argv.template);