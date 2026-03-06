import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./MyProducts.css";

function MyProducts() {

  const [products, setProducts] = useState([]);
   const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  

  useEffect(() => {
    const fetchProducts = async () => {

    const currentUser = JSON.parse(localStorage.getItem("user"));

    if (!currentUser) {
      navigate("/login");
        return;
      return;
    }

    try {
      const q = query(
        collection(db, "products"),
        where("userId", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);

      const list = [];

      querySnapshot.forEach((docItem) => {
        list.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      setProducts(list);

    } catch (error) {
      console.error("Error loading products:", error);
       setLoading(false);
    }
  };
    fetchProducts();
  }, [navigate]);

  const deleteProduct = async (id) => {

  try {
      await deleteDoc(doc(db, "products", id));
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading products...</p>;
  }

  if (products.length === 0) {
    return <p style={{ padding: "20px" }}>No products added yet.</p>;
  }

  return (
    <div className="my-products-container">
      <h2>My Products</h2>
      {products.map((product) => (
        <div key={product.id} className="product-card">
          {product.photoURL && (
            <img src={product.photoURL} alt={product.name} width="120" />
          )}
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <p>Category: {product.category}</p>
          <p>Price: {product.price}</p>
          <p>Status: {product.status}</p>
          <button onClick={() => deleteProduct(product.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default MyProducts;

       
export default MyProducts;
