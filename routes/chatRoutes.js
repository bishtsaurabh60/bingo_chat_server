import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    removeFromGroup,
    leaveFromGroup,
    addToGroup,
} from "../controllers/chatControllers.js";


const router = express.Router();

router.route('/').post(protect, accessChat).get(protect, fetchChats);
router.route('/group').post(protect, createGroupChat);
router.route('/rename').put(protect, renameGroup);
router.route('/groupadd').put(protect, addToGroup);
router.route('/groupremove').put(protect, removeFromGroup);
router.route('/leave').put(protect, leaveFromGroup);

export default router;