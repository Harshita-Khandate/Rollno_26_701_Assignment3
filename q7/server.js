const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_cart';

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedInitialData();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// Seed sample 2-level categories & products if none exist
async function seedInitialData() {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      console.log('Seeding initial categories and products...');
      // Level 1 Categories
      const electronics = await Category.create({ name: 'Electronics', parent: null });
      const fashion = await Category.create({ name: 'Fashion', parent: null });

      // Level 2 Subcategories
      const laptops = await Category.create({ name: 'Laptops', parent: electronics._id });
      const phones = await Category.create({ name: 'Smartphones', parent: electronics._id });
      const mens = await Category.create({ name: "Men's Wear", parent: fashion._id });
      const womens = await Category.create({ name: "Women's Wear", parent: fashion._id });

      // Sample Products
      await Product.create([
        {
          name: 'Gaming Laptop',
          description: 'High performance gaming laptop 16GB RAM',
          price: 65000,
          stock: 8,
          category: electronics._id,
          subcategory: laptops._id
        },
        {
          name: 'Business Ultrabook',
          description: 'Lightweight business laptop 14 inch',
          price: 52000,
          stock: 12,
          category: electronics._id,
          subcategory: laptops._id
        },
        {
          name: '5G Smartphone',
          description: '128GB Storage, 50MP Camera',
          price: 18000,
          stock: 20,
          category: electronics._id,
          subcategory: phones._id
        },
        {
          name: 'Cotton Casual Shirt',
          description: 'Pure cotton slim-fit shirt',
          price: 1200,
          stock: 30,
          category: fashion._id,
          subcategory: mens._id
        },
        {
          name: 'Floral Summer Dress',
          description: 'Breathable floral print summer dress',
          price: 1600,
          stock: 15,
          category: fashion._id,
          subcategory: womens._id
        }
      ]);
      console.log('Initial seed completed successfully.');
    }
  } catch (err) {
    console.error('Error seeding data:', err.message);
  }
}

// ----------------- CATEGORY ROUTES -----------------
// GET all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().populate('parent', 'name').sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new category (Level 1 if parent is null/empty, Level 2 if parent is provided)
app.post('/api/categories', async (req, res) => {
  try {
    const { name, parent } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const newCategory = new Category({
      name,
      parent: parent ? parent : null
    });
    await newCategory.save();
    const populated = await Category.findById(newCategory._id).populate('parent', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE category (also deletes child subcategories and associated products)
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Find child subcategories if this is a parent
    const childCategories = await Category.find({ parent: id });
    const childIds = childCategories.map(c => c._id);
    const allIds = [id, ...childIds];

    // Delete products under these categories
    await Product.deleteMany({
      $or: [{ category: { $in: allIds } }, { subcategory: { $in: allIds } }]
    });

    // Delete categories
    await Category.deleteMany({ _id: { $in: allIds } });

    res.json({ message: 'Category and related items deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- PRODUCT ROUTES -----------------
// GET all products with optional category & subcategory filters
app.get('/api/products', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.subcategory) filter.subcategory = req.query.subcategory;

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new product
app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, stock, category, subcategory } = req.body;
    if (!name || price == null || !category || !subcategory) {
      return res.status(400).json({ error: 'Name, price, category, and subcategory are required' });
    }

    const newProduct = new Product({
      name,
      description: description || '',
      price: Number(price),
      stock: Number(stock) || 0,
      category,
      subcategory
    });

    await newProduct.save();
    const populated = await Product.findById(newProduct._id)
      .populate('category', 'name')
      .populate('subcategory', 'name');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, description, price, stock, category, subcategory } = req.body;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        category,
        subcategory
      },
      { new: true }
    )
      .populate('category', 'name')
      .populate('subcategory', 'name');

    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- ORDER / CART ROUTES -----------------
// POST place order
app.post('/api/orders', async (req, res) => {
  try {
    const { items, customerName, totalAmount } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const order = new Order({
      customerName: customerName || 'Guest User',
      items,
      totalAmount
    });
    await order.save();

    // Deduct stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all orders (for admin view)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
