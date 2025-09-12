import { typeDefs } from "./schemas";
import { resolvers } from "./resolvers";
import { NextRequest } from "next/server";
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { connectToDatabase } from "./configs/connect-to-db";

connectToDatabase();
console.log("Connected to database");
const server = new ApolloServer<Context>({
  resolvers,
  typeDefs,
  introspection: true,
});

export const handler = startServerAndCreateNextHandler<NextRequest, Context>(
  server,
  {
    context: async () => {
      return {};
    },
  }
);
