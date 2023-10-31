import bodyParser from "body-parser";
import express from "express";
import { connectToDb, sequelize } from "./models/sequelize";
import router from "./router";

const app = express();

export const startupServer = async () => {
  try {
    app.use(bodyParser.json());
    app.use("/", router);
    app.set("sequelize", sequelize);
    app.set("models", sequelize.models);
    await connectToDb();
    app.listen(3001, () => {
      console.log("Express App Listening on Port 3001");
    });
  } catch (error) {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  }
};
