import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={<div className="container-custom py-10">404</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
