import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.BACKEND_URI || "http://localhost:4000/api",
  documents: ["src/**/*.graphql"],
  generates: {
    "src/generated/index.ts": {
      config: {
        reactApolloVersion: 3,
        withHOC: true,
        withHooks: true,
      },
      plugins: [
        {
          add: {
            content: "// @ts-nocheck",
          },
        },
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
    },
  },
};

export default config;
