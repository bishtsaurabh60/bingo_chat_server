import express from "express";
import { registerUser, authUser, allUsers } from "../controllers/usersControllers.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

//router.route() is also used for chaining multiple request

router.route("/").post(registerUser).get(protect,allUsers);
router.post("/login", authUser);

export default router;
