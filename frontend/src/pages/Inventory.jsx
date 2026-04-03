import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: '',
        otherCategory: '',
        price: 0,
        quantity: 0,
        supplier: '',
        min_stock_threshold: 10,
        reorder_point: 10,
        max_stock_level: 0,
    });
    const [editProduct, setEditProduct] = useState({
        name: '',
        category: '',
        otherCategory: '',
        price: 0,
        quantity: 0,
        supplier: '',
        min_stock_threshold: 10,
        reorder_point: 10,
        max_stock_level: 0,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('category');
    const location = useLocation();
    const navigate = useNavigate();
    const role = localStorage.getItem('role');

    const queryParams = new URLSearchParams(location.search);
    const filterType = queryParams.get('filter');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products/');
            const productArray = Array.isArray(response.data) ? response.data : (response.data.data || []);
            setProducts(productArray);
        } catch (error) {
            console.error('Failed to fetch products', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (error) {
                alert('Failed to delete product');
            }
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newProduct,
                category:
                    newProduct.category === 'Other'
                        ? (newProduct.otherCategory || '').trim()
                        : newProduct.category,
            };
            delete payload.otherCategory;
            await api.post('/products/', payload);
            setIsModalOpen(false);
            setNewProduct({
                name: '',
                category: '',
                otherCategory: '',
                price: 0,
                quantity: 0,
                supplier: '',
                min_stock_threshold: 10,
                reorder_point: 10,
                max_stock_level: 0,
            });
            fetchProducts();
        } catch (error) {
            alert('Failed to add product');
        }
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        const isOther =
            !!product?.category &&
            ![
                'Electronics',
                'Laptops',
                'Smartphones',
                'Accessories',
                'Office Supplies',
                'Furniture',
                'Other',
            ].includes(product.category);

        setEditProduct({
            name: product?.name || '',
            category: isOther ? 'Other' : (product?.category || ''),
            otherCategory: isOther ? product.category : '',
            price: Number(product?.price ?? 0),
            quantity: Number(product?.quantity ?? 0),
            supplier: product?.supplier || '',
            min_stock_threshold: Number(product?.min_stock_threshold ?? 10),
            reorder_point: Number(product?.reorder_point ?? product?.min_stock_threshold ?? 10),
            max_stock_level: Number(product?.max_stock_level ?? 0),
        });
        setIsEditModalOpen(true);
    };

    const handleEditProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct?.id) return;
        try {
            const payload = {
                ...editProduct,
                category:
                    editProduct.category === 'Other'
                        ? (editProduct.otherCategory || '').trim()
                        : editProduct.category,
            };
            delete payload.otherCategory;
            await api.put(`/products/${editingProduct.id}`, payload);
            setIsEditModalOpen(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (error) {
            alert('Failed to update product');
        }
    };

    const handleUpdateStock = async (id, currentQty, change) => {
        try {
            await api.put(`/products/${id}`, { quantity: currentQty + change });
            fetchProducts();
        } catch (error) {
            alert('Failed to update stock');
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.supplier?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filterType === 'low-stock') {
            return matchesSearch && (productIsLowStock(p));
        }
        return matchesSearch;
    }).sort((a, b) => {
        const valA = (a[sortBy] || '').toString().toLowerCase();
        const valB = (b[sortBy] || '').toString().toLowerCase();
        
        if (sortBy === 'quantity' || sortBy === 'price') {
            return (a[sortBy] || 0) - (b[sortBy] || 0);
        }
        return valA.localeCompare(valB);
    });

    function productIsLowStock(product) {
        const reorderPoint = product.reorder_point ?? product.min_stock_threshold ?? 10;
        return product.quantity < reorderPoint;
    }

    const getStockBadge = (product) => {
        if (product.quantity === 0) return <span className="badge badge-danger">Out of Stock</span>;
        const reorderPoint = product.reorder_point ?? product.min_stock_threshold ?? 10;
        if (product.quantity < reorderPoint) return <span className="badge badge-warning">Low Stock</span>;
        return <span className="badge badge-success">In Stock</span>;
    };

    return (
        <Layout role={role}>
            <div className="page-header">
                <div>
                    <h1>Products {filterType === 'low-stock' && <span style={{ color: 'var(--warning)', fontSize: '0.9rem', verticalAlign: 'middle' }}>(Low Stock Filter Active)</span>}</h1>
                    <p className="subtitle">
                        {filterType === 'low-stock' ? `${filteredProducts.length} low stock items` : `${products.length} items in inventory`}
                        {filterType && (
                            <button 
                                onClick={() => navigate('/inventory')} 
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, marginLeft: '12px', padding: 0, textDecoration: 'underline' }}
                            >
                                Clear Filter
                            </button>
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Search Bar */}
                    <div style={{ position: 'relative' }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="modal-input"
                            style={{ paddingLeft: '40px', marginBottom: 0, minWidth: '240px' }}
                        />
                    </div>
                    {/* Sort Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sort By:</span>
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="modal-input"
                            style={{ marginBottom: 0, minWidth: '140px', padding: '8px 12px' }}
                        >
                            <option value="category">Category</option>
                            <option value="name">Product Name</option>
                            <option value="quantity">Stock Level</option>
                            <option value="price">Price</option>
                        </select>
                    </div>
                    {role === 'admin' && (
                        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* Products Table */}
            {filteredProducts.length === 0 ? (
                <div className="premium-table-wrapper">
                    <div className="empty-state">
                        <div className="empty-icon">📦</div>
                        <h3>{searchQuery ? 'No products match your search' : 'No products yet'}</h3>
                        <p>{searchQuery ? 'Try a different search term' : 'Click "Add Product" to get started'}</p>
                    </div>
                </div>
            ) : (
                <div className="premium-table-wrapper">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Supplier</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product.id}>
                                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                                    <td>
                                        <span className="badge badge-neutral">{product.category}</span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>₹{product.price?.toLocaleString()}</td>
                                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{product.quantity}</td>
                                    <td>{getStockBadge(product)}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{product.supplier || '—'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleUpdateStock(product.id, product.quantity, -1)} className="btn-icon" title="Decrease stock">−</button>
                                            <button onClick={() => handleUpdateStock(product.id, product.quantity, 1)} className="btn-icon" title="Increase stock">+</button>
                                            {role === 'admin' && (
                                                <button onClick={() => openEditModal(product)} className="btn btn-secondary btn-sm">
                                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                            )}
                                            {role === 'admin' && (
                                                <button onClick={() => handleDelete(product.id)} className="btn btn-danger btn-sm">
                                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Product Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="modal-content">
                        <h3>Add New Product</h3>
                        <p className="modal-subtitle">Fill in the details below to add a new item to your inventory.</p>
                        <form onSubmit={handleAddProduct}>
                            <input
                                placeholder="Product Name"
                                value={newProduct.name}
                                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                required
                                className="modal-input"
                            />
                            <select
                                value={newProduct.category}
                                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                required
                                className="modal-input"
                            >
                                <option value="" disabled>Select Category</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Laptops">Laptops</option>
                                <option value="Smartphones">Smartphones</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Office Supplies">Office Supplies</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Other">Other</option>
                            </select>
                            {newProduct.category === 'Other' && (
                                <input
                                    placeholder="Enter category name"
                                    value={newProduct.otherCategory}
                                    onChange={e => setNewProduct({ ...newProduct, otherCategory: e.target.value })}
                                    required
                                    className="modal-input"
                                />
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <input
                                    type="number"
                                    placeholder="Price (₹)"
                                    value={newProduct.price || ''}
                                    onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                                    required
                                    className="modal-input"
                                />
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    value={newProduct.quantity || ''}
                                    onChange={e => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })}
                                    required
                                    className="modal-input"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        Reorder Point
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 10"
                                        value={newProduct.reorder_point ?? ''}
                                        onChange={e => setNewProduct({ ...newProduct, reorder_point: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        className="modal-input"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        Min Stock
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 10"
                                        value={newProduct.min_stock_threshold ?? ''}
                                        onChange={e => setNewProduct({ ...newProduct, min_stock_threshold: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        className="modal-input"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        Max Stock
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 100"
                                        value={newProduct.max_stock_level ?? ''}
                                        onChange={e => setNewProduct({ ...newProduct, max_stock_level: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        className="modal-input"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                            </div>
                            <input
                                placeholder="Supplier Name"
                                value={newProduct.supplier}
                                onChange={e => setNewProduct({ ...newProduct, supplier: e.target.value })}
                                className="modal-input"
                            />
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Save Product
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsEditModalOpen(false)}>
                    <div className="modal-content">
                        <h3>Edit Product</h3>
                        <p className="modal-subtitle">Update product details and stock policy.</p>
                        <form onSubmit={handleEditProduct}>
                            <input
                                placeholder="Product Name"
                                value={editProduct.name}
                                onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                                required
                                className="modal-input"
                            />
                            <select
                                value={editProduct.category}
                                onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
                                required
                                className="modal-input"
                            >
                                <option value="" disabled>Select Category</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Laptops">Laptops</option>
                                <option value="Smartphones">Smartphones</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Office Supplies">Office Supplies</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Other">Other</option>
                            </select>
                            {editProduct.category === 'Other' && (
                                <input
                                    placeholder="Enter category name"
                                    value={editProduct.otherCategory}
                                    onChange={e => setEditProduct({ ...editProduct, otherCategory: e.target.value })}
                                    required
                                    className="modal-input"
                                />
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <input
                                    type="number"
                                    placeholder="Price (₹)"
                                    value={editProduct.price ?? ''}
                                    onChange={e => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })}
                                    required
                                    className="modal-input"
                                />
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    value={editProduct.quantity ?? ''}
                                    onChange={e => setEditProduct({ ...editProduct, quantity: parseInt(e.target.value) || 0 })}
                                    required
                                    className="modal-input"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        Reorder Point
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 10"
                                        value={editProduct.reorder_point ?? ''}
                                        onChange={e => setEditProduct({ ...editProduct, reorder_point: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        className="modal-input"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        Min Stock
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 10"
                                        value={editProduct.min_stock_threshold ?? ''}
                                        onChange={e => setEditProduct({ ...editProduct, min_stock_threshold: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        className="modal-input"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        Max Stock
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 100"
                                        value={editProduct.max_stock_level ?? ''}
                                        onChange={e => setEditProduct({ ...editProduct, max_stock_level: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        className="modal-input"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                            </div>
                            <input
                                placeholder="Supplier Name"
                                value={editProduct.supplier}
                                onChange={e => setEditProduct({ ...editProduct, supplier: e.target.value })}
                                className="modal-input"
                            />
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Update Product
                                </button>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Inventory;
