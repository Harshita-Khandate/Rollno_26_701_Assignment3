const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // If parent is null, it's a Level 1 Category.
  // If parent is set to another Category ID, it's a Level 2 Subcategory.
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
