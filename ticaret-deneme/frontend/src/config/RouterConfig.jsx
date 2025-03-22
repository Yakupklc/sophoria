import { Routes, Route, Navigate } from "react-router-dom";
import Register from "../pages/Register/Register";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import React from "react";
import Profile from "../pages/profile/Profile";
import { isLoggedIn } from "../utils/authUtils";
import ProductPage from "../pages/ProductPages/ProductPage";
import SellerProfile from "../pages/SellerProfile/SellerProfile";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import Checkout from "../pages/Checkout/Checkout";
import OrderSuccess from "../pages/OrderSuccess/OrderSuccess";
import ComplaintSuggestion from "../pages/ComplaintSuggestion/ComplaintSuggestion";

const PrivateRoute = ({ children }) => {
  return isLoggedIn() ? children : <Navigate to="/login" />;
};

const RouterConfig = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/product/:id" element={<ProductPage />} />
    <Route path="/seller/:id" element={<SellerProfile />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/order-success" element={<OrderSuccess />} />
    <Route path="/complaint-suggestion" element={<ComplaintSuggestion />} />
    <Route
      path="/profile"
      element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      }
    />
  </Routes>
);

export default RouterConfig;
