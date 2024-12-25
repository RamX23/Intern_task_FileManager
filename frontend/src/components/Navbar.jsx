import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const logoutHandler = async (e) => {
    e.preventDefault();
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar bg-primary m-5 rounded-pill px-4">
      <div className="container-fluid ">
        <a className="navbar-brand">File Manager</a>
        <form onSubmit={logoutHandler}>
          <button className="btn bg-light btn-hover-success" type="submit">Logout</button>
        </form>
      </div>
    </nav>
  );
};

export default Navbar;
