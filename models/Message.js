var mongoose = require('mongoose'),
    mongooseAutoIncrement = require('mongoose-auto-increment');

var MessageSchema = mongoose.Schema({
    sender: { type: String },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "conversationId"},
    type: {
        type: String,
        default: 'TEXT'
    },
    content: { type: String },
    creationDate: Date,
});

MessageSchema.statics.getConversationMessages = function(id,limit,callback) {
	var limitation = (limit)? limit: 50;
    this.find({ conversationId: id }).limit(limitation).sort({ creationDate: -1 }).exec(callback);
}

MessageSchema.statics.getLastConversationMessages = function(id,callback) {
	this.find({ conversationId: id }).limit(1).sort({ creationDate: -1 }).exec(callback);
}

MessageSchema.statics.createMessage = function(newMessage, callback){
	newMessage.save(callback);
}

MessageSchema.plugin(mongooseAutoIncrement.plugin, {model: 'Message', field: 'ID'});

var Message = mongoose.model('Message', MessageSchema);

module.exports = Message;