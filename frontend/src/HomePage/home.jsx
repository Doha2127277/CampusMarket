const handleRequestOrder = async (e, product) => {
  e.stopPropagation();

  if (!auth.currentUser) {
    alert("You must login first!");
    return;
  }

  try {
    await addDoc(collection(db, "orders"), {
      productId: product.id,
      productName: product.name,
      productPrice: product.price, 
      productImage: product.photoURL || "", 
      buyerId: auth.currentUser.uid,
      buyerName: auth.currentUser.displayName || "No Name",
      sellerId: product.sellerId || "",
      status: "pending",
      paymentMethod: "cash_on_delivery",
      createdAt: serverTimestamp()
    });

    alert("Order created successfully!");
  } catch (error) {
    console.error("Error creating order:", error);
    alert("Something went wrong");
  }
};