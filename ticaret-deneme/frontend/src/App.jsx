import "./App.css";
import RouterConfig from "./config/RouterConfig";
import { CartProvider } from "./context/CartContext";
import { SearchProvider } from "./context/SearchContext";
import { FilterProvider } from './context/FilterContext';
import Footer from "./components/footer/Footer";

function App() {

  return (<div className="app">
    <FilterProvider>
    <SearchProvider>
      <CartProvider>
        <RouterConfig />
      </CartProvider>
    </SearchProvider>
    </FilterProvider>
    <Footer />
    </div>
  );
}

export default App;
