import argue from "../src";

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
//              ^?