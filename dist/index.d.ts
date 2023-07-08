/**
 * Argue - Modern argument parsing, with colors, made easy.
 */
interface ArgueColors {
    error?: (input: string) => string;
    header?: (input: string) => string;
    program?: (input: string) => string;
    options?: (input: string) => string;
    commands?: (input: string) => string;
    description?: (input: string) => string;
}
interface ArgueOptions {
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
type ArgumentToType<T extends string | string[] | undefined> = T extends undefined ? unknown : T extends "string" ? string : T extends "number" ? number : T extends "boolean" ? boolean : T extends string[] ? string : never;
type ArgumentMultiple<T, U extends boolean | undefined> = U extends undefined ? T : U extends true ? T[] : T;
type ArgumentRequired<T, U extends boolean | undefined, V> = U extends undefined ? T | V : U extends true ? T : T | V;
type ArgueOptOptions = ArgueArgOptions;
type ArguePosOptions = ArgueArgOptions;
interface ArgueCommandOptions {
    name: string;
    describe?: string;
    help?: string | null;
}
interface ParseContext<T = Record<string, unknown>> {
    command?: string;
    argv: T;
    help: () => void;
}
type ParseResult<T> = {
    success: true;
    ctx: ParseContext<T>;
} | {
    success: false;
    error: string;
};
type StripLeadingDashes<T extends string> = T extends `--${infer Name}` ? Name : T extends `-${infer Name}` ? Name : never;
type SplitAtCommas<T extends string> = T extends `${infer First},${infer Space}${infer Rest}` ? [First, ...SplitAtCommas<Rest>] : [T];
type GetLastItem<T extends any[]> = T extends [...infer _, infer Last] ? Last : never;
type NormalizeOptionName<T extends string> = StripLeadingDashes<GetLastItem<SplitAtCommas<T>>>;
declare class ArgueParse<T extends Record<string, any>> {
    private commands;
    private options;
    private kwargs;
    private args;
    private seenOptional;
    private seenMultiple;
    private isSubcommand;
    constructor(options: ArgueOptions, isSubcommand?: boolean);
    /**
     * Defines a command with the specified options and an optional handler function.
     *
     * @param options - Options for the command, including name, describe, and help.
     * @param handler - Optional handler function that will be called to handle the command.
     */
    command<S>(options: ArgueCommandOptions, handler?: (parser: ArgueParse<{}>) => S): typeof handler extends undefined ? ArgueParse<T> : ArgueParse<T & (S extends ArgueParse<infer U> ? U : never)>;
    /**
     * Defines a new option with the specified options and returns `this`.
     *
     * @param options - Options for the option.
     */
    opt<U extends string, V extends ArgueOptOptions["accepts"], W extends ArgueOptOptions["multiple"] = false, E extends ArgueOptOptions["required"] = false, S extends ArgueOptOptions["default"] = undefined>(options: ArgueOptOptions & {
        name: U;
        accepts?: V;
        multiple?: W;
        required?: E;
        default?: S;
    }): ArgueParse<T & {
        [K in NormalizeOptionName<U>]: ArgumentRequired<ArgumentMultiple<ArgumentToType<V>, W>, E, S>;
    }>;
    /**
     * Defines a new positional argument with the specified options and returns `this`.
     *
     * @param options - Options for the positional argument.
     */
    pos<U extends string, V extends ArguePosOptions["accepts"], W extends ArguePosOptions["multiple"] = false, E extends ArguePosOptions["required"] = false, S extends ArgueOptOptions["default"] = undefined>(options: ArguePosOptions & {
        name: U;
        accepts?: V;
        multiple?: W;
        required?: E;
        default?: S;
    }): ArgueParse<T & {
        [K in U]: ArgumentRequired<ArgumentMultiple<ArgumentToType<V>, W>, E, S>;
    }>;
    /**
     * Display the help information for the command-line interface.
     *
     * @param error - Optional error message to display.
     * @returns void
     */
    help(error?: string): void;
    /**
     * Safely parses the provided arguments and returns a parse result.
     *
     * @param args - The string array containing the arguments to parse.
     * @returns The parse result, containing the parsed data or an error message.
     */
    safeParse(args: string[]): ParseResult<T>;
    /**
     * Parses the passed arguments and returns a parse context.
     * If parsing fails, it displays a help message and exits.
     *
     * @returns The parse context if successful, otherwise exits the program.
     */
    parse(args: string[]): ParseContext<T>;
}
/**
 * Creates a new instance of Argue with the specified options and returns it.
 *
 * @param options - Optional configuration options for the Argue instance.
 * @returns The created Argue instance.
 */
declare function argue(options?: ArgueOptions): ArgueParse<{}>;

export { ArgueColors, ArgueCommandOptions, ArgueOptOptions, ArgueOptions, ArguePosOptions, ParseContext, ParseResult, argue as default };
