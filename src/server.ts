import { exit } from "process";
import { startupServer } from "./app";

startupServer().catch(async (error) => {
  console.log(error);
  exit(1);
});
