import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./MyProducts.css";

function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States الخاصة بالتعديل
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState("Sell"); // الحالة الجديدة للنوع

  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    const fetchProducts = async () => {
      try {
        const q = query(
    collection(db, "products"),
    where("sellerId", "==", user.uid)  // ← هنا بدل userId
);
        
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((docItem) => {
          list.push({ id: docItem.id, ...docItem.data() });
        });
        setProducts(list);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "products", id));
        setProducts(products.filter((p) => p.id !== id));
        alert("Product deleted successfully!");
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setNewName(product.name);
    setNewPrice(product.price);
    setNewCategory(product.category || "");
    setNewType(product.type || "Sell"); // تحميل النوع الحالي
    setIsModalOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const productRef = doc(db, "products", editingProduct.id);
      await updateDoc(productRef, {
        name: newName,
        price: Number(newPrice),
        category: newCategory,
        type: newType, // حفظ النوع الجديد
        status: "pending"
      });

      setProducts(products.map(p => p.id === editingProduct.id ? 
        { ...p, name: newName, price: newPrice, category: newCategory, type: newType, status: "pending" } : p
      ));

      alert("Updated successfully!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating:", error);
      alert("Update failed!");
    }
  };

  const getStatusClass = (status) => {
    const s = status?.toLowerCase();
    if (s === 'verified' || s === 'approved') return 'status-verified';
    if (s === 'rejected') return 'status-rejected';
    return 'status-pending';
  };

  if (loading) return <div className="loading-state">Loading products...</div>;

  return (
    <div className="my-products-page">
      
      <h2 className="page-title">My Products</h2>
      <div className="products-grid">
        {products.length === 0 ? (
          <div className="no-products">No products found.</div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-item-card">
              <div className="img-container">
                {product.photoURL ? <img src={product.photoURL} alt={product.name} /> : <div className="no-img">No Image</div>}
              </div>
              <div className="item-details">
                <h3 className="item-name">{product.name}</h3>
                <p className="item-price">{product.price} EGP</p>
                <div className="item-meta">
                   <span className="type-tag">{product.type === "Donate" ? "Donation" : "For Sale"}</span>
                   <span className="item-category"> | {product.category}</span>
                </div>
                <div className="status-box">
                  Status: <span className={`status-badge ${getStatusClass(product.status)}`}>
                    {product.status || 'Pending'}
                  </span>
                </div>
                <div className="item-actions">
                  <button className="btn-edit" onClick={() => handleEdit(product)}>Edit</button>
                  <button className="btn-delete" onClick={() => deleteProduct(product.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="edit-modal-overlay">
          <div className="edit-modal-content">
            <h3>Edit Product</h3>
            <form onSubmit={saveEdit}>
              <label>Name:</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              
              <label>Price:</label>
              <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
              
              <label>Category:</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} required>
                <option value="Engineering">Engineering</option>
                <option value="Medicine">Medicine</option>
                <option value="Business">Business</option>
              </select>

              <label>Type:</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} required>
                <option value="Sell">For Sale</option>
                <option value="Donate">Donation / Free</option>
              </select>

              <div className="modal-actions">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProducts;