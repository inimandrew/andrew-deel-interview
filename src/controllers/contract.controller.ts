import { Request, Response } from "express";
import { Contract } from "../models/sequelize";
import { getPaginationMeta } from "../services/paginate";

export class ContractController {
  async findOne(request: Request, response: Response) {
    const contract = await Contract.findOne({
      where: { id: request.params.id },
    });

    if (!contract) {
      return response.status(401).json({
        message: "Unrecognized contract-id",
      });
    }

    return response.status(200).json({
      data: {
        contract,
      },
    });
  }

  async fetchAll(request: Request, response: Response) {
    const page = request.query.page ? Number(request.query.page) : 1;
    const limit = request.query.limit ? Number(request.query.limit) : 2;
    const from = (page - 1) * limit;

    const { rows, count } = await Contract.findAndCountAll({
      where: {
        status: "in_progress",
      },
      limit,
      offset: from,
    });
    const meta = getPaginationMeta({
      totalQueryCount: count,
      totalResultCount: rows.length,
      from,
      limit,
    });

    return response.status(200).json({
      data: {
        contracts: rows,
        meta,
      },
    });
  }
}
