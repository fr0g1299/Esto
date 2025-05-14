import React from "react";
import {
  Redirect,
  Route,
  RouteProps,
  RouteComponentProps,
} from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<RouteComponentProps>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  component: Component,
  path,
  ...rest
}) => {
  const { user, role, loading } = useAuth();

  if (loading) return null;

  return (
    <Route
      {...rest}
      path={path}
      render={(props) =>
        user ? (
          path === "/admin" && role !== "Admin" ? (
            <Redirect to="/not-found" />
          ) : (
            <Component {...props} />
          )
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export default PrivateRoute;
