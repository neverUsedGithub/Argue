/**
 * Argue - Modern argument parsing, with colors, made easy.
 */

export interface ArgueColors {
    error?: (input: string) => string;
    header?: (input: string) => string;
    program?: (input: string) => string;
    options?: (input: string) => string;
    commands?: (input: string) => string;
    description?: (input: string) => string;
}

export interface ArgueOptions {
    name?: string;
    suffix?: string;
    describe?: string;
    colors?: ArgueColors;
    commandRequired?: boolean;
}

interface ArgueArgOptions {
    required?: boolean;
    multiple?: boolean;
    describe?: string;
    accepts?: "string" | "number" | "boolean" | string[];
    default?: any;
    name: string;
}

type ArgueArg = Omit<Required<ArgueArgOptions>, "name"> & {
    names: string[];
    type: "option" | "argument";
};

type ArgueCommand = Required<ArgueCommandOptions> & {
    handler: ((parser: ArgueParse) => ArgueParse) | null;
};

export type ArgueOptOptions = ArgueArgOptions;
export type ArguePosOptions = ArgueArgOptions;

export interface ArgueCommandOptions {
    name: string;
    describe?: string;
    help?: string | null;
}

export interface ParseContext {
    command?: string;
    argv: Record<string, unknown>;
    help: () => void;
}

export type ParseResult =
    | {
          success: true;
          ctx: ParseContext;
      }
    | { success: false; error: string };

const SPACE_REGEX = / /g;
const NUMBER_REGEX = /^((0|[1-9][0-9]*)(\.[0-9]+)?)$/;

function normalizeName(name: string): string {
    if (!name.includes("-")) return name;
    let i = 0;
    while (name[i] === "-" && i++ < name.length) {}
    return name.substring(i);
}

function logColored(
    color: ((input: string) => string) | undefined,
    message: string
) {
    if (color) console.log(color(message));
    else console.log(message);
}

class ArgueParse {
    private commands: ArgueCommand[];
    private options: ArgueOptions;
    private kwargs: ArgueArg[];
    private args: (ArgueArg & { multiple: boolean })[];
    private seenOptional: boolean;
    private isSubcommand: boolean;

    constructor(options: ArgueOptions, isSubcommand?: boolean) {
        this.options = options;
        this.options.suffix =
            this.options.suffix ?? " [...commands] [...arguments]";
        this.commands = [];
        this.isSubcommand = isSubcommand ?? false;
        this.kwargs = [];
        this.args = [];
        this.seenOptional = false;

        if (!this.isSubcommand) {
            this.commands.push({
                name: "help",
                help: "help [command]",
                describe: "Shows a help menu.",
                handler: (argue) =>
                    argue.pos({
                        name: "command",
                        describe: "The command to help with.",
                        default: null,
                        required: false,
                    }),
            });
        }
    }

    command(
        options: ArgueCommandOptions,
        handler?: (parser: ArgueParse) => ArgueParse
    ) {
        this.commands.push({
            name: options.name,
            describe: options.describe ?? "",
            handler: handler ?? null,
            help: options.help ?? null,
        });
        return this;
    }

    opt(options: ArgueOptOptions) {
        const names = options.name.replace(SPACE_REGEX, "").split(",");

        this.kwargs.push({
            required: options.required ?? false,
            describe: options.describe ?? "",
            default: options.default ?? null,
            accepts: options.accepts ?? "string",
            names: names,
            multiple: options.multiple ?? false,
            type: "option",
        });
        return this;
    }

    pos(options: ArguePosOptions) {
        if (options.required && this.seenOptional)
            throw new Error(
                "A required argument cannot follow a not required one."
            );

        this.args.push({
            required: options.required ?? false,
            describe: options.describe ?? "",
            default: options.default ?? null,
            accepts: options.accepts ?? "string",
            names: [options.name],
            multiple: options.multiple ?? false,
            type: "argument",
        });
        return this;
    }

    help(error?: string) {
        if (error) {
            logColored(this.options.colors?.error, `Error: ${error}\n`);
        }
        logColored(
            this.options.colors?.program,
            this.options.name + (this.options.suffix ?? "")
        );
        if (this.options.describe) {
            logColored(
                this.options.colors?.description,
                "\n" + this.options.describe
            );
        }
        console.log();

        if (this.commands.length > 0) {
            const maxLength = Math.max(
                ...this.commands.map(
                    (cmd) => (cmd.help ? cmd.help : cmd.name).length
                )
            );

            logColored(this.options.colors?.header, "Commands");
            for (const cmd of this.commands) {
                let first = (cmd.help ? cmd.help : cmd.name).padEnd(maxLength);
                let second = cmd.describe;

                if (this.options.colors?.commands)
                    first = this.options.colors.commands(first);

                if (this.options.colors?.description)
                    second = this.options.colors.description(second);

                console.log("  " + first + "  " + second);
            }
            console.log();
        }

        const realArgs = this.kwargs.concat(this.args);
        if (realArgs.length > 0) {
            const maxLength = Math.max(
                ...realArgs.map((a) => a.names.join(", ").length)
            );
            logColored(this.options.colors?.header, "Options");
            for (const arg of realArgs) {
                let first = arg.names.join(", ").padEnd(maxLength);
                let second = arg.describe;

                if (this.options.colors?.options)
                    first = this.options.colors.options(first);

                if (this.options.colors?.description)
                    second = this.options.colors.description(second);

                console.log("  " + first + "  " + second);
            }
        }
    }

