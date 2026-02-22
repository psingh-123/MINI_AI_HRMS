import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div style={{ display: "flex", backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Navbar />
        <div style={{ padding: "32px" }}>{children}</div>
      </div>
    </div>
  );
}

export default Layout;
