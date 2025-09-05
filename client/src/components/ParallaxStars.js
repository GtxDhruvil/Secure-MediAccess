import React, { useEffect } from 'react';
import './ParallaxStars.css';

const ParallaxStars = () => {
  useEffect(() => {
    const multipleBoxShadow = (n) => {
      let value = `${Math.floor(Math.random() * 2000)}px ${Math.floor(Math.random() * 2000)}px #FFF`;
      for (let i = 2; i <= n; i++) {
        value += `, ${Math.floor(Math.random() * 2000)}px ${Math.floor(Math.random() * 2000)}px #FFF`;
      }
      return value;
    };

    const shadowsSmall = multipleBoxShadow(700);
    const shadowsMedium = multipleBoxShadow(200);
    const shadowsBig = multipleBoxShadow(100);

    const stars1 = document.getElementById('stars');
    const stars2 = document.getElementById('stars2');
    const stars3 = document.getElementById('stars3');

    if (stars1) stars1.style.setProperty('--shadows-small', shadowsSmall);
    if (stars2) stars2.style.setProperty('--shadows-medium', shadowsMedium);
    if (stars3) stars3.style.setProperty('--shadows-big', shadowsBig);

  }, []);

  return (
    <div className="stars-container">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
    </div>
  );
};

export default ParallaxStars;
