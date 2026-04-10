import React from 'react';
import logoImg from './tbs-logo.png'; // Path to your logo file

const TbsLogo = ({size = "h-10"}) => {
  return (
    <div className="logo-container">
      <img 
        src={logoImg.src} 
        alt="The Betel Store Logo" 
        className={size} 
      />
    </div>
  );
};

export default TbsLogo;