    safeParse(args: string[]): ParseResult {
        const parsedArgs: Record<string, unknown> = {};
        let posIndex: number = 0;

        for (const cmd of this.commands) {
            if (cmd.name !== args[0]) continue;
            if (!cmd.handler) {
                return {
                    success: true,
                    ctx: {
                        command: cmd.name,
                        argv: {},
                        help: (error?: string) => this.help(error),
                    },
                };
            }

            const parser = cmd.handler(new ArgueParse({}, true));
            const result = parser.safeParse(args.slice(1));

            if (result.success && cmd.name === "help") {
                const cmd = result.ctx.argv.command;

                if (cmd === null) {
                    this.help();
                    process.exit(0);
                }

                let foundCommand: ArgueCommand | null = null;
                for (const command of this.commands) {
                    if (command.name !== cmd) continue;
                    foundCommand = command;
                    break;
                }

                if (!foundCommand) {
                    this.help(`couldn't find command '${cmd}'`);
                    process.exit(1);
                }

                if (!foundCommand.handler) {
                    this.help(`can't help with '${cmd}'`);
                    process.exit(1);
                }

                foundCommand
                    .handler(
                        new ArgueParse(
                            {
                                name: foundCommand.name,
                                suffix: "",
                                colors: this.options.colors,
                            },
                            true
                        )
                    )
                    .help();
                process.exit(0);
            }

            if (!result.success)
                return { success: false, error: result.error }
            
            result.ctx.command = cmd.name;
            return result;
        }

        if (this.commands.length !== 0 && this.options.commandRequired) {
            return {
                success: false,
                error: `a command is required`,
            };
        }

        for (let i = 0; i < args.length; i++) {
            let foundArg: ArgueArg | null = null;
            let usedName = args[i];

            for (const arg of this.kwargs) {
                if (arg.names.includes(args[i])) {
                    foundArg = arg;
                    break;
                }
            }

            if (!foundArg) {
                if (posIndex >= this.args.length)
                    return {
                        success: false,
                        error: `${
                            args[i].startsWith("-")
                                ? "unrecognized"
                                : "unexpected"
                        } ${args[i].startsWith("-") ? "option" : "argument"} '${
                            args[i]
                        }'`,
                    };

                foundArg = this.args[posIndex++];
                if (foundArg.multiple) {
                    posIndex--;
                }
            }

            const argName = foundArg.names[foundArg.names.length - 1];

            if (foundArg.type === "argument")
                usedName = argName;

            let argValue: string;
            if (foundArg.type === "option" && foundArg.accepts !== "boolean")
                argValue = args[++i];
            else if (
                foundArg.type === "option" &&
                foundArg.accepts === "boolean"
            )
                argValue = "true";
            else argValue = args[i];

            let realValue: number | string | boolean;

            if (foundArg.accepts === "number") {
                if (!NUMBER_REGEX.test(argValue))
                    return {
                        success: false,
                        error: `${foundArg.type} '${usedName}' expected a number`,
                    };

                realValue = argValue.includes(".")
                    ? parseFloat(argValue)
                    : parseInt(argValue);
            } else if (foundArg.accepts === "boolean") {
                const truthy = ["yes", "true", "1", "y"];
                const falsy = ["no", "false", "0", "n"];

                if (
                    !truthy.includes(argValue.toLowerCase()) &&
                    !falsy.includes(argValue.toLowerCase())
                ) {
                    return {
                        success: false,
                        error: `${foundArg.type} '${usedName}' expected 'true' or 'false'`,
                    };
                }

                realValue = truthy.includes(argValue.toLowerCase());
            } else if (
                Array.isArray(foundArg.accepts) &&
                !foundArg.accepts.includes(argValue)
            ) {
                realValue = argValue;
                return {
                    success: false,
                    error: `${
                        foundArg.type
                    } '${usedName}' expected one of ${foundArg.accepts
                        .map((el) => `'${el}'`)
                        .join(", ")}`,
                };
            } else {
                realValue = argValue;
            }

            const normalized = normalizeName(argName);

            if (foundArg.multiple) {
                if (!(normalized in parsedArgs)) parsedArgs[normalized] = [];
                (parsedArgs[normalized] as any[]).push(realValue);
            } else parsedArgs[normalizeName(argName)] = realValue;
        }

        for (const arg of this.kwargs.concat(this.args)) {
            const name = arg.names[arg.names.length - 1];

            if (normalizeName(name) in parsedArgs) continue;

            if (arg.required)
                return {
                    success: false,
                    error: `${arg.type} '${name}' is required`,
                };

            parsedArgs[normalizeName(name)] = arg.default;
        }

        return {
            success: true,
            ctx: {
                argv: parsedArgs,
                help: (error?: string) => this.help(error),
            },
        };
    }

    parse(args: string[]): ParseContext {
        const res = this.safeParse(args);

        if (!res.success) {
            this.help(res.error);
            process.exit(1);
        }

        return res.ctx;
    }
}

export default function argue(options?: ArgueOptions) {
    return new ArgueParse(
        options ?? {
            name: "program",
            commandRequired: true,
        }
    );
}
