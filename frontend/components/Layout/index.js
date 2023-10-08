import Navbar from "../Navbar";
import Footer from "../Footer";
const Layout = ({ children }) => {
  return (
    <main>
      <Navbar />
      <div className="divider"></div>
      <div className="min-h-screen"> {children}</div>
      <div className="divider"></div>
      <Footer />
    </main>
  );
};

export default Layout;
