import React from 'react';
import Navbar from '../../components/navbar/Navbar';
import Products from '../../components/products/Products';

const Home = () => {
  // Sayfanın Home olduğunu belirten bir prop gönderiyoruz
  return (
    <div className="has-navbar"> 
      <Navbar isHomePage={true} />
      <Products />
    </div>
  )
}

export default Home;