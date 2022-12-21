import  asyncHandler  from 'express-async-handler';
import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";


//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
    //chat id,message,sender

    const { content, chatId } = req.body;

    if (!content || !chatId) {

        return res.sendStatus(400).json({ error: "Invalid data passed into request" });
    }

    try {
        const newMessage = {
          sender: req.user._id,
          content,
          chat: chatId,
        };
        let message = await Message.create(newMessage);

    //    message = await message.populate('sender', 'name pic');
    //     message = await message.populate('chat');
    //     message = await User.populate(message, {
    //         path: 'chat.users',
    //         select:'name pic email'
    //     });
        
        message = await (
          await message.populate("sender", "name pic")
        ).populate({
          path: "chat",
          select: "chatName isGroupChat users",
          model: "Chat",
          populate: { path: "users", select: "name email pic", model: "User" },
        });

        await Chat.findByIdAndUpdate(chatId, {
            latestMessage:message
        });

        return res.status(201).json(message);
    } catch (err) {
        res.status(400);
        throw new Error(err.message);
    }
});


//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "name pic email")
            .populate("chat");
        return res.status(200).json(messages);
    } catch (err) {
        res.status(400);
        throw new Error(err.message);
    }
});

export { sendMessage, allMessages };