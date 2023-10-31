import { Sequelize, Model, DataTypes } from "sequelize";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite3",
});

class Contract extends Model {}
Contract.init(
  {
    terms: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("new", "in_progress", "terminated", "completed"),
    },
  },
  {
    sequelize,
    modelName: "Contract",
  },
);

class Profile extends Model {}
Profile.init(
  {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profession: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(12, 2),
    },
    type: {
      type: DataTypes.ENUM("client", "contractor"),
    },
  },
  {
    sequelize,
    modelName: "Profile",
  },
);

class Job extends Model {}
Job.init(
  {
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    paymentDate: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: "Job",
  },
);

class Transaction extends Model {}
Transaction.init(
  {
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("deposit", "job_payment"),
    },
  },
  {
    sequelize,
    modelName: "Transaction",
  },
);

Profile.hasMany(Contract, { as: "Contractor", foreignKey: "ContractorId" });
Profile.hasMany(Contract, { as: "Client", foreignKey: "ClientId" });
Profile.hasMany(Transaction, { as: "Deposit", foreignKey: "DepositorId" });

Contract.belongsTo(Profile, { as: "Contractor" });
Contract.belongsTo(Profile, { as: "Client" });
Contract.hasMany(Job);

Job.hasMany(Transaction, { as: "Job", foreignKey: "JobId" });
Job.belongsTo(Contract);

Transaction.belongsTo(Profile, { as: "Depositor" });
Transaction.belongsTo(Job, { as: "Job" });

const connectToDb = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export { Profile, Contract, Job, Transaction, connectToDb };
