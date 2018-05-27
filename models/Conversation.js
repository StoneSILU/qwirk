var mongoose = require('mongoose'),
    mongooseAutoIncrement = require('mongoose-auto-increment');

var ConversationSchema = mongoose.Schema({
	name: { type: String, maxlength: 50 },
    conversationPicture: { type: String },
    moderators: { 
        type: Array,
        default: []
    },
    participants: { 
        type: Array,
         default: []
     },
    type: {
        type: String,
        enum : ['Channel','Group','Conversation'],
        default: 'Conversation'
    },
    banned: {
        type: Array
    },
    kicked: {
        type: Array
    },
    creationDate: { type: Date, default: new Date() },
});

ConversationSchema.statics.createConversation = function(newConversation, callback) {
    newConversation.save(callback)
}

ConversationSchema.statics.getUserConversations = function(username,callback) {
    this.find({ $or: [ { moderators: username }, { participants: username } ] }, callback)
}
ConversationSchema.statics.getChannels = function(callback) {
    this.find({ type: 'Channel' }, callback)
}
ConversationSchema.statics.addSomeone = function(infos,callback) {
    this.findOneAndUpdate({ _id: infos._conversationId }, { $addToSet: infos.varToAdd }, callback );
}

ConversationSchema.statics.deleteSomeone = function(infos,callback) {
    console.log(infos)
    this.findOneAndUpdate({ _id: infos._conversationId }, { $pull: infos.varToDelete }, { multi: true }, callback );
}

ConversationSchema.plugin(mongooseAutoIncrement.plugin, {model: 'Conversation', field: 'ID'});

var Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;