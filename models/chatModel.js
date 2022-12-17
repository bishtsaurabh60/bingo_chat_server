import {Schema,model} from "mongoose";

const chatSchema = Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    groupAdmin: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timeStamps: true }
);

const Chat = model("Chat", chatSchema);

export default Chat;
