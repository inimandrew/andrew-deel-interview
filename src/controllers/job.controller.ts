import { Request, Response } from "express";
import {
  Contract,
  Job,
  Profile,
  Transaction,
  sequelize,
} from "../models/sequelize";
import { getPaginationMeta } from "../services/paginate";

export class JobController {
  async fetchAllUnpaid(request: Request, response: Response) {
    const page = request.query.page ? Number(request.query.page) : 1;
    const limit = request.query.limit ? Number(request.query.limit) : 2;
    const from = (page - 1) * limit;

    const { rows, count } = await Job.findAndCountAll({
      where: {
        paid: false,
      },
      attributes: ["id", "description", "price", "paid", "createdAt"],
      limit,
      offset: from,
      include: [
        {
          model: Contract,
          attributes: ["id", "terms", "status"],
          where: {
            status: "in_progress",
          },
        },
      ],
    });
    const meta = getPaginationMeta({
      totalQueryCount: count,
      totalResultCount: rows.length,
      from,
      limit,
    });

    return response.status(200).json({
      data: {
        jobs: rows,
        meta,
      },
    });
  }

  async jobPayment(request: Request, response: Response) {
    const profile: Profile = (<any>request).profile;

    const job = await Job.findOne({
      plain: true,
      nest: true,
      where: {
        id: request.params.job_id,
        paid: false,
      },
      include: [
        {
          model: Contract,
          where: {
            status: "in_progress",
            ClientId: profile.get("id"),
          },
        },
      ],
    });

    if (!job) {
      return response.status(401).json({
        message: "Unrecognized job-id",
      });
    }

    const jobObj = JSON.parse(JSON.stringify(job, null, 2));
    const balance = Number(profile.get("balance"));
    const price = Number(jobObj.price);

    const contractorProfile = await Profile.findOne({
      where: jobObj.Contract.ContractorId,
    });

    if (!contractorProfile) {
      return response.status(401).json({
        message: "Unrecognized contractor-id",
      });
    }

    if (balance < price) {
      return response.status(401).json({
        message: "Insufficient funds! Cannot pay for Job!",
      });
    }

    const t = await sequelize.transaction();

    try {
      await Job.update(
        {
          paid: true,
          paymentDate: new Date().toString(),
        },
        {
          where: {
            id: jobObj.id,
          },
          transaction: t,
        },
      );

      await Contract.update(
        {
          status: "completed",
        },
        {
          where: {
            id: jobObj.ContractId,
          },
          transaction: t,
        },
      );

      await Profile.update(
        {
          balance: balance - price,
        },
        {
          where: {
            id: profile.get("id"),
          },
          transaction: t,
        },
      );

      await Profile.update(
        {
          balance: Number(contractorProfile.get("balance")) + price,
        },
        {
          where: {
            id: contractorProfile.get("id"),
          },
          transaction: t,
        },
      );

      await Transaction.create(
        {
          type: "job_payment",
          JobId: jobObj.id,
          amount: price,
        },
        {
          transaction: t,
        },
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      return response.status(500).json({ message: "Internal Server Error" });
    }

    return response.status(200).json({
      data: {
        message: "Job Payment Successful!",
      },
    });
  }
}
