const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    }
});

const orderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    customerAddress: {
        type: String,
        required: [true, 'Delivery address is required'],
        trim: true
    },
    items: {
        type: [orderItemSchema],
        validate: {
            validator: (v) => Array.isArray(v) && v.length > 0,
            message: 'Order must contain at least one item.'
        }
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);