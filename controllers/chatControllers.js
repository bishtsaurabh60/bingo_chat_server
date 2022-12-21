import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  // If chat with 'userId' not present in request
  if (!userId) {
    return res
      .status(400)
      .json({ message: "the userId param not sent with the request" });
  }

  let isChat = await Chat.find({
    isGroupChat: false, // 'isGroupChat' will be false as it is one-to-one chat
    // logged in user's id and the user id we sent should be same in the 'users' array
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email", //Fields we want to populate
  });

  // Check if chat exists, else create a new chat
  if (isChat.length > 0) {
    return res.status(200).send(isChat[0]);
  }
  else {
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
  try {
    let results = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
    
    results = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name pic email",
    });
    return res.status(200).send(results);
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
  const { users, name } = req.body;
  if (!users || !name) {
    return res.status(400).send({ message: "Please Fill all the fields" });
  }

  let user = JSON.parse(users);

  if (user.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  user.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: name,
      users: user,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");
    res.status(200).json(fullGroupChat);
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  // check if the requester is admin
  const groupChatExists = await Chat.findOne({ _id: chatId }); // Find if group chat exists.

  if (!groupChatExists) {
    // Error: No group chat with the given id exists.
    return res.status(400).json({ error: "Invalid group chat Id." });
  }

  if (!groupChatExists.groupAdmin.equals(req.user._id)) {
    // Error: Requester is not the admin of this group.
    return res
      .status(401)
      .json({ error: "Only the admin can the group name." });
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.status(200).json(updatedChat);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { userId, chatId } = req.body;

  // check if the requester is admin
  const groupChatExists = await Chat.findOne({ _id: chatId }); // Find if group chat exists.

  if (!groupChatExists) {
    // Error: No group chat with the given id exists.
    return res.status(400).json({ error: "Invalid group chat Id." });
  }

  if (!groupChatExists.groupAdmin.equals(req.user._id)) {
    // Error: Requester is not the admin of this group.
    return res
      .status(401)
      .json({ error: "Only the admin can add people to the group." });
  }

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Group Not Found");
  } else {
    res.status(200).json(added);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { userId, chatId } = req.body;

  // check if the requester is admin
  const groupChatExists = await Chat.findOne({ _id: chatId }); // Find if group chat exists.

  if (!groupChatExists) {
    // Error: No group chat with the given id exists.
    return res.status(400).json({ error: "Invalid group chat Id." });
  }

  if (!groupChatExists.groupAdmin.equals(req.user._id)) {
    // Error: Requester is not the admin of this group.
    return res
      .status(401)
      .json({ error: "Only the admin can remove people from the group." });
  }

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(400);
    throw new Error("Group Not Found");
  } else {
    res.status(200).json(removed);
  }
});

// @desc    leave from Group
// @route   PUT /api/chat/leave
// @access  Protected
const leaveFromGroup = asyncHandler(async (req, res) => {
  const { userId, chatId } = req.body;

  // check if the requester is admin
  const groupChatExists = await Chat.findOne({ _id: chatId }); // Find if group chat exists.

  if (!groupChatExists) {
    // Error: No group chat with the given id exists.
    return res.status(400).json({ error: "Invalid group chat Id." });
  }

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(400);
    throw new Error("Group Not Found");
  } else {
    res.status(200).json(removed);
  }
});


export {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  removeFromGroup,
  leaveFromGroup,
  addToGroup,
};
