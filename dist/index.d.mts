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
declare class ArgueParse {
    private commands;
    private options;
    private kwargs;
    private args;
    private seenOptional;
    private seenMultiple;
    private isSubcommand;
    constructor(options: ArgueOptions, isSubcommand?: boolean);
    command(options: ArgueCommandOptions, handler?: (parser: ArgueParse) => ArgueParse): this;
    opt(options: ArgueOptOptions): this;
    pos(options: ArguePosOptions): this;
    help(error?: string): void;
    safeParse<T extends Record<string, any> = Record<string, unknown>>(args: string[]): ParseResult<T>;
    parse<T extends Record<string, any> = Record<string, unknown>>(args: string[]): ParseContext<T>;
}
declare function argue(options?: ArgueOptions): ArgueParse;

export { ArgueColors, ArgueCommandOptions, ArgueOptOptions, ArgueOptions, ArguePosOptions, ParseContext, ParseResult, argue as default };
