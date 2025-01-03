import { ReactNode } from "react";

type RootComp = {
  children: ReactNode;
};

const AuthLayout = ({ children }: RootComp) => {
  return <div className="flex justify-center pt-40">{children}</div>;
};

export default AuthLayout;
