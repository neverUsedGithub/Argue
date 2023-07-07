// src/index.ts
var SPACE_REGEX = / /g;
var NUMBER_REGEX = /^((0|[1-9][0-9]*)(\.[0-9]+)?)$/;
function normalizeName(name) {
  if (!name.includes("-"))
    return name;
  let i = 0;
  while (name[i] === "-" && i++ < name.length) {
  }
  return name.substring(i);
}
function logColored(color, message) {
  if (color)
    console.log(color(message));
  else
    console.log(message);
}
function stringifyValue(value) {
  if (typeof value === "string")
    return `"${value}"`;
  return value;
}
function stringifyType(value) {
  if (Array.isArray(value))
    return value.map(stringifyValue).join(", ");
  return value;
}
var ArgueParse = class _ArgueParse {
  commands;
  options;
  kwargs;
  args;
  seenOptional;
  seenMultiple;
  isSubcommand;
  constructor(options, isSubcommand) {
    this.options = options;
    this.options.suffix = this.options.suffix ?? " [...commands] [...arguments]";
    this.commands = [];
    this.isSubcommand = isSubcommand ?? false;
    this.kwargs = [];
    this.args = [];
    this.seenOptional = false;
    this.seenMultiple = false;
    if (!this.isSubcommand) {
      this.command(
        {
          name: "help",
          help: "help [command]",
          describe: "Shows a help menu."
        },
        (argue2) => argue2.pos({
          name: "command",
          describe: "The command to help with.",
          default: null,
          required: false
        })
      );
    }
  }
  command(options, handler) {
    const command = {
      name: options.name,
      describe: options.describe ?? "",
      handler: handler ?? null,
      help: options.help ?? null
    };
    this.commands.push(command);
    return this;
  }
  opt(options) {
    const names = options.name.replace(SPACE_REGEX, "").split(",");
    this.kwargs.push({
      required: options.required ?? false,
      describe: options.describe ?? "",
      default: options.default ?? null,
      accepts: options.accepts ?? "string",
      names,
      multiple: options.multiple ?? false,
      type: "option"
    });
    return this;
  }
  pos(options) {
    if (this.seenMultiple)
      throw new Error(
        "No arguments can follow an argument that accepts multiple values."
      );
    if (options.required && this.seenOptional)
      throw new Error(
        "A required argument cannot follow an optional one."
      );
    this.seenMultiple = options.multiple ?? false;
    this.seenOptional = !options.required;
    this.args.push({
      required: options.required ?? false,
      describe: options.describe ?? "",
      default: options.default ?? null,
      accepts: options.accepts ?? "string",
      names: [options.name],
      multiple: options.multiple ?? false,
      type: "argument"
    });
    return this;
  }
  help(error) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    if (error) {
      logColored((_a = this.options.colors) == null ? void 0 : _a.error, `Error: ${error}
`);
    }
    if (this.options.describe) {
      logColored(
        (_b = this.options.colors) == null ? void 0 : _b.description,
        this.options.describe + "\n"
      );
    }
    logColored((_c = this.options.colors) == null ? void 0 : _c.header, "Usage");
    logColored(
      (_d = this.options.colors) == null ? void 0 : _d.program,
      "  " + this.options.name + (this.options.suffix ?? "") + "\n"
    );
    const realArgs = this.args.concat(this.kwargs);
    const maxLength = Math.max(
      ...this.commands.map(
        (cmd) => (cmd.help ? cmd.help : cmd.name).length
      ),
      ...realArgs.map((a) => a.names.join(", ").length)
    );
    if (this.commands.length > 0) {
      logColored((_e = this.options.colors) == null ? void 0 : _e.header, "Commands");
      for (const cmd of this.commands) {
        let first = (cmd.help ? cmd.help : cmd.name).padEnd(maxLength);
        let second = cmd.describe;
        if ((_f = this.options.colors) == null ? void 0 : _f.commands)
          first = this.options.colors.commands(first);
        if ((_g = this.options.colors) == null ? void 0 : _g.description)
          second = this.options.colors.description(second);
        console.log("  " + first + "  " + second);
      }
      console.log();
    }
    if (realArgs.length > 0) {
      logColored((_h = this.options.colors) == null ? void 0 : _h.header, "Options");
      for (const arg of realArgs) {
        let first = arg.names.join(", ").padEnd(maxLength);
        let second = arg.describe + (arg.accepts ? ` (${stringifyType(arg.accepts)})` : "") + (!arg.required && arg.default !== void 0 ? ` (default: ${stringifyValue(arg.default)})` : "");
        if ((_i = this.options.colors) == null ? void 0 : _i.options)
          first = this.options.colors.options(first);
        if ((_j = this.options.colors) == null ? void 0 : _j.description)
          second = this.options.colors.description(second);
        console.log("  " + first + "  " + second);
      }
    }
  }
  safeParse(args) {
    const parsedArgs = {};
    let posIndex = 0;
    for (const cmd of this.commands) {
      if (cmd.name !== args[0])
        continue;
      if (!cmd.handler) {
        return {
          success: true,
          ctx: {
            command: cmd.name,
            argv: {},
            help: (error) => this.help(error)
          }
        };
      }
      const parser = cmd.handler(new _ArgueParse({}, true));
      const result = parser.safeParse(args.slice(1));
      if (result.success && cmd.name === "help") {
        const cmd2 = result.ctx.argv.command;
        if (cmd2 === null) {
          this.help();
          process.exit(0);
        }
        let foundCommand = null;
        for (const command of this.commands) {
          if (command.name !== cmd2)
            continue;
          foundCommand = command;
          break;
        }
        if (!foundCommand) {
          this.help(`couldn't find command '${cmd2}'`);
          process.exit(1);
        }
        if (!foundCommand.handler) {
          this.help(`can't help with '${cmd2}'`);
          process.exit(1);
        }
        foundCommand.handler(
          new _ArgueParse(
            {
              name: foundCommand.help ?? foundCommand.name,
              suffix: "",
              colors: this.options.colors,
              describe: foundCommand.describe
            },
            true
          )
        ).help();
        process.exit(0);
      }
      if (!result.success)
        return { success: false, error: result.error };
      result.ctx.command = cmd.name;
      return result;
    }
    if (this.commands.length !== 0 && this.options.commandRequired) {
      return {
        success: false,
        error: `a command is required`
      };
    }
    for (let i = 0; i < args.length; i++) {
      let foundArg = null;
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
            error: `${args[i].startsWith("-") ? "unrecognized" : "unexpected"} ${args[i].startsWith("-") ? "option" : "argument"} '${args[i]}'`
          };
        foundArg = this.args[posIndex++];
        if (foundArg.multiple) {
          posIndex--;
        }
      }
      const argName = foundArg.names[foundArg.names.length - 1];
      if (foundArg.type === "argument")
        usedName = argName;
      let argValue;
      if (foundArg.type === "option" && foundArg.accepts !== "boolean")
        argValue = args[++i];
      else if (foundArg.type === "option" && foundArg.accepts === "boolean")
        argValue = "true";
      else
        argValue = args[i];
      let realValue;
      if (foundArg.accepts === "number") {
        if (!NUMBER_REGEX.test(argValue))
          return {
            success: false,
            error: `${foundArg.type} '${usedName}' expected a number`
          };
        realValue = argValue.includes(".") ? parseFloat(argValue) : parseInt(argValue);
      } else if (foundArg.accepts === "boolean") {
        const truthy = ["yes", "true", "1", "y"];
        const falsy = ["no", "false", "0", "n"];
        if (!truthy.includes(argValue.toLowerCase()) && !falsy.includes(argValue.toLowerCase())) {
          return {
            success: false,
            error: `${foundArg.type} '${usedName}' expected 'true' or 'false'`
          };
        }
        realValue = truthy.includes(argValue.toLowerCase());
      } else if (Array.isArray(foundArg.accepts) && !foundArg.accepts.includes(argValue)) {
        realValue = argValue;
        return {
          success: false,
          error: `${foundArg.type} '${usedName}' expected one of ${foundArg.accepts.map((el) => `'${el}'`).join(", ")}`
        };
      } else {
        realValue = argValue;
      }
      const normalized = normalizeName(argName);
      if (foundArg.multiple) {
        if (!(normalized in parsedArgs))
          parsedArgs[normalized] = [];
        parsedArgs[normalized].push(realValue);
      } else
        parsedArgs[normalizeName(argName)] = realValue;
    }
    for (const arg of this.kwargs.concat(this.args)) {
      const name = arg.names[arg.names.length - 1];
      if (normalizeName(name) in parsedArgs)
        continue;
      if (arg.required)
        return {
          success: false,
          error: `${arg.type} '${name}' is required`
        };
      parsedArgs[normalizeName(name)] = arg.default;
    }
    return {
      success: true,
      ctx: {
        argv: parsedArgs,
        help: (error) => this.help(error)
      }
    };
  }
  parse(args) {
    const res = this.safeParse(args);
    if (!res.success) {
      this.help(res.error);
      process.exit(1);
    }
    return res.ctx;
  }
};
function argue(options) {
  return new ArgueParse(
    options ?? {
      name: "program",
      commandRequired: true
    }
  );
}
export {
  argue as default
};
