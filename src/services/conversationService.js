const { Filter } = require('firebase-admin/firestore');
const { db } = require('../config/firebase');
const { getUserInfo } = require('./userService');

exports.createConversationRoom = async (user1Id, user2Id) => {
    try {
        const user1 = await getUserInfo(user1Id);
        getUserInfo(user2Id).then(async (user) => {
            const conversationRef = await db.collection('conversations').add({
                participant_1: user1,
                participant_2: user,
                lastMessage: {
                    senderId: "",
                    messageType: "",
                    message: "",
                    timestamp: "",
                },
                type: "individual",
                pinMessage: {
                    senderId: "",
                    messageType: "",
                    message: "",
                    timestamp: "",
                },
            })
            return conversationRef.id;
        })
    } catch (error) {
      throw error;
    }
}

exports.getAllConversations = async (userId) => {
    try {
        const conversationRef = db.collection('conversations').where(
            Filter.or(
                (
                    Filter.or(
                        Filter.where('participant_1.id', '==', userId),
                        Filter.where('participant_2.id', '==', userId),
                    )
                ),
                Filter.where('participants_array', 'array-contains', userId)       
            )
        )
        const conversationDocs = await conversationRef.get();
        const conversations = [];
        conversationDocs.forEach((doc) => {
            const conversationData = doc.data();
            conversations.push({
                id: doc.id,
                ...conversationData,  
            });
        });
        return conversations;
    } catch (error) {
        console.log(error)
        throw error;
    }
}

exports.createGroupChatRoom = async (userIds) => {
    try {
        const participants = [];
        for (let i = 0; i < userIds.length; i++) {
            const user = await getUserInfo(userIds[i]);
            participants.push(user);
        }
        const conversationRef = await db.collection('conversations').add({
            type: "group",
            participants,
            lastMessage: {
                senderId: "",
                messageType: "",
                message: "",
                timestamp: "",
            },
            groupAvatar: "",
            groupName: "",
            participants_array: userIds,
            pinMessage: {
                senderId: "",
                messageType: "",
                message: "",
                timestamp: "",
            },
        });
        return conversationRef.id;
    } catch (error) {
        throw error;
    }
}

exports.pinMessage = async (conversationId, message) => {
    try {
        const conversationRef = db.collection('conversations').doc(conversationId);

        await conversationRef.update({ pinMessage: message });

        const updatedDocument = await conversationRef.get();
        const updatedConversation = {
            id: updatedDocument.id,
            ...updatedDocument.data(),
        };

        return { success: true, message: 'Pin message updated successfully', updatedConversation };
    } catch (error) {
        console.error(error);
        throw error; // Rethrow the error so it can be caught in the calling function
    }
}