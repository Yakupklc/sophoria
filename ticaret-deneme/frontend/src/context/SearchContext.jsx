import React, { createContext, useState, useContext } from 'react';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sadece ürün ismine göre filtreleme fonksiyonu
  const filterProductsByName = (products) => {
    if (!searchQuery.trim()) {
      return products;
    }
    
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <SearchContext.Provider value={{
      searchQuery,
      setSearchQuery,
      filterProductsByName
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);