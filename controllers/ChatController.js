const User = require("./../models/user");
const ChatHeads = require("./../models/chatHeads");
const Chat = require("./../models/chat");
const socket = require("./../socket");
const Contact = require("../models/contact");
require('dotenv').config();

const convo = async (to, from, text) => {
  return conversation;
};
exports.teststop = async (request, response, next) => {
  const { u1, u2, text } = request.body;
  const user1 = await User.findById(u1);
  const user2 = await User.findById(u2);
  const chats = await ChatHeads.find({
    $and: [
      { $or: [{ user1: user1 }, { user2: user1 }] },
      { $or: [{ user1: user2 }, { user2: user2 }] },
    ],
  });
  if (chats.length > 0) {
    //already friends
    let msg = await convo(user1, user2, text);
    response.json({ type: "friends", msg: msg });
  } else {
    const newChat = new ChatHeads();
    newChat.user1 = user1;
    newChat.user2 = user2;
    await newChat.save();
    let msg = await convo(user1, user2, text);
    response.json({ type: "just friends", msg: msg });
  }
};

exports.saveMessage = async (request, response, next) => {
  const { to, text } = request.body;
  const toUser = await User.findById(to);
  const fromUser = await User.findById(request.user._id);
  const message = new Chat();
  message.to = toUser;
  message.from = fromUser;
  if(text!='' || text!=undefined){
      message.text = text;
  }
  
  if(request.file.path){
    console.log(request.file)
    message.file = {
      src:process.env['APP_URL']+request.file.path,
      mimetype: request.file.mimetype
    };
    message.isFile = true;
  }
  await message.save();
  const messageInSocket = {...Chat.toApi(message, request.user._id)};
  messageInSocket.user = messageInSocket.from_user;
  socket.io().emit(to, {
    type: "NEW_MESSAGE",
    message:messageInSocket
  });
  return response.json(Chat.toApi(message, request.user._id));
};

exports.getConversations = async (userID) => {
  const user = await User.findById(userID);
  //Chat.find({from:user}).populate('from').populate('to').then(r => response.json(r));
  const conversations = await Chat.aggregate([
    {
      $match: {
        $or: [
          {
            to: user._id,
          },
          {
            from: user._id,
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "from",
        foreignField: "_id",
        as: "from_user",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "to",
        foreignField: "_id",
        as: "to_user",
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
    {
      $group: {
        _id: {
          $cond: [
            {
              $eq: ["$to", user._id],
            },
            {
              $concat: [
                {
                  $toString: "$to",
                },
                " and ",
                {
                  $toString: "$from",
                },
              ],
            },
            {
              $concat: [
                {
                  $toString: "$from",
                },
                " and ",
                {
                  $toString: "$to",
                },
              ],
            },
          ],
        },
        updatedAt: {
          $first: "$updatedAt",
        },
        messages: {
          $push: "$$ROOT",
        },
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
    {
      $addFields: {
        messages: { $slice: ["$messages", 50] },
      },
    },
    {
      $project: {
        _id: 1,
        updatedAt: 1,
        "messages._id": 1,
        "messages.isFile": 1,
        "messages.to": 1,
        "messages.from": 1,
        "messages.text": 1,
        "messages.createdAt": 1,
        "messages.file": 1,
        "messages.seenbySender": 1,
        "messages.seenByReceiver": 1,
        "messages.to_user._id": 1,
        "messages.to_user.name": 1,
        "messages.to_user.displayPicture": 1,
        "messages.to_user.meta": 1,
        "messages.to_user.email": 1,
        "messages.to_user.phone": 1,
        "messages.to_user.socialMediaHandles": 1,
        "messages.to_user.createdAt": 1,
        "messages.from_user._id": 1,
        "messages.from_user.name": 1,
        "messages.from_user.displayPicture": 1,
        "messages.from_user.meta": 1,
        "messages.from_user.email": 1,
        "messages.from_user.phone": 1,
        "messages.from_user.socialMediaHandles": 1,
        "messages.from_user.createdAt": 1,
      },
    },
  ]);
  // return conversations;
  const mapped = conversations.map((conversation) => {
    let otherUser;
    let aMessage = conversation.messages[0];
    conversation.messages.reverse();
    conversation.messages.map((message) => {
      message.from_user = message.from_user[0];
      message.to_user = message.to_user[0];
      otherUser = userID.toString() == message.to.toString() ? message.from_user : message.to_user;
      message.user = otherUser;
      return message;
    });
    const user = userID.toString() === aMessage.to.toString() ? aMessage.from_user : aMessage.to_user;
    conversation.id = user._id;
    conversation.user = user;
    return conversation;
  });
  return mapped;
 
};
const getContacts = async (user) => {
    const contacts=await Contact.find({ user_id: user._id })
    .populate("user_id")
    .populate("contact_id");
    return Contact.toApi(contacts); 
};

exports.getHome = async (request, response, next) => {
  const conversations = await getConversations(request.user._id);
  const contacts = await getContacts(request.user);
  response.json({ conversations: conversations,contacts: contacts});
};

exports.findUsers = async (request, response, next) => {
  const { name } = request.query;
  console.log(name)
  User.find({ $text: { $search: name } })
    .then((results) => {
      response.json({ users: User.toApi(results) });
    })
    .catch((error) => {
      const err = new Error(error);
      next(err);
    });
};

exports.fetchMoreConversation = async (request, response, next) => {
    const {to} = request.body;
    const {user} = request;
    const chats=await Chat.find(
      [
        {
          $and: {
            $or: [
              {from: to}, 
              {to: to}
            ]
          }
        },
        {
          $or: [
            {from: user._id}, 
            {to: user._id}
          ]
        }
      ]
      );
    return response.json(chats);
    


}