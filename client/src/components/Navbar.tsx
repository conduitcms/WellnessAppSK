import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-white shadow mb-4">
      <div className="container mx-auto px-4">
        <ul className="flex space-x-4">
          <li>
            <NavLink to="/supplements" activeClassName="font-bold">
              Supplements
            </NavLink>
          </li>
          <li>
            <NavLink to="/symptoms" activeClassName="font-bold">
              Symptoms
            </NavLink>
          </li>
          <li>
            <NavLink to="/sleep" activeClassName="font-bold">
              Sleep
            </NavLink>
          </li>
          <li>
            <NavLink to="/heart-rate" activeClassName="font-bold">
              Heart Rate
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar; 