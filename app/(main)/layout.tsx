import React, { ReactNode } from 'react'

type RootLayoutProps = {
  children: ReactNode;
};

const MainLayout = ({ children }: RootLayoutProps)  => {
  return (
    <div className='container mx-auto my-32'>
      {children}
    </div>
  )
}

export default MainLayout
