import { mergeTypeDefs } from "@graphql-tools/merge";
import { userTypeDefs } from "./user";

export const typeDefs = mergeTypeDefs([userTypeDefs]);
