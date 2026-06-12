// server/models/Notification.model.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      // PRD v2 §3.3 — removed PROFILE_VIEWED
      enum: ['APPLICATION_RECEIVED', 'STATUS_UPDATE', 'JOB_POSTED', 'SYSTEM'],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    data:    { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

// PRD v2 §3.3 — optimised for "fetch my unread notifications" query
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
