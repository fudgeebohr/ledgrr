const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    payer: {
      type: String,
      required: [true, 'Payer is required'],
      trim: true,
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      trim: true,
    },
    monthlyDue: {
      type: Number,
      required: [true, 'Monthly due amount is required'],
      min: [0, 'Monthly due cannot be negative'],
    },
    monthsToPay: {
      type: Number,
      required: [true, 'Total number of months to pay is required'],
      min: [1, 'Months to pay must be at least 1'],
    },
    monthsPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Next upcoming due date for this item
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ItemSchema.virtual('totalAmount').get(function () {
  return this.monthlyDue * this.monthsToPay;
});

ItemSchema.virtual('amountPaid').get(function () {
  return this.monthlyDue * this.monthsPaid;
});

ItemSchema.virtual('remainingMonths').get(function () {
  return Math.max(this.monthsToPay - this.monthsPaid, 0);
});

ItemSchema.virtual('remainingAmount').get(function () {
  return this.remainingMonths * this.monthlyDue;
});

ItemSchema.virtual('progressPercent').get(function () {
  if (this.monthsToPay === 0) return 0;
  return Math.min(Math.round((this.monthsPaid / this.monthsToPay) * 100), 100);
});

ItemSchema.virtual('isCompleted').get(function () {
  return this.monthsPaid >= this.monthsToPay;
});

module.exports = mongoose.model('Item', ItemSchema);
