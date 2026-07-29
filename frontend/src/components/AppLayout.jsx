import { NavLink, Outlet } from "react-router";

function AppLayout() {
  return (
    <div className="application-shell">
      <header className="application-header">
        <div className="application-brand">
          <h1>PO Viewer</h1>
          <p>Purchase order management</p>
        </div>

        <nav
          className="application-navigation"
          aria-label="Main navigation"
        >
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "navigation-link active" : "navigation-link"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/purchase-orders"
            className={({ isActive }) =>
              isActive ? "navigation-link active" : "navigation-link"
            }
          >
            Purchase Orders
          </NavLink>
        </nav>
      </header>

      <main className="application-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
