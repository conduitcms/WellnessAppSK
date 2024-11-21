import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-white shadow mb-4">
      <div className="container mx-auto px-4">
        <ul className="flex space-x-4">
          <li>
            <NavLink 
              to="/supplements" 
              className={({ isActive }) => isActive ? "font-bold" : ""}
            >
              Supplements
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/symptoms" 
              className={({ isActive }) => isActive ? "font-bold" : ""}
            >
              Symptoms
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/sleep" 
              className={({ isActive }) => isActive ? "font-bold" : ""}
            >
              Sleep
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/heart-rate" 
              className={({ isActive }) => isActive ? "font-bold" : ""}
            >
              Heart Rate
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar; 