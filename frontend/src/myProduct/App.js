import { BrowserRouter, Routes, Route } from "react-router-dom";
import MyProducts from "./pages/myProducts";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/my-products" element={<MyProducts />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;