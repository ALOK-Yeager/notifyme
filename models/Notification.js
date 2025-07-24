const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required'],
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    type: {
        type: String,
        enum: ['email', 'push', 'in-app', 'sms'],
        required: [true, 'Notification type is required'],
        index: true
    },
    category: {
        type: String,
        enum: ['marketing', 'updates', 'security', 'social', 'system'],
        required: true,
        default: 'system'
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        maxlength: [500, 'Message cannot exceed 500 characters']
    },
    data: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    },
    actions: [{
        label: { type: String, required: true },
        action: { type: String, required: true },
        style: { type: String, enum: ['default', 'primary', 'danger'], default: 'default' }
    }],
    status: {
        sent: { type: Boolean, default: false },
        delivered: { type: Boolean, default: false },
        read: { type: Boolean, default: false, index: true },
        clicked: { type: Boolean, default: false }
    },
    timestamps: {
        sent: Date,
        delivered: Date,
        read: Date,
        clicked: Date
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical'],
        default: 'normal',
        index: true
    },
    retries: {
        count: { type: Number, default: 0 },
        lastAttempt: Date,
        nextAttempt: Date,
        error: String
    },
    expiry: {
        type: Date,
        index: { expireAfterSeconds: 0 }
    },
    groupId: {
        type: String,
        index: true
    },
    template: {
        name: String,
        version: String,
        variables: Map
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

NotificationSchema.index({ recipient: 1, 'status.read': 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, category: 1, 'status.read': 1 });
NotificationSchema.index({ groupId: 1, createdAt: -1 });

NotificationSchema.virtual('isExpired').get(function () {
    return this.expiry && this.expiry < new Date();
});

NotificationSchema.virtual('age').get(function () {
    return Date.now() - this.createdAt;
});

NotificationSchema.methods.markAsRead = function () {
    this.status.read = true;
    this.timestamps.read = new Date();
    return this.save();
};

NotificationSchema.methods.markAsDelivered = function () {
    this.status.delivered = true;
    this.timestamps.delivered = new Date();
    return this.save();
};

NotificationSchema.methods.markAsSent = function () {
    this.status.sent = true;
    this.timestamps.sent = new Date();
    return this.save();
};

NotificationSchema.statics.getUnreadCount = function (userId) {
    return this.countDocuments({
        recipient: userId,
        'status.read': false,
        expiry: { $gt: new Date() }
    });
};

NotificationSchema.statics.markAllAsRead = function (userId) {
    return this.updateMany(
        {
            recipient: userId,
            'status.read': false
        },
        {
            $set: {
                'status.read': true,
                'timestamps.read': new Date()
            }
        }
    );
};

NotificationSchema.pre('save', function (next) {
    if (!this.expiry) {
        const expiryDays = this.priority === 'critical' ? 30 : 7;
        this.expiry = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    }
    next();
});

module.exports = mongoose.model('Notification', NotificationSchema);