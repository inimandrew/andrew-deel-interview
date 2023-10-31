import { Request, Response } from "express";
import {
  Contract,
  Transaction,
  Job,
  Profile,
  sequelize,
} from "../models/sequelize";
import { MAXIMUM_ALLOWED_DEPOSIT_PERCENTAGE } from "../constants";
import { QueryTypes } from "sequelize";

export class ProfileController {
  async deposit(request: Request, response: Response) {
    const amount = request.body.amount;

    if (!amount) {
      return response.status(401).json({
        message: "Deposit amount is required",
      });
    }

    const profile = await Profile.findOne({
      where: { id: request.params.userId },
    });

    if (!profile) {
      return response.status(404).json({
        message: "Unrecognized user-id",
      });
    }

    const unpaidJobTotal = await Job.findAll({
      where: {
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
    }).then((jobs) =>
      jobs.reduce((acc, curr) => acc + Number(curr.get("price")), 0),
    );

    if (unpaidJobTotal <= 0) {
      return response.status(401).json({
        message: "Deposit cannot occur since you have no active unpaid jobs.",
      });
    } else if (Number(amount) >= unpaidJobTotal) {
      return response.status(401).json({
        message:
          "Deposit Amount cannot be greater than total unpaid jobs amount",
      });
    }

    const percentage = (Number(amount) / unpaidJobTotal) * 100;

    if (percentage > MAXIMUM_ALLOWED_DEPOSIT_PERCENTAGE) {
      return response.status(401).json({
        message: `Deposit Amount cannot be greater ${MAXIMUM_ALLOWED_DEPOSIT_PERCENTAGE}percent of unpaid jobs total of ${unpaidJobTotal}`,
      });
    }

    const t = await sequelize.transaction();

    try {
      const oldBalance = profile.get("balance") + amount;

      await Profile.update(
        {
          balance: oldBalance,
        },
        {
          where: {
            id: profile.get("id"),
          },
          transaction: t,
        },
      );

      await Transaction.create(
        {
          amount,
          DepositorId: profile.get("id"),
          type: "deposit",
        },
        { transaction: t },
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      return response.status(500);
    }

    return response.status(201).json({
      data: {
        message: "Deposit Successful!",
      },
    });
  }

  async getBestClients(request: Request, response: Response) {
    const page = request.query.page ? Number(request.query.page) : 1;
    const limit = request.query.limit ? Number(request.query.limit) : 2;
    const from = (page - 1) * limit;
    const start = request.query.start;
    const end = request.query.end;

    if (!start || !end) {
      return response.status(400).json({
        message: "Start and End Date is Required!",
      });
    }

    const results: {
      id: any;
      firstName: any;
      lastName: any;
      paid: any;
    }[] = await sequelize.query(
      "SELECT p.id, p.firstName, p.lastName, sum(j.price) as paid from Profiles p left join Contracts c  on c.ClientId  = p.id left join Jobs j  on j.ContractId  = c.id WHERE j.paid = TRUE AND p.type = :type AND j.paymentDate >= :start AND j.paymentDate <= :end GROUP BY p.id ORDER BY paid desc LIMIT :limit OFFSET :offset",
      {
        replacements: {
          type: "client",
          limit,
          offset: from,
          start,
          end,
        },
        type: QueryTypes.SELECT,
      },
    );

    return response.status(200).json({
      data: results.map(
        (result: { id: any; firstName: any; lastName: any; paid: any }) => ({
          id: result.id,
          fullName: `${result.firstName} ${result.lastName}`,
          paid: result.paid,
        }),
      ),
    });
  }

  async getBestProfession(request: Request, response: Response) {
    const start = request.query.start;
    const end = request.query.end;

    if (!start || !end) {
      return response.status(400).json({
        message: "Start and End Date is Required!",
      });
    }

    const result: {
      id: any;
      profession: any;
      paid: any;
    }[] = await sequelize.query(
      "SELECT p.id, p.profession, sum(j.price) as paid from Profiles p left join Contracts c  on c.ContractorId = p.id left join Jobs j  on j.ContractId  = c.id WHERE j.paid = TRUE AND p.type = :type AND j.paymentDate >= :start AND j.paymentDate <= :end GROUP BY p.profession order by paid desc limit 1",
      {
        replacements: {
          type: "contractor",
          limit: 1,
          start,
          end,
        },
        type: QueryTypes.SELECT,
      },
    );

    return response.status(200).json({
      data: {
        profession: {
          name: result[0].profession,
          totalPaid: result[0].paid,
        },
      },
    });
  }
}
