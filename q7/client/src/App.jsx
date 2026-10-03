import { useState, useEffect } from 'react';

export default function App() {
  const [view, setView] = useState('user'); // 'user' or 'admin'
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Student');
  const [message, setMessage] = useState('');

  // User Filter State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Admin Category Form State
  const [catName, setCatName] = useState('');
  const [catParent, setCatParent] = useState('');

  // Admin Product Form State
  const [prodEditingId, setProdEditingId] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodCat, setProdCat] = useState('');
  const [prodSubcat, setProdSubcat] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Helper arrays for 2-level categories
  const level1Categories = categories.filter((c) => !c.parent);
  const getSubcategories = (parentId) =>
    categories.filter((c) => c.parent && (c.parent._id === parentId || c.parent === parentId));

  // --- ADMIN ACTIONS ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, parent: catParent || null })
      });
      if (res.ok) {
        setCatName('');
        setCatParent('');
        fetchCategories();
        setMessage('Category created successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category? (This will also delete child subcategories and products)')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
      fetchProducts();
      setMessage('Category deleted');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodCat || !prodSubcat) {
      alert('Please fill all required fields');
      return;
    }

    const payload = {
      name: prodName,
      description: prodDesc,
      price: Number(prodPrice),
      stock: Number(prodStock),
      category: prodCat,
      subcategory: prodSubcat
    };

    try {
      if (prodEditingId) {
        await fetch(`/api/products/${prodEditingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setMessage('Product updated successfully!');
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setMessage('Product added successfully!');
      }
      resetProductForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProduct = (p) => {
    setProdEditingId(p._id);
    setProdName(p.name);
    setProdDesc(p.description || '');
    setProdPrice(p.price);
    setProdStock(p.stock);
    setProdCat(p.category?._id || p.category);
    setProdSubcat(p.subcategory?._id || p.subcategory);
  };

  const resetProductForm = () => {
    setProdEditingId(null);
    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setProdStock('10');
    setProdCat('');
    setProdSubcat('');
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
      setMessage('Product deleted');
    } catch (err) {
      console.error(err);
    }
  };

  // --- USER / CART ACTIONS ---
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Cannot add more than available stock');
          return prev;
        }
        return prev.map((item) =>
          item.product === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            product: product._id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            quantity: 1
          }
        ];
      }
    });
    setMessage(`Added "${product.name}" to cart`);
  };

  const updateCartQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock) {
              alert('Cannot exceed available stock');
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          items: cart,
          totalAmount: cartTotal
        })
      });
      if (res.ok) {
        alert('Order placed successfully!');
        setCart([]);
        fetchProducts();
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter products for User View
  const filteredProducts = products.filter((p) => {
    const catId = p.category?._id || p.category;
    const subcatId = p.subcategory?._id || p.subcategory;

    if (selectedCategory && catId !== selectedCategory) return false;
    if (selectedSubcategory && subcatId !== selectedSubcategory) return false;
    return true;
  });

  return (
    <div>
      <h1>Shopping Cart with 2-Level Category & Products (MERN)</h1>

      {/* Navigation bar to toggle views */}
      <div>
        <button onClick={() => setView('user')}>User Site (Shopping)</button>{' '}
        <button onClick={() => setView('admin')}>Admin Site (Manage Catalog)</button>
      </div>

      {message && <p><b>Notification:</b> {message}</p>}
      <hr />

      {/* ================= USER SITE ================= */}
      {view === 'user' && (
        <div>
          <h2>User Site: Product Catalog & Shopping Cart</h2>

          {/* 2-Level Category Filter */}
          <fieldset>
            <legend>Filter by 2-Level Categories</legend>
            <p>
              <label>
                <b>Level 1 Category:</b>{' '}
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('');
                  }}
                >
                  <option value="">-- All Main Categories --</option>
                  {level1Categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {'  '}
              {selectedCategory && (
                <label>
                  <b>Level 2 Subcategory:</b>{' '}
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                  >
                    <option value="">-- All Subcategories --</option>
                    {getSubcategories(selectedCategory).map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {'  '}
              {(selectedCategory || selectedSubcategory) && (
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedSubcategory('');
                  }}
                >
                  Reset Filter
                </button>
              )}
            </p>
          </fieldset>

          {/* Product List */}
          <h3>Available Products</h3>
          {filteredProducts.length === 0 ? (
            <p>No products found in this category.</p>
          ) : (
            <table border="1" cellPadding="5" cellSpacing="0">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Description</th>
                  <th>Level 1 Category</th>
                  <th>Level 2 Subcategory</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.description || '-'}</td>
                    <td>{p.category?.name || '-'}</td>
                    <td>{p.subcategory?.name || '-'}</td>
                    <td>Rs. {p.price}</td>
                    <td>{p.stock}</td>
                    <td>
                      <button
                        disabled={p.stock <= 0}
                        onClick={() => addToCart(p)}
                      >
                        {p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <hr />

          {/* Shopping Cart Section */}
          <h3>Your Shopping Cart ({cart.length} items)</h3>
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <div>
              <table border="1" cellPadding="5" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.product}>
                      <td>{item.name}</td>
                      <td>Rs. {item.price}</td>
                      <td>
                        <button onClick={() => updateCartQuantity(item.product, -1)}>-</button>
                        {' '}{item.quantity}{' '}
                        <button onClick={() => updateCartQuantity(item.product, 1)}>+</button>
                      </td>
                      <td>Rs. {item.price * item.quantity}</td>
                      <td>
                        <button onClick={() => removeFromCart(item.product)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="3" align="right"><b>Total Amount:</b></td>
                    <td colSpan="2"><b>Rs. {cartTotal}</b></td>
                  </tr>
                </tbody>
              </table>

              <p>
                <label>
                  Customer Name:{' '}
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </label>
                {' '}
                <button onClick={handlePlaceOrder}>Place Order / Checkout</button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= ADMIN SITE ================= */}
      {view === 'admin' && (
        <div>
          <h2>Admin Site: Category & Product Management</h2>

          {/* 1. Category Management (2 Levels) */}
          <fieldset>
            <legend><b>1. Manage Categories (2 Levels)</b></legend>
            <form onSubmit={handleAddCategory}>
              <p>
                <label>
                  Category Name:{' '}
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                  />
                </label>
                {'  '}
                <label>
                  Parent Category (Leave empty for Level 1):{' '}
                  <select
                    value={catParent}
                    onChange={(e) => setCatParent(e.target.value)}
                  >
                    <option value="">None (Create as Level 1 Parent Category)</option>
                    {level1Categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} (Level 1)
                      </option>
                    ))}
                  </select>
                </label>
                {'  '}
                <button type="submit">Add Category</button>
              </p>
            </form>

            <h4>All Categories Hierarchy</h4>
            {categories.length === 0 ? (
              <p>No categories created yet.</p>
            ) : (
              <table border="1" cellPadding="5" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Category Name</th>
                    <th>Parent Category</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c._id}>
                      <td>{c.parent ? 'Level 2 (Subcategory)' : 'Level 1 (Parent)'}</td>
                      <td><b>{c.name}</b></td>
                      <td>{c.parent?.name || '-'}</td>
                      <td>
                        <button onClick={() => handleDeleteCategory(c._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </fieldset>

          <br />

          {/* 2. Product Management */}
          <fieldset>
            <legend>
              <b>2. {prodEditingId ? 'Edit Product' : 'Add New Product'}</b>
            </legend>
            <form onSubmit={handleSaveProduct}>
              <p>
                <label>
                  Product Name:{' '}
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                  />
                </label>
                {'  '}
                <label>
                  Price (Rs.):{' '}
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                  />
                </label>
                {'  '}
                <label>
                  Stock:{' '}
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                  />
                </label>
              </p>

              <p>
                <label>
                  Description:{' '}
                  <input
                    type="text"
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    size="40"
                  />
                </label>
              </p>

              <p>
                <label>
                  Level 1 Category:{' '}
                  <select
                    required
                    value={prodCat}
                    onChange={(e) => {
                      setProdCat(e.target.value);
                      setProdSubcat('');
                    }}
                  >
                    <option value="">-- Select Level 1 Category --</option>
                    {level1Categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                {'  '}
                <label>
                  Level 2 Subcategory:{' '}
                  <select
                    required
                    value={prodSubcat}
                    onChange={(e) => setProdSubcat(e.target.value)}
                    disabled={!prodCat}
                  >
                    <option value="">-- Select Level 2 Subcategory --</option>
                    {getSubcategories(prodCat).map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </label>
              </p>

              <p>
                <button type="submit">{prodEditingId ? 'Update Product' : 'Save Product'}</button>
                {' '}
                {prodEditingId && <button type="button" onClick={resetProductForm}>Cancel Edit</button>}
              </p>
            </form>

            <h4>All Products in Database</h4>
            {products.length === 0 ? (
              <p>No products found.</p>
            ) : (
              <table border="1" cellPadding="5" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Level 1 Category</th>
                    <th>Level 2 Subcategory</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>Rs. {p.price}</td>
                      <td>{p.stock}</td>
                      <td>{p.category?.name || '-'}</td>
                      <td>{p.subcategory?.name || '-'}</td>
                      <td>
                        <button onClick={() => handleEditProduct(p)}>Edit</button>{' '}
                        <button onClick={() => handleDeleteProduct(p._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </fieldset>

          <br />

          {/* 3. Orders List */}
          <fieldset>
            <legend><b>3. Customer Orders</b></legend>
            {orders.length === 0 ? (
              <p>No orders placed yet.</p>
            ) : (
              <table border="1" cellPadding="5" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td>{o._id}</td>
                      <td>{o.customerName}</td>
                      <td>
                        <ul>
                          {o.items?.map((it, idx) => (
                            <li key={idx}>
                              {it.name} x {it.quantity} (Rs. {it.price})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>Rs. {o.totalAmount}</td>
                      <td>{new Date(o.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </fieldset>
        </div>
      )}
    </div>
  );
}
