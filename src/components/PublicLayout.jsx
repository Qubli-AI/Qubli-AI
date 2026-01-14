import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

const PublicLayout = ({ auth }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar auth={auth} />
      <main className="grow">
        <Outlet context={{ auth }} />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
