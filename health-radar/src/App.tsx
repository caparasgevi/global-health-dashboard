import React from 'react';
import { LazyMotion, domMax } from "framer-motion";
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';

function App() {
  return (
    <LazyMotion features={domMax}>
      <div className="min-h-screen flex flex-col transition-colors duration-300">
        <Header />

        <main className="flex-grow">
          <Home />
          <About />
        </main>

        <Footer />
      </div>
    </LazyMotion>
  );
}

export default App;