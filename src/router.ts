import express from "express";
import { ContractController } from "./controllers/contract.controller";
import { JobController } from "./controllers/job.controller";
import { ProfileController } from "./controllers/profile";
import { getProfile } from "./middleware/getProfile";

const router = express.Router();
const contractController = new ContractController();
const jobController = new JobController();
const profileController = new ProfileController();

router.get("/contracts/:id", (request, response) => {
  contractController.findOne(request, response);
});

router.get("/contracts/", (request, response) => {
  contractController.fetchAll(request, response);
});

router.get("/jobs/unpaid", (request, response) => {
  jobController.fetchAllUnpaid(request, response);
});

router.post("/balances/deposit/:userId", (request, response) => {
  profileController.deposit(request, response);
});

router.use(getProfile);
router.post("/jobs/:job_id/pay", (request, response) => {
  jobController.jobPayment(request, response);
});

router.get("/admins/best-profession", (request, response) => {
  profileController.getBestProfession(request, response);
});

router.get("/admins/best-clients", (request, response) => {
  profileController.getBestClients(request, response);
});

router.use((_req, res) => {
    return res.status(404).send({ message: "Endpoint not found." });
});

router.use((_req, res) => {
    return res.status(500).send({ message: "Internal Server Error" });
});

export default router;
