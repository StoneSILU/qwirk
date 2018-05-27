var mongoose = require('mongoose'),
    mongooseAutoIncrement = require('mongoose-auto-increment'),
    passportLocalMongoose = require('passport-local-mongoose'),
    Hash = require('password-hash');

var UserSchema = mongoose.Schema({
    firstName: { type: String, maxlength: 50 },
    lastName: { type: String, maxlength: 50 },
    username: { type: String, maxlength: 50, unique: true },
    email: { type: String, unique: true},
    password: { type: String, set: function(newValue) {
        return Hash.isHashed(newValue) ? newValue : Hash.generate(newValue);
    } },
    profilePicture: { type: String },
    birthDate: { type: Date, max: Date.now() },
    gender: {
        type: String,
        enum : ['Female','Male'],
        default: 'Male'
    },
    status: {
        type: String,
        enum : ['ONLINE','OFFLINE','AWAY','NOT DISTURBING'],
        default: 'ONLINE'
    },
    active: { type: Boolean, default: true },
    bio: { type: String, maxlength: 100 },
    contactList: { type: [mongoose.Schema.Types.Mixed], default: undefined },
    creationDate: Date,
});


UserSchema.statics.authenticate = function(email, password, callback) {
    this.findOne({ email: email }, function(error, user) {
        if (user && Hash.verify(password, user.password)) {
            callback(null, user);
        } else if (user || !error) {
            // Email or password was invalid (no MongoDB error)
            error = new Error("Your email address or password is invalid. Please try again.");
            callback(error, null);
        } else {
            // Something bad happened with MongoDB. You shouldn't run into this often.
            callback(error, null);
        }
    });
};

UserSchema.statics.createUser = function(newUser, callback) {
    this.findOne({ $or: [ { username: newUser.username }, { email: newUser.email } ] }, function(error, user) {
        if (user) { 
            callback("User already exists")
            return;
        }else {
            console.log("newUser.password before : " +newUser)
            if (!Hash.isHashed(newUser.password)) {
                Hash.generate(newUser.password);
            }
            newUser.save(callback);
        }
    })
}

UserSchema.statics.getProfilePic = function(id, callback) {
    this.findOne({ ID: id }, { profilePicture: 1 }, callback);
}
UserSchema.statics.getUserInfoById = function(id, callback) {
    this.findOne({ ID: id }, callback).project({ password: 0 });
}

UserSchema.statics.updateProps = function(options, callback) {
    // console.log(options.id);
    this.update({ ID: options.id }, { $set: options.properties }, callback );
}

UserSchema.statics.searchUser = function(options, callback) {
    this.find({ $or: [ { username: {'$regex': options.username } },{ email: {'$regex': options.username } }], ID: {'$ne': options.userId}  }, { password: 0, _id: 0, contactList: 0 }, callback);
}

UserSchema.statics.getUserInfoByUsername = function(username, callback) {
    this.findOne({ username: username }, { password: 0 }, callback);
}

UserSchema.statics.getUserByUsername = function(username, callback) {
    this.findOne({ username: username }, callback);
}

UserSchema.statics.getUserByEmail = function(email, callback) {
    this.findOne({ email: email }, callback);
}

UserSchema.statics.getUserById = function(id, callback) {
    this.findOne( { ID: id } , callback);
}
UserSchema.statics.getUser = function(id, callback) {
    this.findOne( { _id: id } , callback);
}

UserSchema.statics.deleteContact = function(infos,callback) {
    console.log(infos)
    this.findOneAndUpdate({ _id: infos.owner }, { $pull: { contactList: { username: infos.username } } }, callback );
}

UserSchema.statics.comparePassword = function(candidatePassword, password, callback) {
    if (Hash.verify(candidatePassword, password)) {
            callback(null, true);
    } else {
        // Something bad happened with MongoDB. You shouldn't run into this often.
        callback("Invalid password", false);
    }
}

UserSchema.plugin(mongooseAutoIncrement.plugin, {model: 'User', field: 'ID'});
UserSchema.plugin(passportLocalMongoose);

var User = mongoose.model('User', UserSchema);

module.exports = User;