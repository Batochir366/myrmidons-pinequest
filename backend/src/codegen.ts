import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "src/schemas",
  generates: {
    "src/generated/index.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "../types#Context",
        makeResolverTypeCallable: true,
        maybeValue: "T",
      },
    },
  },
};

export default config;
