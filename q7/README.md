# Question 7: Shopping Cart with Admin Site & User Site (2-Level Category & Products) - MERN Stack

## Description
This project implements a complete Shopping Cart application using the MERN stack (MongoDB, Express, React, Node.js) with:
1. **Admin Site**:
   - Create and manage 2-level categories (Level 1 Parent Categories and Level 2 Subcategories).
   - Create, edit, and delete products mapped to Level 1 Category and Level 2 Subcategory.
   - View customer orders.
2. **User Site**:
   - Filter products by 2-Level categories (Select Main Category -> dynamically populates Subcategories).
   - Product catalog with name, category, price, stock.
   - Shopping cart: Add to cart, adjust quantities (+/-), remove items, total price calculation.
   - Checkout/Place order with stock decrement.
3. **Design**: Simple clean code, pure HTML, no external CSS.

## How to Run

### 1. Install Dependencies
Open terminal in `q7` folder:
```bash
npm install
cd client
npm install
cd ..
```

### 2. Start Application
From the `q7` directory:
```bash
npm run dev
```
- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:3000`
