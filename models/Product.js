const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Perfume name is required'],
        trim: true,
        unique: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    brand: {
        type: String,
        default: 'Luxury'
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    inStock: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);