import React, { useState, useEffect } from "react";
import { Search, User, ShoppingCart, LogOut, UserPlus } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getCurrentUser, isLoggedIn, logout } from "../../utils/authUtils";
import { useCart } from "../../context/CartContext";
import { useSearch } from "../../context/SearchContext";
import { useFilter } from "../../context/FilterContext";
import "./Navbar.css";
import logo from "../../images/logo.png";
import Cart from '../cart/Cart';
import { IconButton, Menu, MenuItem } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const { getCartCount, toggleCart } = useCart();
  const { setSearchQuery } = useSearch();
  const { setSelectedCategory } = useFilter();
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const userLoggedIn = isLoggedIn();
  const isHomePage = location.pathname === "/" || location.pathname === "/home";

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [prevScrollPos]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(localSearchQuery);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    setSearchQuery(value);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    navigate("/");
  };

  const handleProfileClick = () => {
    if (userLoggedIn) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    handleMenuClose();
  };

  return (
    <>
      <nav className={`navbar ${visible ? "navbar-visible" : "navbar-hidden"}`}>
        <div className="navbar-container">
          <div className="navbar-content">
            <Link to="/" className="navbar-logo">
              <img src={logo} alt="Logo" />
            </Link>

            {isHomePage && (
              <div className="navbar-search">
                <div className="search-wrapper">
                  <IconButton
                    onClick={handleMenuOpen}
                    sx={{ color: '#6b7280', padding: '0.5rem' }}
                    title="Kategoriler"
                    className="category-button"
                  >
                    <CategoryIcon />
                  </IconButton>

                  <form onSubmit={handleSubmit} className="search-form">
                    <div className="search-input-container">
                      <input
                        type="text"
                        value={localSearchQuery}
                        onChange={handleSearchChange}
                        className="search-input"
                        placeholder="Ürün ara..."
                      />
                      <button type="submit" className="search-button">
                        <Search className="search-icon" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="navbar-icons">
              {userLoggedIn ? (
                <button
                  className="icon-button profile-button"
                  onClick={handleProfileClick}
                  title={currentUser ? currentUser.username : "Profil"}
                >
                  <User />
                </button>
              ) : (
                <button
                  className="icon-button profile-button"
                  onClick={handleProfileClick}
                  title="Giriş Yap / Kayıt Ol"
                >
                  <UserPlus />
                </button>
              )}

              <button
                className="icon-button cart-button"
                onClick={toggleCart}
              >
                <ShoppingCart />
                <span className="cart-badge">{getCartCount()}</span>
              </button>

              {userLoggedIn && (
                <button
                  className="icon-button logout-button"
                  onClick={handleLogout}
                  title="Çıkış Yap"
                >
                  <LogOut />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Alt Navbar */}
      <div className="bottom-navbar">
        <IconButton
          onClick={handleMenuOpen}
          sx={{ color: '#6b7280', padding: '0.5rem' }}
          title="Kategoriler"
        >
          <CategoryIcon />
        </IconButton>

        {userLoggedIn ? (
          <button
            className="icon-button"
            onClick={handleProfileClick}
            title={currentUser ? currentUser.username : "Profil"}
          >
            <User />
          </button>
        ) : (
          <button
            className="icon-button"
            onClick={handleProfileClick}
            title="Giriş Yap / Kayıt Ol"
          >
            <UserPlus />
          </button>
        )}

        <button
          className="icon-button cart-button"
          onClick={toggleCart}
        >
          <ShoppingCart />
          <span className="cart-badge">{getCartCount()}</span>
        </button>

        {userLoggedIn && (
          <button
            className="icon-button"
            onClick={handleLogout}
            title="Çıkış Yap"
          >
            <LogOut />
          </button>
        )}

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          PaperProps={{
            style: {
              maxHeight: '300px',
              width: '200px',
            },
          }}
        >
          <MenuItem onClick={() => handleCategorySelect("")}>
            Tüm Kategoriler
          </MenuItem>
          <MenuItem onClick={() => handleCategorySelect("Elektronik")}>
            Elektronik
          </MenuItem>
          <MenuItem onClick={() => handleCategorySelect("Giyim")}>
            Giyim
          </MenuItem>
          <MenuItem onClick={() => handleCategorySelect("Ev & Yaşam")}>
            Ev & Yaşam
          </MenuItem>
          <MenuItem onClick={() => handleCategorySelect("Kitap")}>
            Kitap
          </MenuItem>
          <MenuItem onClick={() => handleCategorySelect("Spor")}>
            Spor
          </MenuItem>
          <MenuItem onClick={() => handleCategorySelect("Kozmetik")}>
            Kozmetik
          </MenuItem>
          <MenuItem onClick={() => handleCategorySelect("Gıda")}>
            Gıda
          </MenuItem>
          <MenuItem onClick={() => handleCategorySelect("Diğer")}>
            Diğer
          </MenuItem>
        </Menu>
      </div>

      <Cart />
    </>
  );
};

export default Navbar;