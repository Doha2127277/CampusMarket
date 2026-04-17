import { useState } from "react";
import bgImage from './image.png';
import "./AddOrder.css";
import { db, auth } from "../firebase.js";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "CampusMarket");
    formData.append("folder", "CampusMarket");

    const res = await fetch(
        "https://api.cloudinary.com/v1_1/dmzp7e6zb/image/upload",
        {
            method: "POST",
            body: formData
        }
    );

    const data = await res.json();
    return data.secure_url;
};

function AddOrder() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [type, setType] = useState("");
    const [mode, setMode] = useState("");
    const [price, setPrice] = useState("");
    const [photo, setPhoto] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    const addOrder = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
            alert("Please login first");
            navigate("/login");   
            return;
        }

        try {
            setIsUploading(true);
            let photoURL = "";
            if (photo) {
                photoURL = await uploadToCloudinary(photo);
            }

            const productData = {
                name,
                description,
                category,
                type,
                status: "pending", // Remains pending for Admin approval
                mode,
                price: mode === "Volunteer" ? 0 : Number(price), // Force 0 if Volunteer
                sellerId: currentUser.uid,
                isSold: false, // Added to support Home Page filtering
                photoURL,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "products"), productData);

            alert("Product submitted for approval!");

            // Reset form
            setName("");
            setDescription("");
            setCategory("");
            setType("");
            setMode("");
            setPrice("");
            setPhoto(null);
            navigate("/");

        } catch (error) {
            console.error("Error adding product:", error);
            alert("Error adding product");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="addproduct-wrapper">
            <img src={bgImage} className="background-image" alt="background" />
            
            <div className="container1">
                <h2>Add Product</h2>

                <form onSubmit={addOrder}>
                    <input
                        placeholder="Product Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required 
                    />

                    <textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>

                    <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                        <option value="">Category</option>
                        <option>Engineering</option>
                        <option>Medicine</option>
                        <option>Business</option>
                    </select>

                    <select value={type} onChange={(e) => setType(e.target.value)} required>
                        <option value="">Type</option>
                        <option>Book</option>
                        <option>Tools</option>
                    </select>

                    <select value={mode} onChange={(e) => setMode(e.target.value)} required>
                        <option value="">Mode</option>
                        <option>For Sale</option>
                        <option>Volunteer</option>
                    </select>

                    {mode !== "Volunteer" && (
                        <input
                            type="number"
                            placeholder="Price" 
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required 
                        />
                    )}

                    <label style={{color: "black", display: "block", marginTop: "10px"}}>Add Product Photo</label>
                    <input
                        type="file"
                        accept="image/*" 
                        required
                        onChange={(e) => setPhoto(e.target.files[0])}
                    />

                    <button type="submit" disabled={isUploading}>
                        {isUploading ? "Uploading..." : "Add Product"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddOrder;
