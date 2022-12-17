import express from "express";
import  protect  from '../middleware/authMiddleware.js';
import { sendMessage,allMessages } from "../controllers/messageControllers.js";

const router = express.Router();

router.route('/').post(protect, sendMessage);

//Fetch All the messages for a single chat
router.route('/:chatId').get(protect, allMessages);
export default router;