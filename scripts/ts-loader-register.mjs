// Register a custom resolve hook that maps extensionless relative
// imports to .ts files, so Node's --experimental-strip-types can
// load the Prisma 7 generated client (which uses extensionless imports).
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("./scripts/ts-loader.mjs", pathToFileURL("./"));
