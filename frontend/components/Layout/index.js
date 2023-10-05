import Navbar from "../Navbar";

const Layout = ({ children }) => {
  return (
    <main>
      <div className="z-50 relative">
        <Navbar />
        {children}
      </div>
    </main>
  );
};

export default Layout;
