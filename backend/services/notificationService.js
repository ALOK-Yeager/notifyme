const Notification = require('../models/Notification');

async function getPaginatedResults(userId, query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { recipient: userId };
    if (query.type) {
        filter.type = query.type;
    }
    if (query.read !== undefined) {
        filter['status.read'] = query.read === 'true';
    }

    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Notification.countDocuments(filter);

    return {
        notifications,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
}

async function getUnreadCount(userId) {
    return Notification.countDocuments({ recipient: userId, 'status.read': false });
}

module.exports = {
    getPaginatedResults,
    getUnreadCount
};
