import { useState } from "react";
import "./AddOrder.css";

function AddOrder() {

const [name,setName] = useState("")
const [description,setDescription] = useState("")
const [category,setCategory] = useState("")
const [type,setType] = useState("")
const [status,setStatus] = useState("")
const [price,setPrice] = useState("")
const [photo,setPhoto] = useState("")
const addOrder = (e) => {
e.preventDefault()

const order = {
name,
description,
category,
type,
status,
price
}

console.log(order)

alert("Order Added")

}

return(

<div className="container">

<h2>Add Product </h2>

<form onSubmit={addOrder}>

<input
placeholder="Product Name"
value={name}
onChange={(e)=>setName(e.target.value) }
required/>

<textarea
placeholder="AddDescription"
value={description}
onChange={(e)=>setDescription(e.target.value)}
 required></textarea>

<select onChange={(e)=>setCategory(e.target.value)} required>
<option>Category</option>
<option>Engineering</option>
<option>Medicine</option>
<option>Business</option>
</select>

<select onChange={(e)=>setType(e.target.value)} required>
<option>Type</option>
<option>Book</option>
<option>Tools</option>
</select>

<select onChange={(e)=>setStatus(e.target.value)} required>
<option>Status</option>
<option>For Sale</option>
<option>Volunteer</option>
</select>

<input
type="number"
placeholder="Price"
onChange={(e)=>setPrice(e.target.value)}
 required/>
<label color="black"> Add Photo of product</label>
<input
type="file"
accept="image/*"
onChange={(e)=>setPhoto(e.target.files[0])}
required
/>

<button type="submit">Add Order</button>

</form>

</div>

)

}

export default AddOrder