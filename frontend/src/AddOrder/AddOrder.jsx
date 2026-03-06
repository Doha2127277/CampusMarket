import { useState } from "react";
import "./AddOrder.css";
import { db } from "../firebase.js";
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

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("")
    const [type, setType] = useState("")
    const [mode, setMode] = useState("")
    const [price, setPrice] = useState("")
    const [photo, setPhoto] = useState(null)

    const addOrder = async (e) => {
        e.preventDefault()
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (!currentUser) {
            alert("Please login first");
            return;
        }

        try {
            let photoURL = "";
            if (photo) {
                photoURL = await uploadToCloudinary(photo);
                console.log("Photo URL:", photoURL);
            }
            const order = {
                name,
                description,
                category,
                type,
                status:"pending",
                mode,
                price: Number(price),
                userId: currentUser.uid,
                photoURL,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "products"), order);

            alert("Product added successfully!");

            // Reset form
            setName("");
            setDescription("");
            setCategory("");
            setType("");
            setMode("");
            setPrice("");
            setPhoto(null);

        } catch (error) {
            console.error("Error adding product:", error);
            alert("Error adding product");
        }



    };

    return (

        <div className="container">

            <h2>Add Product </h2>

            <form onSubmit={addOrder}>

                <input
                    placeholder="Product Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required />

                <textarea
                    placeholder="AddDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required></textarea>

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

                <input
                    type="number"
                    placeholder="Price" value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required />
                <label color="black"> Add Photo of product</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files[0])}
                />

                <button type="submit" > Add Order</button>

            </form>

        </div>

    )

}

export default AddOrder